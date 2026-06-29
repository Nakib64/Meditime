import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Offer from "@/models/Offer";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await dbConnect();
    const offer = await Offer.findOne({ _id: id, isActive: true });
    if (!offer) {
      return NextResponse.json({ success: false, error: "Offer not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, offer });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch offer" }, { status: 500 });
  }
}
