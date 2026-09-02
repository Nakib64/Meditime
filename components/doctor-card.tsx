"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Clock, MapPin, Stethoscope, ChevronRight, Building2 } from "lucide-react";
import { useLanguage, getLocalizedValue } from "@/contexts/LanguageContext";
import { trackViewBook } from "@/lib/gtm";

export interface Doctor {
  _id: string;
  name: string;
  specialty: string;
  qualification: string;
  designation?: string;
  phoneNumber: string;
  slug?: string;
  slugBn?: string;
  email?: string;
  department?: string;
  reportShowFee?: number;
  newPatientFee?: number;
  diseases?: string[];
  slotDuration?: number;
  availability: Array<{
    days: string[];
    daysBn?: string[];
    time?: string;
    timeBn?: string;
    hospital: string;
  }>;
  bio?: string;
  image?: string;
  rating?: number;
  nameBn?: string;
  specialtyBn?: string;
  qualificationBn?: string;
  designationBn?: string;
}

interface DoctorCardProps {
  doctor: Doctor;
  index?: number;
  actions?: React.ReactNode;
  disableLink?: boolean;
  language?: 'en' | 'bn';
}

const daysOfWeek = ["Saturday","Sunday","Monday","Tuesday","Wednesday","Thursday","Friday"];
const banglaDays  = ["শনিবার","রবিবার","সোমবার","মঙ্গলবার","বুধবার","বৃহস্পতিবার","শুক্রবার"];

const getBengaliDay = (day: string): string => {
  const i = daysOfWeek.indexOf(day);
  return i >= 0 ? banglaDays[i] : day;
};

const areDaysConsecutive = (sortedDays: string[]): boolean => {
  if (sortedDays.length <= 1) return true;
  for (let i = 1; i < sortedDays.length; i++) {
    if (daysOfWeek.indexOf(sortedDays[i]) - daysOfWeek.indexOf(sortedDays[i - 1]) !== 1)
      return false;
  }
  return true;
};

const slotToText = (
  slot: Doctor["availability"][number],
  language: string
): string => {
  const sortedDays = [...(slot.days || [])].sort(
    (a, b) => daysOfWeek.indexOf(a) - daysOfWeek.indexOf(b)
  );
  if (!sortedDays.length) return "";

  const time = language === "bn" && slot.timeBn ? slot.timeBn : slot.time || "";
  const isOnCall = time === "On Call" || time === "অন কল";
  if (isOnCall) return time;

  const consecutive = areDaysConsecutive(sortedDays);

  if (language === "bn") {
    const getBnDay = (d: string) => {
      if (slot.daysBn?.length === slot.days.length) {
        const idx = slot.days.indexOf(d);
        if (idx !== -1 && slot.daysBn[idx]) return slot.daysBn[idx];
      }
      return getBengaliDay(d);
    };
    if (sortedDays.length === 1) return `${getBnDay(sortedDays[0])} — ${time}`;
    if (consecutive) return `${getBnDay(sortedDays[0])} থেকে ${getBnDay(sortedDays[sortedDays.length - 1])} — ${time}`;
    return `${sortedDays.map(getBnDay).join(", ")} — ${time}`;
  } else {
    if (sortedDays.length === 1) return `${sortedDays[0]} — ${time}`;
    if (consecutive) return `${sortedDays[0]} to ${sortedDays[sortedDays.length - 1]} — ${time}`;
    return `${sortedDays.join(", ")} — ${time}`;
  }
};

