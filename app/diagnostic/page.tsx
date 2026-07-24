"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Activity,
  Search,
  Microscope,
  Heart,
  Eye,
  CheckCircle2,
  Timer,
  MapPin,
  ChevronRight,
  AlertCircle,
  Droplet,
  HeartPulse,
  Scan,
  FlaskConical
} from "lucide-react";
import { motion } from "framer-motion";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

import { useLanguage } from "@/contexts/LanguageContext";
import { homepageTranslations } from "@/lib/homepage-translations";
import { getLocalizedValue } from "@/contexts/LanguageContext";

// Local types and imports
import { BookedTest, Hospital, Division, District, Thana } from "@/types/diagnostic";

// Refactored modular components
import DiagnosticCart from "@/components/diagnostic/DiagnosticCart";
import DiagnosticTestList from "@/components/diagnostic/DiagnosticTestList";
import DiagnosticLocationFilter from "@/components/diagnostic/DiagnosticLocationFilter";
import DiagnosticHistoryModal from "@/components/diagnostic/DiagnosticHistoryModal";

export default function DiagnosticPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const t = homepageTranslations[language].diagnosticPage;

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [tests, setTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [bookedTests, setBookedTests] = useState<BookedTest[]>([]);
  const [selectedVenue, setSelectedVenue] = useState<Hospital | null>(null);

  const [showBookingsModal, setShowBookingsModal] = useState(false);
  const [myBookingsHistory, setMyBookingsHistory] = useState<any[]>([]);

  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalTests, setTotalTests] = useState(0);
  const [stats, setStats] = useState<Record<string, number>>({});
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [thanas, setThanas] = useState<Thana[]>([]);
  const [selectedDivision, setSelectedDivision] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedThana, setSelectedThana] = useState("");
  const [user, setUser] = useState<any>(null);


  const observerTarget = useRef<HTMLDivElement>(null);
  const isLoadingRef = useRef(false);

  // Load cart and user from LocalStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedTests = localStorage.getItem("diagnosticCart");
      const savedVenue = localStorage.getItem("diagnosticVenue");
      const savedBookings = localStorage.getItem("myDiagnosticBookings");
      const userData = localStorage.getItem("user");

      if (savedTests) setBookedTests(JSON.parse(savedTests));
      if (savedVenue) setSelectedVenue(JSON.parse(savedVenue));
      if (savedBookings) setMyBookingsHistory(JSON.parse(savedBookings));
      if (userData) {
        try {
          setUser(JSON.parse(userData));
        } catch (e) {
          console.error("Error parsing user data:", e);
        }
      }
    }
  }, []);

  // Save cart to LocalStorage when mutated
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("diagnosticCart", JSON.stringify(bookedTests));
    }
  }, [bookedTests]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (selectedVenue) localStorage.setItem("diagnosticVenue", JSON.stringify(selectedVenue));
      else localStorage.removeItem("diagnosticVenue");
    }
  }, [selectedVenue]);

  // Sync abandoned cart to server
  useEffect(() => {
    // Only attempt to sync if user is logged in
    if (!user) return;

    // If there ARE tests OR if we want to CLEAR an existing cart (tests.length === 0)
    // we should trigger the sync. The API now handles delete if tests is empty.

    // We only skip if EVERYTHING is empty and we haven't started (not likely here)
    // but the main change is removing the early return on length === 0.

    const timer = setTimeout(async () => {
      try {
        await fetch("/api/diagnostic/abandoned-cart", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user.id || user._id,
            fullName: user.fullName || user.name,
            phoneNumber: user.phoneNumber,
            email: user.email,
            tests: bookedTests,
            venueId: selectedVenue?._id,
            totalPrice: bookedTests.reduce((acc, curr) => acc + (curr.price || 0), 0)
          })
        });
      } catch (err) {
        console.error("Error syncing abandoned cart:", err);
      }
    }, 3000); // 3 second debounce to avoid excessive writes

    return () => clearTimeout(timer);
  }, [bookedTests, selectedVenue, user]);

  // Fetch bookings from database if logged in
  useEffect(() => {
    const fetchUserBookings = async () => {
      if (!user) return;

      try {
        const userId = user.id || user._id;
        const res = await fetch(`/api/diagnostic/bookings?userId=${userId}`);
        const data = await res.json();

        if (res.ok && data.bookings) {
          // Merge with local storage bookings (prioritizing DB)
          const localBookings = JSON.parse(localStorage.getItem("myDiagnosticBookings") || "[]");

          // Use a Map to deduplicate by bookingRef or _id
          const combined = [...data.bookings, ...localBookings];
          const unique = Array.from(new Map(combined.map(b => [b._id || b.bookingRef, b])).values());

          setMyBookingsHistory(unique);
          localStorage.setItem("myDiagnosticBookings", JSON.stringify(unique));
        }
      } catch (error) {
        console.error("Error fetching cross-device bookings:", error);
      }
    };

    fetchUserBookings();
  }, [user]);

  const handleBooking = (test: any) => {
    setBookedTests(prev => {
      const exists = prev.find(t => t._id === test._id);
      if (exists) {
        return prev.filter(t => t._id !== test._id);
      }
      return [...prev, { _id: test._id, name: test.name, nameBn: test.nameBn, price: test.price, serialNumber: test.serialNumber, recommendations: test.recommendations || [] }];
    });
  };

  // Fetch stats logic
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch("/api/diagnostic/stats");
        const data = await res.json();
        if (res.ok) setStats(data.stats);
      } catch (error) {
        console.error("Error fetching stats:", error);
      }
    };
    fetchStats();
  }, []);

  const fetchHospitals = async () => {
    try {
      const response = await fetch("/api/locations/hospitals");
      if (response.ok) {
        const data = await response.json();
        setHospitals(data.hospitals || []);
      }
    } catch (error) {
      console.error("Error fetching hospitals:", error);
    }
  };

  const fetchDivisions = async () => {
    try {
      const response = await fetch("/api/locations/divisions");
      if (response.ok) {
        const data = await response.json();
        setDivisions(data.divisions || []);
      }
    } catch (error) {
      console.error("Error fetching divisions:", error);
    }
  };

  const fetchDistricts = useCallback(async (divisionName: string) => {
    try {
      const division = divisions.find((d) => d.name === divisionName);
      if (!division) return;
      const response = await fetch(`/api/locations/districts?division=${division._id}`);
      if (response.ok) {
        const data = await response.json();
        setDistricts(data.districts || []);
      }
    } catch (error) {
      console.error("Error fetching districts:", error);
    }
  }, [divisions]);

  const fetchThanas = useCallback(async (districtName: string) => {
    try {
      const district = districts.find((d) => d.name === districtName);
      if (!district) return;
      const response = await fetch(`/api/locations/thanas?district=${district._id}`);
      if (response.ok) {
        const data = await response.json();
        setThanas(data.thanas || []);
      }
    } catch (error) {
      console.error("Error fetching thanas:", error);
    }
  }, [districts]);

  useEffect(() => {
    fetchDivisions();
    fetchHospitals();
  }, []);

  useEffect(() => {
    if (selectedDivision) fetchDistricts(selectedDivision);
  }, [selectedDivision, fetchDistricts]);

  useEffect(() => {
    if (selectedDistrict) fetchThanas(selectedDistrict);
  }, [selectedDistrict, fetchThanas]);

  const handleDivisionSelect = (division: string) => {
    setSelectedDivision(division);
    setSelectedDistrict("");
    setSelectedThana("");
  };

  const handleDistrictSelect = (district: string) => {
    setSelectedDistrict(district);
    setSelectedThana("");
  };

  const handleThanaSelect = (thana: string) => {
    setSelectedThana(thana);
  };

  const filteredHospitals = useMemo(() => {
    return hospitals.filter((hospital) => {
      const hospitalDivision = hospital.thana?.district?.division?.name;
      const hospitalDistrict = hospital.thana?.district?.name;
      const hospitalThana = hospital.thana?.name;
      if (selectedDivision && hospitalDivision !== selectedDivision) return false;
      if (selectedDistrict && hospitalDistrict !== selectedDistrict) return false;
      if (selectedThana && hospitalThana !== selectedThana) return false;
      return true;
    });
  }, [hospitals, selectedDivision, selectedDistrict, selectedThana]);

  const fetchTests = useCallback(async (page: number, search: string, category: string | null, isNewSearch: boolean = false) => {
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;
    setLoading(true);
    try {
      const url = new URL("/api/diagnostic/tests", window.location.origin);
      url.searchParams.set("page", page.toString());
      url.searchParams.set("limit", "10");
      if (search) {
        url.searchParams.set("search", search);
      }
      if (category) {
        url.searchParams.set("category", category);
      }
      const res = await fetch(url.toString());
      const data = await res.json();
      if (res.ok) {
        if (isNewSearch) {
          setTests(data.tests);
        } else {
          setTests(prev => [...prev, ...data.tests]);
        }
        setHasMore(page < data.totalPages);
        setTotalTests(data.totalTests || 0);
      }
    } catch (error) {
      console.error("Error fetching tests:", error);
    } finally {
      isLoadingRef.current = false;
      setLoading(false);
    }
  }, []);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Initial fetch and fetch on search change or category change
  useEffect(() => {
    setCurrentPage(1);
    fetchTests(1, debouncedSearch, selectedCategory, true);
  }, [debouncedSearch, selectedCategory, fetchTests]);

  // Fetch more on page change
  useEffect(() => {
    if (currentPage > 1) {
      fetchTests(currentPage, debouncedSearch, selectedCategory, false);
    }
  }, [currentPage, debouncedSearch, selectedCategory, fetchTests]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !isLoadingRef.current) {
          setCurrentPage(prev => prev + 1);
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore]);


  const categories = [
    { id: 'blood', backendId: 'Blood', icon: "/blood.png", title: t.categories.blood, count: stats['Blood'] || 0, color: "bg-[#0088FF]" },
    { id: 'cardio', backendId: 'Cardiology', icon: "/cardio.png", title: t.categories.cardio, count: stats['Cardiology'] || 0, color: "bg-[#00D084]" },
    { id: 'imaging', backendId: 'Imaging', icon: "/imaging.png", title: t.categories.imaging, count: stats['Imaging'] || 0, color: "bg-[#FF6B00]" },
    { id: 'pathology', backendId: 'Pathology', icon: "/path.png", title: t.categories.pathology, count: stats['Pathology'] || 0, color: "bg-slate-200" },
  ];


  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": language === 'bn' ? 'ডায়াগনস্টিক টেস্ট তালিকা' : 'Diagnostic Test List',
    "itemListElement": tests.map((test, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "item": {
        "@type": "Service",
        "name": getLocalizedValue(test.name, test.nameBn, language),
        "serviceType": "Diagnostic Test",
        "provider": {
          "@type": "MedicalOrganization",
          "name": "Meditime"
        },
        "offers": {
          "@type": "Offer",
          "price": test.price,
          "priceCurrency": "BDT"
        }
      }
    }))
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />

      {/* Cover Photo / Hero Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="relative h-[450px] md:h-[650px] w-full overflow-hidden"
      >
        <div
          className="absolute inset-0 bg-cover bg-[position:80%_center] lg:bg-center bg-no-repeat"
          style={{
            backgroundImage:
              "url('/hero/diagnostic.png')",
          }}
        />
        <div className="relative z-20 h-full flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 ">
          <div className="max-w-7xl mx-auto w-full text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <h1 className="text-2xl md:text-6xl lg:text-[50px] font-bold text-white mb-6 drop-shadow-2xl leading-tight">
                {t.heroTitle}
              </h1>
              <p className="text-[16px] md:text-xl text-white max-w-2xl mb-8">
                {t.heroSubtitle}
              </p>

              <div className="flex justify-center lg:justify-start mb-8">
                <Button onClick={() => setShowBookingsModal(true)}
                  className="gap-2 btn-primary btn-slide">
                  <Activity className="w-5 h-5" />
                  {language === 'en' ? 'My Booking History' : 'আমার বুকিং ইতিহাস'}
                  {myBookingsHistory.length > 0 && <span className="bg-white text-[#00B7B5] px-2 py-0.5 rounded-md text-xs ml-1 font-black">{myBookingsHistory.length}</span>}
                </Button>
              </div>
            </motion.div>



          </div>
        </div>
      </motion.div>

      {/* Category Cards Section */}
      <section className="pt-12 pb-12 relative overflow-hidden bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {categories.map((cat, idx) => {
              const Icon = cat.icon;
              const isSelected = selectedCategory === cat.backendId;
              return (
                <Card
                  key={idx}
                  onClick={() => setSelectedCategory(isSelected ? null : cat.backendId)}
                  className={`p-6 rounded-[2rem] border transition-all cursor-pointer flex flex-col items-center group ${isSelected ? 'border-[#00B7B5] ring-2 ring-[#00B7B5] bg-slate-50' : 'border-slate-100 hover:shadow-lg hover:border-slate-200'}`}
                >
                  <div className={`w-14 h-14`}>
                    <Image
                      src={cat.icon}
                      alt={cat.title}
                      width={50}
                      height={50}
                    />
                  </div>
                  <h3 className="font-bold text-slate-900 mb-1 text-sm md:text-base">{cat.title}</h3>
                  <p className="text-[10px] md:text-xs text-slate-500 font-medium">{cat.count} {t.testsPlus}</p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>


      <div className="relative max-w-3xl mx-auto mb-16">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t.searchPlaceholder}
          className="w-full h-16 pl-14 pr-4 bg-white border border-slate-200 rounded-2xl focus:border-[#00B7B5] focus:ring-4 focus:ring-[#00B7B5]/10 focus:outline-none transition-all shadow-sm text-lg"
        />
      </div>
      {/* Main Content Area */}
      <section className="pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-8">

            {/* Left Column (Tests List) */}
            <DiagnosticTestList
              ref={observerTarget}
              language={language}
              totalTests={totalTests}
              tests={tests}
              bookedTests={bookedTests}
              handleBooking={handleBooking}
              loading={loading}
              t={t}
            />

            {/* Right Column (Sidebar) */}
            <div className="lg:w-1/3 space-y-6">

              {/* Shopping Cart UI */}
              <DiagnosticCart
                bookedTests={bookedTests}
                language={language}
                handleBooking={handleBooking}
              />

              {/* Location Filters */}
              <DiagnosticLocationFilter
                language={language}

                selectedDivision={selectedDivision}
                selectedDistrict={selectedDistrict}
                selectedThana={selectedThana}
                setSelectedDivision={setSelectedDivision}
                setSelectedDistrict={setSelectedDistrict}
                setSelectedThana={setSelectedThana}
                handleDivisionSelect={handleDivisionSelect}
                handleDistrictSelect={handleDistrictSelect}
                handleThanaSelect={handleThanaSelect}
                divisions={divisions}
                districts={districts}
                thanas={thanas}
                filteredHospitals={filteredHospitals}
                selectedVenue={selectedVenue}
                setSelectedVenue={setSelectedVenue}
              />

              {/* Checkout Action */}
              {bookedTests.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`${selectedVenue ? 'bg-primary border-primary shadow-[#00B7B5]/20' : 'bg-slate-50 border-slate-200 shadow-slate-200/50'} rounded-3xl p-5 shadow-lg border flex flex-col gap-3 transition-colors duration-300`}
                >
                  <div className={selectedVenue ? "text-white" : "text-slate-600"}>
                    <p className="text-xs font-medium ">
                      {selectedVenue
                        ? (language === 'en' ? "Ready for Booking" : "বুকিং এর জন্য প্রস্তুত")
                        : (language === 'en' ? "Hospital Selection Required" : "হাসপাতাল নির্বাচন আবশ্যক")}
                    </p>
                    {selectedVenue ? (
                      <h2 className="text-sm font-bold truncate mt-1">{getLocalizedValue(selectedVenue.name, selectedVenue.nameBn, language)}</h2>
                    ) : (
                      <p className="text-xs font-bold text-red-500 mt-1 flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        {language === 'en' ? "Please select a hospital from above to proceed." : "এগিয়ে যেতে উপরের তালিকা থেকে একটি হাসপাতাল নির্বাচন করুন।"}
                      </p>
                    )}
                  </div>
                  <Button
                    onClick={() => router.push('/diagnostic/checkout')}
                    disabled={!selectedVenue}
                    className={`w-full font-bold rounded-xl h-11 border-none shadow-sm transition-all ${selectedVenue ? 'bg-white text-[#00B7B5] hover:bg-slate-50' : 'bg-slate-200 text-slate-400 opacity-70 cursor-not-allowed'}`}
                  >
                    {language === 'en' ? "Proceed to Checkout" : "চেকআউট করুন"}
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </motion.div>
              )}



            </div>

          </div>
        </div>
      </section>

      <Footer />

      {/* Bookings Modal */}
      <DiagnosticHistoryModal
        language={language}
        showBookingsModal={showBookingsModal}
        setShowBookingsModal={setShowBookingsModal}
        myBookingsHistory={myBookingsHistory}
        setMyBookingsHistory={setMyBookingsHistory}
      />
    </div>
  );
}
