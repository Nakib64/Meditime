import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Offer from "@/models/Offer";

export async function GET() {
  try {
    await dbConnect();
    const offers = await Offer.find().sort({ createdAt: -1 });
    return NextResponse.json({ success: true, offers });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch offers" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await dbConnect();
    const body = await req.json();
    const offer = await Offer.create(body);
    return NextResponse.json({ success: true, offer });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to create offer" }, { status: 500 });
  }
}
