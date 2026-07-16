import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Thana from "@/models/Thana";
import Hospital from "@/models/Hospital";
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
        { error: "Thana ID is required" },
        { status: 400 }
      );
    }

    // Validate MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid thana ID format" },
        { status: 400 }
      );
    }

    console.log("Attempting to delete thana with ID:", id);

    // Check if thana has hospitals
    const hospitals = await Hospital.find({ thana: id });
    if (hospitals.length > 0) {
      return NextResponse.json(
        { error: "Cannot delete thana with existing hospitals. Please delete or reassign hospitals first." },
        { status: 400 }
      );
    }

    const thana = await Thana.findByIdAndDelete(id);
    
    if (!thana) {
      console.log("Thana not found with ID:", id);
      // Check if any thana exists (for debugging)
      const allThanas = await Thana.find({}).limit(5).select("_id name");
      console.log("Sample thana IDs in database:", allThanas.map(t => ({ id: t._id.toString(), name: t.name })));
      return NextResponse.json(
        { error: "Thana not found" },
        { status: 404 }
      );
    }

    console.log("Thana deleted successfully:", thana.name);
    return NextResponse.json(
      { message: "Thana deleted successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error deleting thana:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

