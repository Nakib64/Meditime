"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ChevronRight, ArrowUpRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useLanguage, getLocalizedValue } from "@/contexts/LanguageContext";
import { homepageTranslations } from "@/lib/homepage-translations";

interface Hospital {
  slug: any;
  addressBn: string | null | undefined;
  address: string | null | undefined;
  _id: string;
  name: string;
  nameBn?: string;
  location?: string;
  photo?: string;
  thana?: { name: string; nameBn?: string };
}

function HospitalCardImage({ src, alt, fallback }: { src: string; alt: string; fallback: string }) {
  const [imgSrc, setImgSrc] = useState(src);

  useEffect(() => {
    setImgSrc(src);
  }, [src]);

  return (
    <Image
      src={imgSrc}
      alt={alt}
      fill
      className="object-cover transition-transform duration-700 group-hover:scale-110 opacity-50"
      onError={() => setImgSrc(fallback)}
    />
  );
}

export default function HospitalPartnersSection() {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);
  const { language } = useLanguage();
  const t = homepageTranslations[language].partners;

  useEffect(() => {
    const fetchHospitals = async () => {
      try {
        const response = await fetch("/api/locations/hospitals");
        const data = await response.json();
        console.log(data);
        if (response.ok) {
          setHospitals(data.hospitals);
        }
      } catch (error) {
        console.error("Error fetching hospitals:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchHospitals();
  }, []);

  if (loading) {
    return (
      <div className="w-full py-16 bg-white flex justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full bg-[var(--background-dark)] py-10 overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* ── Header ── */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl sm:text-4xl text-white font-bold mb-3  tracking-tight leading-snug ">
              {t.title}
            </h2>
            <div className="w-20 h-1.5 bg-primary mx-auto mb-6 shadow-[0_0_15px_rgba(13,148,136,0.5)]" />
            <p className=" text-sm sm:text-lg text-white/90 max-w-xl mx-auto leading-relaxed font-medium">
              {t.subtitle}
            </p>
          </motion.div>
        </div>

        {/* ── Marquee Slider ── */}
        <div className="relative w-full overflow-hidden py-10">
          <div className="animate-marquee2 flex gap-8">
            {hospitals.map((hospital, idx) => {
              const medicalPlaceholders = [
               '/Hospital.png'
              ];
              const placeholder = medicalPlaceholders[idx % medicalPlaceholders.length] + "?auto=format&fit=crop&w=800&q=80";
              const staticFallback = "/Hospital.png";

              return (
                <Link
                  key={`${hospital._id}-${idx}`}
                  href={`/hospital/${hospital.slug}`}
                  className="group relative w-[320px] h-[450px] shrink-0 overflow-hidden rounded-3xl border border-white/10 shadow-2xl"
                >
                  {/* Hospital Photo Cover with Fallback Logic */}
                  <HospitalCardImage 
                    src={'/Hospital.png'} 
                    alt={hospital.name} 
                    fallback={staticFallback} 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent transition-opacity duration-300 group-hover:opacity-90" />
                  <div className="absolute bottom-6 left-6 right-6">
                    <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-5 transition-all duration-300 group-hover:bg-white/20 group-hover:-translate-y-2">
                      <h3 className="text-white font-bold text-[19px] leading-tight mb-1">
                        {getLocalizedValue(hospital.name, hospital.nameBn, language)}
                      </h3>
                      <p className="text-white/70 text-[13px] font-medium flex items-center gap-1">
                        {getLocalizedValue(
                          hospital.address,
                          hospital.addressBn,
                          language
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="absolute inset-0 border-2 border-primary/0 group-hover:border-primary/50 transition-all duration-500 rounded-3xl pointer-events-none" />
                </Link>
              );
            })}
          </div>
        </div>

        {/* ── Bottom CTA ── */}
        <div className="mt-16 flex justify-center">
          <Link href="/hospital" className="btn-slide btn-primary px-10 py-4 rounded-none font-bold uppercase tracking-widest text-[13px] shadow-xl">
            <span className="relative z-10 flex items-center gap-2">
              {t.viewAll}
              <ChevronRight className="w-4 h-4" />
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
