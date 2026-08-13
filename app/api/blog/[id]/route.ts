import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Blog from "@/models/Blog";

import mongoose from "mongoose";
import { generateUniqueSlug } from "@/lib/slug";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await dbConnect();
    
    let blog = null;

    if (mongoose.Types.ObjectId.isValid(id)) {
      blog = await Blog.findOne({ _id: id, isActive: true });
    }

    if (!blog) {
      blog = await Blog.findOne({ slug: id, isActive: true });
    }

    if (!blog) {
      return NextResponse.json({ success: false, error: "Blog not found" }, { status: 404 });
    }

    // Auto-generate slug for legacy blogs if missing
    if (!blog.slug) {
      blog.slug = await generateUniqueSlug(blog.title || blog.titleBn || "blog", Blog, blog._id);
      await blog.save();
    }

    return NextResponse.json({ success: true, blog });
  } catch (error) {
    console.error("Error fetching blog:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch blog" }, { status: 500 });
  }
}
