import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Blog from "@/models/Blog";

export async function GET() {
  try {
    await dbConnect();
    const blogs = await Blog.find({ isActive: true }).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, blogs });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch blogs" }, { status: 500 });
  }
}
