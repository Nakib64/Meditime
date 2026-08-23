"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import Nav_for_details from "@/components/nav_for_details";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  Building2,
  MapPin,
  Users,
  Search,
  Loader2,
} from "lucide-react";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { motion } from "framer-motion";
import { useLanguage, getLocalizedValue } from "@/contexts/LanguageContext";
import DoctorCard from "@/components/doctor-card";
import Loading from "@/app/loading";
import { trackHospitalProfileView } from "@/lib/gtm";

interface Hospital {
  slug: string;
  _id: string;
  name: string;
  nameBn?: string;
  thana?: {
    _id: string;
    name: string;
    nameBn?: string;
    district?: {
      _id: string;
      name: string;
      nameBn?: string;
      division?: {
        _id: string;
        name: string;
        nameBn?: string;
      };
    };
  };
  address?: string;
  addressBn?: string;
  phone?: string;
  email?: string;
}

const banglaLabels = {
  back: "হাসপাতালে ফিরুন",
  hospitalNotFound: "হাসপাতাল পাওয়া যায়নি",
  notFoundDesc: "আপনি যে হাসপাতাল খুঁজছেন তা বিদ্যমান নেই।",
  doctorsAt: "এই হাসপাতালের ডাক্তার",
  noDoctors: "এই হাসপাতালে কোন ডাক্তার পাওয়া যায়নি",
  checkLater: "পরবর্তীতে আবার চেক করুন",
  location: "অবস্থান",
  address: "ঠিকানা",
  loading: "হাসপাতালের তথ্য লোড হচ্ছে...",
  aboutHospital: "হাসপাতাল সম্পর্কে",
  searchPlaceholder: "ডাক্তার খুঁজুন...",
  doctorsList: "Doctors list",
  nearbyHospitals: "Nearby Hospitals",
};

