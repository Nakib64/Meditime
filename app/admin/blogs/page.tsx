"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, X, Edit, Trash2, Loader2, Globe, FileText, Search } from "lucide-react";
import { showToast } from "@/lib/toast";
import { slugify } from "@/lib/utils";
import dynamic from "next/dynamic";

const RichTextEditor = dynamic(() => import("@/components/RichTextEditor"), {
  ssr: false,
  loading: () => <p>Loading editor...</p>,
});

interface Blog {
  _id: string;
  title: string;
  titleBn: string;
  description: string;
  descriptionBn: string;
  imageUrl: string;
  slug?: string;
  metaTitle?: string;
  metaDescription?: string;
  isActive: boolean;
}

export default function BlogsPage() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>("");

  const [formData, setFormData] = useState({
    title: "",
    titleBn: "",
    description: "",
    descriptionBn: "",
    imageUrl: "",
    slug: "",
    metaTitle: "",
    metaDescription: "",
    isActive: true,
  });

  const [isSlugManual, setIsSlugManual] = useState(false);
  const [isMetaTitleManual, setIsMetaTitleManual] = useState(false);

  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/blogs");
      const data = await response.json();
      if (response.ok) {
        setBlogs(data.blogs);
      }
    } catch (error) {
      console.error("Error fetching blogs:", error);
      showToast.error("Failed to fetch blogs");
    } finally {
      setLoading(false);
    }
  };

  const handleTitleChange = (newTitle: string) => {
    setFormData((prev) => ({
      ...prev,
      title: newTitle,
      slug: isSlugManual ? prev.slug : slugify(newTitle),
      metaTitle: isMetaTitleManual ? prev.metaTitle : newTitle,
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast.error("Please upload an image file");
      return;
    }

    setUploading(true);
    try {
      const formDataImg = new FormData();
      formDataImg.append("image", file);

      const response = await fetch("/api/upload/imgbb", {
        method: "POST",
        body: formDataImg,
      });

      const data = await response.json();

      if (response.ok && data.url) {
        const imageUrl = data.url;
        setFormData((prev) => ({ ...prev, imageUrl }));
        setImagePreview(imageUrl);
        showToast.success("Image uploaded successfully");
      } else {
        showToast.error("Failed to upload image");
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      showToast.error("Error uploading image");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = editingId
        ? `/api/admin/blogs/${editingId}`
        : "/api/admin/blogs";
      const method = editingId ? "PUT" : "POST";

      const payload = {
        ...formData,
        slug: slugify(formData.slug || formData.title),
      };

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (response.ok) {
        await fetchBlogs();
        resetForm();
        showToast.success(editingId ? "Blog updated successfully" : "Blog created successfully");
      } else {
        showToast.error(result.error || "Failed to save blog");
      }
    } catch (error) {
      console.error("Error saving blog:", error);
      showToast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (blog: Blog) => {
    setEditingId(blog._id);
    setFormData({
      title: blog.title || "",
      titleBn: blog.titleBn || "",
      description: blog.description || "",
      descriptionBn: blog.descriptionBn || "",
      imageUrl: blog.imageUrl || "",
      slug: blog.slug || slugify(blog.title || ""),
      metaTitle: blog.metaTitle || blog.title || "",
      metaDescription: blog.metaDescription || "",
      isActive: blog.isActive ?? true,
    });
    setIsSlugManual(Boolean(blog.slug));
    setIsMetaTitleManual(Boolean(blog.metaTitle));
    setImagePreview(blog.imageUrl || "");
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this blog?")) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/admin/blogs/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await fetchBlogs();
        showToast.success("Blog deleted successfully");
      } else {
        const data = await response.json();
        showToast.error(data.error || "Failed to delete blog");
      }
    } catch (error) {
      console.error("Error deleting blog:", error);
      showToast.error("Failed to delete blog");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({
      title: "",
      titleBn: "",
      description: "",
      descriptionBn: "",
      imageUrl: "",
      slug: "",
      metaTitle: "",
      metaDescription: "",
      isActive: true,
    });
    setIsSlugManual(false);
    setIsMetaTitleManual(false);
    setImagePreview("");
  };

  const stripHtml = (html: string) =>
    (html || "").replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();

  const isFormValid = Boolean(
    formData.title.trim() &&
    formData.titleBn.trim() &&
    stripHtml(formData.description) &&
    stripHtml(formData.descriptionBn) &&
    formData.imageUrl.trim()
  );

  if (loading && blogs.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 font-medium">Loading...</span>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manage Blogs / Health Tips</h1>
          <p className="text-gray-600 mt-1">Create and manage blogs and health tips with SEO controls</p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setShowForm(!showForm);
          }}
          className="bg-primary hover:bg-primary/90"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Blog
        </Button>
      </div>

      {showForm && (
        <Card className="p-6 bg-white border-2 border-primary/10 shadow-lg">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
            <div>
              <h2 className="text-xl font-bold text-gray-800">
                {editingId ? "Edit Blog Post" : "Create New Blog Post"}
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">Fill in the content and SEO details below</p>
            </div>
            <Button variant="ghost" size="sm" onClick={resetForm}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* English Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Title (English) <span className="text-red-500">*</span></Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="e.g. 10 Daily Habits for a Healthy Heart"
                  required
                />
              </div>

              {/* Bangla Title */}
              <div className="space-y-2">
                <Label htmlFor="titleBn">Title (Bangla) <span className="text-red-500">*</span></Label>
                <Input
                  id="titleBn"
                  value={formData.titleBn}
                  onChange={(e) => setFormData({ ...formData, titleBn: e.target.value })}
                  placeholder="যেমন: সুস্থ হৃদযন্ত্রের জন্য ১০টি দৈনন্দিন অভ্যাস"
                  required
                />
              </div>

              {/* URL Slug Field */}
              <div className="space-y-2 md:col-span-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <Label htmlFor="slug" className="font-semibold text-slate-800 flex items-center gap-1.5">
                    <Globe className="w-4 h-4 text-primary" />
                    URL Slug (Editable)
                  </Label>
                  <span className="text-xs text-gray-500">
                    {isSlugManual ? "Customized" : "Autofilled from title"}
                  </span>
                </div>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => {
                    setIsSlugManual(true);
                    setFormData({ ...formData, slug: e.target.value });
                  }}
                  placeholder="e.g. 10-daily-habits-for-a-healthy-heart"
                  className="bg-white font-mono text-sm"
                />
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  Preview URL: <span className="text-primary font-medium">https://meditime.com.bd/blog/{slugify(formData.slug || formData.title || "your-blog-slug")}</span>
                </p>
              </div>

              {/* SEO Meta Title */}
              <div className="space-y-2 md:col-span-2 bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="metaTitle" className="font-semibold text-emerald-900 flex items-center gap-1.5">
                    <Search className="w-4 h-4 text-emerald-600" />
                    Meta Title (SEO)
                  </Label>
                  <span className="text-xs text-slate-500">
                    {formData.metaTitle.length}/60 chars
                  </span>
                </div>
                <Input
                  id="metaTitle"
                  value={formData.metaTitle}
                  onChange={(e) => {
                    setIsMetaTitleManual(true);
                    setFormData({ ...formData, metaTitle: e.target.value });
                  }}
                  placeholder="Strategic SEO title for search engines (defaults to English title if blank)"
                  className="bg-white"
                />
                <p className="text-xs text-slate-500">
                  This title appears as the main clickable blue link in Google search results.
                </p>

                {/* SEO Meta Description */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="metaDescription" className="font-semibold text-emerald-900 flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-emerald-600" />
                      Meta Description (SEO & Keywords)
                    </Label>
                    <span className="text-xs text-slate-500">
                      {formData.metaDescription.length}/160 chars
                    </span>
                  </div>
                  <textarea
                    id="metaDescription"
                    rows={3}
                    value={formData.metaDescription}
                    onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
                    placeholder="Write a concise description targeting high-value keywords to improve click-through rate on Google..."
                    className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                  <p className="text-xs text-slate-500">
                    Target target keywords strategically here for maximum search ranking & engagement.
                  </p>
                </div>
              </div>

              {/* Description (English) */}
              <div className="space-y-2 md:col-span-2">
                <Label>Description (English) <span className="text-red-500">*</span></Label>
                <div className="border rounded-lg overflow-hidden min-h-[200px]">
                  <RichTextEditor
                    value={formData.description}
                    onChange={(val) => setFormData({ ...formData, description: val })}
                  />
                </div>
              </div>

              {/* Description (Bangla) */}
              <div className="space-y-2 md:col-span-2">
                <Label>Description (Bangla) <span className="text-red-500">*</span></Label>
                <div className="border rounded-lg overflow-hidden min-h-[200px]">
                  <RichTextEditor
                    value={formData.descriptionBn}
                    onChange={(val) => setFormData({ ...formData, descriptionBn: val })}
                  />
                </div>
              </div>

              {/* Cover Photo Upload */}
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="image">Blog Cover Photo <span className="text-red-500">*</span></Label>
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploading}
                />
                {uploading && (
                  <p className="text-sm text-primary flex items-center mt-1">
                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                    Uploading...
                  </p>
                )}
                {imagePreview && (
                  <div className="mt-3 relative inline-block">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-32 h-24 object-cover rounded-lg border-2 border-gray-100 shadow-sm"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setImagePreview("");
                        setFormData((prev) => ({ ...prev, imageUrl: "" }));
                      }}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-4 pt-4 border-t border-gray-100">
              <Button type="submit" disabled={loading || uploading || !isFormValid} className="flex-1 bg-primary">
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {editingId ? "Update Blog" : "Create Blog"}
              </Button>
              <Button type="button" variant="outline" onClick={resetForm} className="flex-1">
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {!showForm && blogs.length === 0 ? (
        <Card className="p-12 text-center border-dashed border-2">
          <p className="text-gray-500 mb-4">No blogs found.</p>
          <Button onClick={() => setShowForm(true)}>Add your first blog</Button>
        </Card>
      ) : !showForm && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {blogs.map((blog) => (
            <Card key={blog._id} className="flex flex-col hover:shadow-lg transition-all duration-200 group overflow-hidden">
              <div className="h-40 overflow-hidden relative">
                {blog.imageUrl ? (
                  <img src={blog.imageUrl} alt={blog.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                ) : (
                  <div className="w-full h-full bg-gray-100 flex items-center justify-center">No Image</div>
                )}
                {!blog.isActive && (
                  <span className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded">Inactive</span>
                )}
              </div>
              <div className="p-4 flex-1">
                <h3 className="font-bold text-lg mb-1 line-clamp-1">{blog.title}</h3>
                <p className="text-xs text-primary font-mono mb-2 flex items-center gap-1 line-clamp-1">
                  <Globe className="w-3 h-3" />
                  /blog/{blog.slug || blog._id}
                </p>
                <p className="text-gray-500 text-sm line-clamp-2" dangerouslySetInnerHTML={{ __html: blog.description }}></p>
              </div>
              <div className="flex gap-2 p-3 bg-gray-50 border-t mt-auto">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => handleEdit(blog)}>
                  <Edit className="h-4 w-4 mr-2" /> Edit
                </Button>
                <Button variant="outline" size="sm" className="flex-1 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => handleDelete(blog._id)}>
                  <Trash2 className="h-4 w-4 mr-2" /> Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
