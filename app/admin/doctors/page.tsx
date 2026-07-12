"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, Search, Loader2, Stethoscope, Globe } from "lucide-react";
import { showToast } from "@/lib/toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { t } from "@/lib/translations";
import { Input } from "@/components/ui/input";
import DoctorCard, { Doctor as DoctorType } from "@/components/doctor-card";

interface Hospital {
  _id: string;
  name: string;
  nameBn?: string;
}

const daysOfWeek = ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const banglaDaysFull = ["শনিবার", "রবিবার", "সোমবার", "মঙ্গলবার", "বুধবার", "বৃহস্পতিবার", "শুক্রবার"];

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<DoctorType[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 12;
  const { language: currentLanguage, setLanguage } = useLanguage();
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  

  const fetchHospitals = async () => {
    try {
      const response = await fetch("/api/locations/hospitals");
      const data = await response.json();
      if (response.ok && data.hospitals) {
        setHospitals(data.hospitals);
      }
    } catch (error) {
      console.error("Error fetching hospitals:", error);
    }
  };

  // Load initial hospitals list
  useEffect(() => {
    fetchHospitals();
  }, []);

  // Reset page to 1 whenever search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Fetch paginated and searched doctors with 150ms debounce and AbortController to prevent lag and race conditions
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);

    const timer = setTimeout(async () => {
      try {
        const params = new URLSearchParams();
        params.append("page", currentPage.toString());
        params.append("limit", limit.toString());
        
        const trimmedQuery = searchQuery.trim();
        if (trimmedQuery) {
          params.append("search", trimmedQuery);
        }
        
        const response = await fetch(`/api/doctors?${params.toString()}`, {
          signal: controller.signal,
        });
        const data = await response.json();
        
        if (response.ok) {
          setDoctors(data.doctors || []);
          setTotal(data.total || 0);
          setTotalPages(data.totalPages || 1);
        } else {
          showToast.error(data.error || "Failed to fetch doctors");
        }
      } catch (error: unknown) {
        if (error instanceof Error && error.name !== "AbortError") {
          console.error("Error fetching doctors:", error);
          showToast.error("Failed to fetch doctors");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
          setIsInitialLoad(false);
        }
      }
    }, 150);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [currentPage, searchQuery]);

  const handleDelete = async (id: string) => {
    if (!confirm(currentLanguage === 'bn' ? "আপনি কি নিশ্চিত যে আপনি এই ডিটেইলসটি মুছে ফেলতে চান?" : "Are you sure you want to delete this doctor profile?")) return;

    try {
      const response = await fetch(`/api/doctors/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setDoctors(doctors.filter((doctor) => doctor._id !== id));
        setTotal(prev => Math.max(0, prev - 1));
        showToast.success("Doctor deleted successfully");
      } else {
        const data = await response.json();
        showToast.error(data.error || "Failed to delete doctor");
      }
    } catch (error) {
      console.error("Error deleting doctor:", error);
      showToast.error("Failed to delete doctor");
    }
  };

  const filteredDoctors = doctors.filter(doctor => {
    return !!doctor.name || !!doctor.nameBn;
  });

  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }
    return pageNumbers;
  };

  if (loading && isInitialLoad) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-gray-500 font-medium">{t("loading", currentLanguage)}</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-12 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 border-b border-gray-100 pb-10">
        <div>
          <h1 className="text-5xl font-black text-gray-900 tracking-tight">
            {t("manageDoctors", currentLanguage)}
          </h1>
          <p className="text-gray-500 mt-3 text-xl font-medium">
            {currentLanguage === 'bn' ? `ডাক্তারদের প্রোফাইল এবং সিরিয়াল পরিচালনা করুন (${total} জন মোট)` : `Administrative control panel for medical professionals (${total} total)`}
          </p>
        </div>
        <Link href="/admin/doctors/create">
          <Button className="bg-primary hover:bg-primary/90 text-white px-10 py-8 text-2xl font-black rounded-[1.5rem] shadow-2xl shadow-primary/20 transition-all hover:scale-105 active:scale-95 border-none">
            <Plus className="h-7 w-7 mr-3 stroke-[3]" />
            {t("createDoctorProfile", currentLanguage)}
          </Button>
        </Link>
      </div>

      <div className="flex flex-col md:flex-row gap-6 items-center max-w-5xl mx-auto md:mx-0">
        <div className="relative group flex-1 w-full">
          <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
            {loading ? (
              <Loader2 className="h-6 w-6 text-primary animate-spin" />
            ) : (
              <Search className="h-6 w-6 text-gray-300 group-focus-within:text-primary transition-colors stroke-[2.5]" />
            )}
          </div>
          <Input
            type="text"
            placeholder={currentLanguage === 'bn' ? 'ডাক্তারের নাম বা বিশেষজ্ঞ দিয়ে খুঁজুন...' : 'Search by name or specialty...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-16 h-16 text-xl border-2 border-gray-100 rounded-[1.5rem] bg-white shadow-lg shadow-gray-100/50 focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all pr-6 font-bold placeholder:text-gray-300"
          />
        </div>

        <div className="relative w-full md:w-72">
           <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
             <Globe className="h-5 w-5 text-gray-400 stroke-[2.5]" />
           </div>
           <select 
             value={currentLanguage}
             onChange={(e) => setLanguage(e.target.value as any)}
             className="w-full h-16 pl-14 pr-10 text-lg border-2 border-gray-100 rounded-[1.5rem] bg-white shadow-lg shadow-gray-100/50 focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-bold appearance-none cursor-pointer"
           >
             <option value="en">{currentLanguage === 'bn' ? 'ইংরেজি' : 'English'}</option>
             <option value="bn">{currentLanguage === 'bn' ? 'বাংলা' : 'Bangla'}</option>
           </select>
           <div className="absolute inset-y-0 right-0 pr-5 flex items-center pointer-events-none">
             <div className="h-2 w-2 border-r-2 border-b-2 border-gray-400 rotate-45 mb-1" />
           </div>
        </div>
      </div>

      {filteredDoctors.length === 0 ? (
        <Card className="p-20 text-center border-dashed border-4 bg-gray-50/50 rounded-[2.5rem]">
          <div className="max-w-md mx-auto space-y-6">
            <div className="bg-white p-8 rounded-full w-28 h-28 flex items-center justify-center mx-auto shadow-md">
              <Stethoscope className="h-14 w-14 text-gray-200" />
            </div>
            <p className="text-gray-500 text-2xl font-black tracking-tight">
              {doctors.length === 0 ? t("noDoctors", currentLanguage) : (currentLanguage === 'bn' ? 'কোনো ডাক্তার পাওয়া যায়নি' : 'No doctors match your search')}
            </p>
            {doctors.length === 0 && (
              <Link href="/admin/doctors/create">
                <Button className="bg-primary text-white h-16 px-10 text-xl font-black rounded-2xl shadow-xl shadow-primary/10">
                  <Plus className="h-6 w-6 mr-2" />
                  {t("createFirstDoctor", currentLanguage)}
                </Button>
              </Link>
            )}
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDoctors.map((doctor) => {
            return (
              <DoctorCard 
                key={doctor._id} 
                doctor={doctor} 
                disableLink={true}
                language={currentLanguage}
                actions={
                  <>
                    <Link href={`/admin/doctors/edit/${doctor._id}`} className="flex-1">
                      <Button variant="ghost" className="w-full h-10 font-bold text-gray-600 hover:text-primary hover:bg-primary/5 rounded-xl transition-all border border-gray-100">
                        <Edit className="h-4 w-4 mr-2" />
                        {t("edit", currentLanguage)}
                      </Button>
                    </Link>
                    <Button 
                      variant="ghost" 
                      className="flex-1 h-10 font-bold text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all border border-gray-100"
                      onClick={() => handleDelete(doctor._id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      {t("delete", currentLanguage)}
                    </Button>
                  </>
                }
              />
            );
          })}
        </div>
      )}

      {/* Pagination UI */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 pt-8 pb-12">
          <Button
            variant="outline"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="h-12 w-12 rounded-xl border-2 font-bold"
          >
            {"<"}
          </Button>

          {getPageNumbers().map(pageNum => (
            <Button
              key={pageNum}
              variant={currentPage === pageNum ? "default" : "outline"}
              onClick={() => setCurrentPage(pageNum)}
              className={`h-12 w-12 rounded-xl border-2 font-bold transition-all ${
                currentPage === pageNum 
                ? "bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-110" 
                : "hover:border-primary hover:text-primary"
              }`}
            >
              {pageNum}
            </Button>
          ))}

          <Button
            variant="outline"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="h-12 w-12 rounded-xl border-2 font-bold"
          >
            {">"}
          </Button>
        </div>
      )}
    </div>
  );
}
