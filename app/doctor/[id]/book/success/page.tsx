"use client";

import { useEffect, useState, useCallback, useRef, Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import {
  CheckCircle,
  Calendar,
  MapPin,
  User,
  Phone,
  ArrowLeft,
  Home,
  Printer,
  Stethoscope,
  Clock,
  CreditCard,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useLanguage, getLocalizedValue } from "@/contexts/LanguageContext";
import Nav_for_details from "@/components/nav_for_details";
import PageLoader from "@/components/page-loader";
import { trackDoctorBookingPurchase } from "@/lib/gtm";

const banglaMonths = [
  "জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন",
  "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর",
];
const englishMonths = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const banglaDays = ["রবিবার", "সোমবার", "মঙ্গলবার", "বুধবার", "বৃহস্পতিবার", "শুক্রবার", "শনিবার"];
const englishDays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const toBengaliNumber = (num: number | string): string => {
  const bengaliDigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
  return num.toString().split("").map((d) => bengaliDigits[parseInt(d)] ?? d).join("");
};

const formatDate = (dateString: string, language: "en" | "bn"): string => {
  const date = new Date(dateString);
  const day = date.getDay();
  const dayNum = date.getDate();
  const month = date.getMonth();
  const year = date.getFullYear();
  
  if (language === "bn") {
    return `${banglaDays[day]}, ${toBengaliNumber(dayNum)} ${banglaMonths[month]}, ${toBengaliNumber(year)}`;
  }
  return `${englishDays[day]}, ${dayNum} ${englishMonths[month]}, ${year}`;
};

const getPatientTypeLabel = (type: string, language: "en" | "bn") => {
  const labels: Record<string, Record<"en" | "bn", string>> = {
    old: { en: "Old Patient", bn: "পুরাতন রোগী" },
    new: { en: "New Patient", bn: "নতুন রোগী" },
    report: { en: "Report Showing", bn: "রিপোর্ট দেখানো" },
  };
  return labels[type]?.[language] || type;
};

const getGenderLabel = (gender: string, language: "en" | "bn") => {
  const labels: Record<string, Record<"en" | "bn", string>> = {
    male: { en: "Male", bn: "পুরুষ" },
    female: { en: "Female", bn: "মহিলা" },
    others: { en: "Other", bn: "অন্যান্য" },
  };
  return labels[gender]?.[language] || gender;
};

function BookingSuccessContent() {
  const { language } = useLanguage();
  const params = useParams();
  const searchParams = useSearchParams();
  const doctorId = params?.id as string;
  const appointmentId = searchParams.get("appointmentId");

  const [appointment, setAppointment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const trackedRef = useRef(false);

  const fetchAppointment = useCallback(async () => {
    try {
      const response = await fetch(`/api/appointments/${appointmentId}`);
      const data = await response.json();
      if (response.ok && data.appointment) {
        setAppointment(data.appointment);
        if (typeof window !== "undefined") {
          localStorage.setItem("lastAppointment", JSON.stringify(data.appointment));
        }
      } else {
        // Fallback to localStorage
        const saved = typeof window !== "undefined" ? localStorage.getItem("lastAppointment") : null;
        if (saved) {
          try { setAppointment(JSON.parse(saved)); } catch { /* noop */ }
        }
      }
    } catch (error) {
      console.error("Error fetching appointment:", error);
      const saved = typeof window !== "undefined" ? localStorage.getItem("lastAppointment") : null;
      if (saved) {
        try { setAppointment(JSON.parse(saved)); } catch { /* noop */ }
      }
    } finally {
      setLoading(false);
    }
  }, [appointmentId]);

  useEffect(() => {
    if (appointmentId) {
      fetchAppointment();
    } else {
      const savedAppointment =
        typeof window !== "undefined" ? localStorage.getItem("lastAppointment") : null;
      if (savedAppointment) {
        try {
          setAppointment(JSON.parse(savedAppointment));
        } catch { /* noop */ }
      }
      setLoading(false);
    }
  }, [appointmentId, fetchAppointment]);

  // Track purchase_doctor_booking when appointment is ready
  useEffect(() => {
    if (appointment && !trackedRef.current) {
      trackedRef.current = true;
      const doc = appointment.doctorId || {};
      const deptName = typeof doc.department === "object" ? doc.department?.name : doc.department;
      trackDoctorBookingPurchase({
        bookingId: appointment._id || appointment.serialNumber || appointmentId,
        doctorName: doc.name || appointment.doctorName,
        diseaseDepartment: deptName,
        hospitalName: appointment.hospitalName,
        visitFee: appointment.fee || doc.fee || doc.consultationFee || 0,
        patientName: appointment.patientName,
        patientPhone: appointment.mobileNumber,
      });
    }
  }, [appointment, appointmentId]);

  const handlePrint = () => window.print();

  if (loading) {
    return (
  <PageLoader/>
    );
  }

  const translations = {
    success: { en: "Appointment Successful!", bn: "অ্যাপয়েন্টমেন্ট সফল!" },
    confirmed: { en: "Your appointment has been successfully confirmed", bn: "আপনার আপনার অ্যাপয়েন্টমেন্ট সফলভাবে নিশ্চিত করা হয়েছে" },
    serialNumber: { en: "Serial Number", bn: "সিরিয়াল নম্বর" },
    doctorInfo: { en: "Doctor Information", bn: "ডাক্তারের তথ্য" },
    patientInfo: { en: "Patient Information", bn: "রোগীর তথ্য" },
    patientName: { en: "Patient Name", bn: "রোগীর নাম" },
    mobileNumber: { en: "Mobile Number", bn: "মোবাইল নম্বর" },
    appointmentDate: { en: "Appointment Date", bn: "অ্যাপয়েন্টমেন্টের তারিখ" },
    hospital: { en: "Chamber / Hospital", bn: "চেম্বার / হাসপাতাল" },
    patientType: { en: "Patient Type", bn: "রোগীর ধরন" },
    status: { en: "Status", bn: "স্ট্যাটাস" },
    gender: { en: "Gender", bn: "লিঙ্গ" },
    age: { en: "Age", bn: "বয়স" },
    years: { en: "Years", bn: "বছর" },
    print: { en: "Print", bn: "প্রিন্ট করুন" },
    backToProfile: { en: "Doctor Profile", bn: "ডাক্তারের প্রোফাইল" },
    goHome: { en: "Go Home", bn: "হোমে যান" },
    importantInfo: { en: "Important Information", bn: "গুরুত্বপূর্ণ তথ্য" },
    note1: { en: "Be present on time on the appointment date", bn: "অ্যাপয়েন্টমেন্টের তারিখে সময়মতো উপস্থিত থাকুন" },
    note2: { en: "Keep this slip printed or take a screenshot", bn: "এই স্লিপটি প্রিন্ট করে বা স্ক্রিনশট নিয়ে সাথে রাখুন" },
    note3: { en: "Pay at the chamber — no advance payment needed", bn: "চেম্বারে গিয়ে পেমেন্ট করুন — কোনো অগ্রিম পেমেন্ট নেই" },
    statusPending: { en: "Pending", bn: "অপেক্ষমান" },
    statusConfirmed: { en: "Confirmed", bn: "নিশ্চিত" },
    statusCompleted: { en: "Completed", bn: "সম্পন্ন" },
  };

  const t = translations;

  if (!appointment) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Nav_for_details />
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-24 text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-800 mb-2" >
            অ্যাপয়েন্টমেন্ট সফলভাবে বুক হয়েছে!
          </h1>
          <p className="text-slate-500 mb-6" >
            আপনার অ্যাপয়েন্টমেন্টের বিস্তারিত তথ্য শীঘ্রই দেখানো হবে।
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link href={`/doctor/${doctorId}`}>
              <Button variant="outline" >
                <ArrowLeft className="h-4 w-4 mr-2" />
                ডাক্তারের প্রোফাইলে ফিরে যান
              </Button>
            </Link>
            <Link href="/">
              <Button >
                <Home className="h-4 w-4 mr-2" />
                {language === "bn" ? "হোমে যান" : "Go Home"}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const doc = appointment.doctorId || {};
  const docProfileSlug = doc.slug || doc._id || doctorId;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-green-50">
      <Nav_for_details />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-24 pb-16">
        {/* Success Header */}
        <div className="text-center mb-8" id="success-header">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 border-2 border-(--color-primary) shadow-sm">
            <CheckCircle className="h-12 w-12 text-(--color-primary)" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-1" >
            {t.success[language]}
          </h1>
          <p className="text-slate-500 text-sm" >
            {t.confirmed[language]}
          </p>
        </div>

        {/* Appointment Slip */}
        <div id="appointment-slip-wrapper">
          <Card
            className="bg-white border border-slate-200 shadow-2xl overflow-hidden print:shadow-none print:border-x-2"
            id="appointment-slip"
          >
            {/* Slip Header */}
            <div className="bg-[var(--color-primary)] px-6 py-6 text-center">
            <div className="flex justify-center mb-4">
              <div className="">
                <img src="/SVG/Asset-4.png" alt="MediTime Logo" className="h-14 w-auto" />
              </div>
            </div>
            
              <p className="text-white/80 text-sm font-bold uppercase tracking-wider mt-1">
                Appointment Slip
              </p>
              {appointment.serialNumber && (
                <div className="mt-4 pt-4 border-t border-white/20">
                  <p className="text-white/70 text-xs uppercase tracking-widest mb-1" >
                    {t.serialNumber[language]}
                  </p>
                  <p className="font-mono font-bold text-2xl text-white">{appointment.serialNumber}</p>
                </div>
              )}
            </div>

            <div className="p-6 space-y-6">
              {/* Doctor Information */}
              <div className="pb-5 border-b border-dashed border-slate-200">
                <p className="text-[11px] text-[#00B7B5] font-bold uppercase tracking-widest mb-3" >
                  {t.doctorInfo[language]}
                </p>
                <div className="flex items-start gap-4">


                  {/* Doctor Info */}
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 text-xl leading-tight mb-0.5" >
                      {getLocalizedValue(doc.name, doc.nameBn, language)}
                    </p>
                    {(language === 'bn' ? doc.specialtyBn : doc.specialty) && (
                      <p className="text-sm text-[#00B7B5] font-semibold mb-0.5" >
                        {language === 'bn' ? (doc.specialtyBn || '') : (doc.specialty || '')}
                      </p>
                    )}
                    {(language === 'bn' ? doc.qualificationBn : doc.qualification) && (
                      <p className="text-sm text-slate-600 font-medium mb-0.5" >
                        {language === 'bn' ? (doc.qualificationBn || '') : (doc.qualification || '')}
                      </p>
                    )}
                    {(language === 'bn' ? doc.designationBn : doc.designation) && (
                      <p className="text-xs text-slate-400 font-medium" >
                        {getLocalizedValue(doc.designation, doc.designationBn, language)}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Patient Information */}
              <div>
                <p className="text-[11px] text-[#00B7B5] font-bold uppercase tracking-widest mb-4" >
                  {t.patientInfo[language]}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Patient Name */}
                  <div className="space-y-1 p-3 bg-slate-50 rounded-xl">
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider" >
                      {t.patientName[language]}
                    </p>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-slate-400 flex-shrink-0" />
                      <p className="font-bold text-slate-800 text-sm" >
                        {appointment.patientName}
                      </p>
                    </div>
                  </div>

                  {/* Mobile */}
                  <div className="space-y-1 p-3 bg-slate-50 rounded-xl">
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider" >
                      {t.mobileNumber[language]}
                    </p>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-slate-400 flex-shrink-0" />
                      <p className="font-bold text-slate-800 text-sm">{appointment.mobileNumber}</p>
                    </div>
                  </div>

                  {/* Date */}
                  <div className="space-y-1 p-3 bg-slate-50 rounded-xl">
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider" >
                      {t.appointmentDate[language]}
                    </p>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-[#00B7B5] flex-shrink-0" />
                      <p className="font-bold text-slate-800 text-sm" >
                        {formatDate(appointment.appointmentDate, language)}
                        {appointment.appointmentTime && ` • ${appointment.appointmentTime}`}
                      </p>
                    </div>
                  </div>

                  {/* Hospital */}
                  <div className="space-y-1 p-3 bg-slate-50 rounded-xl">
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider" >
                      {t.hospital[language]}
                    </p>
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
                      <p className="font-bold text-slate-800 text-sm leading-snug" >
                        {appointment.hospitalName}
                      </p>
                    </div>
                  </div>

                  {/* Patient Type */}
                  <div className="space-y-1 p-3 bg-slate-50 rounded-xl">
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider" >
                      {t.patientType[language]}
                    </p>
                    <p className="font-bold text-slate-800 text-sm" >
                      {getPatientTypeLabel(appointment.patientType, language)}
                    </p>
                  </div>

                  {/* Status */}
                  <div className="space-y-1 p-3 bg-slate-50 rounded-xl">
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider" >
                      {t.status[language]}
                    </p>
                    <span
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-green-50 text-green-600 border border-green-100"
                      
                    >
                      <CheckCircle className="h-3 w-3" />
                      {appointment.status === "pending"
                        ? t.statusPending[language]
                        : appointment.status === "confirmed"
                          ? t.statusConfirmed[language]
                          : t.statusCompleted[language]}
                    </span>
                  </div>

                  {/* Gender (if available) */}
                  {appointment.gender && (
                    <div className="space-y-1 p-3 bg-slate-50 rounded-xl">
                      <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider" >
                        {t.gender[language]}
                      </p>
                      <p className="font-bold text-slate-800 text-sm" >
                        {getGenderLabel(appointment.gender, language)}
                      </p>
                    </div>
                  )}

                  {/* Age (if available) */}
                  {appointment.age && (
                    <div className="space-y-1 p-3 bg-slate-50 rounded-xl">
                      <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider" >
                        {t.age[language]}
                      </p>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-orange-400 flex-shrink-0" />
                        <p className="font-bold text-slate-800 text-sm" >
                          {language === "bn" ? toBengaliNumber(appointment.age) : appointment.age} {t.years[language]}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

           
          </Card>
        </div>

        {/* Print Button */}
        <div className="mt-4 flex justify-center print:hidden">
          <Button
            onClick={handlePrint}
            variant="outline"
            className="flex items-center gap-2 hover:border-primary hover:text-primary transition-all"
            
          >
            <Printer className="h-4 w-4" />
            {t.print[language]}
          </Button>
        </div>


            <div className="bg-white print:hidden px-4 border rounded-2xl mt-6 py-4 border-t border-slate-100 text-center">
              <p className="text-sm text-slate-600 font-medium leading-relaxed">
                {language === "bn" 
                  ? "আপনার অ্যাপয়েন্টমেন্ট কনফার্ম হয়েছে। অল্প সময়ের মধ্যেই আপনার সিরিয়াল নম্বরসহ একটি এসএমএস পাবেন।" 
                  : "Your appointment has been confirmed. You will receive an SMS with your serial number shortly."}
              </p>
            </div>
        {/* Important Notes */}
        <Card className="p-4 bg-amber-50 border border-amber-200 mt-6 print:hidden">
          <h3 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2" >
            <CreditCard className="h-4 w-4 text-amber-600" />
            {t.importantInfo[language]}
          </h3>
          <ul className="space-y-1.5 text-xs text-gray-700" >
            <li className="flex items-start gap-2">
              <span className="text-amber-600 font-bold">•</span>
              <span>{t.note1[language]}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-600 font-bold">•</span>
              <span>{t.note2[language]}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-600 font-bold">•</span>
              <span>{t.note3[language]}</span>
            </li>
          </ul>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6 print:hidden">
          <Link href={`/doctor/${docProfileSlug}`}>
            <Button
              variant="outline"
              className="w-full sm:w-auto hover:border-primary hover:text-primary transition-all"
              
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t.backToProfile[language]}
            </Button>
          </Link>
          <Link href="/">
            <Button
              className="w-full sm:w-auto btn-primary btn-slide"
              
            >
              <Home className="h-4 w-4 mr-2" />
              {t.goHome[language]}
            </Button>
          </Link>
        </div>
      </div>

      <Footer />

      {/* Print Styles — single page, no blank second page */}
      <style jsx global>{`
        @media print {
          @page {
            size: auto;
            margin: 0;
          }

          /* Hide UI elements */
          nav, footer, .print\\:hidden, #success-header {
            display: none !important;
          }

          /* Force colors and backgrounds */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }

          /* Reset container for print */
          body, html {
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          /* Reset main content area */
          main, .min-h-screen, .max-w-2xl {
            min-height: auto !important;
            padding: 0 !important;
            margin: 0 !important;
            max-width: none !important;
            background: none !important;
          }

          /* Stretch the slip in print */
          #appointment-slip-wrapper {
            display: block !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
          }

          #appointment-slip {
            margin: 0 !important;
            width: 100% !important;
            max-width: none !important;
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}

export default function BookingSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4" />
            <p className="text-gray-600" >
              লোড হচ্ছে...
            </p>
          </div>
        </div>
      }
    >
      <BookingSuccessContent />
    </Suspense>
  );
}
