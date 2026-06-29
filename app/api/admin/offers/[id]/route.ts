import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Offer from "@/models/Offer";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const offer = await Offer.findById((await params).id);
    if (!offer) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    return NextResponse.json({ success: true, offer });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch offer" }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const body = await req.json();
    const offer = await Offer.findByIdAndUpdate((await params).id, body, { new: true });
    return NextResponse.json({ success: true, offer });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to update offer" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    await Offer.findByIdAndDelete((await params).id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to delete offer" }, { status: 500 });
  }
}
