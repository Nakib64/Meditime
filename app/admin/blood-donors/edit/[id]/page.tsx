"use client";

import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import Image from "next/image";
import { useLanguage } from "@/contexts/LanguageContext";
import { t } from "@/lib/translations";
import { ArrowLeft } from "lucide-react";

const bloodDonorSchema = z.object({
  name: z.string().optional(),
  nameBn: z.string().optional(),
  phoneNumber: z.string().min(10, "Phone number is required"),
  bloodGroup: z.enum(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"], {
    message: "Blood group is required",
  }),
  division: z.string().optional(),
  district: z.string().optional(),
  thana: z.string().optional(),
  photo: z.string().optional(),
  availabilityStatus: z.enum(["Available", "Unavailable", "Recently Donated"], {
    message: "Availability status is required",
  }),
  isApproved: z.boolean().default(true)
});

type BloodDonorFormValues = z.infer<typeof bloodDonorSchema>;

export default function EditBloodDonorPage() {
  const params = useParams();
  const donorId = params.id as string;
  
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [language, setLanguage] = useState<'en' | 'bn'>('en');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Location state
  const [divisions, setDivisions] = useState<Array<{_id: string; name: string}>>([]);
  const [districts, setDistricts] = useState<Array<{_id: string; name: string}>>([]);
  const [thanas, setThanas] = useState<Array<{_id: string; name: string}>>([]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    getValues,
    formState: { errors },
  } = useForm<BloodDonorFormValues>({
    resolver: zodResolver(bloodDonorSchema) as any,
    defaultValues: {
      availabilityStatus: "Available",
    },
  });

  const watchedDivision = watch("division");
  const watchedDistrict = watch("district");

  // Fetch divisions on mount
  useEffect(() => {
    fetch("/api/locations/divisions")
      .then((res) => res.json())
      .then((data) => {
        if (data.divisions) setDivisions(data.divisions);
      });
  }, []);

  // Fetch donor data
  useEffect(() => {
    if (donorId) {
      fetch(`/api/blood-donors/${donorId}`)
        .then((res) => res.json())
        .then((data) => {
          console.log(data)
          if (data.bloodDonor) {
            const donor = data.bloodDonor;
            reset({
              name: donor.name || "",
              nameBn: donor.nameBn || "",
              phoneNumber: donor.phoneNumber || "",
              bloodGroup: donor.bloodGroup,
              division: donor.division || "",
              district: donor.district || "",
              thana: donor.thana || "",
              availabilityStatus: donor.availabilityStatus || "Available",
              photo: donor.photo || "",
              isApproved: donor.isApproved ?? true,
            });
            if (donor.photo) {
              setImagePreview(donor.photo);
            }
          }
        })
        .catch((error) => {
          console.error("Error fetching donor:", error);
          alert("Failed to load donor data");
        })
        .finally(() => {
          setIsFetching(false);
        });
    }
  }, [donorId, reset]);

  // Fetch districts when division changes
  useEffect(() => {
    if (watchedDivision) {
      const division = divisions.find(d => d.name === watchedDivision);
      if (division) {
        fetch(`/api/locations/districts?division=${division._id}`)
          .then((res) => res.json())
          .then((data) => {
            if (data.districts) setDistricts(data.districts);
          });
      }
    }
  }, [watchedDivision, divisions]);

  // Fetch thanas when district changes
  useEffect(() => {
    if (watchedDistrict) {
      const district = districts.find(d => d.name === watchedDistrict);
      if (district) {
        fetch(`/api/locations/thanas?district=${district._id}`)
          .then((res) => res.json())
          .then((data) => {
            if (data.thanas) setThanas(data.thanas);
          });
      }
    }
  }, [watchedDistrict, districts]);





  const onSubmit = async (data: BloodDonorFormValues) => {
    setIsLoading(true);
    try {
      let imageUrl = data.photo;

      if (selectedImage) {
        setIsUploading(true);
        try {
        } catch (error: any) {
          alert(error.message || "Failed to upload image. Please try again.");
          setIsLoading(false);
          setIsUploading(false);
          return;
        } finally {
          setIsUploading(false);
        }
      }

      const response = await fetch(`/api/blood-donors/${donorId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          photo: imageUrl || undefined,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        router.push("/admin/blood-donors");
        alert("Blood donor updated successfully!");
      } else {
        alert(result.error || "Failed to update blood donor");
      }
    } catch (error) {
      alert("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const { language: globalLanguage } = useLanguage();

  if (isFetching) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2">{t("loading", language)}</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t("back", language)}
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t("editBloodDonor", language)}</h1>
          <p className="text-gray-600 mt-1">{language === 'bn' ? 'রক্তদাতার তথ্য আপডেট করুন' : 'Update blood donor profile information'}</p>
        </div>
      </div>

      <Card className="p-6 bg-white">
        {/* <div className="flex justify-end mb-8">
          <div className="bg-gray-150/80 p-1.5 rounded-xl inline-flex shadow-inner">
            <button
              type="button"
              onClick={() => setLanguage('en')}
              className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
                language === 'en'
                  ? 'bg-white text-primary shadow-sm scale-105'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              English
            </button>
            <button
              type="button"
              onClick={() => setLanguage('bn')}
              className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
                language === 'bn'
                  ? 'bg-white text-primary shadow-sm scale-105'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              বাংলা
            </button>
          </div>
        </div> */}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">{language === 'bn' ? 'পূর্ণ নাম (English)' : 'Full Name (English)'}</Label>
              <Input
                id="name"
                {...register("name")}
                defaultValue={getValues("name")}
                placeholder="John Doe"
              />
              {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="nameBn">{language === 'bn' ? 'পূর্ণ নাম (বাংলা)' : 'Full Name (বাংলা)'}</Label>
              <Input
                id="nameBn"
                {...register("nameBn")}
                defaultValue={getValues("nameBn")}
                placeholder="জন ডো"
              />
              {errors.nameBn && <p className="text-sm text-red-500">{errors.nameBn.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phoneNumber">{t("phone", language)} *</Label>
              <div className="relative flex items-center">
                <span className="absolute left-3 flex items-center gap-1.5 text-gray-500 text-sm border-r pr-2 h-6 border-gray-300 pointer-events-none select-none">
                  <img src="https://flagcdn.com/w40/bd.png" alt="BD" className="w-6 h-4 rounded-sm object-cover" />
                  <span>+88</span>
                </span>
                <Input
                  id="phoneNumber"
                  type="tel"
                  maxLength={11}
                  placeholder="01XXXXXXXXX"
                  {...register("phoneNumber", {
                    onChange: (e) => {
                      e.target.value = e.target.value.replace(/\D/g, '').slice(0, 11);
                    }
                  })}
                  className="pl-[5rem] w-full"
                />
              </div>
              {errors.phoneNumber && <p className="text-sm text-red-500">{errors.phoneNumber.message}</p>}
            </div>


            <div className="space-y-2">
              <Label htmlFor="bloodGroup">{t("bloodGroup", language)} *</Label>
              <select
                id="bloodGroup"
                {...register("bloodGroup")}
                defaultValue={getValues("bloodGroup")}
                className="w-full h-10 px-3 border border-gray-300 rounded-md bg-white"
              >
                <option value="">{t("selectBloodGroup", language)}</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
              {errors.bloodGroup && <p className="text-sm text-red-500">{errors.bloodGroup.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="availabilityStatus">{t("availabilityStatus", language)} *</Label>
              <select
                id="availabilityStatus"
                {...register("availabilityStatus")}
                defaultValue={getValues("availabilityStatus")}
                className="w-full h-10 px-3 border border-gray-300 rounded-md bg-white"
              >
                <option value="Available">{language === 'bn' ? 'উপলব্ধ' : 'Available'}</option>
                <option value="Unavailable">{language === 'bn' ? 'অনুপলব্ধ' : 'Unavailable'}</option>
                <option value="Recently Donated">{language === 'bn' ? 'সম্প্রতি দিয়েছেন' : 'Recently Donated'}</option>
              </select>
              {errors.availabilityStatus && <p className="text-sm text-red-500">{errors.availabilityStatus.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="division">{t("division", language)}</Label>
              <select
                id="division"
                {...register("division", {
                  onChange: (e) => {
                    setValue("district", "");
                    setValue("thana", "");
                  }
                })}
                defaultValue={getValues("division")}
                className="w-full h-10 px-3 border border-gray-300 rounded-md bg-white"
              >
                <option value="">{t("selectDivision", language)}</option>
                {divisions.map((div) => (
                  <option key={div._id} value={div.name}>{div.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="district">{t("district", language)}</Label>
              <select
                id="district"
                {...register("district", {
                  onChange: (e) => {
                    setValue("thana", "");
                  }
                })}
                defaultValue={getValues("district")}
                disabled={!watchedDivision}
                className="w-full h-10 px-3 border border-gray-300 rounded-md bg-white disabled:opacity-50"
              >
                <option value="">{t("selectDistrict", language)}</option>
                {districts.map((dist) => (
                  <option key={dist._id} value={dist.name}>{dist.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="thana">{t("thana", language)}</Label>
              <select
                id="thana"
                {...register("thana")}
                defaultValue={getValues("thana")}
                disabled={!watchedDistrict || !watchedDivision}
                className="w-full h-10 px-3 border border-gray-300 rounded-md bg-white disabled:opacity-50"
              >
                <option value="">{t("selectThana", language)}</option>
                {thanas.map((thana) => (
                  <option key={thana._id} value={thana.name}>{thana.name}</option>
                ))}
              </select>
            </div>


          </div>

          <div className="pt-4 flex gap-4">
            <Button
              type="submit"
              disabled={isLoading || isUploading}
              className="flex-1 bg-primary hover:bg-primary/90 text-white font-bold h-10"
            >
              {isUploading
                ? t("uploading", language)
                : isLoading
                ? t("saving", language)
                : t("update", language)}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              className="flex-1 h-10 font-bold"
            >
              {t("cancel", language)}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
