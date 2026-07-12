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
  designation?: string;
  designationBn?: string;
  qualification?: string;
  qualificationBn?: string;
}



export default function SearchSection() {
  const { language } = useLanguage();
  const t = homepageTranslations[language].search;
  const router = useRouter();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const abortRef = useRef<AbortController | null>(null);
  const cacheRef = useRef<Record<string, Doctor[]>>({});

  // Fetch suggestions with local cache and a responsive 150ms debounce
  useEffect(() => {
    const q = searchQuery.trim();
    if (!q || q.length < 1) {
      // Clear instantly without waiting for debounce
      setDoctors([]);
      return;
    }

    const cacheKey = q.toLowerCase();
    if (cacheRef.current[cacheKey]) {
      // Instant cache hit
      setDoctors(cacheRef.current[cacheKey]);
      return;
    }

    // Abort any previous in-flight request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    // 150ms debounce: reduces server load but feels lightning fast
    const timer = setTimeout(() => {
      const fetchSuggestions = async () => {
        try {
          const docsRes = await fetch(`/api/doctors?search=${encodeURIComponent(q)}&limit=20&suggestions=true`, { signal: controller.signal });

          let docs: Doctor[] = [];

          if (docsRes.ok) {
            const docsData = await docsRes.json();
            docs = docsData.doctors || [];
            setDoctors(docs);
          }

          // Cache the response
          if (docsRes.ok) {
            cacheRef.current[cacheKey] = docs;
          }
        } catch (err: unknown) {
          if (err instanceof Error && err.name !== "AbortError") {
            console.error("Error fetching suggestions:", err);
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

  const suggestions = useMemo(() => {
    if (!searchQuery || searchQuery.length < 1) return [];
    const query = searchQuery.toLowerCase().trim();
    const queryClean = query.replace(/[\s.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");
    if (!queryClean) return [];

    interface ScoredSuggestion {
      type: string;
      typeBn: string;
      value: string;
      doctor?: Doctor;
      link: string;
      score: number;
    }

    const results: ScoredSuggestion[] = [];
    const cleanField = (str: string | undefined) => (str || '').toLowerCase().replace(/[\s.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");

    doctors.forEach((doctor) => {
      const nameLower = (doctor.name || '').toLowerCase();
      const nameBnLower = (doctor.nameBn || '').toLowerCase();
      const specialtyLower = (doctor.specialty || '').toLowerCase();
      const specialtyBnLower = (doctor.specialtyBn || '').toLowerCase();
      const deptLower = (doctor.department || '').toLowerCase();
      const hospLower = (doctor.hospital || '').toLowerCase();
      const desigLower = (doctor.designation || '').toLowerCase();
      const qualifLower = (doctor.qualification || '').toLowerCase();

      const nameClean = cleanField(doctor.name);
      const nameBnClean = cleanField(doctor.nameBn);
      const specialtyClean = cleanField(doctor.specialty);
      const specialtyBnClean = cleanField(doctor.specialtyBn);
      const deptClean = cleanField(doctor.department);
      const hospClean = cleanField(doctor.hospital);
      const desigClean = cleanField(doctor.designation);
      const qualifClean = cleanField(doctor.qualification);

      let score = 0;
      if (nameLower === query || nameClean === queryClean) score += 100; // exact match
      else if (nameLower.startsWith(query) || nameClean.startsWith(queryClean)) score += 80;  // starts with
      else if (nameLower.includes(query) || nameClean.includes(queryClean)) score += 60;  // contains
      if (nameBnLower.includes(query) || nameBnClean.includes(queryClean)) score += 50;  // Bangla name
      if (specialtyLower.includes(query) || specialtyClean.includes(queryClean) || specialtyBnLower.includes(query) || specialtyBnClean.includes(queryClean)) score += 30;
      if (deptLower.includes(query) || deptClean.includes(queryClean)) score += 20;
      if (hospLower.includes(query) || hospClean.includes(queryClean)) score += 20;
      if (desigLower.includes(query) || desigClean.includes(queryClean)) score += 10;
      if (qualifLower.includes(query) || qualifClean.includes(queryClean)) score += 10;

      results.push({
        type: "Doctor", typeBn: "ডাক্তার",
        value: language === 'bn' ? (doctor.nameBn || doctor.name || '') : (doctor.name || ''),
        doctor,
        link: `/doctor/${(language === 'bn' ? (doctor.slugBn || doctor.slug) : (doctor.slug || doctor.slugBn)) || doctor._id}`,
        score,
      });
    });

    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, 20);
  }, [searchQuery, doctors, language]);

  const handleSearch = () => {
    if (searchQuery.trim()) {
      router.push(`/doctor?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleSuggestionClick = (suggestion: {
    type: string;
    value: string;
    doctor?: Doctor;
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
                            {language === 'bn' ? (suggestion.doctor.specialtyBn || "") : (suggestion.doctor.specialty || "")}
                          </div>
                        )}
                      </div>
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