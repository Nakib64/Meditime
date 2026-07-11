"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Search, X, MapPin, Building2, Phone, Mail, Users, ArrowRight } from "lucide-react";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage, getLocalizedValue } from "@/contexts/LanguageContext";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { homepageTranslations } from "@/lib/homepage-translations";
import { useRouter } from "next/navigation";
import PageLoader from "@/components/page-loader";

interface Hospital {
  _id: string;
  name: string;
  nameBn?: string;
  slug?: string;
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

type SortOption = "name" | "location";
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

export default function HospitalListPage() {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [thanas, setThanas] = useState<Thana[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);

  const [selectedDivision, setSelectedDivision] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedThana, setSelectedThana] = useState("");

  const [sortBy, setSortBy] = useState<SortOption>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const router = useRouter();
  const { language } = useLanguage();
  const t = homepageTranslations[language].hospitalsPage;

  const fetchHospitals = useCallback(async () => {
    try {
      const response = await fetch("/api/locations/hospitals?limit=100");
      const data = await response.json();
      if (response.ok) {
        setHospitals(data.hospitals);
      }
    } catch (error) {
      console.error("Error fetching hospitals:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDivisions = useCallback(async () => {
    try {
      const response = await fetch("/api/locations/divisions");
      const data = await response.json();
      if (response.ok) {
        setDivisions(data.divisions);
      }
    } catch (error) {
      console.error("Error fetching divisions:", error);
    }
  }, []);

  const fetchDistricts = useCallback(async (divisionName: string) => {
    try {
      const division = divisions.find(d => d.name === divisionName);
      if (!division) return;

      const response = await fetch(`/api/locations/districts?division=${division._id}`);
      const data = await response.json();
      if (response.ok) {
        setDistricts(data.districts);
      }
    } catch (error) {
      console.error("Error fetching districts:", error);
    }
  }, [divisions]);

  const fetchThanas = useCallback(async (districtName: string) => {
    try {
      const district = districts.find(d => d.name === districtName);
      if (!district) return;

      const response = await fetch(`/api/locations/thanas?district=${district._id}`);
      const data = await response.json();
      if (response.ok) {
        setThanas(data.thanas);
      }
    } catch (error) {
      console.error("Error fetching thanas:", error);
    }
  }, [districts]);

  useEffect(() => {
    fetchHospitals();
    fetchDivisions();
  }, [fetchHospitals, fetchDivisions]);

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

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const getHospitalLocationString = (hospital: Hospital): string => {
    const parts: string[] = [];

    // Division
    const divisionName = getLocalizedValue(
      hospital.thana?.district?.division?.name,
      hospital.thana?.district?.division?.nameBn,
      language
    );
    if (divisionName) parts.push(divisionName);

    // District
    const districtName = getLocalizedValue(
      hospital.thana?.district?.name,
      hospital.thana?.district?.nameBn,
      language
    );
    if (districtName) parts.push(districtName);

    // Thana
    const thanaName = getLocalizedValue(
      hospital.thana?.name,
      hospital.thana?.nameBn,
      language
    );
    if (thanaName) parts.push(thanaName);

    return parts.join(", ");
  };

  const suggestions = useMemo(() => {
    const trimmedQuery = searchQuery.trim().toLowerCase();
    if (!trimmedQuery || trimmedQuery.length < 1) return [];

    const results: Array<{ type: string; value: string; hospital?: Hospital }> = [];

    // Filter and Sort hospitals by relevance
    const matchingHospitals = hospitals
      .filter(hospital => {
        const name = (hospital.name || "").toLowerCase();
        const nameBn = (hospital.nameBn || "").toLowerCase();
        const address = (hospital.address || "").toLowerCase();
        const addressBn = (hospital.addressBn || "").toLowerCase();
        const location = getHospitalLocationString(hospital).toLowerCase();

        return (
          name.includes(trimmedQuery) ||
          nameBn.includes(trimmedQuery) ||
          address.includes(trimmedQuery) ||
          addressBn.includes(trimmedQuery) ||
          location.includes(trimmedQuery)
        );
      })
      .sort((a, b) => {
        const aName = (a.name || "").toLowerCase();
        const bName = (b.name || "").toLowerCase();
        const aNameBn = (a.nameBn || "").toLowerCase();
        const bNameBn = (b.nameBn || "").toLowerCase();

        // 1. Exact match name priority
        const aExact = aName === trimmedQuery || aNameBn === trimmedQuery;
        const bExact = bName === trimmedQuery || bNameBn === trimmedQuery;
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;

        // 2. Starts with name priority
        const aStarts = aName.startsWith(trimmedQuery) || aNameBn.startsWith(trimmedQuery);
        const bStarts = bName.startsWith(trimmedQuery) || bNameBn.startsWith(trimmedQuery);
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;

        // 3. Contains name priority
        const aContainsName = aName.includes(trimmedQuery) || aNameBn.includes(trimmedQuery);
        const bContainsName = bName.includes(trimmedQuery) || bNameBn.includes(trimmedQuery);
        if (aContainsName && !bContainsName) return -1;
        if (!aContainsName && bContainsName) return 1;

        // 4. Address/Location match priority
        const aLocation = getHospitalLocationString(a).toLowerCase();
        const bLocation = getHospitalLocationString(b).toLowerCase();
        const aAddr = (a.address || "").toLowerCase();
        const bAddr = (b.address || "").toLowerCase();
        const aAddrBn = (a.addressBn || "").toLowerCase();
        const bAddrBn = (b.addressBn || "").toLowerCase();

        const aAddrMatch = aAddr.includes(trimmedQuery) || aAddrBn.includes(trimmedQuery) || aLocation.includes(trimmedQuery);
        const bAddrMatch = bAddr.includes(trimmedQuery) || bAddrBn.includes(trimmedQuery) || bLocation.includes(trimmedQuery);

        if (aAddrMatch && !bAddrMatch) return -1;
        if (!aAddrMatch && bAddrMatch) return 1;

        // 5. Default Alphabetical
        return aName.localeCompare(bName);
      })
      .slice(0, 10);

    matchingHospitals.forEach(hospital => {
      const displayName = getLocalizedValue(hospital.name, hospital.nameBn, language);
      if (displayName && !results.some(r => r.value === displayName)) {
        results.push({
          type: language === 'bn' ? "হাসপাতাল" : "Hospital",
          value: displayName,
          hospital
        });
      }
    });

    return results;
  }, [searchQuery, hospitals, language, getHospitalLocationString]);



  const filteredAndSortedHospitals = useMemo(() => {
    let filtered = [...hospitals];

    // Removed restrictive language filter to show all hospitals

    if (debouncedSearchQuery) {
      const query = debouncedSearchQuery.toLowerCase();
      filtered = filtered.filter((hospital) => {
        const name = getLocalizedValue(hospital.name, hospital.nameBn, language);
        const address = getLocalizedValue(hospital.address, hospital.addressBn, language);
        const locationStr = getHospitalLocationString(hospital);

        // Also check against raw names and alternate language fields for better coverage
        const searchPool = [
          hospital.name,
          hospital.nameBn,
          hospital.address,
          hospital.addressBn,
          hospital.phone,
          hospital.email,
          locationStr,
          hospital.thana?.district?.division?.name,
          hospital.thana?.district?.division?.nameBn,
          hospital.thana?.district?.name,
          hospital.thana?.district?.nameBn,
          hospital.thana?.name,
          hospital.thana?.nameBn
        ].filter(Boolean).join(" ").toLowerCase();

        return searchPool.includes(query);
      });
    }

    if (selectedDivision) {
      filtered = filtered.filter(
        hospital => hospital.thana?.district?.division?.name === selectedDivision
      );
    }
    if (selectedDistrict) {
      filtered = filtered.filter(
        hospital => hospital.thana?.district?.name === selectedDistrict
      );
    }
    if (selectedThana) {
      filtered = filtered.filter(
        hospital => hospital.thana?.name === selectedThana
      );
    }

    filtered.sort((a, b) => {
      // Priority sorting based on search relevance when a query is present
      if (debouncedSearchQuery) {
        const query = debouncedSearchQuery.toLowerCase();
        const aName = (a.name || "").toLowerCase();
        const bName = (b.name || "").toLowerCase();
        const aNameBn = (a.nameBn || "").toLowerCase();
        const bNameBn = (b.nameBn || "").toLowerCase();

        // 1. Exact Name Match
        const aExact = aName === query || aNameBn === query;
        const bExact = bName === query || bNameBn === query;
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;

        // 2. Name Starts With Match
        const aStarts = aName.startsWith(query) || aNameBn.startsWith(query);
        const bStarts = bName.startsWith(query) || bNameBn.startsWith(query);
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;

        // 3. Name Contains Match
        const aContains = aName.includes(query) || aNameBn.includes(query);
        const bContains = bName.includes(query) || bNameBn.includes(query);
        if (aContains && !bContains) return -1;
        if (!aContains && bContains) return 1;

        // 4. Address/Location Match
        const aLocation = getHospitalLocationString(a).toLowerCase();
        const bLocation = getHospitalLocationString(b).toLowerCase();
        const aAddr = (a.address || "").toLowerCase();
        const bAddr = (b.address || "").toLowerCase();
        const aAddrBn = (a.addressBn || "").toLowerCase();
        const bAddrBn = (b.addressBn || "").toLowerCase();

        const aAddrMatch = aAddr.includes(query) || aAddrBn.includes(query) || aLocation.includes(query);
        const bAddrMatch = bAddr.includes(query) || bAddrBn.includes(query) || bLocation.includes(query);

        if (aAddrMatch && !bAddrMatch) return -1;
        if (!aAddrMatch && bAddrMatch) return 1;

        // If they are in the same relevance group, fall through to default sort logic
      }

      let aVal: string;
      let bVal: string;

      switch (sortBy) {
        case "name":
          aVal = (a.name || "").toLowerCase();
          bVal = (b.name || "").toLowerCase();
          break;
        case "location":
          aVal = getHospitalLocationString(a).toLowerCase();
          bVal = getHospitalLocationString(b).toLowerCase();
          break;
        default:
          return 0;
      }

      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [
    hospitals,
    debouncedSearchQuery,
    selectedDivision,
    selectedDistrict,
    selectedThana,
    sortBy,
    sortDirection,
    language,
  ]);

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedDivision("");
    setSelectedDistrict("");
    setSelectedThana("");
  };

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

  const hasActiveFilters = useMemo(() => {
    return selectedDivision || selectedDistrict || selectedThana;
  }, [selectedDivision, selectedDistrict, selectedThana]);

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
          className="absolute inset-0 bg-cover bg-[position:30%_center] lg:bg-center bg-no-repeat"
          style={{
            backgroundImage:
              "url('/hero/hospital.png')",
          }}
        />
        <div className="relative z-20 h-full flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 pb-20">
          <div className="max-w-7xl mx-auto w-full text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <h1 className="text-2xl md:text-6xl lg:text-[50px] font-bold text-white mb-6 drop-shadow-2xl leading-tight">
                {t.heroTitle}
              </h1>
              <p className="text-[16px] md:text-xl text-white/90 max-w-2xl mb-8 font-light">
                {language === 'bn' ? 'সাভারের কাছে বিভিন্ন লোকেশন, ২০+ স্পেশালিটি এবং ৫০+ হাসপাতাল থেকে ডাক্তার খুঁজে নিন।' : 'Find doctors near Savar from different locations, 20+ specialties, and 50+ hospitals.'}
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
          className="mb-16"
        >
          <div className="relative max-w-3xl mx-auto mt-2">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary to-blue-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
              <div className="relative bg-white rounded-2xl shadow-xl flex items-center px-2">
                <Search className="absolute left-4 md:left-6 top-1/2 transform -translate-y-1/2 text-primary h-5 w-5 md:h-6 md:w-6 z-10" />
                <Input
                  type="text"
                  placeholder={t.searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSuggestions(true);
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
                      if (suggestion.hospital) {
                        const slug = suggestion.hospital.slug || encodeURIComponent(suggestion.hospital.name);
                        router.push(`/hospital/${slug}`);
                      } else {
                        setSearchQuery(suggestion.value);
                      }
                      setShowSuggestions(false);
                    } else if (e.key === "Escape") {
                      setShowSuggestions(false);
                    }
                  }}
                  className="w-full pl-12 md:pl-14 pr-4 py-2.5 md:py-7 text-sm md:text-lg border-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent placeholder:text-gray-400"
                />
                <Button
                  onClick={() => setShowSuggestions(false)}
                  className="bg-primary hover:bg-primary-dark text-white flex items-center gap-2 rounded-xl px-4 md:px-8 py-6 text-sm md:text-lg font-medium transition-all shadow-lg hover:shadow-primary/30"
                >
                  <Search className="h-5 w-5" />
                  <span className="hidden md:inline">{language === 'bn' ? 'খুঁজুন' : 'Search'}</span>
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
                  {suggestions.map((suggestion, index) => (
                    <motion.div
                      key={`${suggestion.type}-${index}`}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`px-6 py-4 cursor-pointer hover:bg-gray-50 transition-colors ${index === focusedIndex ? "bg-gray-50" : ""
                        }`}
                      onClick={() => {
                        if (suggestion.hospital) {
                          const slug = suggestion.hospital.slug || encodeURIComponent(suggestion.hospital.name);
                          router.push(`/hospital/${slug}`);
                        } else {
                          setSearchQuery(suggestion.value);
                        }
                        setShowSuggestions(false);
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-bold text-gray-800 text-base">
                            {suggestion.value}
                          </div>
                          {suggestion.hospital && (
                            <div className="text-sm text-gray-500 mt-1">
                              {getHospitalLocationString(suggestion.hospital)}
                            </div>
                          )}
                        </div>
                        <span
                          className="text-xs text-primary bg-primary/10 px-3 py-1.5 rounded-full font-bold uppercase tracking-wider"
                        >
                          {suggestion.type}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Location Filters - Modern Design */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-8"
        >
          <Card className="p-6 md:p-8 bg-gradient-to-br from-primary/10 via-primary/5 to-white border-2 border-primary/20 shadow-xl">
            <div className="mb-6">
              <h2
                className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-3"

              >
                <div className="p-2 bg-primary/20 rounded-lg">
                  <MapPin className="h-6 w-6 text-primary" />
                </div>
                {t.findByLocation}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">


              <div>
                <Label
                  htmlFor="filter-division"
                  className="mb-3 block text-base font-semibold text-gray-700"

                >
                  {language === 'bn' ? '২. বিভাগ' : '2. Division'}
                </Label>
                <select
                  id="filter-division"
                  value={selectedDivision}
                  onChange={(e) => handleDivisionSelect(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-base bg-white shadow-sm hover:shadow-md transition-all"

                >
                  <option value="">{t.selectDivision}</option>
                  {divisions.map((div) => (
                    <option key={div._id} value={div.name}>
                      {div.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label
                  htmlFor="filter-district"
                  className="mb-3 block text-base font-semibold text-gray-700"

                >
                  {language === 'bn' ? '৩. জেলা' : '3. District'}
                </Label>
                <select
                  id="filter-district"
                  value={selectedDistrict}
                  onChange={(e) => handleDistrictSelect(e.target.value)}
                  disabled={!selectedDivision}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed text-base bg-white shadow-sm hover:shadow-md transition-all"

                >
                  <option value="">{selectedDivision ? t.selectDistrict : t.selectDivisionFirst}</option>
                  {districts.map((dist) => (
                    <option key={dist._id} value={dist.name}>
                      {dist.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label
                  htmlFor="filter-thana"
                  className="mb-3 block text-base font-semibold text-gray-700"

                >
                  {language === 'bn' ? '৪. উপজেলা/থানা' : '4. Thana'}
                </Label>
                <select
                  id="filter-thana"
                  value={selectedThana}
                  onChange={(e) => handleThanaSelect(e.target.value)}
                  disabled={!selectedDistrict || !selectedDivision}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed text-base bg-white shadow-sm hover:shadow-md transition-all"

                >
                  <option value="">{selectedDivision && selectedDistrict ? t.selectThana : t.selectDistrictFirst}</option>
                  {thanas.map((thana) => (
                    <option key={thana._id} value={thana.name}>
                      {thana.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {(selectedDivision || selectedDistrict || selectedThana) && (
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
                  }}
                  className="flex items-center gap-2 px-5 py-2.5"

                >
                  <X className="h-5 w-5" />
                  {t.reset}
                </Button>
              </motion.div>
            )}
          </Card>
        </motion.div>

        {/* Sort and Results Count */}


        {/* Hospital Cards Grid */}
        <AnimatePresence mode="wait">
          {filteredAndSortedHospitals.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="p-16 text-center shadow-xl bg-gradient-to-br from-gray-50 to-white">
                <Building2 className="h-24 w-24 mx-auto text-gray-300 mb-6" />
                <p
                  className="text-2xl font-semibold text-gray-600 mb-4"

                >
                  {t.noHospitals}
                </p>
                {hasActiveFilters && (
                  <Button
                    onClick={clearFilters}
                    variant="outline"
                    className="mt-4"

                  >
                    {t.clearFilters}
                  </Button>
                )}
              </Card>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAndSortedHospitals.map((hospital, index) => (
                <motion.div
                  key={hospital._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  whileHover={{ y: -5 }}
                >
                  <Link href={`/hospital/${encodeURIComponent(hospital?.slug || hospital.name)}`}>
                    <Card className="relative bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 h-full cursor-pointer group overflow-hidden">
                      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-blue-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
                      <div className="p-6 flex flex-col h-full">
                        {/* 1. Center the hospital icon */}
                        <div className="mb-4 flex justify-center"> {/* Changed to justify-center */}
                          <div className="p-3 bg-blue-50 text-primary rounded-xl shrink-0 group-hover:scale-110 transition-transform duration-300">
                            <Building2 className="h-6 w-6" />
                          </div>
                        </div>

                        <h3
                          className="text-xl font-bold text-gray-900 group-hover:text-primary transition-colors mb-3 leading-tight text-center"

                        >
                          {getLocalizedValue(hospital.name, hospital.nameBn, language)}
                        </h3>

                        {/* 2. MapPin moved to address */}
                        <div className="flex items-start gap-2 mb-4 flex-grow justify-center">
                          <MapPin className="h-4 w-4 text-gray-400 mt-1 shrink-0" />
                          {hospital.address ? (
                            <p
                              className="text-sm text-gray-500 leading-relaxed text-center"

                            >
                              {getLocalizedValue(hospital.address, hospital.addressBn, language)}
                            </p>
                          ) : (
                            <p className="text-sm text-gray-400 italic">ঠিকানা উপলব্ধ নয়</p>
                          )}
                        </div>

                        <div className="pt-4 border-t border-gray-100 mt-auto flex items-center justify-center text-sm font-medium">
                          <span className="text-primary flex items-center gap-2 group-hover:translate-x-1 transition-transform">
                            {/* 3. Button icon changed to ArrowRight */}
                            {t.viewDoctors} <ArrowRight className="w-4 h-4" />
                          </span>
                        </div>
                      </div>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>
      <Footer />
    </div>
  );
}
