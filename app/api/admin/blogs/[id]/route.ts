import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Blog from "@/models/Blog";

import { generateUniqueSlug } from "@/lib/slug";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const blog = await Blog.findById((await params).id);
    if (!blog) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    return NextResponse.json({ success: true, blog });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch blog" }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const { id } = await params;
    const body = await req.json();

    const existingBlog = await Blog.findById(id);
    if (!existingBlog) {
      return NextResponse.json({ success: false, error: "Blog not found" }, { status: 404 });
    }

    let slug = existingBlog.slug;
    const slugInput = body.slug?.trim();
    
    // If slug is explicitly passed or doesn't exist yet, generate/validate it
    if (slugInput || !slug) {
      const slugCandidate = slugInput || body.title || body.titleBn || "blog";
      slug = await generateUniqueSlug(slugCandidate, Blog, id);
    }

    const updateData = {
      ...body,
      slug,
      metaTitle: body.metaTitle !== undefined ? body.metaTitle.trim() : existingBlog.metaTitle,
      metaDescription: body.metaDescription !== undefined ? body.metaDescription.trim() : existingBlog.metaDescription,
    };

    const blog = await Blog.findByIdAndUpdate(id, updateData, { new: true });
    return NextResponse.json({ success: true, blog });
  } catch (error) {
    console.error("Error updating blog:", error);
    return NextResponse.json({ success: false, error: "Failed to update blog" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    await Blog.findByIdAndDelete((await params).id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to delete blog" }, { status: 500 });
  }
}
