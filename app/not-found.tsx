"use client";

import Link from "next/link";
import { Home, Stethoscope, FileText, ArrowLeft, PhoneCall } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-sky-50 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decorative Glowing Blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-sky-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse pointer-events-none" />

      <div className="max-w-2xl w-full text-center space-y-10 p-8 sm:p-12 glass rounded-[2.5rem] shadow-2xl border border-white/60 relative z-10 animate-in fade-in zoom-in duration-500">

        {/* Animated Medical SVG Illustration */}
        <div className="flex justify-center">
          <div className="relative">
            {/* Pulsing circle background */}
            <div className="absolute inset-0 bg-primary/10 rounded-full scale-150 animate-ping opacity-25" />

            <div className="relative bg-white/80 p-8 rounded-full shadow-lg border border-primary/20 flex items-center justify-center">
              <svg
                className="w-24 h-24 text-primary animate-pulse"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {/* Stethoscope head */}
                <path d="M4.5 16.5c-1.5 1.5-2.5 3.5-2.5 5.5" />
                <path d="M12 2v3" />
                {/* Heartbeat pulse forming a 404 shape or question mark */}
                <path d="M3 12h3l2-5 3 10 2-7 1 3h7" />
                {/* Question mark doctor head */}
                <circle cx="12" cy="5" r="3" />
              </svg>
            </div>
          </div>
        </div>

        {/* Brand Text */}
        <div className="space-y-4">
          <div className="inline-block px-4 py-1.5 bg-primary/10 text-primary-dark font-bold text-sm rounded-full tracking-wide uppercase">
            Medi Time • ৪MD
          </div>

          <h1 className="text-7xl sm:text-8xl font-black text-primary tracking-tighter drop-shadow-md select-none">
            404
          </h1>

          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              দুঃখিত, পাতাটি খুঁজে পাওয়া যায়নি!
            </h2>
            <h3 className="text-lg sm:text-xl font-medium text-gray-500">
              Oops! The page you are looking for does not exist.
            </h3>
          </div>

          <p className="text-sm sm:text-base text-gray-600 max-w-md mx-auto leading-relaxed">
            হতে পারে লিংকটিতে কোনো ভুল রয়েছে অথবা পাতাটি সরিয়ে ফেলা হয়েছে। নিচের লিংকগুলো ব্যবহার করে আবার চেষ্টা করুন।
          </p>
        </div>

        {/* Actions Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
          <Link
            href="/"
            className={cn(
              buttonVariants({ variant: "default" }),
              "h-14 rounded-2xl text-base font-bold shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
            )}
          >
            <Home className="h-5 w-5" />
            হোম পেজ (Home)
          </Link>

          <Link
            href="/doctor"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "h-14 rounded-2xl text-base font-bold border-2 hover:bg-primary/5 hover:text-primary transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
            )}
          >
            <Stethoscope className="h-5 w-5 text-primary" />
            ডাক্তার (Doctors)
          </Link>

          <Link
            href="/diagnostic"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "h-14 rounded-2xl text-base font-bold border-2 hover:bg-primary/5 hover:text-primary transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
            )}
          >
            <FileText className="h-5 w-5 text-primary" />
            টেস্ট (Diagnostic)
          </Link>
        </div>

        {/* Go Back & Support */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-gray-100">
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-primary transition-colors cursor-pointer group"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            পূর্ববর্তী পেজে ফিরে যান (Go Back)
          </button>

          <a
            href="tel:+01610384444"
            className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-primary transition-colors"
          >
            <PhoneCall className="h-4 w-4" />
            সহায়তার জন্য কল করুন: ০১৬১০৩৮৫৫৫৫
          </a>
        </div>

      </div>
    </div>
  );
}
