"use client";

import {
  useEffect,
  useState,
  useMemo,
  useCallback,
  useRef,
  Suspense,
} from "react";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import Footer from "@/components/footer";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/autoplay";

import {
  Search,
  X,
  Star,
  Building2,
  MapPin,
  Award,
  Stethoscope,
  ChevronLeft,
  ChevronRight,
  Heart,
  Brain,
  Bone,
  Eye,
  Smile,
  Baby,
  Ear,
  Droplets,
  Activity,
  Wind,
  Scissors,
  Microscope,
  Zap,
  Dumbbell,
  ScanLine,
  Droplet,
  HeartPulse,
  Pill,
} from "lucide-react";
import Navbar from "@/components/navbar";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import DoctorCard from "@/components/doctor-card";
import { getLocalizedValue, useLanguage } from "@/contexts/LanguageContext";
import { homepageTranslations } from "@/lib/homepage-translations";
import PageLoader from "@/components/page-loader";

interface Department {
  _id: string;
  name: string;
  nameBn?: string;
  image?: string;
}


interface Doctor {
  slug: string;
  slugBn?: string;
  _id: string;
  name: string;
  nameBn?: string;
  specialty: string;
  specialtyBn?: string;
  qualification: string;
  qualificationBn?: string;
  designation?: string;
  designationBn?: string;
  phoneNumber: string;
  email?: string;
  department?: string;

  reportShowFee?: number;
  newPatientFee?: number;
  diseases?: string[];
  slotDuration?: number;
  availability: Array<{
    days: string[];
    daysBn?: string[];
    time?: string;
    timeBn?: string;
    hospital: string;
  }>;

  bio?: string;
  bioBn?: string;
  image?: string;
  rating?: number;
}

type SortOption =
  | "name"

  | "rating"
  | "specialty"
  | "hospital";
type SortDirection = "asc" | "desc";

interface Division {
  _id: string;
  name: string;
}

interface District {
  _id: string;
  name: string;
  division: Division;
}

interface Thana {
  _id: string;
  name: string;
  district: District;
}

interface Hospital {
  _id: string;
  name: string;
  nameBn?: string;
  thana?: Thana;
  slug?: string;
}

// All available icon filenames (without .png extension) in /public/icon_of_dept
const DEPT_ICONS = [
  "Burn-Plastic & Reconstructive Surgery",
  "Cardiology & Medicine",
  "Chest Thoracic Surgery",
  "Dermatology & Venereology",
  "Diabetes  Endocrinology",
  "ENT-Ear Nose & Throat",
  "Gastro-Liver Diseases",
  "General & Laparoscopic Surgery",
  "Gynecology & Obstetrics",
  "Hematology & Medicine (Blood diseases)",
  "Hepato-Biliary & Liver Transplant Surgery",
  "Medicine Specialist",
  "Neonatal & Pediatrics",
  "Nephrology & Medicine",
  "Neuromedicine & Neurosurgery",
  "Nuclear Medicine",
  "Nutrition & Dietetics",
  "Oncology Cancer)",
  "Ophthalmology",
  "Oral & Dental Diseases",
  "Pain Medicine & Rheumatology ",
  "Physiotherapy",
  "Psychiatry & Psychotherapy",
  "Pulmonology & Asthma",
  "Thyroid & Hormone ",
  "Trauma & Orthopedic Surgery",
  "Urology & Nephrology",
  "Vascular Surgery (Blood vessels)",
];

/**
 * Fuzzy match a department name to an icon filename by checking if
 * any significant word in the dept name appears in the icon filename.
 */
function findDeptIcon(deptName: string): string | null {
  const normalize = (s: string) =>
    s.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim();

  const deptWords = normalize(deptName)
    .split(/\s+/)
    .filter((w) => w.length > 3); // ignore short words like "and", "of"

  if (deptWords.length === 0) return null;

  let bestMatch: string | null = null;
  let bestScore = 0;

  for (const icon of DEPT_ICONS) {
    const normalizedIcon = normalize(icon);
    let score = 0;
    for (const word of deptWords) {
      if (normalizedIcon.includes(word)) score++;
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = icon;
    }
  }

  return bestScore > 0 ? bestMatch : null;
}

function DoctorListPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [thanas, setThanas] = useState<Thana[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  // Filter states
  const [selectedSpecialty, setSelectedSpecialty] = useState("");
  const [selectedHospital, setSelectedHospital] = useState("");
  const [selectedQualification, setSelectedQualification] = useState("");

  const [minFee, setMinFee] = useState("");
  const [maxFee, setMaxFee] = useState("");
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [minRating, setMinRating] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);

  // Hierarchical location filters
  const [selectedDivision, setSelectedDivision] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedThana, setSelectedThana] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedDept, setSelectedDept] = useState<string>("");

  // Sort states
  const [sortBy, setSortBy] = useState<SortOption>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const { language } = useLanguage();
  const t = homepageTranslations[language].doctorsPage;

  // Pagination states
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [totalDoctors, setTotalDoctors] = useState(0);
  const observerTarget = useRef<HTMLDivElement>(null);

  // Carousel ref
  const carouselRef = useRef<HTMLDivElement>(null);

  const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const currentDays = t.days;

  // Dedicated suggestions state (independent of main grid)
  const [suggestionDoctors, setSuggestionDoctors] = useState<Doctor[]>([]);
  const [debouncedSuggestQuery, setDebouncedSuggestQuery] = useState("");
  // Ref for scrolling to results
  const resultsRef = useRef<HTMLDivElement>(null);

  // Department keyword → Lucide icon mapping
  const getDeptIcon = (name: string) => {
    return <Stethoscope className="w-7 h-7" />;
  };
  const getDeptPublicIcon = (name: string, image?: string) => {
    if (image) return image;
    const matchedIcon = findDeptIcon(name);
    return matchedIcon ? `/icon_of_dept/${encodeURIComponent(matchedIcon)}.png` : null;
  };

  const fetchDoctors = async (pageNum: number, isNewFilter: boolean = false) => {
    try {
      if (pageNum > 1) setLoadingMore(true);
      else {
        if (!loading) setIsSearching(true);
      }

      const params = new URLSearchParams();
      params.append("page", pageNum.toString());
      params.append("limit", "12");
      if (debouncedSearchQuery) params.append("search", debouncedSearchQuery);
      if (selectedSpecialty) params.append("specialty", selectedSpecialty);
      if (selectedHospital) params.append("hospitalSlug", selectedHospital);
      if (selectedDepartment) params.append("department", selectedDepartment);
      if (selectedDivision) params.append("division", selectedDivision);
      if (selectedDistrict) params.append("district", selectedDistrict);
      if (selectedThana) params.append("thana", selectedThana);
      if (selectedQualification) params.append("qualification", selectedQualification);
      if (minFee) params.append("minFee", minFee);
      if (maxFee) params.append("maxFee", maxFee);
      if (minRating) params.append("minRating", minRating);
      if (selectedDays.length > 0) params.append("days", selectedDays.join(","));
      params.append("sortBy", sortBy);
      params.append("sortDirection", sortDirection);

      const response = await fetch(`/api/doctors?${params.toString()}`);
      const data = await response.json();

      if (response.ok) {
        if (isNewFilter) {
          setDoctors(data.doctors);
        } else {
          setDoctors(prev => [...prev, ...data.doctors]);
        }
        setTotalDoctors(data.total);
        setHasMore(data.page < data.totalPages);
      }
    } catch (error) {
      console.error("Error fetching doctors:", error);
    } finally {
      setLoading(false);
      setIsSearching(false);
      setLoadingMore(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await fetch("/api/departments");
      const data = await response.json();
      if (response.ok) {
        setDepartments(data.departments);
      }
    } catch (error) {
      console.error("Error fetching departments:", error);
    }
  };

  const fetchHospitals = useCallback(async () => {
    try {
      const thanaObj = thanas.find((t) => t.name === selectedThana);
      const url = thanaObj
        ? `/api/locations/hospitals?thana=${thanaObj._id}`
        : "/api/locations/hospitals";
      const response = await fetch(url);
      const data = await response.json();
      if (response.ok) {
        setHospitals(data.hospitals);
      }
    } catch (error) {
      console.error("Error fetching hospitals:", error);
    }
  }, [selectedThana, thanas]);

  const fetchDivisions = async () => {
    try {
      const response = await fetch("/api/locations/divisions");
      const data = await response.json();
      if (response.ok) {
        setDivisions(data.divisions);
      }
    } catch (error) {
      console.error("Error fetching divisions:", error);
    }
  };

  const fetchDistricts = useCallback(
    async (divisionName: string) => {
      try {
        const division = divisions.find((d) => d.name === divisionName);
        if (!division) return;

        const response = await fetch(
          `/api/locations/districts?division=${division._id}`,
        );
        const data = await response.json();
        if (response.ok) {
          setDistricts(data.districts);
        }
      } catch (error) {
        console.error("Error fetching districts:", error);
      }
    },
    [divisions],
  );

  const fetchThanas = useCallback(
    async (districtName: string) => {
      try {
        const district = districts.find((d) => d.name === districtName);
        if (!district) return;

        const response = await fetch(
          `/api/locations/thanas?district=${district._id}`,
        );
        const data = await response.json();
        if (response.ok) {
          setThanas(data.thanas);
        }
      } catch (error) {
        console.error("Error fetching thanas:", error);
      }
    },
    [districts],
  );

  useEffect(() => {
    fetchHospitals();
  }, [fetchHospitals]);

  useEffect(() => {
    fetchDivisions();
    fetchDepartments();
  }, []);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Suggestions query with 150ms debounce to prevent typing lag
  useEffect(() => {
    const q = searchQuery.trim();
    if (!q || q.length < 1) {
      setSuggestionDoctors([]);
      setDebouncedSuggestQuery("");
      return;
    }
    setDebouncedSuggestQuery(q);

    const controller = new AbortController();
    const timer = setTimeout(() => {
      const fetchSuggestions = async () => {
        try {
          const res = await fetch(
            `/api/doctors?search=${encodeURIComponent(q)}&limit=100&suggestions=true`,
            { signal: controller.signal }
          );
          const data = await res.json();
          if (res.ok) {
            setSuggestionDoctors(data.doctors || []);
          }
        } catch (err: unknown) {
          if (err instanceof Error && err.name !== "AbortError") {
            console.error(err);
          }
        }
      };
      fetchSuggestions();
    }, 150);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [searchQuery]);

  // Fetch doctors when filters change
  useEffect(() => {
    setPage(1);
    fetchDoctors(1, true);
  }, [
    debouncedSearchQuery,
    selectedSpecialty,
    selectedHospital,
    selectedDepartment,
    selectedDivision,
    selectedDistrict,
    selectedThana,
    selectedQualification,
    minFee,
    maxFee,
    minRating,
    selectedDays,
    sortBy,
    sortDirection
  ]);

  // Infinite scroll effect
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
          const nextPage = page + 1;
          setPage(nextPage);
          fetchDoctors(nextPage);
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [hasMore, loading, loadingMore, page]);

  useEffect(() => {
    if (selectedDivision && divisions.length > 0) {
      fetchDistricts(selectedDivision);
    } else {
      setDistricts([]);
      setThanas([]);
    }
  }, [selectedDivision, divisions, fetchDistricts]);

  useEffect(() => {
    if (selectedDistrict && districts.length > 0) {
      fetchThanas(selectedDistrict);
    } else {
      setThanas([]);
    }
  }, [selectedDistrict, districts, fetchThanas]);

  // Read search query from URL params
  useEffect(() => {
    const search = searchParams.get("search");
    if (search) {
      setSearchQuery(decodeURIComponent(search));
    }
  }, [searchParams]);

  // Get unique values for filters
  const specialties = useMemo(() => {
    const unique = Array.from(
      new Set(doctors.map((d) => d.specialty).filter(Boolean)),
    );
    return unique.sort();
  }, [doctors]);

  const hospitalsFilterList = useMemo(() => {
    return hospitals.map((h) => ({
      slug: h.slug || h.name,
      name: h.name,
      nameBn: h.nameBn || h.name,
    })).sort((a, b) => a.name.localeCompare(b.name));
  }, [hospitals]);

  const qualifications = useMemo(() => {
    const unique = Array.from(
      new Set(doctors.map((d) => d.qualification).filter(Boolean)),
    );
    return unique.sort();
  }, [doctors]);

  const departmentNames = useMemo(() => {
    return departments.map((d) => d.name);
  }, [departments]);

  // Auto-suggestions based on search query — uses dedicated suggestion doctors
  const suggestions = useMemo(() => {
    if (!searchQuery || searchQuery.length < 1) return [];

    const query = searchQuery.toLowerCase().trim();
    const queryClean = query.replace(/[\s.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");
    if (!queryClean) return [];

    // Score each doctor by how closely they match the query
    const scored = suggestionDoctors.map(doctor => {
      const nameLower = (doctor.name || '').toLowerCase();
      const nameBnLower = (doctor.nameBn || '').toLowerCase();
      const specialtyLower = (doctor.specialty || '').toLowerCase();
      const desigLower = (doctor.designation || '').toLowerCase();
      const qualifLower = (doctor.qualification || '').toLowerCase();

      const cleanField = (str: string | undefined) => (str || '').toLowerCase().replace(/[\s.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");
      const nameClean = cleanField(doctor.name);
      const nameBnClean = cleanField(doctor.nameBn);
      const specialtyClean = cleanField(doctor.specialty);
      const desigClean = cleanField(doctor.designation);
      const qualifClean = cleanField(doctor.qualification);

      let score = 0;
      if (nameLower === query || nameClean === queryClean) score += 100; // exact match
      else if (nameLower.startsWith(query) || nameClean.startsWith(queryClean)) score += 80;  // starts with
      else if (nameLower.includes(query) || nameClean.includes(queryClean)) score += 60;  // contains
      if (nameBnLower.includes(query) || nameBnClean.includes(queryClean)) score += 50;  // Bangla name
      if (specialtyLower.includes(query) || specialtyClean.includes(queryClean)) score += 30;
      if (desigLower.includes(query) || desigClean.includes(queryClean)) score += 10;
      if (qualifLower.includes(query) || qualifClean.includes(queryClean)) score += 10;

      return { doctor, score };
    });

    // Sort descending by score, keep only those with at least some match
    scored.sort((a, b) => b.score - a.score);

    return scored.slice(0, 20).map(({ doctor }) => ({
      type: 'Doctor',
      typeBn: 'ডাক্তার',
      value: language === 'bn' && doctor.nameBn ? doctor.nameBn : doctor.name,
      doctor,
      link: `/doctor/${(language === 'bn' ? (doctor.slugBn || doctor.slug) : (doctor.slug || doctor.slugBn)) || doctor._id}`
    }));
  }, [searchQuery, suggestionDoctors, language]);

  // Filter and sort doctors
  const filteredAndSortedDoctors = doctors;

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedSpecialty("");
    setSelectedHospital("");
    setSelectedQualification("");

    setMinFee("");
    setMaxFee("");
    setMinRating("");
    setSelectedDays([]);
    setSelectedDivision("");
    setSelectedDistrict("");
    setSelectedThana("");
    setSelectedDepartment("");
  };

  // Handle hierarchical selection flow
  const handleDivisionSelect = (division: string) => {
    setSelectedDivision(division);
    setSelectedDistrict("");
    setSelectedThana("");
    setSelectedHospital("");
  };

  const handleDistrictSelect = (district: string) => {
    setSelectedDistrict(district);
    setSelectedThana("");
    setSelectedHospital("");
  };

  const handleThanaSelect = (thana: string) => {
    setSelectedThana(thana);
    setSelectedHospital("");
  };

  const handleHospitalSelect = (hospital: string) => {
    setSelectedHospital(hospital);
  };

  const handleDepartmentSelect = (department: string) => {
    setSelectedDepartment(department);
  };

  const toggleDay = (day: string) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  };

  // Get matched fields for search highlighting
  const getMatchedFields = (doctor: Doctor): string[] => {
    if (!searchQuery) return [];

    const query = searchQuery.toLowerCase();
    const queryClean = query.replace(/[\s.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");
    const matched: string[] = [];

    const cleanStr = (str: string | undefined) => (str || '').toLowerCase().replace(/[\s.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");

    if (doctor.name.toLowerCase().includes(query) || cleanStr(doctor.name).includes(queryClean)) {
      matched.push("Doctor Name");
    }
    if (doctor.specialty.toLowerCase().includes(query) || cleanStr(doctor.specialty).includes(queryClean)) {
      matched.push("Specialty");
    }
    if (doctor.availability && Array.isArray(doctor.availability) && doctor.availability.some(slot => slot.hospital?.toLowerCase().includes(query) || cleanStr(slot.hospital).includes(queryClean))) {
      matched.push("Hospital");
    }
    if (doctor.qualification.toLowerCase().includes(query) || cleanStr(doctor.qualification).includes(queryClean)) {
      matched.push("Qualification");
    }
    if (doctor.bio?.toLowerCase().includes(query) || cleanStr(doctor.bio).includes(queryClean)) {
      matched.push("Bio");
    }

    return matched;
  };

  const hasActiveFilters = useMemo(() => {
    return (
      selectedSpecialty ||
      selectedHospital ||
      selectedQualification ||
      minFee ||
      maxFee ||
      minRating ||
      selectedDays.length > 0
    );
  }, [
    selectedSpecialty,
    selectedHospital,
    selectedQualification,

    minFee,
    maxFee,
    minRating,
    selectedDays,
  ]);

  if (loading) {
    return (
      <PageLoader />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <Navbar />

      {/* Cover Photo / Hero Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="relative  h-[450px] md:h-[650px] w-full overflow-hidden"
      >
        <div
          className="absolute inset-0 bg-cover bg-[position:80%_center] lg:bg-center bg-no-repeat"
          style={{
            backgroundImage:
              "url('/hero/doctor.png')",
          }}
        />
        <div className="relative z-20 h-full flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 pb-20">
          <div className="max-w-7xl w-full mx-auto text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <h1 className="text-2xl md:text-5xl lg:text-[48px] font-bold text-white mb-6 drop-shadow-2xl leading-tight">
                {t.heroTitle}
              </h1>
              <p className="text-[16px] md:text-xl text-white/90 max-w-2xl lg:mb-8 font-light">
                {t.heroDesc}
              </p>
            </motion.div>
          </div>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 -mt-32 relative z-30">
        {/* Search Section - Floating */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-20"
        >
          <div className="relative max-w-3xl mx-auto">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary to-blue-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
              <div className="relative relative bg-white rounded-2xl shadow-xl flex items-center px-2">
                <Search className="absolute left-4 md:left-6 top-1/2 transform -translate-y-1/2 text-primary h-5 w-5 md:h-6 md:w-6 z-10" />
                <Input
                  type="text"
                  placeholder={t.searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSearchQuery(val);
                    setShowSuggestions(val.trim().length > 0);
                    setFocusedIndex(-1);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => {
                    setTimeout(() => setShowSuggestions(false), 300);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "ArrowDown") {
                      e.preventDefault();
                      setFocusedIndex((prev) =>
                        prev < suggestions.length - 1 ? prev + 1 : prev,
                      );
                    } else if (e.key === "ArrowUp") {
                      e.preventDefault();
                      setFocusedIndex((prev) => (prev > 0 ? prev - 1 : -1));
                    } else if (e.key === "Enter" && focusedIndex >= 0) {
                      e.preventDefault();
                      const suggestion = suggestions[focusedIndex];
                      if (suggestion.doctor) {
                        setSearchQuery(suggestion.doctor.name);
                      } else {
                        setSearchQuery(suggestion.value);
                      }
                      setShowSuggestions(false);
                    } else if (e.key === "Escape") {
                      setShowSuggestions(false);
                    }
                  }}
                  className="w-full pl-12 md:pl-14 pr-4  md:py-7 text-sm md:text-lg border-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent placeholder:text-gray-400"
                />
                <Button
                  onClick={() => { setShowSuggestions(false); resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}
                  className="bg-primary hover:bg-primary-dark text-white flex items-center gap-2 rounded-xl px-4 md:px-8 py-6 text-sm md:text-lg font-medium transition-all shadow-lg hover:shadow-primary/30"
                >
                  <Search className="h-5 w-5" />
                  <span className="hidden md:inline">{t.searchButton}</span>
                </Button>
              </div>
            </div>

            <AnimatePresence>
              {showSuggestions && suggestions.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-full left-0 right-0 mt-4 bg-white border border-gray-100 rounded-2xl shadow-2xl z-50 max-h-96 overflow-y-auto overflow-hidden divide-y divide-gray-50"
                >
                  {suggestions.map((suggestion, index) => {

                    const content = (
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`px-6 py-4 cursor-pointer hover:bg-gray-50 transition-colors ${index === focusedIndex ? "bg-gray-50" : ""
                          }`}
                        onClick={() => {
                          if (suggestion.link) {
                            router.push(suggestion.link);
                            setShowSuggestions(false);
                          } else if (suggestion.doctor) {
                            setSearchQuery(language === 'bn' && suggestion.doctor.nameBn ? suggestion.doctor.nameBn : suggestion.doctor.name);
                            setShowSuggestions(false);
                          } else {
                            setSearchQuery(suggestion.value);
                            setShowSuggestions(false);
                          }
                          setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 400);
                        }}
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-4 flex-1">
                            {suggestion.doctor?.image ? (
                              <Image
                                src={suggestion.doctor.image}
                                alt={suggestion.doctor.name || "Doctor"}
                                width={44}
                                height={44}
                                className="rounded-full object-cover w-11 h-11 border border-gray-100 flex-shrink-0"
                              />
                            ) : (
                              <div className="w-11 h-11 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                                <Stethoscope className="w-5 h-5" />
                              </div>
                            )}
                            <div className="flex-1">
                              <div className="font-bold text-gray-800 text-base">
                                {language === 'bn' && suggestion?.doctor?.nameBn ? suggestion?.doctor?.nameBn : suggestion?.doctor?.name || suggestion?.doctor?.nameBn}
                              </div>
                              {suggestion.doctor && (
                                <div className="text-sm text-gray-500 mt-0.5 flex items-center gap-2">
                                  <span className="text-primary font-medium">
                                    {language === 'bn' && suggestion.doctor.specialtyBn ? suggestion.doctor.specialtyBn : suggestion.doctor.specialty || suggestion.doctor.specialtyBn}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                          <span
                            className={`text-xs px-3 py-1.5 rounded-full font-bold uppercase tracking-wider ${suggestion.type === "Doctor"
                              ? "bg-blue-100 text-blue-700"
                              : suggestion.type === "Specialty"
                                ? "bg-purple-100 text-purple-700"
                                : "bg-green-100 text-green-700"
                              }`}
                          >
                            {language === 'bn' ? suggestion.typeBn : suggestion.type || suggestion.type}
                          </span>
                        </div>
                      </motion.div>
                    );

                    return suggestion.link ? (
                      <Link
                        key={`${suggestion.type}-${index}`}
                        href={suggestion.link}
                      >
                        {content}
                      </Link>
                    ) : (
                      <div key={`${suggestion.type}-${index}`}>{content}</div>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Department Carousel Section */}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mb-16"
        >
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 md:p-8">
            <div className="mb-6 md:mb-8 flex items-end justify-between gap-4">
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-gray-900">
                  {t.departmentTitle}
                </h2>
                <p className="text-gray-500 mt-1 text-sm md:text-base">{t.departmentSubtitle}</p>
              </div>
            </div>
            <div className="relative px-16">
              <Swiper
                modules={[Autoplay, Navigation]}
                spaceBetween={20}
                slidesPerView={1}
                observer
                observeParents
                resizeObserver
                watchOverflow
                navigation={{
                  nextEl: ".department-next",
                  prevEl: ".department-prev",
                }}
                autoplay={{
                  delay: 3000,
                  disableOnInteraction: false,
                }}
                breakpoints={{
                  0: {
                    slidesPerView: 1,
                  },
                  640: {
                    slidesPerView: 2,
                  },
                  768: {
                    slidesPerView: 3,
                  },
                  1024: {
                    slidesPerView: 4,
                  },
                }}
                loop={departments.length > 4}
                className="w-full px-2 pb-4"
              >
                {departments.map((dept, index) => (
                  <SwiperSlide
                    key={dept._id || dept.name}
                    className="!flex !justify-center"
                  >
                    <motion.button
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setSelectedDepartment(dept.name);
                        setSelectedDept(dept.name);
                        setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 400);
                      }}
                      className={`btn-slide group w-full max-w-[2500px] md:max-w-[220px] h-[260px] border border-primary bg-white flex flex-col items-center justify-between shrink-0 rounded-3xl p-8 ${selectedDept === dept.name
                        ? "bg-primary text-white shadow-md"
                        : "bg-white text-gray-700 border border-gray-200"
                        }`}
                    >
                      <div className="relative z-10 w-full flex-grow flex items-center justify-center p-2">
                        <Image
                          src={getDeptPublicIcon(dept.name, dept.image) || "/default.png"}
                          alt={dept.name}
                          width={120}
                          height={120}
                          className="object-contain transition-all duration-500 group-hover:scale-110 drop-shadow-md"
                        />
                      </div>
                      {/* Department Name */}
                      <div className="relative z-10 w-full text-center">
                        <h3 className="text-[17px] font-bold text-slate-800 group-hover:text-white transition-colors duration-300 leading-tight">
                          {getLocalizedValue(dept.name, dept.nameBn, language)}
                        </h3>
                        <div className="mt-2 h-1 w-0 group-hover:w-full bg-white/30 mx-auto transition-all duration-500 rounded-full" />
                      </div>
                    </motion.button>
                  </SwiperSlide>
                ))}
              </Swiper>

              {/* Navigation Buttons */}
              <button className="department-prev absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-lg rounded-full p-2 text-primary hover:bg-primary hover:text-white transition-colors border border-gray-100 disabled:opacity-50">
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button className="department-next absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-lg rounded-full p-2 text-primary hover:bg-primary hover:text-white transition-colors border border-gray-100 disabled:opacity-50">
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>

            {/* View All Button - Bottom for All Screens */}
            <div className="mt-6 flex justify-center">
              <Link href="/departments" className="text-primary font-medium hover:underline flex items-center gap-1">
                {t.viewAll} <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </motion.div>


        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-12"
        >
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
            <div className="mb-8 border-b border-gray-100 pb-4">
              <h2
                className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-3"
              >
                <div className="p-2.5 bg-[#3DB5A0]/10 text-[#3DB5A0] rounded-xl">
                  <MapPin className="h-6 w-6" />
                </div>
                {t.findByLocation}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <Label
                  htmlFor="filter-division"
                  className="mb-3 block text-base font-semibold text-gray-700"
                >
                  ১. {t.division}
                </Label>
                <div className="relative">
                  <select
                    id="filter-division"
                    value={selectedDivision}
                    onChange={(e) => handleDivisionSelect(e.target.value)}
                    className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-700 bg-gray-50/50 hover:bg-white transition-all appearance-none cursor-pointer"
                  >
                    <option value="">{t.selectDivision}</option>
                    {divisions.map((div) => (
                      <option key={div._id} value={div.name}>
                        {div.name}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                    <ChevronLeft className="w-4 h-4 -rotate-90" />
                  </div>
                </div>
              </div>

              <div>
                <Label
                  htmlFor="filter-district"
                  className="mb-3 block text-base font-semibold text-gray-700"
                >
                  ২. {t.district}
                </Label>
                <div className="relative">
                  <select
                    id="filter-district"
                    value={selectedDistrict}
                    onChange={(e) => handleDistrictSelect(e.target.value)}
                    disabled={!selectedDivision}
                    className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-700 bg-gray-50/50 hover:bg-white transition-all appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">
                      {selectedDivision
                        ? t.selectDistrict
                        : t.selectDivisionFirst}
                    </option>
                    {districts.map((dist) => (
                      <option key={dist._id} value={dist.name}>
                        {dist.name}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                    <ChevronLeft className="w-4 h-4 -rotate-90" />
                  </div>
                </div>
              </div>

              <div>
                <Label
                  htmlFor="filter-thana"
                  className="mb-3 block text-base font-semibold text-gray-700"
                >
                  ৩. {t.thana}
                </Label>
                <div className="relative">
                  <select
                    id="filter-thana"
                    value={selectedThana}
                    onChange={(e) => handleThanaSelect(e.target.value)}
                    disabled={!selectedDistrict || !selectedDivision}
                    className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-700 bg-gray-50/50 hover:bg-white transition-all appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">
                      {selectedDivision && selectedDistrict
                        ? t.selectThana
                        : t.selectDistrictFirst}
                    </option>
                    {thanas.map((thana) => (
                      <option key={thana._id} value={thana.name}>
                        {thana.name}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                    <ChevronLeft className="w-4 h-4 -rotate-90" />
                  </div>
                </div>
              </div>

              <div>
                <Label
                  htmlFor="filter-hospital-hierarchical"
                  className="mb-3 block text-base font-semibold text-gray-700"
                >
                  ৪. {t.hospital}
                </Label>
                <div className="relative">
                  <select
                    id="filter-hospital-hierarchical"
                    value={selectedHospital}
                    onChange={(e) => handleHospitalSelect(e.target.value)}
                    className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-700 bg-gray-50/50 hover:bg-white transition-all appearance-none cursor-pointer"
                  >
                    <option value="">{t.allHospitals}</option>
                    {hospitalsFilterList.map((hosp) => (
                      <option key={hosp.slug} value={hosp.slug}>
                        {language === 'bn' ? hosp.nameBn : hosp.name}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                    <ChevronLeft className="w-4 h-4 -rotate-90" />
                  </div>
                </div>
              </div>

              <div>
                <Label
                  htmlFor="filter-department-hierarchical"
                  className="mb-3 block text-base font-semibold text-gray-700"
                >
                  ৫. {t.department}
                </Label>
                <div className="relative">
                  <select
                    id="filter-department-hierarchical"
                    value={selectedDepartment}
                    onChange={(e) => handleDepartmentSelect(e.target.value)}
                    className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-700 bg-gray-50/50 hover:bg-white transition-all appearance-none cursor-pointer"
                  >
                    <option value="">{t.allDepartments}</option>
                    {departmentNames.map((dept) => (
                      <option key={dept} value={dept}>
                        {language === 'en' ? dept : (departments.find(d => d.name === dept)?.nameBn || '')}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                    <ChevronLeft className="w-4 h-4 -rotate-90" />
                  </div>
                </div>
              </div>
            </div>

            {(selectedDivision ||
              selectedDistrict ||
              selectedThana ||
              selectedDepartment) && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-6 flex justify-end"
                >
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedDivision("");
                      setSelectedDistrict("");
                      setSelectedThana("");
                      setSelectedDepartment("");
                      setSelectedHospital("");
                    }}
                    className="flex items-center gap-2 px-5 py-2.5"
                  >
                    <X className="h-5 w-5" />
                    {t.reset}
                  </Button>
                </motion.div>
              )}
          </div>
        </motion.div>

        {/* Filter & Sort Controls Section */}

        {/* Filters Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="mb-8"
            >
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
                <div className="mb-6 pb-4 border-b border-gray-100">
                  <h3
                    className="text-xl md:text-2xl font-bold text-gray-900"
                  >
                    {t.filterTitle}
                  </h3>
                  <p
                    className="text-sm text-gray-600 mt-1"
                  >
                    {t.filterSubtitle}
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Specialty Filter */}
                  <div>
                    <Label
                      htmlFor="specialty"
                      className="mb-3 block text-base font-semibold text-gray-700"
                    >
                      {t.specialtyFilter}
                    </Label>
                    <select
                      id="specialty"
                      value={selectedSpecialty}
                      onChange={(e) => setSelectedSpecialty(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-base bg-white shadow-sm hover:shadow-md transition-all"
                    >
                      <option value="">{t.allSpecialties}</option>
                      {specialties.map((spec) => (
                        <option key={spec} value={spec}>
                          {spec}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Hospital Filter */}
                  <div>
                    <Label
                      htmlFor="hospital"
                      className="mb-3 block text-base font-semibold text-gray-700"
                    >
                      {t.hospitalFilter}
                    </Label>
                    <select
                      id="hospital"
                      value={selectedHospital}
                      onChange={(e) => setSelectedHospital(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-base bg-white shadow-sm hover:shadow-md transition-all"
                    >
                      <option value="">{t.allHospitals}</option>
                      {hospitalsFilterList.map((hosp) => (
                        <option key={hosp.slug} value={hosp.slug}>
                          {language === 'bn' ? hosp.nameBn : hosp.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Qualification Filter */}
                  <div>
                    <Label
                      htmlFor="qualification"
                      className="mb-3 block text-base font-semibold text-gray-700"
                    >
                      {t.qualificationFilter}
                    </Label>
                    <select
                      id="qualification"
                      value={selectedQualification}
                      onChange={(e) => setSelectedQualification(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-base bg-white shadow-sm hover:shadow-md transition-all"
                    >
                      <option value="">{t.allQualifications}</option>
                      {qualifications.map((qual) => (
                        <option key={qual} value={qual}>
                          {qual}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Experience Range */}

                  {/* Fee Range */}
                  <div>
                    <Label
                      className="mb-3 block text-base font-semibold text-gray-700"
                    >

                    </Label>
                    <div className="flex gap-3">
                      <Input
                        type="number"
                        placeholder={`${t.min} ৳`}
                        value={minFee}
                        onChange={(e) => setMinFee(e.target.value)}
                        className="w-full px-4 py-3 border-2 rounded-xl shadow-sm hover:shadow-md transition-all"
                      />
                      <Input
                        type="number"
                        placeholder={`${t.max} ৳`}
                        value={maxFee}
                        onChange={(e) => setMaxFee(e.target.value)}
                        className="w-full px-4 py-3 border-2 rounded-xl shadow-sm hover:shadow-md transition-all"
                      />
                    </div>
                  </div>

                  {/* Rating Filter */}
                  <div>
                    <Label
                      htmlFor="rating"
                      className="mb-3 block text-base font-semibold text-gray-700"
                    >
                      {t.minimumRating}
                    </Label>
                    <select
                      id="rating"
                      value={minRating}
                      onChange={(e) => setMinRating(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-base bg-white shadow-sm hover:shadow-md transition-all"
                    >
                      <option value="">{t.anyRating}</option>
                      <option value="4">৪+ ⭐</option>
                      <option value="3">৩+ ⭐</option>
                      <option value="2">২+ ⭐</option>
                      <option value="1">১+ ⭐</option>
                    </select>
                  </div>

                  {/* Availability Days */}
                  <div className="md:col-span-2 lg:col-span-3">
                    <Label
                      className="mb-3 block text-base font-semibold text-gray-700"
                    >
                      {t.availableDays}
                    </Label>
                    <div className="flex flex-wrap gap-3">
                      {daysOfWeek.map((day, index) => (
                        <motion.button
                          key={day}
                          type="button"
                          onClick={() => toggleDay(day)}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className={`px-5 py-2.5 rounded-xl text-base font-semibold transition-all shadow-md hover:shadow-lg ${selectedDays.includes(day)
                            ? "bg-[#3DB5A0] text-white"
                            : "bg-white text-gray-700 hover:bg-gray-100 border-2 border-gray-300"
                            }`}
                        >
                          {currentDays[index]}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results Count Section */}
        <div ref={resultsRef}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="mb-8"
          >
            <Card className="p-5 bg-white border border-gray-100 shadow-sm rounded-2xl">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div
                  className="text-base font-semibold text-gray-700"
                >
                  {searchQuery ? (
                    <span>
                      {t.found}{" "}
                      <span className="text-primary font-bold text-lg">
                        {filteredAndSortedDoctors.length}
                      </span>{" "}
                      {t.doctors} {t.matching} &quot;
                      {searchQuery}&quot;
                    </span>
                  ) : (
                    <span>
                      {t.showing}{" "}
                      <span className="text-primary font-bold text-lg">
                        {doctors.length}
                      </span>{" "}
                      {t.of}{" "}
                      <span className="text-primary font-bold text-lg">
                        {totalDoctors}
                      </span>{" "}
                      {t.totalDoctors}
                    </span>
                  )}
                </div>
                {searchQuery && filteredAndSortedDoctors.length > 0 && (
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSearchQuery("")}
                      className="flex items-center gap-2 px-4 py-2.5 border-2 shadow-md hover:shadow-lg"
                    >
                      <X className="h-5 w-5" />
                      {t.clearSearch}
                    </Button>
                  </motion.div>
                )}
              </div>
            </Card>
          </motion.div>

          {/* Doctor Cards Section */}
          <div className="relative">
            {isSearching && (
              <div className="absolute inset-0 z-10 bg-white/50 backdrop-blur-[1px] flex items-center justify-center rounded-2xl min-h-[400px]">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full"
                />
              </div>
            )}

            {filteredAndSortedDoctors.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="mb-8"
              >
                <Card className="p-12 text-center bg-gradient-to-br from-gray-50 to-white border-2 border-gray-200 shadow-lg">
                  <div className="mb-6">
                    <Stethoscope className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p
                      className="text-xl font-semibold text-gray-600 mb-4"
                    >
                      {t.noDoctors}
                    </p>
                  </div>
                  {hasActiveFilters && (
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button
                        onClick={clearFilters}
                        variant="outline"
                        className="px-6 py-3 border-2 shadow-md hover:shadow-lg"
                      >
                        {t.clearFilters}
                      </Button>
                    </motion.div>
                  )}
                </Card>
              </motion.div>
            ) : (
              <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8 transition-opacity duration-300 ${isSearching ? 'opacity-30' : 'opacity-100'}`}>
                {doctors.map((doctor, index) => {
                  const doctorWithBnHospital = {
                    ...doctor,
                    hospitalBn: "",
                    hospital: ""
                  };
                  return (
                    <DoctorCard key={`${doctor._id}-${index}`} doctor={doctor} index={index} />
                  );
                })}
              </div>
            )}
          </div>

          {/* Loading Indicator for Infinite Scroll */}
          <div ref={observerTarget} className="py-10 flex justify-center w-full">
            {loadingMore && (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full"
              />
            )}
            {!hasMore && doctors.length > 0 && (
              <p className="text-gray-500 font-medium">{language === 'bn' ? 'আর কোনো ডাক্তার নেই' : 'No more doctors to show'}</p>
            )}
          </div>
        </div>{/* /resultsRef */}
      </div>
      <Footer />
    </div>
  );
}

export default function DoctorListPage() {
  return (
    <Suspense
      fallback={
        <PageLoader />
      }
    >
      <DoctorListPageContent />
    </Suspense>
  );
}