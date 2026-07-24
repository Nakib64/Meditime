"use client";

import { useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Loader2 } from "lucide-react";
import Link from "next/link";
import AppointmentCard from "./AppointmentCard";
import { Appointment } from "@/types/appointment";

interface AppointmentListProps {
  language: "en" | "bn";
  appointments: Appointment[];
  loading: boolean;
  filter: string;
  setFilter: (f: string) => void;
  cancellingId: string | null;
  onCancel: (id: string) => void;
  formatDate: (date: string) => string;
  formatTime: (time?: string) => string;
}

export default function AppointmentList({
  language,
  appointments,
  loading,
  filter,
  setFilter,
  cancellingId,
  onCancel,
  formatDate,
  formatTime,
}: AppointmentListProps) {
  useEffect(() => {
    console.log("Appointments in Dashboard List:", appointments);
  }, [appointments]);
  
  const filters = ['all', 'pending', 'confirmed', 'completed', 'cancelled'];
  
  const getFilterLabel = (f: string) => {
    if (f === 'all') return language === 'bn' ? 'সব' : 'All';
    if (f === 'pending') return language === 'bn' ? 'অপেক্ষমান' : 'Pending';
    if (f === 'confirmed') return language === 'bn' ? 'নিশ্চিত' : 'Confirmed';
    if (f === 'completed') return language === 'bn' ? 'সম্পন্ন' : 'Completed';
    return language === 'bn' ? 'বাতিল' : 'Cancelled';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          {language === 'bn' ? 'আমার অ্যাপয়েন্টমেন্টসমূহ' : 'My Appointments'}
        </h2>
        
        <div className="flex flex-wrap gap-1.5 md:gap-2">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-2.5 py-1.5 md:px-3 md:py-1.5 rounded-lg text-[10px] md:text-xs font-bold transition-all ${
                filter === f 
                  ? 'bg-primary text-white shadow-md' 
                  : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-100'
              }`}
            >
              {getFilterLabel(f)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : appointments.length === 0 ? (
        <Card className="p-8 md:p-12 text-center border-dashed border-2">
          <Calendar className="h-10 w-10 md:h-12 md:w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-sm md:text-base text-gray-500 mb-6">
            {language === 'bn' ? 'কোন অ্যাপয়েন্টমেন্ট পাওয়া যায়নি' : 'No appointments found'}
          </p>
          <Link href="/doctor">
            <Button className="rounded-xl">
              {language === 'bn' ? 'নতুন অ্যাপয়েন্টমেন্ট করুন' : 'Book New Appointment'}
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 mb-10">
          {appointments.map((appointment) => (
            <AppointmentCard
              key={appointment._id}
              appointment={appointment}
              language={language}
              cancellingId={cancellingId}
              onCancel={onCancel}
              formatDate={formatDate}
              formatTime={formatTime}
            />
          ))}
        </div>
      )}
    </div>
  );
}
