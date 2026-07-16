import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Doctor from "@/models/Doctor";
import mongoose from "mongoose";
import Hospital from "@/models/Hospital";
import Thana from "@/models/Thana";
import District from "@/models/District";
import Division from "@/models/Division";
import { generateUniqueSlug } from "@/lib/slug";
import { verifyAdmin } from "@/lib/auth";
import { normalizeSearchQuery, buildPhoneticRegex } from "@/lib/search-utils";


// Force model output refreshing
// if (mongoose.models.Doctor) {
//   delete mongoose.models.Doctor; 
// }

const dpBuffer = new Int32Array(4000);

function getLcsLength(str1: string, str2: string): number {
  const m = str1.length;
  const n = str2.length;
  if (m === 0 || n === 0) return 0;
  
  if ((m + 1) * (n + 1) > 4000) {
    // Fallback to local allocation if word is exceptionally long (unlikely)
    const dp = Array.from({ length: m + 1 }, () => new Int32Array(n + 1));
    for (let i = 1; i <= m; i++) {
      const code1 = str1.charCodeAt(i - 1);
      for (let j = 1; j <= n; j++) {
        if (code1 === str2.charCodeAt(j - 1)) {
          dp[i][j] = dp[i - 1][j - 1] + 1;
        } else {
          dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
        }
      }
    }
    return dp[m][n];
  }
  
  const stride = n + 1;
  
  // Clear buffer headers
  for (let j = 0; j <= n; j++) dpBuffer[j] = 0;
  for (let i = 0; i <= m; i++) dpBuffer[i * stride] = 0;
  
  for (let i = 1; i <= m; i++) {
    const code1 = str1.charCodeAt(i - 1);
    const rowOffset = i * stride;
    const prevRowOffset = (i - 1) * stride;
    
    for (let j = 1; j <= n; j++) {
      if (code1 === str2.charCodeAt(j - 1)) {
        dpBuffer[rowOffset + j] = dpBuffer[prevRowOffset + j - 1] + 1;
      } else {
        const val1 = dpBuffer[prevRowOffset + j];
        const val2 = dpBuffer[rowOffset + j - 1];
        dpBuffer[rowOffset + j] = val1 > val2 ? val1 : val2;
      }
    }
  }
  
  return dpBuffer[m * stride + n];
}

