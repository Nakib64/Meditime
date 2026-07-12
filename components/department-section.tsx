"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import Link from "next/link";
import { ChevronRight, ArrowUpRight } from "lucide-react";
import { useLanguage, getLocalizedValue } from "@/contexts/LanguageContext";
import { homepageTranslations } from "@/lib/homepage-translations";

interface Department {
  _id: string;
  name: string;
  nameBn?: string;
  image?: string;
}

/* ─── Icon Matcher for PNGs ────────────────────────────────────────────────── */

const DEPT_ICONS = [
  "Burn-Plastic & Reconstructive Surgery.png",
  "Cardiology & Medicine.png",
  "Chest Thoracic Surgery.png",
  "Dermatology & Venereology.png",
  "Diabetes  Endocrinology.png",
  "ENT-Ear Nose & Throat.png",
  "Gastro-Liver Diseases.png",
  "General & Laparoscopic Surgery.png",
  "Gynecology & Obstetrics.png",
  "Hematology & Medicine (Blood diseases).png",
  "Hepato-Biliary & Liver Transplant Surgery.png",
  "Medicine Specialist.png",
  "Neonatal & Pediatrics.png",
  "Nephrology & Medicine.png",
  "Neuromedicine & Neurosurgery.png",
  "Nuclear Medicine.png",
  "Nutrition & Dietetics.png",
  "Oncology Cancer).png",
  "Ophthalmology.png",
  "Oral & Dental Diseases.png",
  "Pain Medicine & Rheumatology .png",
  "Physiotherapy.png",
  "Psychiatry & Psychotherapy.png",
  "Pulmonology & Asthma.png",
  "Thyroid & Hormone .png",
  "Trauma & Orthopedic Surgery.png",
  "Urology & Nephrology.png",
  "Vascular Surgery (Blood vessels).png"
];

const getIconPath = (name: string): string => {
  const n = name.toLowerCase();
  
  // Try exact or partial match
  const match = DEPT_ICONS.find(icon => {
    const iconBase = icon.toLowerCase().replace(".png", "");
    return n.includes(iconBase) || iconBase.includes(n);
  });
  
  if (match) return `/icon_of_dept/${encodeURIComponent(match)}`;

  // Try matching individual words (longer than 3 chars)
  const words = n.split(/[\s&/-]+/).filter(w => w.length > 3);
  const wordMatch = DEPT_ICONS.find(icon => {
    const iconLow = icon.toLowerCase();
    return words.some(word => iconLow.includes(word));
  });

  // Default placeholder if no match found
  return wordMatch ? `/icon_of_dept/${encodeURIComponent(wordMatch)}` : "/icon_of_dept/Medicine Specialist.png";
};

/* ════════════════════════════════════════════════════════════════════════════
   Component
════════════════════════════════════════════════════════════════════════════ */

export default function DepartmentSection() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const { language } = useLanguage();
  const t = homepageTranslations[language].departments;

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const res = await fetch("/api/departments");
        const data = await res.json();
        if (res.ok) setDepartments(data.departments);
      } catch (err) {
        console.error("Error fetching departments:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDepartments();
  }, []);

  if (loading) {
    return (
      <div className="w-full py-16 bg-white flex justify-center ">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full px-0 sm:px-6 lg:px-0 py-12 sm:py-20 bg-[var(--background-dark)] overflow-hidden  mx-auto rounded-none shadow-2xl">
      <div className="text-center container mx-auto px-4 sm:px-6 lg:px-8">
        {/* ── Header ── */}
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
          <p className="text-sm sm:text-lg max-w-xl mx-auto leading-relaxed font-medium text-white/90">
            {t.subtitle}
          </p>
        </motion.div>
      </div>

      {/* ── Marquee Slider ── */}
      <div className="relative w-full overflow-hidden  container mx-auto">
        <div className="animate-marquee flex gap-8 mt-20">
          {[...departments].map((dept, idx) => {
            const iconPath = getIconPath(dept.name);
            const slug = dept.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

            return (
              <Link
                key={`${dept._id}-${idx}`}
                href={`/departments/${dept.name}`}
                className="btn-slide group  w-[260px] h-[320px] border border-primary bg-white flex flex-col items-center justify-between shrink-0 rounded-3xl p-8 "
              >
                {/* Large Icon centerpiece */}
                <div className="relative z-10 w-full flex-grow flex items-center justify-center p-2">
                  <Image
                    src={iconPath}
                    alt={dept.name}
                    width={140}
                    height={140}
                    className="object-contain transition-all duration-500 group-hover:scale-110 drop-shadow-md"
                  />
                </div>

                <div className="relative z-10 w-full text-center">
                  <h3 className="text-[17px] font-bold text-slate-800 group-hover:text-white transition-colors duration-300 leading-tight">
                    {getLocalizedValue(dept.name, dept.nameBn, language)}
                  </h3>
                  <div className="mt-2 h-1 w-0 group-hover:w-full bg-white/30 mx-auto transition-all duration-500 rounded-full" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* ── Bottom CTA ── */}
      <div className="mt-16 flex justify-center px-4">
        <Link href="/departments" className="btn-slide btn-primary text-black px-10 py-4 rounded-none font-bold uppercase tracking-widest text-[13px] shadow-xl">
          <span className="relative z-10 flex items-center gap-2">
            {t.viewAll}
            <ChevronRight className="w-4 h-4" />
          </span>
        </Link>
      </div>
    </div>
  );
}