// ─── KEY FIX: group ALL slots that share the same hospital slug into one entry ───
const groupAvailabilityByHospital = async (
  availability: Doctor["availability"],
  language: string = "en"
): Promise<{ hospital: any; texts: string[] }[]> => {
  const slots = Array.isArray(availability) ? availability : [availability];

  // 1. Unique hospital slugs
  const uniqueSlugs = [...new Set(slots.map((s) => s?.hospital).filter(Boolean))];

  // 2. Fetch hospital objects in parallel
  const hospitalMap = new Map<string, any>();
  await Promise.all(
    uniqueSlugs.map(async (slug) => {
      try {
        const res = await fetch(`/api/locations/hospitals/${slug}`);
        if (!res.ok) throw new Error(`Failed: ${slug}`);
        hospitalMap.set(slug, await res.json());
      } catch (err) {
        console.error(`Error fetching hospital "${slug}":`, err);
      }
    })
  );

  // 3. Group ALL slots by hospital slug → one entry per unique hospital
  const groupMap = new Map<string, { hospital: any; texts: string[] }>();

  for (const slot of slots) {
    const slug = slot?.hospital;
    if (!slug || !hospitalMap.has(slug)) continue;

    const text = slotToText(slot, language);
    if (!text) continue;

    if (!groupMap.has(slug)) {
      groupMap.set(slug, { hospital: hospitalMap.get(slug), texts: [] });
    }
    groupMap.get(slug)!.texts.push(text);
  }

  return [...groupMap.values()];
};