export default function HospitalDetailPage() {
  const params = useParams();
  const router = useRouter();
  const hospitalSlug = decodeURIComponent(params.slug as string);
  const { language } = useLanguage();

  const [hospital, setHospital] = useState<Hospital | null>(null);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [allHospitals, setAllHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  const PAGE_SIZE = 10;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Debounce search input by 150ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery.trim());
      setVisibleCount(PAGE_SIZE); // reset pagination on new search
    }, 150);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchHospitalAndDoctors = useCallback(async () => {
    try {
      setLoading(true);

      // 1. Fetch single hospital by slug/id
      const hospitalResponse = await fetch(`/api/locations/hospitals/${hospitalSlug}`);
      const hospitalData = await hospitalResponse.json();

      if (hospitalResponse.ok && hospitalData.hospital) {
        const foundHospital = hospitalData.hospital;
        setHospital(foundHospital);
        trackHospitalProfileView(foundHospital.name);

        // 2. Fetch doctors for this specific hospital using the new dedicated API
        const doctorsResponse = await fetch(`/api/hospitals/${encodeURIComponent(hospitalSlug)}/doctors`);
        const doctorsData = await doctorsResponse.json();
        if (doctorsResponse.ok) {
          setDoctors(doctorsData.doctors || []);
        }

        // 3. Fetch top 3 nearest hospitals for recommendations
        const hospitalsResponse = await fetch(`/api/hospitals/${encodeURIComponent(hospitalSlug)}/nearest`);
        const hospitalsData = await hospitalsResponse.json();
        if (hospitalsResponse.ok) {
          setAllHospitals(hospitalsData.hospitals || []);
        }
      } else {
        setHospital(null);
      }
    } catch (error) {
      console.error("Error fetching hospital and doctors:", error);
    } finally {
      setLoading(false);
    }
  }, [hospitalSlug]);

  useEffect(() => {
    if (hospitalSlug) {
      fetchHospitalAndDoctors();
    }
  }, [hospitalSlug, fetchHospitalAndDoctors]);

  const getHospitalLocationString = (h: Hospital | null): string => {
    if (!h) return "";
    const parts: string[] = [];

    const division = getLocalizedValue(h.thana?.district?.division?.name, h.thana?.district?.division?.nameBn, language);
    const district = getLocalizedValue(h.thana?.district?.name, h.thana?.district?.nameBn, language);
    const thana = getLocalizedValue(h.thana?.name, h.thana?.nameBn, language);
    if (thana) parts.push(thana);
    if (district) parts.push(district);
    if (division) parts.push(division);



    return parts.join(", ");
  };

  const recommendedHospitals = useMemo(() => {
    return allHospitals;
  }, [allHospitals]);

  const filteredDoctors = useMemo(() => {
    if (!debouncedQuery) return doctors;

    const cleanQuery = debouncedQuery.toLowerCase().replace(/[\s.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");
    if (!cleanQuery) return doctors;

    return doctors.filter((doctor) => {
      const fields = [
        doctor.name,
        doctor.nameBn,
        doctor.department,
        doctor.departmentBn,
      ].filter(Boolean).map((v: string) => v.toLowerCase().replace(/[\s.,\/#!$%\^&\*;:{}=\-_`~()]/g, ""));

      return fields.some((f) => f.includes(cleanQuery));
    });
  }, [doctors, debouncedQuery]);

  const visibleDoctors = filteredDoctors.slice(0, visibleCount);
  const hasMore = visibleCount < filteredDoctors.length;

  // Keep a ref so the stable observer callback always reads the latest hasMore.
  const hasMoreRef = useRef(hasMore);
  hasMoreRef.current = hasMore;

  // Callback ref — fires when the sentinel node mounts or unmounts.
  // This correctly handles the sentinel being inside a conditional render.
  const setSentinelRef = useCallback((node: HTMLDivElement | null) => {
    if (sentinelRef.current) {
      // cleanup previous observer if node changes
      sentinelRef.current = null;
    }
    if (!node) return;
    sentinelRef.current = node;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMoreRef.current) {
          setVisibleCount((prev) => prev + PAGE_SIZE);
        }
      },
      { rootMargin: '200px', threshold: 0 }
    );
    observer.observe(node);
    // Store cleanup on the node itself so we can disconnect when it unmounts
    (node as any).__observer = observer;
  }, []);

  // Disconnect when sentinel unmounts (search changes hide/show it)
  useEffect(() => {
    return () => {
      if (sentinelRef.current) {
        (sentinelRef.current as any).__observer?.disconnect();
      }
    };
  }, []);

  if (loading) {
    return (
      <Loading></Loading>
    );
  }

  if (!hospital) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Nav_for_details />
        <div className="max-w-7xl mt-28 mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="p-12 text-center shadow-xl">
              <Building2 className="h-20 w-20 mx-auto text-gray-400 mb-6" />
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                {language === 'bn' ? banglaLabels.hospitalNotFound : "Hospital Not Found"}
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                {language === 'bn' ? banglaLabels.notFoundDesc : "The hospital you are looking for does not exist."}
              </p>
              <Button onClick={() => router.push("/hospital")} variant="outline" className="text-lg px-6 py-3">
                <ArrowLeft className="h-5 w-5 mr-2" />
                {language === 'bn' ? banglaLabels.back : "Back to Hospitals"}
              </Button>
            </Card>
          </motion.div>
        </div>
        <Footer />
      </div>
    );
  }

  const hospitalName = getLocalizedValue(hospital.name, hospital.nameBn, language);
  const hospitalAddress = getLocalizedValue(hospital.address, hospital.addressBn, language);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <Nav_for_details />
      <div className="max-w-7xl mt-28 mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Content */}
          <div className="flex-1">

            {/* Hospital Header */}
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
              <Card className="p-8 md:p-10 bg-gradient-to-br from-primary/10 via-primary/5 to-white border-2 border-primary/20 shadow-xl">
                <div className="flex flex-col md:flex-row gap-8">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="relative w-32 h-32 rounded-2xl overflow-hidden shrink-0 bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center shadow-lg"
                  >
                    <Building2 className="h-16 w-16 text-white" />
                  </motion.div>
                  <div className="flex-1">
                    <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                      {hospitalName}
                    </h1>

                    <div className="">

                      {hospitalAddress && (
                        <motion.div
                          whileHover={{ scale: 1.02 }}
                          className="flex items-start gap-3 p-4 bg-white/60 rounded-lg border border-gray-200"
                        >
                          <MapPin className="h-6 w-6 shrink-0 text-primary mt-0.5" />
                          <div>
                            <p className="text-sm font-semibold text-gray-500 mb-1">
                              {language === 'bn' ? banglaLabels.address : "Address"}
                            </p>
                            <p className="text-base font-medium text-gray-800">
                              {hospitalAddress}
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Hospital Description */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
              <Card className="p-8 bg-gradient-to-br from-white via-primary/5 to-white border-2 border-primary/10 shadow-lg">
                <div className="space-y-4">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Building2 className="h-6 w-6 text-primary" />
                    </div>
                    {language === 'bn' ? banglaLabels.aboutHospital : "About Hospital"}
                  </h3>
                  <div className="text-base md:text-lg leading-relaxed text-gray-700">
                    <p className="text-justify">
                      {hospitalName} {language === 'bn'
                        ? "একটি আধুনিক ও উন্নত চিকিৎসা সেবা প্রদানকারী স্বাস্থ্যসেবা প্রতিষ্ঠান। আমাদের হাসপাতালে অভিজ্ঞ ও দক্ষ চিকিৎসকগণ সর্বোচ্চ মানের চিকিৎসা সেবা প্রদান করে থাকেন। আধুনিক চিকিৎসা সরঞ্জাম ও প্রযুক্তির সমন্বয়ে আমরা রোগীদের জন্য সর্বোত্তম চিকিৎসা নিশ্চিত করি।"
                        : "is a modern healthcare institution providing advanced medical services. Our experienced and skilled doctors provide the highest quality medical care. We ensure the best treatment for patients with modern medical equipment and technology."}
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Doctors Header with Search Box */}
            <div className="flex flex-col items-start justify-between gap-4 mb-6">
              <div className="flex-1">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3 flex items-center gap-3">
                  <div className="p-3 bg-primary/10 rounded-xl">
                    <Users className="h-8 w-8 text-primary" />
                  </div>
                  {hospitalName}'s {language === 'bn' ? "ডাক্তার তালিকা" : "Doctors list"} ({doctors.length})
                </h2>
              </div>

              {/* Search Box */}
              <div className="w-full md:w-auto">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 transition-colors" />
                  <Input
                    type="text"
                    placeholder={language === 'bn' ? banglaLabels.searchPlaceholder : "Search doctors..."}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-10 py-2 w-full md:w-80 border-2 border-gray-200 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      aria-label="Clear search"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Doctors Grid */}
            {filteredDoctors.length === 0 ? (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                <Card className="p-16 text-center shadow-xl bg-gradient-to-br from-gray-50 to-white">
                  <Users className="h-24 w-24 mx-auto text-gray-300 mb-6" />
                  <p className="text-2xl font-semibold text-gray-600 mb-3">
                    {language === 'bn' ? banglaLabels.noDoctors : "No doctors found at this hospital"}
                  </p>
                  <p className="text-lg text-gray-400">
                    {language === 'bn' ? banglaLabels.checkLater : "Please check back later or search with a different term."}
                  </p>
                </Card>
              </motion.div>
            ) : (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-4">
                  {visibleDoctors.map((doctor, index) => (
                    <motion.div
                      key={doctor._id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <DoctorCard doctor={doctor} index={index} />
                    </motion.div>
                  ))}
                </div>

                {/* Infinite scroll sentinel */}
                <div ref={setSentinelRef} className="flex flex-col items-center gap-2 py-4">
                  {hasMore && (
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {language === 'bn' ? 'আরো লোড হচ্ছে...' : 'Loading more...'}
                    </div>
                  )}
                  {!hasMore && filteredDoctors.length > PAGE_SIZE && (
                    <p className="text-xs text-gray-400">
                      {language === 'bn'
                        ? `মোট ${filteredDoctors.length} জন ডাক্তার দেখানো হয়েছে`
                        : `Showing all ${filteredDoctors.length} doctors`}
                    </p>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Sidebar — always visible */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="w-full lg:w-80 shrink-0">
            <Card className="p-6 bg-gradient-to-br from-white via-primary/5 to-white border-2 border-primary/20 shadow-xl sticky top-32">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Building2 className="h-6 w-6 text-primary" />
                </div>
                {language === 'bn' ? banglaLabels.nearbyHospitals : "Nearby Hospitals"}
              </h3>

              {recommendedHospitals.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="p-4 bg-gray-100 rounded-full mb-4">
                    <Building2 className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-sm font-medium text-gray-500">
                    {language === 'bn' ? 'কাছাকাছি কোনো হাসপাতাল পাওয়া যায়নি' : 'No nearby hospitals found'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recommendedHospitals.map((rec) => (
                    <motion.div key={rec._id} whileHover={{ scale: 1.02 }}>
                      <Link href={`/hospital/${rec.slug || encodeURIComponent(rec.name)}`}>
                        <Card className="p-4 bg-white border-2 border-gray-200 hover:border-primary/50 shadow-md transition-all cursor-pointer">
                          <div className="flex items-start gap-3">
                            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                              <Building2 className="h-6 w-6 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-bold text-gray-900 mb-1 line-clamp-2">
                                {getLocalizedValue(rec.name, rec.nameBn, language)}
                              </h4>
                              <div className="flex gap-1 text-xs text-gray-500">
                                <MapPin className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                                <span className="line-clamp-2">
                                  {getLocalizedValue(rec.address, rec.addressBn, language) || getHospitalLocationString(rec)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </Card>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              )}
            </Card>
          </motion.div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
