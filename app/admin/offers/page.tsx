"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, X, Edit, Trash2, Loader2 } from "lucide-react";
import { showToast } from "@/lib/toast";
import dynamic from "next/dynamic";

const RichTextEditor = dynamic(() => import("@/components/RichTextEditor"), {
  ssr: false,
  loading: () => <p>Loading editor...</p>,
});

interface Offer {
  _id: string;
  title: string;
  titleBn: string;
  description: string;
  descriptionBn: string;
  imageUrl: string;
  startDate?: string;
  endDate?: string;
  isActive: boolean;
}

export default function OffersPage() {
  const [offers, setOffers] = useState<Offer[]>([]);
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
    startDate: "",
    endDate: "",
    isActive: true,
  });

  useEffect(() => {
    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/offers");
      const data = await response.json();
      if (response.ok) {
        setOffers(data.offers);
      }
    } catch (error) {
      console.error("Error fetching offers:", error);
      showToast.error("Failed to fetch offers");
    } finally {
      setLoading(false);
    }
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
        setFormData({ ...formData, imageUrl });
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
        ? `/api/admin/offers/${editingId}`
        : "/api/admin/offers";
      const method = editingId ? "PUT" : "POST";

      const payload = {
        ...formData,
        startDate: formData.startDate ? new Date(formData.startDate).toISOString() : undefined,
        endDate: formData.endDate ? new Date(formData.endDate).toISOString() : undefined,
      };

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (response.ok) {
        await fetchOffers();
        resetForm();
        showToast.success(editingId ? "Offer updated successfully" : "Offer created successfully");
      } else {
        showToast.error(result.error || "Failed to save offer");
      }
    } catch (error) {
      console.error("Error saving offer:", error);
      showToast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (offer: Offer) => {
    setEditingId(offer._id);
    setFormData({
      title: offer.title,
      titleBn: offer.titleBn || "",
      description: offer.description || "",
      descriptionBn: offer.descriptionBn || "",
      imageUrl: offer.imageUrl || "",
      startDate: offer.startDate ? new Date(offer.startDate).toISOString().split('T')[0] : "",
      endDate: offer.endDate ? new Date(offer.endDate).toISOString().split('T')[0] : "",
      isActive: offer.isActive ?? true,
    });
    setImagePreview(offer.imageUrl || "");
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this offer?")) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/admin/offers/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await fetchOffers();
        showToast.success("Offer deleted successfully");
      } else {
        const data = await response.json();
        showToast.error(data.error || "Failed to delete offer");
      }
    } catch (error) {
      console.error("Error deleting offer:", error);
      showToast.error("Failed to delete offer");
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
      startDate: "",
      endDate: "",
      isActive: true,
    });
    setImagePreview("");
  };

  if (loading && offers.length === 0) {
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
          <h1 className="text-3xl font-bold text-gray-900">Manage Offers</h1>
          <p className="text-gray-600 mt-1">Create and manage offers</p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setShowForm(!showForm);
          }}
          className="bg-primary hover:bg-primary/90"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Offer
        </Button>
      </div>

      {showForm && (
        <Card className="p-6 bg-white border-2 border-primary/10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-800">
              {editingId ? "Edit Offer" : "Create Offer"}
            </h2>
            <Button variant="ghost" size="sm" onClick={resetForm}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="title">Title (English) <span className="text-red-500">*</span></Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Offer Title"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="titleBn">Title (Bangla) <span className="text-red-500">*</span></Label>
                <Input
                  id="titleBn"
                  value={formData.titleBn}
                  onChange={(e) => setFormData({ ...formData, titleBn: e.target.value })}
                  placeholder="অফারের শিরোনাম"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label>Description (English) <span className="text-red-500">*</span></Label>
                <div className="border rounded-lg overflow-hidden min-h-[200px]">
                  <RichTextEditor
                    value={formData.description}
                    onChange={(val) => setFormData({ ...formData, description: val })}
                  />
                </div>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label>Description (Bangla) <span className="text-red-500">*</span></Label>
                <div className="border rounded-lg overflow-hidden min-h-[200px]">
                  <RichTextEditor
                    value={formData.descriptionBn}
                    onChange={(val) => setFormData({ ...formData, descriptionBn: val })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="image">Offer Cover Photo <span className="text-red-500">*</span></Label>
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
                        setFormData({ ...formData, imageUrl: "" });
                      }}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-4 flex flex-col justify-center">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-5 h-5 text-primary rounded border-gray-300 focus:ring-primary"
                  />
                  <Label htmlFor="isActive">Is Active</Label>
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={loading} className="flex-1 bg-primary">
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {editingId ? "Update Offer" : "Create Offer"}
              </Button>
              <Button type="button" variant="outline" onClick={resetForm} className="flex-1">
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {!showForm && offers.length === 0 ? (
        <Card className="p-12 text-center border-dashed border-2">
          <p className="text-gray-500 mb-4">No offers found.</p>
          <Button onClick={() => setShowForm(true)}>Add your first offer</Button>
        </Card>
      ) : !showForm && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(() => {
            const latestActiveOfferId = offers.find(o => o.isActive)?._id;
            return offers.map((offer) => (
              <Card key={offer._id} className="flex flex-col hover:shadow-lg transition-all duration-200 group overflow-hidden">
                <div className="h-40 overflow-hidden relative">
                  {offer.imageUrl ? (
                    <img src={offer.imageUrl} alt={offer.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  ) : (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center">No Image</div>
                  )}
                  {offer._id === latestActiveOfferId && (
                    <span className="absolute top-2 left-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded">Popup Banner</span>
                  )}
                  {!offer.isActive && (
                    <span className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded">Inactive</span>
                  )}
                </div>
              <div className="p-4 flex-1">
                <h3 className="font-bold text-lg mb-1 line-clamp-1">{offer.title}</h3>
                <p className="text-gray-500 text-sm line-clamp-2" dangerouslySetInnerHTML={{ __html: offer.description }}></p>
              </div>
              <div className="flex gap-2 p-3 bg-gray-50 border-t mt-auto">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => handleEdit(offer)}>
                  <Edit className="h-4 w-4 mr-2" /> Edit
                </Button>
                <Button variant="outline" size="sm" className="flex-1 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => handleDelete(offer._id)}>
                  <Trash2 className="h-4 w-4 mr-2" /> Delete
                </Button>
              </div>
            </Card>
          ));
        })()}
        </div>
      )}
    </div>
  );
}
