"use client";

import { useEffect, useState } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, X, Loader2, Image as ImageIcon } from "lucide-react";
import { showToast } from "@/lib/toast";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";
import { t } from "@/lib/translations";
import { convertToBengaliNumber, convertToEnglishNumber } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { SearchableSelect } from "@/components/ui/searchable-select";


const doctorSchema = z.object({
  name: z.string().optional(),
  nameBn: z.string().optional(),
  department: z.string().optional(),
  departmentBn: z.string().optional(),
  specialty: z.string().optional(),
  specialtyBn: z.string().optional(),
  qualification: z.string().optional(),
  qualificationBn: z.string().optional(),
  designation: z.string().optional(),
  designationBn: z.string().optional(),
  newPatientFee: z.number().min(0).optional(),
  newPatientFeeBn: z.string().optional(),
  reportShowFee: z.number().min(0).optional(),
  reportShowFeeBn: z.string().optional(),
  bio: z.string().optional(),
  bioBn: z.string().optional(),
  phone: z.string().optional(),
  experience: z.number().min(0).optional(),
  availability: z.array(z.object({
    days: z.array(z.string()),
    daysBn: z.array(z.string()).optional(),
    time: z.string().optional(),
    timeBn: z.string().optional(),
    hospital: z.string().min(1, "Hospital is required"),
  })).optional(),
  image: z.string().optional(),
}).refine((data) => data.name || data.nameBn, {
  message: "At least one name (English or Bangla) is required",
  path: ["name"],
}).refine((data) => data.qualification || data.qualificationBn, {
  message: "At least one qualification (English or Bangla) is required",
  path: ["qualification"],
});

type DoctorFormValues = z.infer<typeof doctorSchema>;

const daysOfWeek = [
  "Saturday",
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
];

const banglaDays = ["শনি", "রবি", "সোম", "মঙ্গল", "বুধ", "বৃহস্পতি", "শুক্র"];