function calculateMatchScore(queryClean: string, targetText: string, isLongField = false): number {
  if (!queryClean || !targetText) return 0;
  
  const queryWords = queryClean.split(/\s+/).filter(Boolean);
  if (queryWords.length === 0) return 0;
  
  const targetClean = targetText.toLowerCase();

  // Optimization: for long fields, use fast substring contains matching
  if (isLongField) {
    let matchedWords = 0;
    for (const qWord of queryWords) {
      if (targetClean.includes(qWord)) {
        matchedWords++;
      }
    }
    return matchedWords / queryWords.length;
  }
  
  const targetWords = targetClean.split(/\s+/).map(w => w.replace(/[\s.,\/#!$%\^&\*;:{}=\-_`~()]/g, "")).filter(Boolean);
  if (targetWords.length === 0) return 0;
  
  let totalScore = 0;
  
  for (const qWord of queryWords) {
    let maxWordScore = 0;
    for (const tWord of targetWords) {
      // Fast path: exact match
      if (qWord === tWord) {
        maxWordScore = 1.0;
        continue;
      }
      
      // Fast path: prefix match
      if (tWord.startsWith(qWord)) {
        maxWordScore = Math.max(maxWordScore, 0.9);
        continue;
      }
      
      const lcs = getLcsLength(qWord, tWord);
      const similarity = lcs / Math.max(qWord.length, tWord.length);
      if (similarity > maxWordScore) {
        maxWordScore = similarity;
      }
    }
    totalScore += maxWordScore;
  }
  
  return totalScore / queryWords.length;
}

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);

    // Pagination
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    // Filters
    const search = searchParams.get("search");
    const specialty = searchParams.get("specialty");
    const hospitalSlug = searchParams.get("hospitalSlug") || searchParams.get("hospital");
    const divisionName = searchParams.get("division");
    const districtName = searchParams.get("district");
    const thanaName = searchParams.get("thana");
    const department = searchParams.get("department");
    const qualification = searchParams.get("qualification");
    const minFee = searchParams.get("minFee");
    const maxFee = searchParams.get("maxFee");
    const days = searchParams.get("days")?.split(","); // Array of days
    const minRating = searchParams.get("minRating");

    // Sorting
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortDirection = searchParams.get("sortDirection") === "asc" ? 1 : -1;

    let query: any = {};

    // Text search handled in-memory below for extremely accurate scoring

    // Exact matches
    if (specialty) query.specialty = specialty;
    if (department) query.department = department;
    if (qualification) query.qualification = qualification;

    let hospitalSlugs: string[] = [];
    if (hospitalSlug) {
      hospitalSlugs.push(hospitalSlug);
    } else if (thanaName || districtName || divisionName) {
      // Helper: build a query value that matches both ObjectId-stored and string-stored FKs
      const bothTypes = (id: mongoose.Types.ObjectId | string) => {
        const str = id.toString();
        return mongoose.Types.ObjectId.isValid(str)
          ? { $in: [new mongoose.Types.ObjectId(str), str] }
          : str;
      };

      let thanaIds: (mongoose.Types.ObjectId | string)[] = [];

      if (thanaName) {
        const thana = await Thana.findOne({ name: thanaName });
        if (thana) thanaIds.push(thana._id);
      } else if (districtName) {
        const district = await District.findOne({ name: districtName });
        if (district) {
          const thanas = await Thana.find({ district: bothTypes(district._id) });
          thanaIds = thanas.map(t => t._id);
        }
      } else if (divisionName) {
        const division = await Division.findOne({ name: divisionName });
        if (division) {
          const districts = await District.find({ division: bothTypes(division._id) });
          const districtIds = districts.map(d => d._id);
          // Build $in array covering both ObjectId and string versions of each district ID
          const districtBothTypes = districtIds.flatMap(id => {
            const str = id.toString();
            return mongoose.Types.ObjectId.isValid(str)
              ? [new mongoose.Types.ObjectId(str), str]
              : [str];
          });
          const thanas = await Thana.find({ district: { $in: districtBothTypes } });
          thanaIds = thanas.map(t => t._id);
        }
      }

      if (thanaIds.length > 0) {
        // Build $in covering both ObjectId and string forms of thana IDs
        const thanaBothTypes = thanaIds.flatMap(id => {
          const str = id.toString();
          return mongoose.Types.ObjectId.isValid(str)
            ? [new mongoose.Types.ObjectId(str), str]
            : [str];
        });
        const hospitals = await Hospital.find({ thana: { $in: thanaBothTypes } });
        hospitalSlugs = hospitals.map(h => h.slug).filter(Boolean) as string[];
      } else {
        // Location provided but no matching hospitals found → return no doctors
        hospitalSlugs.push("NON_EXISTENT_HOSPITAL_SLUG_FOR_EMPTY_LOCATION");
      }
    }

    if (hospitalSlugs.length > 0) {
      query["availability.hospital"] = { $in: hospitalSlugs };
    }

    // Range filters
    if (minFee || maxFee) {

    }

    if (minRating) {
      query.rating = { $gte: parseFloat(minRating) };
    }

    // Availability days filter
    if (days && days.length > 0) {
      query["availability.days"] = { $in: days };
    }

    let doctors: any[] = [];
    let total = 0;

    if (search) {
      // Fetch all candidate doctors matching non-search filters (e.g. location, specialty, rating)
      let docQuery = Doctor.find(query);
      if (searchParams.get("suggestions") === "true") {
        docQuery = docQuery.select("name nameBn specialty specialtyBn qualification qualificationBn designation designationBn department departmentBn hospital hospitalBn slug slugBn image rating");
      }
      const allDocs = await docQuery;
      const cleanSearch = normalizeSearchQuery(search);

      const scored = allDocs.map(doctor => {
        const scoreName = calculateMatchScore(cleanSearch, doctor.name || "");
        const scoreNameBn = calculateMatchScore(cleanSearch, doctor.nameBn || "");

        const maxScore = Math.max(
          scoreName,
          scoreNameBn
        );

        return { doctor, maxScore };
      });

      // Filter out matches with less than 35% similarity on any field
      const filtered = scored.filter(item => item.maxScore >= 0.35);

      // Sort by match score descending
      filtered.sort((a, b) => b.maxScore - a.maxScore);

      total = filtered.length;
      doctors = filtered.slice(skip, skip + limit).map(item => item.doctor);
    } else {
      // Standard query with pagination
      const [docs, count] = await Promise.all([
        Doctor.find(query)
          .sort({ [sortBy]: sortDirection })
          .skip(skip)
          .limit(limit),
        Doctor.countDocuments(query)
      ]);
      doctors = docs;
      total = count;
    }

    return NextResponse.json({
      doctors,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching doctors:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const isAdmin = await verifyAdmin(request);
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 401 });
    }

    await dbConnect();

    const body = await request.json();
    const {
      name,
      specialty,
      qualification,
      designation,

      email,
      phoneNumber,
      department,

      reportShowFee,
      newPatientFee,
      diseases,
      availability,
      bio,
      image,

      // Bangla fields
      nameBn,
      specialtyBn,
      qualificationBn,
      designationBn,
      bioBn,
      departmentBn,
      reportShowFeeBn,
      newPatientFeeBn,

      // English counterparts for fields stored in Bangla
      diseasesEn,
    } = body;

    // Validate required fields
    if ((!name && !nameBn) || (!qualification && !qualificationBn) || !availability) {
      console.error("Create Doctor Validation Failed:", { name, nameBn, qualification, qualificationBn, hasAvailability: !!availability });
      return NextResponse.json(
        { error: "Missing required fields: Name (English/Bangla), Qualification (English/Bangla), or Availability" },
        { status: 400 }
      );
    }



    // Ensure availability is an array and validate structure
    const availabilityArray = Array.isArray(availability) ? availability : [availability];

    // Validate each availability slot
    for (const slot of availabilityArray) {
      if (!slot.days || !Array.isArray(slot.days) || slot.days.length === 0) {
        return NextResponse.json(
          { error: "Each availability slot must have at least one day selected" },
          { status: 400 }
        );
      }
    }

    // Prepare doctor data
    const doctorData: any = {
      name: name || "",
      specialty: specialty || "",
      qualification: qualification || "",
      designation: designation || "",

      availability: availabilityArray,
    };

    // Add optional fields
    if (email) doctorData.email = email;
    if (phoneNumber) doctorData.phoneNumber = phoneNumber;
    if (department) doctorData.department = department;

    // Handle fees - allow 0
    if (reportShowFee !== undefined) doctorData.reportShowFee = reportShowFee;
    if (newPatientFee !== undefined) doctorData.newPatientFee = newPatientFee;

    if (diseases && Array.isArray(diseases)) doctorData.diseases = diseases;
    if (diseasesEn && Array.isArray(diseasesEn)) doctorData.diseasesEn = diseasesEn;
    if (bio) doctorData.bio = bio;
    if (image) doctorData.image = image;

    // Bangla Fields
    if (nameBn) doctorData.nameBn = nameBn;
    if (specialtyBn) doctorData.specialtyBn = specialtyBn;
    if (qualificationBn) doctorData.qualificationBn = qualificationBn;
    if (designationBn) doctorData.designationBn = designationBn;
    if (bioBn) doctorData.bioBn = bioBn;
    if (departmentBn) doctorData.departmentBn = departmentBn;
    if (reportShowFeeBn) doctorData.reportShowFeeBn = reportShowFeeBn;
    if (newPatientFeeBn) doctorData.newPatientFeeBn = newPatientFeeBn;

    // Generate slugs
    doctorData.slug = await generateUniqueSlug(doctorData.name || doctorData.nameBn || "doctor", Doctor);

    // Log the data being sent for debugging
    console.log('Creating doctor with data:', JSON.stringify(doctorData, null, 2));

    // Create doctor
    const doctor = await Doctor.create(doctorData);

    return NextResponse.json(
      { message: "Doctor created successfully", doctor },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating doctor:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

