"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";
import { t } from "@/lib/translations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Loader2 } from "lucide-react";
import { showToast } from "@/lib/toast";

const ambulanceSchema = z.object({
  name: z.string().min(2, "Name/Company is required"),
  nameBn: z.string().optional(),
  phoneNumber: z.string().min(10, "Phone number is required"),
  ambulanceNumber: z.string().min(1, "Ambulance number is required"),
  drivingLicence: z.string().min(1, "Driving licence is required"),
  division: z.string().optional(),
  district: z.string().optional(),
  thana: z.string().optional(),
  availabilityStatus: z.enum(["Available", "Unavailable", "On Call"], {
    message: "Availability status is required",
  }),
  vehicleType: z.enum(
    [
      "AC Ambulance", "Non AC Ambulance", "ICU Ambulance", "Freezing Ambulance", "NICU Ambulance", "Air Ambulance"
    ],
    {
      message: "Vehicle type is required",
    },
  ),
});

type AmbulanceFormValues = z.infer<typeof ambulanceSchema>;

export default function CreateAmbulancePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [language, setLanguage] = useState<'en' | 'bn'>('en');
  const router = useRouter();

  // Location state
  const [divisions, setDivisions] = useState<Array<{ _id: string; name: string }>>([]);
  const [districts, setDistricts] = useState<Array<{ _id: string; name: string }>>([]);
  const [thanas, setThanas] = useState<Array<{ _id: string; name: string }>>([]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<AmbulanceFormValues>({
    resolver: zodResolver(ambulanceSchema),
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

  // Fetch districts when division changes
  useEffect(() => {
    if (watchedDivision) {
      const division = divisions.find((d) => d.name === watchedDivision);
      if (division) {
        fetch(`/api/locations/districts?division=${division._id}`)
          .then((res) => res.json())
          .then((data) => {
            if (data.districts) setDistricts(data.districts);
          });
      }
      setValue("district", "");
      setValue("thana", "");
      setThanas([]);
    }
  }, [watchedDivision, divisions, setValue]);

  // Fetch thanas when district changes
  useEffect(() => {
    if (watchedDistrict) {
      const district = districts.find((d) => d.name === watchedDistrict);
      if (district) {
        fetch(`/api/locations/thanas?district=${district._id}`)
          .then((res) => res.json())
          .then((data) => {
            if (data.thanas) setThanas(data.thanas);
          });
      }
      setValue("thana", "");
    }
  }, [watchedDistrict, districts, setValue]);

  const onSubmit = async (data: AmbulanceFormValues) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/ambulances", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        showToast.success("Ambulance created successfully!");
        router.push("/admin/ambulances");
        router.refresh();
      } else {
        showToast.error(result.error || "Failed to create ambulance");
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      showToast.error("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t("back", language)}
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t("createAmbulance", language)}</h1>
          <p className="text-gray-600 mt-1">{language === 'bn' ? 'সিস্টেমে একটি নতুন অ্যাম্বুলেন্স সার্ভিস যোগ করুন' : 'Add a new ambulance service to the system'}</p>
        </div>
      </div>

      <Card className="p-6 bg-white">
        {/* <div className="flex justify-end mb-8">
          <div className="bg-gray-100/80 p-1.5 rounded-xl inline-flex shadow-inner">
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
              <Label htmlFor="name">{t("ambulanceServiceName", language)} *</Label>
              <Input
                id="name"
                {...register("name")}
                placeholder="Ambulance Service Name"
              />
              {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="nameBn">{t("nameBn", language)}</Label>
              <Input
                id="nameBn"
                {...register("nameBn")}
                placeholder="অ্যাম্বুলেন্স সার্ভিসের নাম লিখুন"
              />
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
              <Label htmlFor="ambulanceNumber">{t("ambulanceNo", language)} *</Label>
              <Input
                id="ambulanceNumber"
                {...register("ambulanceNumber")}
                placeholder="e.g. Dhaka-MET-11-1234"
              />
              {errors.ambulanceNumber && <p className="text-sm text-red-500">{errors.ambulanceNumber.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="drivingLicence">{t("drivingLicence", language)} *</Label>
              <Input
                id="drivingLicence"
                {...register("drivingLicence")}
                placeholder="e.g. 123456789"
              />
              {errors.drivingLicence && <p className="text-sm text-red-500">{errors.drivingLicence.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="division">{language === 'bn' ? 'বিভাগ' : 'Division'}</Label>
              <select
                id="division"
                {...register("division")}
                className="w-full h-10 px-3 border border-gray-300 rounded-md bg-white"
                onChange={(e) => {
                  setValue("division", e.target.value);
                  setValue("district", "");
                  setValue("thana", "");
                }}
              >
                <option value="">{t("selectDivision", language)}</option>
                {divisions.map((div) => (
                  <option key={div._id} value={div.name}>{div.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="district">{language === 'bn' ? 'জেলা' : 'District'}</Label>
              <select
                id="district"
                {...register("district")}
                disabled={!watchedDivision}
                className="w-full h-10 px-3 border border-gray-300 rounded-md bg-white disabled:opacity-50"
                onChange={(e) => {
                  setValue("district", e.target.value);
                  setValue("thana", "");
                }}
              >
                <option value="">{t("selectDistrict", language)}</option>
                {districts.map((dist) => (
                  <option key={dist._id} value={dist.name}>{dist.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="thana">{language === 'bn' ? 'থানা' : 'Thana'}</Label>
              <select
                id="thana"
                {...register("thana")}
                disabled={!watchedDistrict}
                className="w-full h-10 px-3 border border-gray-300 rounded-md bg-white disabled:opacity-50"
              >
                <option value="">{t("selectThana", language)}</option>
                {thanas.map((thana) => (
                  <option key={thana._id} value={thana.name}>{thana.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="vehicleType">{t("vehicleType", language)} *</Label>
              <select
                id="vehicleType"
                {...register("vehicleType")}
                className="w-full h-10 px-3 border border-gray-300 rounded-md bg-white"
              >
                <option value="">{t("selectVehicleType", language)}</option>
                <option value="AC Ambulance">{t("acAmbulance", language)}</option>
                <option value="Non AC Ambulance">{t("nonAcAmbulance", language)}</option>
                <option value="ICU Ambulance">{t("icuAmbulance", language)}</option>
                <option value="Freezing Ambulance">{t("freezingAmbulance", language)}</option>
                <option value="NICU Ambulance">{t("nicuAmbulance", language)}</option>
                <option value="Air Ambulance">{t("airAmbulance", language)}</option>
              </select>
              {errors.vehicleType && <p className="text-sm text-red-500">{errors.vehicleType.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="availabilityStatus">{t("availabilityStatus", language)} *</Label>
              <select
                id="availabilityStatus"
                {...register("availabilityStatus")}
                className="w-full h-10 px-3 border border-gray-300 rounded-md bg-white"
              >
                <option value="Available">{t("available", language)}</option>
                <option value="Unavailable">{t("unavailable", language)}</option>
                <option value="On Call">{t("onCall", language)}</option>
              </select>
              {errors.availabilityStatus && <p className="text-sm text-red-500">{errors.availabilityStatus.message}</p>}
            </div>
          </div>

          <div className="pt-4 flex gap-4">
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-primary hover:bg-primary/90 text-white font-bold h-10"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("saving", language)}
                </>
              ) : (
                t("create", language)
              )}
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