export default function CreateDoctorPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const [formLanguage, setFormLanguage] = useState<'en' | 'bn'>(language);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [departments, setDepartments] = useState<any[]>([]);
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [diseases, setDiseases] = useState<any[]>([]);
  const [filteredDiseases, setFilteredDiseases] = useState<any[]>([]);
  const [selectedDiseaseIds, setSelectedDiseaseIds] = useState<string[]>([]);
  
  const [divisions, setDivisions] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [thanas, setThanas] = useState<any[]>([]);
  const [filteredDistricts, setFilteredDistricts] = useState<any[]>([]);
  const [filteredThanas, setFilteredThanas] = useState<any[]>([]);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<DoctorFormValues>({
    resolver: zodResolver(doctorSchema),
    defaultValues: {
      name: "",
      nameBn: "",
      department: "",
      departmentBn: "",
      specialty: "",
      specialtyBn: "",
      qualification: "",
      qualificationBn: "",
      designation: "",
      designationBn: "",
      bio: "",
      bioBn: "",
      phone: "",
      image: "",
      availability: [{ days: [], time: "", timeBn: "", hospital: "" }],
      newPatientFee: 0,
      newPatientFeeBn: "",
      reportShowFee: 0,
      reportShowFeeBn: "",
      experience: 0,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "availability",
  });

  const imageUrl = watch("image");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [deptsRes, hospsRes, divsRes, distsRes, thanasRes, diseasesRes] = await Promise.all([
          fetch("/api/departments"),
          fetch("/api/locations/hospitals?limit=1000"),
          fetch("/api/locations/divisions"),
          fetch("/api/locations/districts"),
          fetch("/api/locations/thanas"),
          fetch("/api/diseases")
        ]);
        
        if (deptsRes.ok) {
          const deptsData = await deptsRes.json();
          setDepartments(deptsData.departments || []);
        }
        
        if (hospsRes.ok) {
          const hospsData = await hospsRes.json();
          setHospitals(hospsData.hospitals || []);
        }

        if (divsRes.ok) {
          const data = await divsRes.json();
          setDivisions(data.divisions || []);
        }
        
        if (distsRes.ok) {
          const data = await distsRes.json();
          setDistricts(data.districts || []);
        }
        
        if (thanasRes.ok) {
          const data = await thanasRes.json();
          setThanas(data.thanas || []);
        }

        if (diseasesRes.ok) {
          const diseasesData = await diseasesRes.json();
          setDiseases(diseasesData.diseases || []);
          setFilteredDiseases(diseasesData.diseases || []);
        }
      } catch (error) {
        console.error("Error fetching dependencies:", error);
      }
    };
    fetchData();
  }, []);

  // Sync formLanguage with global language on initial load
  useEffect(() => {
    setFormLanguage(language);
  }, [language]);

  const selectedDepartment = watch("department");
  useEffect(() => {
    if (!selectedDepartment) {
      setFilteredDiseases(diseases);
    } else {
      const filtered = diseases.filter(d => {
        const deptId = d.department?._id || d.department;
        const dept = departments.find(dep => dep.name === selectedDepartment);
        return deptId === dept?._id;
      });
      setFilteredDiseases(filtered);
    }
  }, [selectedDepartment, diseases, departments]);

  const [duplicateMatches, setDuplicateMatches] = useState<any[]>([]);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);

  const watchName = watch("name");
  const watchNameBn = watch("nameBn");
  const watchDesignation = watch("designation");
  const watchSpecialty = watch("specialty");
  const watchQualification = watch("qualification");
  const watchDesignationBn = watch("designationBn");
  const watchSpecialtyBn = watch("specialtyBn");
  const watchQualificationBn = watch("qualificationBn");

  useEffect(() => {
    const checkDuplicates = async () => {
      const n = watchName || watchNameBn;
      const des = watchDesignation || watchDesignationBn;
      const spec = watchSpecialty || watchSpecialtyBn;
      const qual = watchQualification || watchQualificationBn;

      const fields = [
        watchName,
        watchNameBn,
        watchDesignation,
        watchDesignationBn,
        watchSpecialty,
        watchSpecialtyBn,
        watchQualification,
        watchQualificationBn
      ];
      const filledCount = fields.filter(f => typeof f === 'string' && f.trim().length > 0).length;

      if (filledCount >= 4) {
        try {
          const res = await fetch("/api/doctors/check-duplicate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: n,
              designation: des || undefined,
              specialty: spec || undefined,
              qualification: qual || undefined
            })
          });
          if (res.ok) {
            const data = await res.json();
            if (data.matches && data.matches.length > 0) {
              setDuplicateMatches(data.matches);
              setShowDuplicateModal(true);
            }
          }
        } catch (error) {
          console.error("Duplicate check error", error);
        }
      }
    };
    
    const timeoutId = setTimeout(checkDuplicates, 1000);
    return () => clearTimeout(timeoutId);
  }, [
    watchName, watchNameBn, 
    watchDesignation, watchDesignationBn, 
    watchSpecialty, watchSpecialtyBn, 
    watchQualification, watchQualificationBn
  ]);

  const onSubmit = async (data: DoctorFormValues) => {
    setLoading(true);
    try {
      const availabilityWithDaysBn = data.availability?.map(slot => {
        const daysBn = slot.days.map(day => {
          const index = daysOfWeek.indexOf(day);
          return index !== -1 ? banglaDays[index] + 'বার' : day;
        });
        return { ...slot, daysBn };
      });

      // Extract English and Bangla disease names from selected disease IDs
      const diseasesBn = selectedDiseaseIds
        .map(id => diseases.find(d => d._id === id)?.bangla)
        .filter((d): d is string => !!d);
      const diseasesEn = selectedDiseaseIds
        .map(id => diseases.find(d => d._id === id)?.name)
        .filter((d): d is string => !!d);

      const response = await fetch("/api/doctors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          availability: availabilityWithDaysBn,
          diseases: diseasesBn,
          diseasesEn: diseasesEn,
        }),
      });

      if (response.ok) {
        showToast.success(language === 'bn' ? "ডাক্তার প্রোফাইল সফলভাবে তৈরি করা হয়েছে" : "Doctor profile created successfully");
        router.push("/admin/doctors");
      } else {
        const err = await response.json();
        showToast.error(err.error || "Failed to create doctor profile");
      }
    } catch (error) {
      console.error("Error creating doctor:", error);
      showToast.error("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploading(true);
      const formData = new FormData();
      formData.append("image", file);
      try {
        const res = await fetch("/api/upload/imgbb", {
          method: "POST",
          body: formData,
        });
        const json = await res.json();
        if (json.url) {
          setValue("image", json.url);
          showToast.success(language === 'bn' ? "ছবি আপলোড সফল হয়েছে" : "Image uploaded successfully");
        } else {
          showToast.error("Failed to upload image");
        }
      } catch (err) {
        console.error("Upload error:", err);
        showToast.error("Failed to upload image");
      } finally {
        setUploading(false);
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          {t("createDoctorProfile", language)}
        </h1>
        <p className="text-gray-600 mt-2">
          {language === 'bn' ? 'নতুন ডাক্তারের তথ্য এবং শিডিউল যোগ করুন' : 'Add new doctor information and schedule to the system'}
        </p>
      </div>

      <Card className="p-6">
        <div className="flex justify-end mb-8">
          <div className="bg-gray-100/80 p-1.5 rounded-xl inline-flex shadow-inner">
            <button
              type="button"
              onClick={() => setFormLanguage('en')}
              className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
                formLanguage === 'en'
                  ? 'bg-white text-primary shadow-sm scale-105'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              English
            </button>
            <button
              type="button"
              onClick={() => setFormLanguage('bn')}
              className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
                formLanguage === 'bn'
                  ? 'bg-white text-primary shadow-sm scale-105'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              বাংলা
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className={formLanguage === 'en' ? 'block' : 'hidden'}>
                  <Label htmlFor="name">
                    {t("name", "en")} <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    {...register("name")}
                    placeholder="Dr. John Doe"
                    className="mt-1"
                  />
                  {errors.name && (
                    <p className="text-sm text-red-500 mt-1">
                      {errors.name.message}
                    </p>
                  )}
              </div>
              <div className={formLanguage === 'bn' ? 'block' : 'hidden'}>
                  <Label htmlFor="nameBn">
                    {t("nameBn", "bn")}
                  </Label>
                  <Input
                    id="nameBn"
                    {...register("nameBn")}
                    placeholder="ডাঃ জন ডো"
                    className="mt-1"
                  />
                  {errors.name && (
                    <p className="text-sm text-red-500 mt-1">
                      {errors.name.message}
                    </p>
                  )}
              </div>
            </div>

            <div>
              <div className={formLanguage === 'en' ? 'block' : 'hidden'}>
                  <Label htmlFor="specialty">
                    {t("specialty", "en")}
                  </Label>
                  <Input
                    id="specialty"
                    {...register("specialty")}
                    placeholder="e.g. Cardiologist"
                    className="mt-1"
                  />
              </div>
              <div className={formLanguage === 'bn' ? 'block' : 'hidden'}>
                  <Label htmlFor="specialtyBn">
                    {t("specialtyBn", "bn")}
                  </Label>
                  <Input
                    id="specialtyBn"
                    {...register("specialtyBn")}
                    placeholder="হৃদরোগ বিশেষজ্ঞ"
                    className="mt-1"
                  />
              </div>
            </div>

            <div>
              <div className={formLanguage === 'en' ? 'block' : 'hidden'}>
                  <Label htmlFor="qualification">
                    {t("qualification", "en")} <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="qualification"
                    {...register("qualification")}
                    placeholder="MBBS, MD"
                    rows={2}
                    className="mt-1"
                  />
                  {errors.qualification && (
                    <p className="text-sm text-red-500 mt-1">
                      {errors.qualification.message}
                    </p>
                  )}
              </div>
              <div className={formLanguage === 'bn' ? 'block' : 'hidden'}>
                  <Label htmlFor="qualificationBn">
                    {t("qualificationBn", "bn")}
                  </Label>
                  <Textarea
                    id="qualificationBn"
                    {...register("qualificationBn")}
                    placeholder="এমবিবিএস, এমডি"
                    rows={2}
                    className="mt-1"
                  />
                  {errors.qualification && (
                    <p className="text-sm text-red-500 mt-1">
                      {errors.qualification.message}
                    </p>
                  )}
              </div>
            </div>

            <div>
              <div className={formLanguage === 'en' ? 'block' : 'hidden'}>
                  <Label htmlFor="designation">{t("designation", "en")}</Label>
                  <Input
                    id="designation"
                    {...register("designation")}
                    placeholder="e.g. Senior Consultant"
                    className="mt-1"
                  />
              </div>
              <div className={formLanguage === 'bn' ? 'block' : 'hidden'}>
                  <Label htmlFor="designationBn">{t("designationBn", "bn")}</Label>
                  <Input
                    id="designationBn"
                    {...register("designationBn")}
                    placeholder="সিনিয়র কনসালটেন্ট"
                    className="mt-1"
                  />
              </div>
            </div>


            <div>
              <Label htmlFor="department">
                {t("selectDepartment", formLanguage)}
              </Label>
              <select
                id="department"
                {...register("department")}
                onChange={(e) => {
                  setValue("department", e.target.value);
                  const dept = departments.find(d => d.name === e.target.value);
                  if (dept) {
                    setValue("departmentBn", dept.nameBn || "");
                  } else {
                    setValue("departmentBn", "");
                  }
                }}
                className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mt-1"
              >
                <option value="">{t("selectDepartment", formLanguage)}</option>
                {departments.map((d) => (
                  <option key={d._id} value={d.name}>
                    {formLanguage === 'bn' && d.nameBn ? d.nameBn : d.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className={formLanguage === 'en' ? 'block' : 'hidden'}>
                <Label htmlFor="newPatientFee">
                  {t("newPatientFee", "en")}
                </Label>
                <Input
                  id="newPatientFee"
                  type="number"
                  {...register("newPatientFee", { 
                    valueAsNumber: true,
                    onChange: (e) => {
                      const val = e.target.value;
                      setValue("newPatientFeeBn", convertToBengaliNumber(val));
                    }
                  })}
                  placeholder="500"
                  className="mt-1"
                />
              </div>
              <div className={formLanguage === 'bn' ? 'block' : 'hidden'}>
                <Label htmlFor="newPatientFeeBn">
                  {t("newPatientFee", "bn")}
                </Label>
                <Input
                  id="newPatientFeeBn"
                  type="text"
                  {...register("newPatientFeeBn", {
                    onChange: (e) => {
                      const engVal = convertToEnglishNumber(e.target.value);
                      const num = engVal ? Number(engVal) : 0;
                      setValue("newPatientFee", num);
                    }
                  })}
                  placeholder="৫০০"
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <div className={formLanguage === 'en' ? 'block' : 'hidden'}>
                <Label htmlFor="reportShowFee">
                  {t("reportShowFee", "en")}
                </Label>
                <Input
                  id="reportShowFee"
                  type="number"
                  {...register("reportShowFee", { 
                    valueAsNumber: true,
                    onChange: (e) => {
                      const val = e.target.value;
                      setValue("reportShowFeeBn", convertToBengaliNumber(val));
                    }
                  })}
                  placeholder="400"
                  className="mt-1"
                />
              </div>
              <div className={formLanguage === 'bn' ? 'block' : 'hidden'}>
                <Label htmlFor="reportShowFeeBn">
                  {t("reportShowFee", "bn")}
                </Label>
                <Input
                  id="reportShowFeeBn"
                  type="text"
                  {...register("reportShowFeeBn", {
                    onChange: (e) => {
                      const engVal = convertToEnglishNumber(e.target.value);
                      const num = engVal ? Number(engVal) : 0;
                      setValue("reportShowFee", num);
                    }
                  })}
                  placeholder="৪০০"
                  className="mt-1"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <div className="flex items-center justify-between mb-3">
                <Label className="block font-semibold text-gray-900">
                  {formLanguage === 'bn' ? 'যে সকল রোগের চিকিৎসা করা হয়' : 'Diseases Treated'}
                </Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const visibleIds = filteredDiseases.map(d => d._id);
                      const updated = Array.from(new Set([...selectedDiseaseIds, ...visibleIds]));
                      setSelectedDiseaseIds(updated);
                      setValue("availability", watch("availability")); // Dummy trigger
                    }}
                    className="h-8 text-xs"
                  >
                    Select All
                  </Button>
                </div>
              </div>
              <div className="max-h-60 overflow-y-auto border-2 border-gray-300 rounded-lg p-4 bg-white grid grid-cols-1 md:grid-cols-2 gap-2">
                {filteredDiseases.map((disease) => {
                  const diseaseName = formLanguage === 'bn' ? (disease.bangla || disease.name) : (disease.name || disease.bangla);
                  
                  return (
                    <label key={disease._id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedDiseaseIds.includes(disease._id)}
                        onChange={(e) => {
                          const updated = e.target.checked 
                            ? [...selectedDiseaseIds, disease._id]
                            : selectedDiseaseIds.filter(id => id !== disease._id);
                          setSelectedDiseaseIds(updated);
                        }}
                        className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                      />
                      <span className="text-sm">{diseaseName}</span>
                    </label>
                  );
                })}
              </div>
            </div>


             <div>
              <Label htmlFor="experience">
                {formLanguage === 'bn' ? 'অভিজ্ঞতা (বছর)' : 'Experience (Years)'}
              </Label>
              <Input
                id="experience"
                type="number"
                {...register("experience", { valueAsNumber: true })}
                placeholder="0"
                className="mt-1"
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="image">{t("profileImage", formLanguage)}</Label>
              <div className="mt-1 space-y-3">
                <div className="flex items-center gap-4">
                  <Input
                    id="image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('image')?.click()}
                    disabled={loading || uploading}
                  >
                    {uploading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      t(imageUrl ? "changeImage" : "selectImage", formLanguage)
                    )}
                  </Button>
                  {imageUrl && (
                    <span className="text-sm text-green-600 flex items-center">
                       <ImageIcon className="h-4 w-4 mr-1"/> Image Selected
                    </span>
                  )}
                </div>
                {imageUrl && (
                  <div className="relative w-32 h-32 rounded-lg overflow-hidden border border-gray-300">
                    <img
                      src={imageUrl}
                      alt="Preview"
                      className="object-cover w-full h-full"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div>
            <div className={formLanguage === 'en' ? 'block' : 'hidden'}>
                <Label htmlFor="bio">
                  {t("bio", "en")} <span className="text-gray-500 text-xs">(Optional)</span>
                </Label>
                <Textarea
                  id="bio"
                  {...register("bio")}
                  rows={4}
                  className="mt-1"
                  placeholder="Doctor's biography..."
                />
            </div>
            <div className={formLanguage === 'bn' ? 'block' : 'hidden'}>
                <Label htmlFor="bioBn">
                  {t("bioBn", "bn")} <span className="text-gray-500 text-xs">(Optional)</span>
                </Label>
                <Textarea
                  id="bioBn"
                  {...register("bioBn")}
                  rows={4}
                  className="mt-1"
                  placeholder="ডাক্তারের জীবনী..."
                />
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <Label className="text-lg font-semibold">
                {t("availability", formLanguage)} <span className="text-red-500">*</span>
              </Label>
              <Button
                type="button"
                onClick={() => append({ days: [], time: "", timeBn: "", hospital: "" })}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                {t("addSlot", formLanguage)}
              </Button>
            </div>

            {fields.map((field, slotIndex) => (
              <Card key={field.id} className="p-4 border-2 border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <Label className="text-base font-semibold">
                    {formLanguage === 'bn' ? 'স্লট' : 'Slot'} {slotIndex + 1}
                  </Label>
                  {fields.length > 1 && (
                    <Button
                      type="button"
                      onClick={() => remove(slotIndex)}
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <Label className="mb-2 block">
                      {t("hospitalName", formLanguage)} <span className="text-red-500">*</span>
                    </Label>
                    <Controller
                      name={`availability.${slotIndex}.hospital`}
                      control={control}
                      render={({ field }) => (
                        <SearchableSelect
                          options={hospitals.map(h => ({
                            value: h.slug || h.name,
                            label: formLanguage === 'bn' && h.nameBn ? h.nameBn : h.name
                          }))}
                          value={field.value || ''}
                          onChange={field.onChange}
                          placeholder={t("selectHospital", formLanguage)}
                          className="mt-1"
                          error={!!errors.availability?.[slotIndex]?.hospital}
                        />
                      )}
                    />
                    {errors.availability?.[slotIndex]?.hospital && (
                      <p className="text-sm text-red-500 mt-1">
                        {errors.availability[slotIndex]?.hospital?.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label className="mb-2 block">
                      {t("selectDays", formLanguage)} <span className="text-red-500">*</span>
                    </Label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {daysOfWeek.map((day, dayIndex) => {
                         const currentDays = watch(`availability.${slotIndex}.days`) || [];
                         const isSelected = currentDays.includes(day);
                         return (
                          <button
                            key={day}
                            type="button"
                            onClick={() => {
                               const newDays = isSelected
                                 ? currentDays.filter(d => d !== day)
                                 : [...currentDays, day];
                               setValue(`availability.${slotIndex}.days`, newDays);
                            }}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                              isSelected
                                ? "bg-primary text-white"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            }`}
                            
                          >
                            {formLanguage === 'bn' ? banglaDays[dayIndex] + 'বার' : day}
                          </button>
                        );
                      })}
                      {(() => {
                        const currentDays = watch(`availability.${slotIndex}.days`) || [];
                        const currentTime = watch(`availability.${slotIndex}.time`);
                        const currentTimeBn = watch(`availability.${slotIndex}.timeBn`);
                        const isOnCall = currentDays.length === daysOfWeek.length && currentTime === "On Call" && currentTimeBn === "অন কল";
                        
                        return (
                          <button
                            type="button"
                            onClick={() => {
                              if (isOnCall) {
                                setValue(`availability.${slotIndex}.days`, []);
                                setValue(`availability.${slotIndex}.time`, "");
                                setValue(`availability.${slotIndex}.timeBn`, "");
                              } else {
                                setValue(`availability.${slotIndex}.days`, daysOfWeek);
                                setValue(`availability.${slotIndex}.time`, "On Call");
                                setValue(`availability.${slotIndex}.timeBn`, "অন কল");
                              }
                            }}
                            className={`px-4 py-2 rounded-md text-sm font-bold transition-all border shadow-sm hover:shadow ${
                              isOnCall 
                                ? "bg-amber-600 text-white border-amber-700" 
                                : "bg-amber-100 text-amber-700 hover:bg-amber-200 border-amber-300"
                            }`}
                          >
                            {formLanguage === 'bn' ? 'অন কল' : 'On Call'}
                          </button>
                        );
                      })()}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className={formLanguage === 'en' ? 'block' : 'hidden'}>
                      <Label htmlFor={`time-${slotIndex}`}>
                        {t("timeSlot", "en")}
                      </Label>
                      <Input
                        id={`time-${slotIndex}`}
                        {...register(`availability.${slotIndex}.time`)}
                        placeholder="e.g. 10:00 AM - 04:00 PM"
                        className="mt-1"
                      />
                    </div>
                    <div className={formLanguage === 'bn' ? 'block' : 'hidden'}>
                      <Label htmlFor={`timeBn-${slotIndex}`}>
                        {t("timeSlot", "bn")}
                      </Label>
                      <Input
                        id={`timeBn-${slotIndex}`}
                        {...register(`availability.${slotIndex}.timeBn`)}
                        placeholder="উদাঃ সকাল ১০:০০ - বিকাল ০৪:০০"
                        className="mt-1"
                          />
                  </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="flex gap-4 pt-8">
            <Button
              type="submit"
              disabled={loading || uploading}
              className="flex-1 h-12 text-lg font-bold bg-primary hover:bg-primary/90 shadow-md rounded-xl transition-all active:scale-95"
            >
              {uploading
                ? t("uploading", formLanguage)
                : loading
                ? (formLanguage === 'bn' ? 'তৈরি করা হচ্ছে...' : 'Creating...')
                : t("create", formLanguage)}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              className="flex-1 h-12 text-lg font-bold border-2 rounded-xl transition-all"
            >
              {t("cancel", formLanguage)}
            </Button>
          </div>
        </form>
      </Card>

      <Dialog open={showDuplicateModal} onOpenChange={setShowDuplicateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Similar Doctor Found</DialogTitle>
            <DialogDescription>
              We found doctors with very similar details. Are you sure you want to create a new one?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 my-4 max-h-[60vh] overflow-y-auto">
            {duplicateMatches.map((match) => (
              <div key={match._id} className="p-3 border rounded-lg">
                <p className="font-semibold">{match.name}</p>
                <p className="text-sm text-gray-600">{match.specialty} | {match.designation}</p>
                <div className="mt-2 text-xs text-gray-500">Similarity: {match.similarity}%</div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2"
                  onClick={() => router.push(`/admin/doctors/edit/${match._id}`)}
                >
                  Edit This Doctor
                </Button>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDuplicateModal(false)}>
              Create Anyway
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
