import { Metadata } from "next";
import dbConnect from "@/lib/mongodb";
import Blog from "@/models/Blog";
import mongoose from "mongoose";

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params;
  try {
    await dbConnect();
    let blog = null;

    if (mongoose.Types.ObjectId.isValid(id)) {
      blog = await Blog.findOne({ _id: id, isActive: true });
    }
    if (!blog) {
      blog = await Blog.findOne({ slug: id, isActive: true });
    }

    if (!blog) {
      return {
        title: "Blog Post | Meditime",
        description: "Read health tips and medical insights on Meditime.",
      };
    }

    const title = blog.metaTitle?.trim() || blog.title || "Blog Post | Meditime";
    const rawDescription = blog.metaDescription?.trim() || blog.description?.replace(/<[^>]*>/g, "").substring(0, 160) || "";
    const description = rawDescription.replace(/&nbsp;/g, " ").trim();
    const url = `https://meditime.com.bd/blog/${blog.slug || blog._id}`;

    return {
      title: `${title} | Meditime`,
      description: description,
      openGraph: {
        title: title,
        description: description,
        url: url,
        type: "article",
        images: blog.imageUrl ? [{ url: blog.imageUrl }] : [],
      },
      twitter: {
        card: "summary_large_image",
        title: title,
        description: description,
        images: blog.imageUrl ? [blog.imageUrl] : [],
      },
      alternates: {
        canonical: url,
      },
    };
  } catch (error) {
    return {
      title: "Blog Post | Meditime",
      description: "Read health tips and medical insights on Meditime.",
    };
  }
}

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
