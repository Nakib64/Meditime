import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Doctor from "@/models/Doctor";
import Hospital from "@/models/Hospital";
import Thana from "@/models/Thana";
import District from "@/models/District";
import Division from "@/models/Division";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    const decodedId = decodeURIComponent(id);
    const searchParams = request.nextUrl.searchParams;
    const language = searchParams.get('language') || 'en';

    let doctor: any;
    if (decodedId.match(/^[0-9a-fA-F]{24}$/)) {
      doctor = await Doctor.findById(decodedId).lean();
    }
    if (!doctor) {
      doctor = await Doctor.findOne({ slug: decodedId }).lean();
    }

    if (!doctor) {
      return NextResponse.json({ doctors: [] }, { status: 200 });
    }

    // Extract current doctor properties
    const currentDept = doctor.department;
    const currentHospitalSlugs = doctor.availability?.map((slot: any) => slot.hospital).filter(Boolean) || [];

    // Query location details (Thana, District, Division) of the current doctor's hospitals
    let currentThanaIds: string[] = [];
    let currentDistrictIds: string[] = [];
    let currentDivisionIds: string[] = [];

    if (currentHospitalSlugs.length > 0) {
      const currentHospitals = await Hospital.find({ slug: { $in: currentHospitalSlugs } })
        .populate({
          path: "thana",
          populate: {
            path: "district"
          }
        })
        .lean() as any[];

      currentThanaIds = currentHospitals.map(h => h.thana?._id?.toString()).filter(Boolean);
      currentDistrictIds = currentHospitals.map(h => h.thana?.district?._id?.toString()).filter(Boolean);
      currentDivisionIds = currentHospitals.map(h => h.thana?.district?.division?.toString()).filter(Boolean);
    }

    // Find candidates: same department OR same hospital
    // We only need a reasonable number of candidates to sort
    const query: any = { _id: { $ne: doctor._id } };
    
    const orConditions = [];
    if (currentDept) orConditions.push({ department: currentDept });
    if (currentHospitalSlugs.length > 0) orConditions.push({ "availability.hospital": { $in: currentHospitalSlugs } });

    if (orConditions.length > 0) {
      query.$or = orConditions;
    }

    let candidates = await Doctor.find(query).limit(100).lean() as any[];

    // Extract all unique candidate hospital slugs to batch query location info
    const candidateHospitalSlugs = Array.from(
      new Set(
        candidates.flatMap(c => c.availability?.map((slot: any) => slot.hospital).filter(Boolean) || [])
      )
    );

    // Fetch locations for all candidates' hospitals
    const hospitalsInfo = await Hospital.find({ slug: { $in: candidateHospitalSlugs } })
      .populate({
        path: "thana",
        populate: {
          path: "district"
        }
      })
      .lean() as any[];

    const hospitalLookup = new Map<string, any>();
    for (const h of hospitalsInfo) {
      hospitalLookup.set(h.slug, h);
    }

    // Function to calculate match score
    const getCandidateScore = (c: any) => {
      const isSameDept = currentDept && c.department === currentDept;
      const cSlugs = c.availability?.map((slot: any) => slot.hospital).filter(Boolean) || [];
      
      let locationMaxScore = 0;
      for (const slug of cSlugs) {
        if (currentHospitalSlugs.includes(slug)) {
          locationMaxScore = Math.max(locationMaxScore, 4);
          continue;
        }
        
        const hInfo = hospitalLookup.get(slug);
        if (!hInfo || !hInfo.thana) continue;
        
        const thanaId = hInfo.thana._id?.toString();
        if (thanaId && currentThanaIds.includes(thanaId)) {
          locationMaxScore = Math.max(locationMaxScore, 3);
          continue;
        }
        
        const districtId = hInfo.thana.district?._id?.toString();
        if (districtId && currentDistrictIds.includes(districtId)) {
          locationMaxScore = Math.max(locationMaxScore, 2);
          continue;
        }

        const divisionId = hInfo.thana.district?.division?.toString();
        if (divisionId && currentDivisionIds.includes(divisionId)) {
          locationMaxScore = Math.max(locationMaxScore, 1);
          continue;
        }
      }

      let totalScore = 0;
      if (isSameDept) totalScore += 10;
      totalScore += locationMaxScore;
      
      return totalScore;
    };

    // If in Bangla mode, prioritize/filter doctors with Bangla names
    if (language === 'bn') {
      const withBn = candidates.filter(d => d.nameBn);
      if (withBn.length >= 4) {
        candidates = withBn;
      } else {
        candidates = candidates.sort((a, b) => {
          if (a.nameBn && !b.nameBn) return -1;
          if (!a.nameBn && b.nameBn) return 1;
          return 0;
        });
      }
    }

    // Sort by relevance score
    const sorted = candidates.sort((a, b) => {
      const scoreA = getCandidateScore(a);
      const scoreB = getCandidateScore(b);

      if (scoreA !== scoreB) return scoreB - scoreA;

      // Tertiary sort: prioritize doctors with images if scores are same
      if (a.image && !b.image) return -1;
      if (!a.image && b.image) return 1;

      return 0;
    });

    return NextResponse.json({ doctors: sorted.slice(0, 4) }, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching related doctors:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
