"use client";

import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { showToast } from "@/lib/toast";
import { convertToBengaliNumber, convertToEnglishNumber } from "@/lib/utils";
import * as z from "zod";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import Image from "next/image";
import { Plus, X } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { t } from "@/lib/translations";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { SearchableSelect } from "@/components/ui/searchable-select";
const doctorSchema = z.object({
  name: z.string().optional(),
  specialty: z.string().optional(),
  qualification: z.string().optional(),
  designation: z.string().optional(),

  department: z.string().optional(),
  departmentBn: z.string().optional(),

  reportShowFee: z.coerce.number().min(0, "Report show fee must be at least 0").optional(),
  reportShowFeeBn: z.string().optional(),
  newPatientFee: z.coerce.number().min(0, "New patient fee must be at least 0").optional(),
  newPatientFeeBn: z.string().optional(),

  diseases: z.array(z.string()).optional(),
  diseasesEn: z.array(z.string()).optional(),

  bio: z.string().optional(),

  // Bangla Fields
  nameBn: z.string().optional(),
  specialtyBn: z.string().optional(),
  qualificationBn: z.string().optional(),
  designationBn: z.string().optional(),
  bioBn: z.string().optional(),

  image: z.string().optional(),
  availabilitySlots: z.array(z.object({
    days: z.array(z.string()).min(1, "Select at least one day"),
    daysBn: z.array(z.string()).optional(),
    time: z.string().optional(),
    timeBn: z.string().optional(),
    hospital: z.string().min(1, "Hospital is required"),
  })).min(1, "Add at least one availability slot"),
}).refine((data) => data.name || data.nameBn, {
  message: "Name (English or Bangla) is required",
  path: ["name"],
}).refine((data) => data.qualification || data.qualificationBn, {
  message: "Qualification (English or Bangla) is required",
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

const banglaDays = [
  "শনি",
  "রবি",
  "সোম",
  "মঙ্গল",
  "বুধ",
  "বৃহস্পতি",
  "শুক্র",
];

interface AvailabilitySlot {
  days: string[];
  daysBn?: string[];
  time: string;
  timeBn?: string;
  hospital: string;
}

export default function EditDoctorPage() {
  const { language: globalLanguage } = useLanguage();
  const [language, setLanguage] = useState<'en' | 'bn'>(globalLanguage);

  // Debug: log language changes
  useEffect(() => {
    console.log('[LANGUAGE STATE] Current language:', language);
  }, [language]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const params = useParams();
  const doctorId = params?.id as string;



  // Hospital Search State
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [availableHospitals, setAvailableHospitals] = useState<any[]>([]);
  const [hospitalSearchTerm, setHospitalSearchTerm] = useState("");
  const [hospitalPage, setHospitalPage] = useState(1);
  const [hasMoreHospitals, setHasMoreHospitals] = useState(false);
  const [isHospitalLoading, setIsHospitalLoading] = useState(false);
  const [showHospitalDropdown, setShowHospitalDropdown] = useState(false);
  const [selectedHospitalName, setSelectedHospitalName] = useState("");
  const hospitalDropdownRef = useRef<HTMLDivElement>(null);
  const hospitalSearchInitialized = useRef(false);
  const [departments, setDepartments] = useState<Array<{ _id: string; name: string; nameBn?: string; image?: string }>>([]);
  const [diseases, setDiseases] = useState<Array<{ _id: string; name: string; bangla: string; department?: { _id: string; name: string } | string }>>([]);
  const [selectedDiseaseIds, setSelectedDiseaseIds] = useState<string[]>([]);
  const [filteredDiseases, setFilteredDiseases] = useState<Array<{ _id: string; name: string; bangla: string; department?: { _id: string; name: string } | string }>>([]);

  const [divisions, setDivisions] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [thanas, setThanas] = useState<any[]>([]);
  const [filteredDistricts, setFilteredDistricts] = useState<any[]>([]);
  const [filteredThanas, setFilteredThanas] = useState<any[]>([]);

  const [availabilitySlots, setAvailabilitySlots] = useState<AvailabilitySlot[]>([
    { days: [], time: "", hospital: "" },
  ]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<DoctorFormValues>({
    resolver: zodResolver(doctorSchema) as any,
    defaultValues: {
      name: "",
      nameBn: "",
      specialty: "",
      specialtyBn: "",
      qualification: "",
      qualificationBn: "",
      designation: "",
      designationBn: "",
      department: "",
      departmentBn: "",
      reportShowFee: 0,
      reportShowFeeBn: "",
      newPatientFee: 0,
      newPatientFeeBn: "",
      diseases: [],
      diseasesEn: [],
      bio: "",
      bioBn: "",
      image: "",
      availabilitySlots: [{ days: [], time: "", timeBn: "", hospital: "" }],
    },
  });
  const fetchHospitals = async (searchValue: string = "", pageToLoad = 1) => {
    setIsHospitalLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchValue) {
        params.set("search", searchValue);
      }
      params.set("page", pageToLoad.toString());
      params.set("limit", "20");

      const response = await fetch(`/api/locations/hospitals?${params.toString()}`);
      const data = await response.json();

      if (response.ok && data.hospitals) {
        setHospitals((prev) => {
          const nextHospitals =
            pageToLoad === 1
              ? data.hospitals
              : [
                ...prev,
                ...data.hospitals.filter(
                  (newHospital: any) =>
                    !prev.some((existing) => existing._id === newHospital._id)
                ),
              ];

          setAvailableHospitals(nextHospitals);
          return nextHospitals;
        });
        setHasMoreHospitals(Boolean(data.hasMore));
        setHospitalPage(pageToLoad);
      } else {
        if (pageToLoad === 1) {
          setHospitals([]);
          setAvailableHospitals([]);
        }
        setHasMoreHospitals(false);
      }
    } catch (error) {
      console.error("Error fetching hospitals:", error);
      if (pageToLoad === 1) {
        setHospitals([]);
        setAvailableHospitals([]);
      }
      setHasMoreHospitals(false);
    } finally {
      setIsHospitalLoading(false);
    }
  };


  // Sync internal language with global language on mount
  useEffect(() => {
    setLanguage(globalLanguage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Watch department field and filter diseases
  const selectedDepartment = watch("department");

  useEffect(() => {
    if (!selectedDepartment || selectedDepartment === "") {
      // Show all diseases if no department selected
      setFilteredDiseases(diseases);
    } else {
      // Find department by name
      const dept = departments.find(d => d.name === selectedDepartment);
      if (dept) {
        // Filter diseases by department
        const filtered = diseases.filter(disease => {
          if (!disease.department) return false;
          const deptId = typeof disease.department === 'object' ? (disease.department as any)._id : disease.department;
          return deptId === dept._id;
        });
        setFilteredDiseases(filtered);
      } else {
        // If department not found, show diseases without department
        setFilteredDiseases(diseases.filter(disease => !disease.department));
      }
    }
  }, [selectedDepartment, departments, diseases]);

  useEffect(() => {
    if (!hospitalSearchInitialized.current) {
      hospitalSearchInitialized.current = true;
      return;
    }

    const debounce = setTimeout(() => {
      fetchHospitals(hospitalSearchTerm, 1);
    }, 400);

    return () => clearTimeout(debounce);
  }, [hospitalSearchTerm]);


  // Handle click outside to close dropdown
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

      if (filledCount >= 4 && doctorId) {
        try {
          const res = await fetch("/api/doctors/check-duplicate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: n,
              designation: des || undefined,
              specialty: spec || undefined,
              qualification: qual || undefined,
              excludeId: doctorId
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
    watchQualification, watchQualificationBn, 
    doctorId
  ]);

  useEffect(() => {
    const loadInitialData = async () => {
      // Fetch all required data in parallel, including hospitals
      const [deptsRes, diseasesRes, divsRes, distsRes, thanasRes, hospitalsRes] = await Promise.all([
        fetch("/api/departments"),
        fetch("/api/diseases"),
        fetch("/api/locations/divisions"),
        fetch("/api/locations/districts"),
        fetch("/api/locations/thanas"),
        fetch("/api/locations/hospitals?limit=200"),
      ]);

      if (deptsRes.ok) {
        const deptsData = await deptsRes.json();
        if (deptsData.departments) {
          setDepartments(deptsData.departments);
        }
      }

      let loadedDiseasesList: any[] = [];
      if (diseasesRes.ok) {
        const diseasesData = await diseasesRes.json();
        if (diseasesData.diseases) {
          setDiseases(diseasesData.diseases);
          setFilteredDiseases(diseasesData.diseases);
          loadedDiseasesList = diseasesData.diseases;
        }
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

      // Load hospitals list and make it available before fetching doctor
      let loadedHospitalsList: any[] = [];
      if (hospitalsRes.ok) {
        const hospitalsData = await hospitalsRes.json();
        if (hospitalsData.hospitals) {
          loadedHospitalsList = hospitalsData.hospitals;
          setHospitals(loadedHospitalsList);
          setAvailableHospitals(loadedHospitalsList);
          setHasMoreHospitals(Boolean(hospitalsData.hasMore));
        }
      }

      // Load doctor data — pass hospitals list so missing ones can be resolved
      if (doctorId) {
        await fetchDoctor(loadedDiseasesList, loadedHospitalsList);
      }
    };

    loadInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doctorId]);



  const fetchDoctor = async (loadedDiseases?: any[], loadedHospitals?: any[]) => {
    try {
      setIsFetching(true);
      const response = await fetch(`/api/doctors/${doctorId}`);
      const data = await response.json();

      if (response.ok && data.doctor) {
        const doctor = data.doctor;

        // Convert availability to array format if needed
        let availabilityArray: AvailabilitySlot[] = [];
        if (Array.isArray(doctor.availability)) {
          availabilityArray = doctor.availability.map((slot: any) => ({
            days: Array.isArray(slot.days) ? slot.days : [],
            daysBn: Array.isArray(slot.daysBn) ? slot.daysBn : [],
            time: slot.time || (slot.startTime && slot.endTime ? `${slot.startTime} - ${slot.endTime}` : "") || "",
            timeBn: slot.timeBn || "",
            hospital: typeof slot.hospital === 'object' ? (slot.hospital.slug || slot.hospital.name || "") : (slot.hospital || ""),
          }));
        } else if (doctor.availability) {
          availabilityArray = [{
            days: Array.isArray(doctor.availability.days) ? doctor.availability.days : [],
            daysBn: Array.isArray(doctor.availability.daysBn) ? doctor.availability.daysBn : [],
            time: doctor.availability.time || (doctor.availability.startTime && doctor.availability.endTime ? `${doctor.availability.startTime} - ${doctor.availability.endTime}` : "") || "",
            timeBn: doctor.availability.timeBn || "",
            hospital: typeof doctor.availability.hospital === 'object' ? (doctor.availability.hospital.slug || doctor.availability.hospital.name || "") : (doctor.availability.hospital || ""),
          }];
        }

        if (availabilityArray.length === 0) {
          availabilityArray = [{ days: [], time: "", timeBn: "", hospital: "" }];
        }

        setAvailabilitySlots(availabilityArray);

        // Ensure all referenced hospitals are present in the hospitals list
        // (they may not be in the initial paginated fetch of 20 results)
        const referencedSlugs = availabilityArray
          .map(s => s.hospital)
          .filter(Boolean);

        if (referencedSlugs.length > 0) {
          // Use the hospitals that were passed in (from loadInitialData), or fall back to current state
          const knownHospitals = loadedHospitals && loadedHospitals.length > 0
            ? loadedHospitals
            : undefined; // will be handled inside setHospitals callback

          if (knownHospitals) {
            const knownSlugs = new Set(knownHospitals.map((h: any) => h.slug || h.name));
            const missingSlugs = referencedSlugs.filter(slug => !knownSlugs.has(slug));

            if (missingSlugs.length > 0) {
              // Fetch the missing hospitals by searching their slugs
              const results = await Promise.all(
                missingSlugs.map(slug =>
                  fetch(`/api/locations/hospitals?search=${encodeURIComponent(slug)}&limit=5`)
                    .then(r => r.json())
                    .then(d => (d.hospitals || []) as any[])
                    .catch(() => [] as any[])
                )
              );
              const found = results.flat();
              if (found.length > 0) {
                const merged = [
                  ...knownHospitals,
                  ...found.filter((h: any) => !knownSlugs.has(h.slug || h.name))
                ];
                setHospitals(merged);
                setAvailableHospitals(merged);
              }
            }
          } else {
            // Fall back: compare against current state
            setHospitals(prev => {
              const prevSlugs = new Set(prev.map((h: any) => h.slug || h.name));
              const missingSlugs = referencedSlugs.filter(slug => !prevSlugs.has(slug));

              if (missingSlugs.length === 0) return prev;

              Promise.all(
                missingSlugs.map(slug =>
                  fetch(`/api/locations/hospitals?search=${encodeURIComponent(slug)}&limit=5`)
                    .then(r => r.json())
                    .then(d => (d.hospitals || []) as any[])
                    .catch(() => [] as any[])
                )
              ).then(results => {
                const found = results.flat();
                if (found.length > 0) {
                  setHospitals(current => {
                    const currentSlugs = new Set(current.map((h: any) => h.slug || h.name));
                    const newOnes = found.filter((h: any) => !currentSlugs.has(h.slug || h.name));
                    if (newOnes.length === 0) return current;
                    const merged = [...current, ...newOnes];
                    setAvailableHospitals(merged);
                    return merged;
                  });
                }
              });

              return prev;
            });
          }
        }

        // Set diseases — match existing Bangla (or fallback English) names back to IDs
        const activeDiseases = loadedDiseases || diseases;
        if (doctor.diseases && Array.isArray(doctor.diseases) && activeDiseases.length > 0) {
          const matchedIds = activeDiseases
            .filter(d => doctor.diseases!.includes(d.bangla) || doctor.diseases!.includes(d.name))
            .map(d => d._id);
          setSelectedDiseaseIds(matchedIds);
        }

        // Set form values
        reset({
          name: doctor.name || "",
          nameBn: doctor.nameBn || "",
          specialty: doctor.specialty || "",
          specialtyBn: doctor.specialtyBn || "",
          qualification: doctor.qualification || "",
          qualificationBn: doctor.qualificationBn || "",
          designation: doctor.designation || "",
          designationBn: doctor.designationBn || "",

          department: doctor.department || "",
          departmentBn: doctor.departmentBn || "",
          reportShowFee: doctor.reportShowFee || 0,
          reportShowFeeBn: doctor.reportShowFeeBn || "",
          newPatientFee: doctor.newPatientFee || 0,
          newPatientFeeBn: doctor.newPatientFeeBn || "",

          diseases: doctor.diseases || [],
          diseasesEn: doctor.diseasesEn || [],
          bio: doctor.bio || "",
          bioBn: doctor.bioBn || "",
          image: doctor.image || "",
          availabilitySlots: availabilityArray,
        });

        // Filtered diseases will be updated by the useEffect that watches department

        // Set image preview if image exists
        if (doctor.image) {
          setImagePreview(doctor.image);
        }


      } else {
        showToast.error(data.error || "Failed to fetch doctor data");
        router.push("/admin/doctors");
      }
    } catch (error) {
      console.error("Error fetching doctor:", error);
      showToast.error("Failed to fetch doctor data");
      router.push("/admin/doctors");
    } finally {
      setIsFetching(false);
    }
  };



  // Add new availability slot
  const addAvailabilitySlot = () => {
    const newSlot = { days: [], time: "", timeBn: "", hospital: "" };
    setAvailabilitySlots([...availabilitySlots, newSlot]);
    setValue("availabilitySlots", [...availabilitySlots, newSlot]);
  };

  // Remove availability slot
  const removeAvailabilitySlot = (index: number) => {
    if (availabilitySlots.length > 1) {
      const updated = availabilitySlots.filter((_, i) => i !== index);
      setAvailabilitySlots(updated);
      setValue("availabilitySlots", updated);
    }
  };

  // Toggle day for a specific slot
  const toggleDay = (slotIndex: number, day: string) => {
    const updated = [...availabilitySlots];
    const slot = updated[slotIndex];
    if (slot.days.includes(day)) {
      slot.days = slot.days.filter((d) => d !== day);
    } else {
      slot.days = [...slot.days, day];
    }
    setAvailabilitySlots(updated);
    setValue("availabilitySlots", updated);
  };

  const updateSlotTime = (slotIndex: number, value: string) => {
    const updated = [...availabilitySlots];
    updated[slotIndex].time = value;
    setAvailabilitySlots(updated);
    setValue("availabilitySlots", updated);
  };

  const updateSlotHospital = (slotIndex: number, value: string) => {
    const updated = [...availabilitySlots];
    updated[slotIndex].hospital = value;
    setAvailabilitySlots(updated);
    setValue("availabilitySlots", updated);
  };

  const updateSlotTimeBn = (slotIndex: number, value: string) => {
    const updated = [...availabilitySlots];
    updated[slotIndex].timeBn = value;
    setAvailabilitySlots(updated);
    setValue("availabilitySlots", updated);
  };



  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        showToast.error("Please select an image file");
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        showToast.error("Image size must be less than 10MB");
        return;
      }

      setSelectedImage(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("image", file);

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to upload image");
    }

    const data = await response.json();
    return data.url;
  };

  const onSubmit = async (data: DoctorFormValues) => {
    setIsLoading(true);
    try {
      let imageUrl = data.image;

      // Upload image if a new file was selected
      if (selectedImage) {
        setIsUploading(true);
        try {
          imageUrl = await uploadImage(selectedImage);
          setValue("image", imageUrl);
        } catch (error: any) {
          showToast.error(error.message || "Failed to upload image. Please try again.");
          setIsLoading(false);
          setIsUploading(false);
          return;
        } finally {
          setIsUploading(false);
        }
      }

      const { availabilitySlots, ...doctorData } = data;

      const availabilityWithDaysBn = availabilitySlots?.map(slot => {
        const daysBn = slot.days.map(day => {
          const index = daysOfWeek.indexOf(day);
          return index !== -1 ? banglaDays[index] + 'বার' : day;
        });
        return { ...slot, daysBn };
      });

      // Extract English and Bangla disease names from selected IDs
      const diseasesEn = selectedDiseaseIds
        .map(id => diseases.find(d => d._id === id)?.name)
        .filter((d): d is string => !!d);
      const diseasesBn = selectedDiseaseIds
        .map(id => diseases.find(d => d._id === id)?.bangla)
        .filter((d): d is string => !!d);

      const response = await fetch(`/api/doctors/${doctorId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...doctorData,
          image: imageUrl || undefined,
          availability: availabilityWithDaysBn,

          nameBn: data.nameBn,
          specialtyBn: data.specialtyBn,
          qualificationBn: data.qualificationBn,
          designationBn: data.designationBn,
          bioBn: data.bioBn,
          departmentBn: data.departmentBn,
          reportShowFeeBn: data.reportShowFeeBn,
          newPatientFeeBn: data.newPatientFeeBn,
          diseases: diseasesBn,
          diseasesEn: diseasesEn,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        showToast.success("Doctor profile updated successfully!");
        router.push("/admin/doctors");
      } else {
        showToast.error(result.error || "Failed to update doctor profile");
      }
    } catch {
      showToast.error("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading doctor data...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{language === 'bn' ? 'ডাক্তারের প্রোফাইল সম্পাদনা করুন' : 'Edit Doctor Profile'}</h1>
        <p className="text-gray-600 mt-2">{language === 'bn' ? 'ডাক্তারের তথ্য আপডেট করুন' : 'Update doctor information'}</p>
      </div>

      <Card className="p-6">
        <div className="flex justify-end mb-8">
          <div className="bg-gray-100/80 p-1.5 rounded-xl inline-flex shadow-inner">
            <button
              type="button"
              onClick={() => {
                console.log('Setting language to en');
                setLanguage('en');
              }}
              className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${language === 'en'
                  ? 'bg-white text-primary shadow-sm scale-105'
                  : 'text-gray-500 hover:text-gray-800'
                }`}
            >
              English
            </button>
            <button
              type="button"
              onClick={() => {
                console.log('Setting language to bn');
                setLanguage('bn');
              }}
              className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${language === 'bn'
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
              <div className={language === 'en' ? 'block' : 'hidden'}>
                <Label htmlFor="name">
                  {t("name", language)} <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  {...register("name")}
                  placeholder="Dr. John Doe"
                  className="mt-1"
                />
                {errors.name && (
                  <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
                )}
              </div>
              <div className={language === 'bn' ? 'block' : 'hidden'}>
                <Label htmlFor="nameBn">
                  {t("nameBn", language)} <span className="text-gray-400 text-sm">({t("optional", language)})</span>
                </Label>
                <Input
                  id="nameBn"
                  {...register("nameBn")}
                  placeholder="ডাঃ জন ডো"
                  className="mt-1"
                />
                {errors.name && (
                  <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
                )}
              </div>
            </div>

            <div>
              <div className={language === 'en' ? 'block' : 'hidden'}>
                <Label htmlFor="specialty">
                  {t("specialty", language)}
                </Label>
                <Input
                  id="specialty"
                  {...register("specialty")}
                  placeholder="e.g. Cardiologist"
                  className="mt-1"
                />
                {errors.specialty && (
                  <p className="text-sm text-red-500 mt-1">{errors.specialty.message}</p>
                )}
              </div>
              <div className={language === 'bn' ? 'block' : 'hidden'}>
                <Label htmlFor="specialtyBn">
                  {t("specialtyBn", language)}
                </Label>
                <Input
                  id="specialtyBn"
                  {...register("specialtyBn")}
                  placeholder="হৃদরোগ বিশেষজ্ঞ"
                  className="mt-1"
                />
                {errors.specialtyBn && (
                  <p className="text-sm text-red-500 mt-1">{errors.specialtyBn.message}</p>
                )}
              </div>
            </div>

            <div>
              <div className={language === 'en' ? 'block' : 'hidden'}>
                <Label htmlFor="qualification">
                  {t("qualification", language)} <span className="text-red-500">*</span>
                </Label>
                <textarea
                  id="qualification"
                  {...register("qualification")}
                  placeholder="MBBS, MD"
                  rows={2}
                  className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mt-1"
                />
                {errors.qualification && (
                  <p className="text-sm text-red-500 mt-1">{errors.qualification.message}</p>
                )}
              </div>
              <div className={language === 'bn' ? 'block' : 'hidden'}>
                <Label htmlFor="qualificationBn">
                  {t("qualificationBn", language)} <span className="text-red-500">*</span>
                </Label>
                <textarea
                  id="qualificationBn"
                  {...register("qualificationBn")}
                  placeholder="এমবিবিএস, এমডি"
                  rows={2}
                  className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mt-1"
                />
                {errors.qualification && (
                  <p className="text-sm text-red-500 mt-1">{errors.qualification.message}</p>
                )}
              </div>
            </div>

            <div>
              <div className={language === 'en' ? 'block' : 'hidden'}>
                <Label htmlFor="designation">
                  {t("designation", language)}
                </Label>
                <Input
                  id="designation"
                  {...register("designation")}
                  placeholder="e.g. Senior Consultant"
                  className="mt-1"
                />
                {errors.designation && (
                  <p className="text-sm text-red-500 mt-1">{errors.designation.message}</p>
                )}
              </div>
              <div className={language === 'bn' ? 'block' : 'hidden'}>
                <Label htmlFor="designationBn">
                  {t("designationBn", language)}
                </Label>
                <Input
                  id="designationBn"
                  {...register("designationBn")}
                  placeholder="সিনিয়র কনসালটেন্ট"
                  className="mt-1"
                />
                {errors.designationBn && (
                  <p className="text-sm text-red-500 mt-1">{errors.designationBn.message}</p>
                )}
              </div>
            </div>








            <div>
              <Label htmlFor="department">
                {t("selectDepartment", language)}
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
                <option value="">{t("selectDepartment", language)}</option>
                {departments.map((dept) => (
                  <option key={dept._id} value={dept.name}>
                    {language === 'bn' && dept.nameBn ? dept.nameBn : dept.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className={language === 'en' ? 'block' : 'hidden'}>
                <Label htmlFor="newPatientFee">
                  {t("newPatientFee", language)} <span className="text-red-500">*</span>
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
                {errors.newPatientFee && (
                  <p className="text-sm text-red-500 mt-1">{errors.newPatientFee.message}</p>
                )}
              </div>
              <div className={language === 'bn' ? 'block' : 'hidden'}>
                <Label htmlFor="newPatientFeeBn">
                  {t("newPatientFee", language)} <span className="text-red-500">*</span>
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
                {errors.newPatientFeeBn && (
                  <p className="text-sm text-red-500 mt-1">{errors.newPatientFeeBn.message}</p>
                )}
              </div>
            </div>

            <div>
              <div className={language === 'en' ? 'block' : 'hidden'}>
                <Label htmlFor="reportShowFee">
                  {t("reportShowFee", language)} <span className="text-gray-500 text-xs">({t("optional", language)})</span>
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
                {errors.reportShowFee && (
                  <p className="text-sm text-red-500 mt-1">{errors.reportShowFee.message}</p>
                )}
              </div>
              <div className={language === 'bn' ? 'block' : 'hidden'}>
                <Label htmlFor="reportShowFeeBn">
                  {t("reportShowFee", language)} <span className="text-gray-500 text-xs">({t("optional", language)})</span>
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
                {errors.reportShowFeeBn && (
                  <p className="text-sm text-red-500 mt-1">{errors.reportShowFeeBn.message}</p>
                )}
              </div>
            </div>

            <div className="md:col-span-2">
              <div className="flex items-center justify-between mb-3">
                <Label className="block font-semibold text-gray-900">
                  {language === 'bn' ? 'যে সকল রোগের চিকিৎসা করা হয়' : 'Diseases Treated'} <span className="text-gray-500 text-xs">({t("optional", language)})</span>
                </Label>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  {language === 'bn' ? 'বাংলা' : 'English'}
                </span>
              </div>
              {selectedDepartment && (
                <p className="text-xs text-gray-600 mb-2">
                  {language === 'bn'
                    ? `বিভাগ অনুযায়ী রোগসমূহ দেখানো হচ্ছে: ${departments.find(d => d.name === selectedDepartment)?.nameBn || selectedDepartment}`
                    : `Showing diseases for department: ${selectedDepartment}`}
                </p>
              )}
              <div className="max-h-60 overflow-y-auto border-2 border-gray-300 rounded-lg p-4 bg-white">
                {filteredDiseases.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">
                    {language === 'bn'
                      ? selectedDepartment
                        ? 'এই বিভাগের জন্য কোনো রোগ পাওয়া যায়নি।'
                        : 'কোনো রোগ পাওয়া যায়নি। অ্যাডমিন প্যানেল থেকে রোগ যোগ করুন।'
                      : selectedDepartment
                        ? 'No diseases found for this department.'
                        : 'No diseases available. Please add diseases from the admin panel.'}
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2" key={`diseases-${language}`}>
                    {filteredDiseases.map((disease) => {
                      const diseaseName = language === 'bn'
                        ? (disease.bangla || disease.name)
                        : (disease.name || disease.bangla);

                      return (
                        <label
                          key={disease._id}
                          className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                        >
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
                )}
              </div>
              {selectedDiseaseIds.length > 0 && (
                <p className="text-xs text-gray-500 mt-2">
                  {selectedDiseaseIds.length} {language === 'bn' ? 'টি রোগ নির্বাচিত হয়েছে' : 'disease(s) selected'}
                </p>
              )}
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="image">Profile Image</Label>
              <div className="mt-1 space-y-3">
                <div className="flex items-center gap-4">
                  <input
                    ref={fileInputRef}
                    id="image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isLoading || isUploading}
                  >
                    {selectedImage ? "Change Image" : imagePreview ? "Change Image" : "Select Image"}
                  </Button>
                  {selectedImage && (
                    <span className="text-sm text-gray-600">
                      {selectedImage.name}
                    </span>
                  )}
                </div>
                {imagePreview && (
                  <div className="relative w-32 h-32 rounded-lg overflow-hidden border border-gray-300">
                    <Image
                      src={imagePreview}
                      alt="Preview"
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div>
            <div className={language === 'en' ? 'block' : 'hidden'}>
              <Label htmlFor="bio">{t("bio", language)}</Label>
              <textarea
                id="bio"
                {...register("bio")}
                rows={4}
                className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mt-1"
                placeholder="Doctor's biography..."
              />
            </div>
            <div className={language === 'bn' ? 'block' : 'hidden'}>
              <Label htmlFor="bioBn">{t("bioBn", language)}</Label>
              <textarea
                id="bioBn"
                {...register("bioBn")}
                rows={4}
                className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mt-1"
                placeholder="ডাক্তারের জীবনী..."
              />
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <Label className="text-lg font-semibold">
                {t("availability", language)} <span className="text-red-500">*</span>
              </Label>
              <Button
                type="button"
                onClick={addAvailabilitySlot}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                স্লট যোগ করুন
              </Button>
            </div>

            {availabilitySlots.map((slot, slotIndex) => (
              <Card key={slotIndex} className="p-4 border-2 border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <Label className="text-base font-semibold">
                    স্লট {slotIndex + 1}
                  </Label>
                  {availabilitySlots.length > 1 && (
                    <Button
                      type="button"
                      onClick={() => removeAvailabilitySlot(slotIndex)}
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
                      {t("hospitalName", language)} <span className="text-red-500">*</span>
                    </Label>
                    <SearchableSelect
                      options={hospitals.map(h => ({
                        value: h.slug || h.name,
                        label: language === 'bn' && h.nameBn ? h.nameBn : h.name
                      }))}
                      value={slot.hospital || ''}
                      onChange={(value) => updateSlotHospital(slotIndex, value)}
                      placeholder={t("selectHospital", language)}
                      className="mt-1"
                      error={!!errors.availabilitySlots?.[slotIndex]?.hospital}
                    />
                    {errors.availabilitySlots?.[slotIndex]?.hospital && (
                      <p className="text-sm text-red-500 mt-1">
                        {errors.availabilitySlots[slotIndex]?.hospital?.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label className="mb-2 block">
                      {t("selectDays", language)} <span className="text-red-500">*</span>
                    </Label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {daysOfWeek.map((day, dayIndex) => (
                        <button
                          key={day}
                          type="button"
                          onClick={() => toggleDay(slotIndex, day)}
                          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${slot.days.includes(day)
                              ? "bg-primary text-white"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            }`}

                        >
                          {language === 'bn' ? banglaDays[dayIndex] + 'বার' : day}
                        </button>
                      ))}
                      {(() => {
                        const isOnCall = slot.days.length === daysOfWeek.length && slot.time === "On Call" && slot.timeBn === "অন কল";

                        return (
                          <button
                            type="button"
                            onClick={() => {
                              const updated = [...availabilitySlots];
                              if (isOnCall) {
                                updated[slotIndex].days = [];
                                updated[slotIndex].time = "";
                                updated[slotIndex].timeBn = "";
                              } else {
                                updated[slotIndex].days = [...daysOfWeek];
                                updated[slotIndex].time = "On Call";
                                updated[slotIndex].timeBn = "অন কল";
                              }
                              setAvailabilitySlots(updated);
                              setValue("availabilitySlots", updated);
                            }}
                            className={`px-4 py-2 rounded-md text-sm font-bold transition-all border shadow-sm hover:shadow ${isOnCall
                                ? "bg-amber-600 text-white border-amber-700"
                                : "bg-amber-100 text-amber-700 hover:bg-amber-200 border-amber-300"
                              }`}
                          >
                            {t("onCall", language)}
                          </button>
                        );
                      })()}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className={language === 'en' ? 'block' : 'hidden'}>
                      <Label htmlFor={`time-${slotIndex}`}>
                        {t("timeSlot", language)}
                      </Label>
                      <Input
                        id={`time-${slotIndex}`}
                        type="text"
                        placeholder="e.g. 10:00 AM - 04:00 PM"
                        value={slot.time}
                        onChange={(e) => updateSlotTime(slotIndex, e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div className={language === 'bn' ? 'block' : 'hidden'}>
                      <Label htmlFor={`timeBn-${slotIndex}`}>
                        {t("timeSlot", language)}
                      </Label>
                      <Input
                        id={`timeBn-${slotIndex}`}
                        type="text"
                        placeholder="উদাঃ সকাল ১০:০০ - বিকাল ০৪:০০"
                        value={slot.timeBn || ""}
                        onChange={(e) => updateSlotTimeBn(slotIndex, e.target.value)}
                        className="mt-1"
                            />
                    </div>
                  </div>


                </div>
              </Card>
            ))}

            {errors.availabilitySlots && (
              <p className="text-sm text-red-500">{errors.availabilitySlots.message}</p>
            )}
          </div>

          <div className="flex gap-4 pt-8 pb-8">
            <Button
              type="submit"
              disabled={isLoading || isUploading}
              className="flex-1 h-12 text-lg font-bold bg-primary hover:bg-primary/90 shadow-md rounded-xl transition-all active:scale-95"
            >
              {isUploading
                ? t("uploading", language)
                : isLoading
                  ? t("updating", language)
                  : t("update", language)}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              className="flex-1 h-12 text-lg font-bold border-2 rounded-xl transition-all"
            >
              {t("cancel", language)}
            </Button>
          </div>
        </form>
      </Card>

      <Dialog open={showDuplicateModal} onOpenChange={setShowDuplicateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Similar Doctor Found</DialogTitle>
            <DialogDescription>
              We found doctors with very similar details. Are you sure you want to update?
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
                  Edit This Doctor Instead
                </Button>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDuplicateModal(false)}>
              Update Anyway
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

