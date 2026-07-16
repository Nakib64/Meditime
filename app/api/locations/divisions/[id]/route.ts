import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Division from "@/models/Division";
import District from "@/models/District";
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
        { error: "Division ID is required" },
        { status: 400 }
      );
    }

    // Validate MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid division ID format" },
        { status: 400 }
      );
    }

    console.log("Attempting to delete division with ID:", id);

    // Check if division has districts
    const districts = await District.find({ division: id });
    if (districts.length > 0) {
      return NextResponse.json(
        { error: "Cannot delete division with existing districts. Please delete districts first." },
        { status: 400 }
      );
    }

    const division = await Division.findByIdAndDelete(id);
    
    if (!division) {
      console.log("Division not found with ID:", id);
      return NextResponse.json(
        { error: "Division not found" },
        { status: 404 }
      );
    }

    console.log("Division deleted successfully:", division.name);
    return NextResponse.json(
      { message: "Division deleted successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error deleting division:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

