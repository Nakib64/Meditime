import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Ambulance from "@/models/Ambulance";

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const division = searchParams.get("division");
    const district = searchParams.get("district");
    const thana = searchParams.get("thana");
    const availabilityStatus = searchParams.get("availabilityStatus");
    const vehicleType = searchParams.get("vehicleType");

    let query: any = {};
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
    if (vehicleType) {
      query.vehicleType = vehicleType;
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

    const ambulances = await Ambulance.find(query).sort({ createdAt: -1 });
    return NextResponse.json({ ambulances }, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching ambulances:", error);
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
      division,
      district,
      thana,
      availabilityStatus,
      vehicleType,
      userId,
      isApproved,
      ambulanceNumber,
      drivingLicence
    } = body;

    // Validate required fields
    if (!name || !phoneNumber || !availabilityStatus || !vehicleType) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create ambulance
    const ambulance = await Ambulance.create({
      name,
      nameBn: nameBn || undefined,
      phoneNumber,
      division: division || undefined,
      district: district || undefined,
      thana: thana || undefined,
      availabilityStatus,
      vehicleType,
      ambulanceNumber: ambulanceNumber || undefined,
      drivingLicence: drivingLicence || undefined,
      userId: userId || undefined,
      isApproved: false, // Applications are pending by default
    });

    return NextResponse.json(
      { message: "Application submitted successfully! Admin will review your application.", ambulance },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating ambulance:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

