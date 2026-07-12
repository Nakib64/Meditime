"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";
import { homepageTranslations } from "@/lib/homepage-translations";

interface Doctor {
  _id: string;
  name: string;
  nameBn?: string;
  slug?: string;
  slugBn?: string;
  specialty?: string;
  specialtyBn?: string;
  department?: string;
  departmentBn?: string;
  hospital?: string;
  hospitalBn?: string;
}

interface Hospital {
  _id: string;
  name: string;
  nameBn?: string;
  slug?: string;
}

export default function SearchSection() {
  const { language } = useLanguage();
  const t = homepageTranslations[language].search;
  const router = useRouter();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const abortRef = useRef<AbortController | null>(null);

  // Instant fetch with AbortController — cancels stale in-flight requests on each keystroke
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 1) {
      setDoctors([]);
      setHospitals([]);
      return;
    }

    // Abort any previous in-flight request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const fetchSuggestions = async () => {
      const q = searchQuery.trim();
      try {
        const [docsRes, hospRes] = await Promise.all([
          fetch(`/api/doctors?search=${encodeURIComponent(q)}&limit=20`, { signal: controller.signal }),
          fetch(`/api/locations/hospitals?search=${encodeURIComponent(q)}&limit=20`, { signal: controller.signal })
        ]);

        if (docsRes.ok) {
          const docsData = await docsRes.json();
          setDoctors(docsData.doctors || []);
        }
        if (hospRes.ok) {
          const hospData = await hospRes.json();
          setHospitals(hospData.hospitals || []);
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name !== "AbortError")
          console.error("Error fetching suggestions:", err);
      }
    };

    fetchSuggestions();
    return () => controller.abort();
  }, [searchQuery]);

  // Build suggestions from already-fetched (API-filtered) doctors & hospitals.
  // All returned results are relevant — we just score + sort them for ranking,
  // then always show up to 20 regardless of score.
  const suggestions = useMemo(() => {
    if (!searchQuery || searchQuery.length < 1) return [];
    const query = searchQuery.toLowerCase().trim();

    interface ScoredSuggestion {
      type: string;
      typeBn: string;
      value: string;
      doctor?: Doctor;
      hospital?: Hospital;
      link: string;
      score: number;
    }

    const results: ScoredSuggestion[] = [];
    const seenSpecialties = new Set<string>();

    // 1. Doctors — always include all (API already filtered for relevance)
    doctors.forEach((doctor) => {
      const name        = (doctor.name      || "").toLowerCase();
      const nameBn      = (doctor.nameBn    || "").toLowerCase();
      const specialty   = (doctor.specialty || "").toLowerCase();
      const specialtyBn = (doctor.specialtyBn || "").toLowerCase();
      const dept        = (doctor.department || "").toLowerCase();
      const hosp        = (doctor.hospital   || "").toLowerCase();

      // Scoring (for ordering only)
      let score = 1; // baseline — every fetched doctor is included
      if (name === query || nameBn === query)                         score = 100;
      else if (name.startsWith(query) || nameBn.startsWith(query))  score = 80;
      else if (name.includes(query)   || nameBn.includes(query))    score = 60;
      else if (specialty.includes(query) || specialtyBn.includes(query)) score = 40;
      else if (dept.includes(query) || hosp.includes(query))        score = 20;

      // Add a deduplicated specialty row when specialty is the primary match
      if ((specialty.includes(query) || specialtyBn.includes(query)) && score < 60) {
        const specKey = specialty;
        if (!seenSpecialties.has(specKey)) {
          seenSpecialties.add(specKey);
          results.push({
            type: "Specialty", typeBn: "বিশেষত্ব",
            value: language === 'bn' ? (doctor.specialtyBn || doctor.specialty || "") : (doctor.specialty || ""),
            link: `/doctor?search=${encodeURIComponent(doctor.specialty || "")}`,
            score: score + 5,
          });
        }
      }

      results.push({
        type: "Doctor", typeBn: "ডাক্তার",
        value: language === 'bn' ? (doctor.nameBn || doctor.name || '') : (doctor.name || ''),
        doctor,
        link: `/doctor/${(language === 'bn' ? (doctor.slugBn || doctor.slug) : (doctor.slug || doctor.slugBn)) || doctor._id}`,
        score,
      });
    });

    // 2. Hospitals — always include all
    const seenHospitals = new Set<string>();
    hospitals.forEach((hospital) => {
      if (seenHospitals.has(hospital._id)) return;
      seenHospitals.add(hospital._id);

      const name   = (hospital.name   || "").toLowerCase();
      const nameBn = (hospital.nameBn || "").toLowerCase();

      let score = 1;
      if (name === query || nameBn === query)                         score = 95;
      else if (name.startsWith(query) || nameBn.startsWith(query))  score = 75;
      else if (name.includes(query)   || nameBn.includes(query))    score = 55;

      results.push({
        type: "Hospital", typeBn: "হাসপাতাল",
        value: language === 'bn' ? (hospital.nameBn || hospital.name || '') : (hospital.name || ''),
        hospital,
        link: `/hospital/${hospital.slug || encodeURIComponent(hospital.name)}`,
        score,
      });
    });

    return results
      .sort((a, b) => b.score !== a.score ? b.score - a.score : a.type.localeCompare(b.type))
      .slice(0, 20);
  }, [searchQuery, doctors, hospitals, language]);

  const handleSearch = () => {
    if (searchQuery.trim()) {
      router.push(`/doctor?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleSuggestionClick = (suggestion: {
    type: string;
    value: string;
    doctor?: Doctor;
    hospital?: Hospital;
    link?: string;
  }) => {
    if (suggestion.link) {
      router.push(suggestion.link);
      setShowSuggestions(false);
    } else {
      router.push(`/doctor?search=${encodeURIComponent(suggestion.value)}`);
      setShowSuggestions(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
      <div
        id="search-section"
        className="sticky top-20 left-0 right-0 z-40 transition-all duration-300 mt-4 mb-4 md:mb-6"
      >
        <div className="relative">
          {/* Pill container — matches Figma exactly */}
          <div className="flex items-center bg-white border border-gray-200 rounded-2xl shadow-md px-3 sm:px-5 py-2 gap-2 sm:gap-3 focus-within:border-primary focus-within:shadow-lg transition-all">
            <Search className="text-gray-400 h-5 w-5 shrink-0" />
            <Input
              type="text"
              placeholder={t.placeholder}
              value={searchQuery}
              onChange={(e) => {
                const val = e.target.value;
                setSearchQuery(val);
                setShowSuggestions(val.trim().length > 0);
                setFocusedIndex(-1);
              }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setFocusedIndex((prev) => prev < suggestions.length - 1 ? prev + 1 : prev);
                } else if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setFocusedIndex((prev) => (prev > 0 ? prev - 1 : -1));
                } else if (e.key === "Enter") {
                  e.preventDefault();
                  if (focusedIndex >= 0 && suggestions[focusedIndex]) {
                    handleSuggestionClick(suggestions[focusedIndex]);
                  } else {
                    handleSearch();
                  }
                } else if (e.key === "Escape") {
                  setShowSuggestions(false);
                }
              }}
              className="flex-1 border-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-auto text-base text-gray-700 placeholder:text-gray-400 bg-transparent"

            />
            {/* Teal embedded button */}
            <button
              onClick={handleSearch}
              className="shrink-0  btn-primary btn-slide text-xs sm:text-sm font-semibold rounded-xl"

            >
              {t.button}
            </button>
          </div>

          {/* Suggestions dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-2xl z-50 max-h-96 overflow-y-auto transition-all duration-200">
              {suggestions.map((suggestion, index) => {
                const content = (
                  <div
                    className={`px-5 py-4 cursor-pointer hover:bg-primary/5 transition-colors border-b border-gray-100 last:border-b-0 ${index === focusedIndex ? "bg-primary/10" : ""
                      }`}
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div
                          className="font-semibold text-gray-900 text-base"

                        >
                          {suggestion.value}
                        </div>
                        {suggestion.doctor && (
                          <div
                            className="text-sm text-gray-500 mt-1"

                          >
                            {language === 'bn' ? suggestion.doctor.specialtyBn && suggestion.doctor.specialtyBn : suggestion.doctor.specialty}
                          </div>
                        )}
                        {suggestion.hospital && (
                          <div
                            className="text-sm text-gray-500 mt-1"
                          >
                            {language === 'bn' ? suggestion.hospital.nameBn && suggestion.hospital.nameBn : suggestion.hospital.name}                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   
                          </div>
                        )}
                      </div>
                      <span
                        className="text-xs text-primary bg-primary/10 px-3 py-1.5 rounded-full font-semibold"

                      >
                        {suggestion.type === "Doctor"
                          ? t.doctorTag
                          : suggestion.type === "Specialty"
                            ? t.specialtyTag
                            : suggestion.type === "Hospital"
                              ? t.hospitalTag
                              : suggestion.type}
                      </span>
                    </div>
                  </div>
                );

                return suggestion.link ? (
                  <Link key={`${suggestion.type}-${index}`} href={suggestion.link}>
                    {content}
                  </Link>
                ) : (
                  <div key={`${suggestion.type}-${index}`}>{content}</div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}