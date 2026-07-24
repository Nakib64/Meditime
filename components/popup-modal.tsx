"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight, ArrowRight, Sparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";
import { usePathname } from "next/navigation";

interface OfferData {
  _id?: string;
  title: string;
  titleBn: string;
  description: string;
  descriptionBn: string;
  imageUrl: string;
  isActive: boolean;
  buttonText?: string;
  buttonTextBn?: string;
  buttonLink?: string;
}

export default function PopupModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [popupData, setPopupData] = useState<OfferData | null>(null);
  const pathname = usePathname();
  const { language } = useLanguage();

  useEffect(() => {
    // Only show popup on the home page
    if (pathname !== "/") return;

    // Check if the user has seen the popup in the last 1 hour
    const hasSeen = localStorage.getItem("hasSeenPopup");
    if (hasSeen) {
      try {
        const item = JSON.parse(hasSeen);
        if (item.expiry && Date.now() < item.expiry) {
          return;
        } else {
          localStorage.removeItem("hasSeenPopup");
        }
      } catch (e) {
        localStorage.removeItem("hasSeenPopup");
      }
    }

    const fetchPopup = async () => {
      try {
        const response = await fetch("/api/popup");
        const data = await response.json();

        if (data.success && data.popup && data.popup.isActive) {
          setPopupData(data.popup);
          // Standard responsive delay of 3 seconds
          setTimeout(() => setIsOpen(true), 3000);
        }
      } catch (error) {
        console.error("Error fetching popup offer:", error);
      }
    };

    fetchPopup();
  }, [pathname]);

  const handleClose = () => {
    setIsOpen(false);
    // Set popup seen status with 1-hour expiration timestamp
    const item = {
      value: "true",
      expiry: Date.now() + 60 * 60 * 1000, // 1 hour in milliseconds
    };
    localStorage.setItem("hasSeenPopup", JSON.stringify(item));
  };

  if (!popupData) return null;

  const currentTitle = language === 'bn' ? (popupData.titleBn || popupData.title || '') : (popupData.title || '');
  const currentDesc = language === 'bn' ? (popupData.descriptionBn || popupData.description || '') : (popupData.description || '');
  const currentBtnText = language === 'bn' 
    ? (popupData.buttonTextBn || 'বিস্তারিত জানুন') 
    : (popupData.buttonText || 'Learn More');
  const currentBtnLink = `/offer/${popupData._id}`;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
            className="relative w-full max-w-4xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh] md:max-h-[85vh] border border-slate-100"
          >
            {/* Close Button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 z-50 p-2.5 rounded-full bg-slate-100/90 hover:bg-slate-200 text-slate-600 hover:text-slate-900 border border-slate-200/50 shadow-md backdrop-blur-sm transition-all duration-200 hover:scale-105 active:scale-95"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Left Column: Image section */}
            <div className="w-full md:w-1/2 relative h-44 md:h-auto min-h-[160px] md:min-h-[480px] bg-slate-50 overflow-hidden">
              <Image
                src={popupData.imageUrl}
                alt={currentTitle}
                fill
                priority
                className="object-cover transition-transform duration-700 hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent md:bg-gradient-to-r md:from-black/10" />
            </div>

            {/* Right Column: Content Section */}
            <div className="w-full md:w-1/2 p-6 md:p-10 flex flex-col justify-between bg-white overflow-hidden">
              <div className="flex-1 flex flex-col min-h-0">
           
                {/* Offer Title */}
                <h2 className="text-xl md:text-2xl lg:text-3xl font-extrabold text-slate-900 leading-tight mb-3 tracking-tight">
                  {currentTitle}
                </h2>

                {/* Offer Description (Scrollable container to handle long text) */}
                <div className="text-slate-500 mb-6 text-sm md:text-base leading-relaxed overflow-y-auto max-h-[160px] md:max-h-[220px] pr-2 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                  <div
                    className="prose prose-sm max-w-none text-slate-600 [&>p]:mb-2 last:[&>p]:mb-0"
                    dangerouslySetInnerHTML={{ __html: currentDesc }}
                  />
                </div>
              </div>

              {/* Action Buttons Wrapper */}
              <div className="flex flex-col sm:flex-row gap-3 w-full mt-auto pt-4 border-t border-slate-100 shrink-0">
                <Link href={currentBtnLink} onClick={handleClose} className="inline-block w-full sm:w-1/2">
                  <button
                    className="btn-primary btn-slide flex items-center justify-center gap-2 w-full py-3.5 rounded-xl text-sm font-bold shadow-md shadow-primary/10 hover:shadow-primary/20 transition-all duration-300"
                  >
                    {currentBtnText}
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </Link>
                <Link href="/signup" onClick={handleClose} className="inline-block w-full sm:w-1/2">
                  <button
                    className="btn-primaryx btn-slidex flex items-center justify-center gap-2 w-full py-3.5 rounded-xl text-sm font-bold shadow-md shadow-primary/10 hover:shadow-primary/20 transition-all duration-300"
                  >
                    {language === 'en' ? 'Sign Up' : 'রেজিস্টার'}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}