import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import District from "@/models/District";
import Thana from "@/models/Thana";
import mongoose from "mongoose";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "District ID is required" },
        { status: 400 }
      );
    }

    // Validate MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid district ID format" },
        { status: 400 }
      );
    }

    console.log("Attempting to delete district with ID:", id);

    // Check if district has thanas
    const thanas = await Thana.find({ district: id });
    if (thanas.length > 0) {
      return NextResponse.json(
        { error: "Cannot delete district with existing thanas. Please delete thanas first." },
        { status: 400 }
      );
    }

    const district = await District.findByIdAndDelete(id);
    
    if (!district) {
      console.log("District not found with ID:", id);
      return NextResponse.json(
        { error: "District not found" },
        { status: 404 }
      );
    }

    console.log("District deleted successfully:", district.name);
    return NextResponse.json(
      { message: "District deleted successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error deleting district:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

