import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import BloodDonor from "@/models/BloodDonor";
import Division from "@/models/Division";
import District from "@/models/District";
import Thana from "@/models/Thana";

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const bloodGroup = searchParams.get("bloodGroup");
    const division = searchParams.get("division");
    const district = searchParams.get("district");
    const thana = searchParams.get("thana");
    const availabilityStatus = searchParams.get("availabilityStatus");

    let query: any = {};
    if (bloodGroup) {
      query.bloodGroup = bloodGroup;
    }
    if (division) {
      query.division = division;
    }
    if (district) {
      query.district = district;
    }
    if (thana) {
      query.thana = thana;
    }
    if (availabilityStatus) {
      query.availabilityStatus = availabilityStatus;
    }
    
    // Handle approval status filtering
    const isAdmin = searchParams.get("admin") === "true";
    const isApprovedParam = searchParams.get("isApproved");

    if (isApprovedParam !== null) {
      query.isApproved = isApprovedParam === "true";
    } else if (!isAdmin) {
      // Default for public is only approved
      query.isApproved = true;
    }

    const bloodDonors = await BloodDonor.find(query).sort({ createdAt: -1 });

    // Resolve divisionBn, districtBn, and thanaBn translations on the fly dynamically (with per-request cache)
    const divisionCache: { [key: string]: string } = {};
    const districtCache: { [key: string]: string } = {};
    const thanaCache: { [key: string]: string } = {};

    const resolvedDonors = await Promise.all(
      bloodDonors.map(async (donor) => {
        const donorObj = donor.toObject();

        if (donorObj.division) {
          if (divisionCache[donorObj.division] !== undefined) {
            donorObj.divisionBn = divisionCache[donorObj.division];
          } else {
            const div = await Division.findOne({ name: donorObj.division });
            const bn = div && div.nameBn ? div.nameBn : "";
            divisionCache[donorObj.division] = bn;
            donorObj.divisionBn = bn;
          }
        }
        if (donorObj.district) {
          if (districtCache[donorObj.district] !== undefined) {
            donorObj.districtBn = districtCache[donorObj.district];
          } else {
            const dist = await District.findOne({ name: donorObj.district });
            const bn = dist && dist.nameBn ? dist.nameBn : "";
            districtCache[donorObj.district] = bn;
            donorObj.districtBn = bn;
          }
        }
        if (donorObj.thana) {
          if (thanaCache[donorObj.thana] !== undefined) {
            donorObj.thanaBn = thanaCache[donorObj.thana];
          } else {
            const th = await Thana.findOne({ name: donorObj.thana });
            const bn = th && th.nameBn ? th.nameBn : "";
            thanaCache[donorObj.thana] = bn;
            donorObj.thanaBn = bn;
          }
        }

        return donorObj;
      })
    );

    return NextResponse.json({ bloodDonors: resolvedDonors }, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching blood donors:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const {
      name,
      nameBn,
      phoneNumber,
      email,
      bloodGroup,
      division,
      district,
      thana,
      photo,
      availabilityStatus,
      lastDonationDate,
      userId,
      isApproved,
    } = body;

    // Validate required fields
    if (!name || !phoneNumber || !bloodGroup || !availabilityStatus) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create blood donor
    const bloodDonor = await BloodDonor.create({
      name,
      nameBn: nameBn || undefined,
      phoneNumber,
      email: email || undefined,
      bloodGroup,
      division: division || undefined,
      district: district || undefined,
      thana: thana || undefined,
      photo: photo || undefined,
      availabilityStatus,
      lastDonationDate: lastDonationDate || undefined,
      userId: userId || undefined,
      isApproved: false, // Applications are pending by default until admin approves
    });

    return NextResponse.json(
      { message: "Application submitted successfully! Admin will review your application.", bloodDonor },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating blood donor:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