export default function DoctorCard({
  doctor,
  index = 0,
  actions,
  disableLink = false,
  language: propLanguage,
}: DoctorCardProps) {
  const { language: contextLanguage } = useLanguage();
  const language = propLanguage || contextLanguage;

  const [isExpanded, setIsExpanded] = useState(false);
  // null = still loading, [] = loaded (possibly empty)
type GroupedAvailability = { hospital: any; texts: string[] }[] | null;

const [groupedAvailability, setGroupedAvailability] = useState<GroupedAvailability>(null);

  useEffect(() => {
    setGroupedAvailability(null); // reset on change
    groupAvailabilityByHospital(doctor.availability, language).then(
      setGroupedAvailability
    );
  }, [doctor.availability, language]);

  const displayName         = getLocalizedValue(doctor.name,         doctor.nameBn,         language);
  const displaySpecialty    = getLocalizedValue(doctor.specialty,    doctor.specialtyBn,    language);
  const displayQualification= getLocalizedValue(doctor.qualification,doctor.qualificationBn,language);
  const displayDesignation  = getLocalizedValue(doctor.designation,  doctor.designationBn,  language);

  // ── Block render until availability is resolved ──────────────────────────
  if (groupedAvailability === null) {
    return (
      <div className="h-[360px] rounded-xl border border-gray-100 bg-white shadow-sm animate-pulse flex flex-col gap-4 p-5">
        <div className="mx-auto w-16 h-16 rounded-full bg-gray-200" />
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto" />
          <div className="h-3 bg-gray-200 rounded w-1/2 mx-auto" />
        </div>
        <div className="mt-auto space-y-2">
          <div className="h-3 bg-gray-200 rounded w-full" />
          <div className="h-3 bg-gray-200 rounded w-5/6" />
        </div>
      </div>
    );
  }

  const CardContent = (
    <Card
      className={`p-5 bg-white border border-gray-100 hover:border-primary/30 shadow-sm transition-all duration-300 h-fit flex flex-col ${
        !disableLink ? "hover:shadow-xl cursor-pointer group" : ""
      }`}
    >
      {/* TOP: image + info */}
      <div className="flex flex-col gap-6 flex-1 mb-4">
        <div className="relative w-16 h-16 rounded-full overflow-hidden bg-gray-50 border-2 border-gray-100 flex-shrink-0 group-hover:border-primary/20 transition-colors mx-auto">
          {doctor.image ? (
            <Image
              src={doctor.image}
              alt={doctor.name}
              fill
              sizes="64px"
              className="object-cover group-hover:scale-110 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-primary/5">
              <Stethoscope className="w-8 h-8 text-primary/40" />
            </div>
          )}
        </div>

        <div className="w-full min-w-0 flex flex-col gap-3">
          <h3 className="text-lg font-bold text-[#193252] leading-snug mb-1 group-hover:text-[#00B1C2] transition-colors">
            {displayName}
          </h3>
          {displaySpecialty && (
            <section className="text-md text-[#017991] font-semibold mb-1">{displaySpecialty}</section>
          )}
          {displayQualification && (
            <section className="text-sm text-[#193252] font-medium mb-0.5">{displayQualification}</section>
          )}
          {displayDesignation && (
            <section className="text-sm text-[#193252] font-medium">{displayDesignation}</section>
          )}
        </div>
      </div>

      {/* BOTTOM: availability + actions */}
      <div className="space-y-6">
        <div className="flex flex-col gap-2 transition-colors overflow-hidden">
          {groupedAvailability.length > 0 ? (
            <div className="flex flex-col gap-2">
              {groupedAvailability
                .slice(0, isExpanded ? groupedAvailability.length : 1)
                .map((group: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-3 border-b bg-[#F6FAFD] border-gray-100/50 last:border-b-0"
                  >
                    <div className="flex gap-2 mb-2 text-sm font-semibold text-[#193252]">
                      <Building2 className="w-4 h-4 mt-0.5 text-[#10B981] shrink-0" />
                      {getLocalizedValue(
                        group.hospital?.hospital?.name ?? group.hospital?.name,
                        group.hospital?.hospital?.nameBn ?? group.hospital?.nameBn,
                        language
                      )}
                    </div>
                    <div className="flex flex-col gap-1.5 ml-1">
                      {group.texts.map((text:string, tIdx:number) => (
                        <div key={tIdx} className="flex items-start gap-2 text-xs text-gray-600">
                          <Clock className="w-3.5 h-3.5 mt-0.5 text-gray-400 shrink-0" />
                          <section className="font-medium leading-relaxed">{text}</section>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

              {groupedAvailability.length > 1 && (
                <section
                  className="bg-[#E0F2FE] hover:bg-[#BAE6FD] text-[#193252] text-xs font-bold py-2.5 px-3 flex items-center justify-center gap-1.5 cursor-pointer transition-colors m-2 rounded-lg"
                  onClick={(e) => {
                    e.preventDefault();
                    setIsExpanded(!isExpanded);
                  }}
                >
                  <MapPin className="w-3.5 h-3.5" />
                  {isExpanded
                    ? language === "bn" ? "কম দেখান" : "Show less"
                    : language === "bn"
                    ? `আরও ${groupedAvailability.length - 1}টি চেম্বার দেখুন`
                    : `See ${groupedAvailability.length - 1} more chamber${groupedAvailability.length > 2 ? "s" : ""}`}
                </section>
              )}
            </div>
          ) : (
            <div className="p-3">
              <div className="flex items-start gap-2 text-xs text-gray-700">
                <Clock className="w-4 h-4 mt-0.5 text-primary shrink-0" />
                <span className="font-semibold leading-relaxed">
                  {language === "bn" ? "সময়সূচী দেখুন" : "View Schedule"}
                </span>
              </div>
            </div>
          )}
        </div>

        {!disableLink && (
          <div className="w-full py-6 btn-primary btn-slide text-white hover:text-[#017991] flex items-center justify-center gap-2">
            {language === "bn" ? "অ্যাপয়েন্টমেন্ট নিন" : "Book Appointment"}
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        )}
        {actions && (
          <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">{actions}</div>
        )}
      </div>
    </Card>
  );

  const handleCardClick = () => {
    trackViewBook({
      doctor_name: doctor.name,
      doctor_specialty: displaySpecialty || doctor.specialty || (typeof doctor.department === 'string' ? doctor.department : ''),
      source_page: "doctors_listing",
      cta_label: language === "bn" ? "অ্যাপয়েন্টমেন্ট নিন" : "Book Appointment",
    });
  };

  return (
    <motion.div whileHover={!disableLink ? { y: -3 } : {}}>
      {!disableLink ? (
        <Link
          href={`/doctor/${doctor.slug || doctor._id}`}
          onClick={handleCardClick}
        >
          {CardContent}
        </Link>
      ) : (
        CardContent
      )}
    </motion.div>
  );
}