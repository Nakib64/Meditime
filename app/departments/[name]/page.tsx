"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Stethoscope, Loader2 } from "lucide-react";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import DoctorCard, { Doctor } from "@/components/doctor-card";
import PageLoader from "@/components/page-loader";
import Link from "next/link";
import { useLanguage, getLocalizedValue } from "@/contexts/LanguageContext";

const translations = {
  en: {
    department: "Department",
    subtitle: "View all specialist doctors in this department and book an appointment",
    searchPlaceholder: "Search by name, specialty, or hospital...",
    doctorsFound: "doctor(s) found",
    noDoctors: "No doctors found in this department",
    tryAnother: "Please check other departments or try again later",
    allDepartments: "View all departments",
  },
  bn: {
    department: "বিভাগ",
    subtitle: "এই বিভাগের সকল বিশেষজ্ঞ ডাক্তার দেখুন এবং অ্যাপয়েন্টমেন্ট বুক করুন",
    searchPlaceholder: "নাম, বিশেষতা, হাসপাতাল দিয়ে খুঁজুন...",
    doctorsFound: "জন ডাক্তার খুঁজে পাওয়া গেছে",
    noDoctors: "এই বিভাগে কোন ডাক্তার পাওয়া যায়নি",
    tryAnother: "দয়া করে অন্য বিভাগ দেখুন অথবা পরে আবার চেষ্টা করুন",
    allDepartments: "সকল বিভাগ দেখুন",
  }
};

export default function DepartmentDoctorsPage() {
  const params = useParams();
  const departmentName = decodeURIComponent(params.name as string);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [deptDetails, setDeptDetails] = useState<{ name: string; nameBn?: string } | null>(null);

  // Pagination states
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [totalDoctors, setTotalDoctors] = useState(0);
  const observerTarget = useRef<HTMLDivElement>(null);

  const { language } = useLanguage();
  const t = translations[language];

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchDoctors = async (pageNum: number, isNewSearch = false) => {
    try {
      if (pageNum > 1) setLoadingMore(true);
      else if (!isNewSearch) setLoading(true);

      const params = new URLSearchParams();
      params.append("page", pageNum.toString());
      params.append("limit", "12");
      params.append("department", departmentName);
      if (debouncedSearchQuery) {
        params.append("search", debouncedSearchQuery);
      }

      const response = await fetch(`/api/doctors?${params.toString()}`);
      const data = await response.json();
      if (response.ok) {
        if (isNewSearch || pageNum === 1) {
          setDoctors(data.doctors || []);
        } else {
          setDoctors(prev => [...prev, ...(data.doctors || [])]);
        }
        setTotalDoctors(data.total || 0);
        setHasMore(data.page < data.totalPages);
      }
    } catch (error) {
      console.error("Error fetching doctors:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const fetchDepartmentDetails = async () => {
    try {
      const response = await fetch(`/api/departments?name=${encodeURIComponent(departmentName)}`);
      const data = await response.json();
      if (response.ok && data.departments && data.departments.length > 0) {
        setDeptDetails(data.departments[0]);
      }
    } catch (error) {
      console.error("Error fetching department details:", error);
    }
  };

  // Fetch department details once
  useEffect(() => {
    fetchDepartmentDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [departmentName]);

  // Reset and refetch on search query change
  useEffect(() => {
    setPage(1);
    setHasMore(true);
    fetchDoctors(1, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearchQuery, departmentName]);

  // Infinite scroll observer
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasMore, loading, loadingMore, page]);

  const displayDeptName = deptDetails
    ? getLocalizedValue(deptDetails.name, deptDetails.nameBn, language)
    : departmentName;

  if (loading && page === 1 && doctors.length === 0) {
    return <PageLoader />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <Navbar />

      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="relative h-[300px] md:h-[400px] w-full overflow-hidden"
      >
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: "url('/hero/dept_profile.png')",
          }}
        />
        <div className="relative z-20 h-full flex items-center justify-center px-4">
          <div className="max-w-7xl mx-auto text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <p className="text-white/80 text-sm font-medium mb-3 uppercase tracking-widest">{t.department}</p>
              <h1 className="text-3xl md:text-5xl font-bold text-white mb-4 drop-shadow-2xl leading-tight">
                {displayDeptName}
              </h1>
              <p className="text-lg text-white/90 drop-shadow-md">
                {t.subtitle}
              </p>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mb-8"
        >
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                type="text"
                placeholder={t.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-4 py-5 text-base border-2 border-gray-200 focus:border-primary rounded-xl shadow-sm"
              />
            </div>
          </div>
        </motion.div>

        {/* Count */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mb-6 text-center"
        >
          <p className="text-base text-gray-600">
            {totalDoctors} {t.doctorsFound}
          </p>
        </motion.div>

        {/* Doctors Grid */}
        {doctors.length === 0 && !loading ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <div className="max-w-md mx-auto">
              <Stethoscope className="h-20 w-20 text-gray-300 mx-auto mb-6" />
              <h3 className="text-2xl font-semibold text-gray-700 mb-4">
                {t.noDoctors}
              </h3>
              <p className="text-gray-500 mb-8">
                {t.tryAnother}
              </p>
              <Link href="/departments">
                <Button className="bg-primary hover:bg-primary-dark text-white">
                  {t.allDepartments}
                </Button>
              </Link>
            </div>
          </motion.div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {doctors.map((doctor, index) => (
                <motion.div
                  key={doctor._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <DoctorCard doctor={doctor} index={index} />
                </motion.div>
              ))}
            </div>

            {/* Infinite Scroll Observer Target */}
            <div ref={observerTarget} className="h-20 w-full flex items-center justify-center mt-8">
              {loadingMore && (
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              )}
            </div>
          </>
        )}
      </div>

      <Footer />
    </div>
  );
}
