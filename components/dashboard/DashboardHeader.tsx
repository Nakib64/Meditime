"use client";

import { Button } from "@/components/ui/button";
import { Activity, Trash2, Phone, Loader2 } from "lucide-react";

interface DashboardHeaderProps {
  language: "en" | "bn";
  user: any;
  myBookingsHistory: any[];
  isClearing: boolean;
  onShowBookings: () => void;
  onClearHistory: () => void;
}

export default function DashboardHeader({
  language,
  user,
  myBookingsHistory,
  isClearing,
  onShowBookings,
  onClearHistory,
}: DashboardHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="pl-10 lg:pl-0">
        <h1 className="text-3xl font-bold text-gray-900">
          {language === 'bn' ? 'আমার ড্যাশবোর্ড' : 'My Dashboard'}
        </h1>
        <p className="text-gray-600 mt-2">
          {language === 'bn' ? `স্বাগতম, ${user?.fullName}` : `Welcome, ${user?.fullName}`}
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button 
          onClick={onShowBookings} 
          className="bg-primary hover:bg-primary/90 text-white gap-2 rounded-xl shadow-lg transition-all py-6"
        >
          <Activity className="w-5 h-5" />
          <span className="hidden sm:inline">{language === 'bn' ? 'ডায়াগনস্টিক ইতিহাস' : 'Diagnostic History'}</span>
          <span className="sm:hidden">{language === 'bn' ? 'ইতিহাস' : 'History'}</span>
          {myBookingsHistory.length > 0 && (
            <span className="bg-white text-primary px-2 py-0.5 rounded-md text-xs ml-1 font-black">
              {myBookingsHistory.length}
            </span>
          )}
        </Button>

        <Button 
          onClick={onClearHistory}
          variant="outline"
          disabled={isClearing}
          className="border-red-100 text-red-500 hover:bg-red-50 gap-2 rounded-xl transition-all py-6"
        >
          {isClearing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
          {language === 'bn' ? 'ইতিহাস মুছুন' : 'Clear History'}
        </Button>

        <Button 
          onClick={() => window.open('https://wa.me/8801610385555', '_blank')}
          className="bg-[#25D366] hover:bg-[#128C7E] text-white gap-2 rounded-xl shadow-lg transition-all py-6"
        >
          <Phone className="w-5 h-5" />
          {language === 'bn' ? 'সাপোর্ট' : 'Support'}
        </Button>
      </div>
    </div>
  );
}
