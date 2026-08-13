import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Blog from "@/models/Blog";

import { generateUniqueSlug } from "@/lib/slug";

export async function GET() {
  try {
    await dbConnect();
    const blogs = await Blog.find().sort({ createdAt: -1 });
    return NextResponse.json({ success: true, blogs });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch blogs" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await dbConnect();
    const body = await req.json();
    
    const slugSource = body.slug?.trim() || body.title || body.titleBn || "blog";
    const slug = await generateUniqueSlug(slugSource, Blog);
    
    const blogData = {
      ...body,
      slug,
      metaTitle: body.metaTitle?.trim() || "",
      metaDescription: body.metaDescription?.trim() || "",
    };

    const blog = await Blog.create(blogData);
    return NextResponse.json({ success: true, blog });
  } catch (error) {
    console.error("Error creating blog:", error);
    return NextResponse.json({ success: false, error: "Failed to create blog" }, { status: 500 });
  }
}
