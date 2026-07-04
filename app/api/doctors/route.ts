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

    // Text search across multiple fields using phonetic query logic
    if (search) {
      const cleanSearch = normalizeSearchQuery(search);
      const fullFuzzyRegex = buildPhoneticRegex(cleanSearch);
      const searchTerms = cleanSearch.split(/\s+/).filter(Boolean);

      if (fullFuzzyRegex) {
        const fullQueryOr = [
          { name: fullFuzzyRegex },
          { nameBn: fullFuzzyRegex },
          { specialty: fullFuzzyRegex },
          { specialtyBn: fullFuzzyRegex },
          { qualification: fullFuzzyRegex },
          { qualificationBn: fullFuzzyRegex },
          { bio: fullFuzzyRegex },
          { bioBn: fullFuzzyRegex },
          { designation: fullFuzzyRegex },
          { designationBn: fullFuzzyRegex }
        ];

        if (searchTerms.length > 1) {
          const termsAnd = searchTerms.map(term => {
            const termFuzzy = buildPhoneticRegex(term);
            if (!termFuzzy) return null;
            return {
              $or: [
                { name: termFuzzy },
                { nameBn: termFuzzy },
                { specialty: termFuzzy },
                { specialtyBn: termFuzzy },
                { qualification: termFuzzy },
                { qualificationBn: termFuzzy },
                { bio: termFuzzy },
                { bioBn: termFuzzy },
                { designation: termFuzzy },
                { designationBn: termFuzzy }
              ]
            };
          }).filter((c): c is NonNullable<typeof c> => c !== null);

          if (termsAnd.length > 0) {
            query.$or = [
              { $and: termsAnd },
              { $or: fullQueryOr }
            ];
          } else {
            query.$or = fullQueryOr;
          }
        } else {
          query.$or = fullQueryOr;
        }
      }
    }

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

    const [doctors, total] = await Promise.all([
      Doctor.find(query)
        .sort({ [sortBy]: sortDirection })
        .skip(skip)
        .limit(limit),
      Doctor.countDocuments(query)
    ]);


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

