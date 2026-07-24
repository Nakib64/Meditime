"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import {
  Star,
  Clock,
  Building2,
  MapPin,
  Award,
  Phone,
  Check,
  Calendar,
  Stethoscope,
  ChevronRight,
} from "lucide-react";
import { motion } from "framer-motion";
import DoctorCard from "@/components/doctor-card";
import PageLoader from "@/components/page-loader";
import { useLanguage, getLocalizedValue } from "@/contexts/LanguageContext";
import { IDoctor } from "@/models/Doctor";




const banglaDays = [
  "সোমবার",
  "মঙ্গলবার",
  "বুধবার",
  "বৃহস্পতিবার",
  "শুক্রবার",
  "শনিবার",
  "রবিবার",
];

const daysOfWeek = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const getBengaliDay = (day: string): string => {
  const index = daysOfWeek.indexOf(day);
  return index >= 0 ? banglaDays[index] : day;
};

const areDaysConsecutive = (sortedDays: string[]): boolean => {
  if (sortedDays.length <= 1) return true;
  for (let i = 1; i < sortedDays.length; i++) {
    const prevIndex = daysOfWeek.indexOf(sortedDays[i - 1]);
    const currIndex = daysOfWeek.indexOf(sortedDays[i]);
    if (currIndex - prevIndex !== 1) return false;
  }
  return true;
};

export default function DoctorProfilePage() {
  const params = useParams();
  const router = useRouter();
  const doctorId = params?.id as string;
  const [doctor, setDoctor] = useState<IDoctor | null>(null);
  const [relatedDoctors, setRelatedDoctors] = useState<IDoctor[]>([]);
  const [hospitals, setHospitals] = useState<{ name: string, nameBn?: string, slug: string, address?: string, addressBn?: string }[]>([]);
  const [loading, setLoading] = useState(true);

  const [departmentDiseases, setDepartmentDiseases] = useState<Array<{ name: string, bangla: string }>>([]);
  const [departmentInfo, setDepartmentInfo] = useState<{ name: string, nameBn?: string } | null>(null);
  const [selectedHospitalSlug, setSelectedHospitalSlug] = useState<string>("");
    const MAX_WORDS = 35;

  function truncateToWords(text: any, wordLimit: any) {
    if (!text) return '';
    const words = text.trim().split(/\s+/);
    if (words.length <= wordLimit) return { text, isTruncated: false };
    return { text: words.slice(0, wordLimit).join(' ') + '...', isTruncated: true };
  }

  const [bioExpanded, setBioExpanded] = useState(false);




  const availabilityArray = Array.isArray(doctor?.availability)
    ? doctor?.availability
    : [doctor?.availability];

  const groupedAvailability = availabilityArray.reduce((acc: any[], slot) => {
    const hospitalSlug = slot?.hospital || "unknown";
    let group = acc.find(g => g.hospital === hospitalSlug);
    if (!group) {
      group = {
        hospital: hospitalSlug,
        slots: []
      };
      acc.push(group);
    }
    group.slots.push(slot);
    return acc;
  }, []);

  useEffect(() => {
    if (doctor && availabilityArray.length > 0) {
      const firstHospital = availabilityArray[0]?.hospital || "";
      if (firstHospital && !selectedHospitalSlug) {
        setSelectedHospitalSlug(firstHospital);
      }
    }
  }, [doctor, availabilityArray, selectedHospitalSlug]);
  const { language } = useLanguage();

  useEffect(() => {
    if (doctorId) {
      fetchDoctor();
      fetchRelatedDoctors();
      fetchHospitals();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doctorId]);

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

  const fetchDoctor = async () => {
    try {
      const response = await fetch(`/api/doctors/${doctorId}`);
      const data = await response.json();
      if (response.ok && data.doctor) {
        setDoctor(data.doctor);
        console.log("Fetched doctor data:", data.doctor);

        // Populate diseases from doctor's specific list (diseases = BN, diseasesEn = EN)
        if (data.doctor.diseases && data.doctor.diseases.length > 0) {
          const mappedDiseases = data.doctor.diseases.map((d: string, i: number) => ({
            name: (data.doctor.diseasesEn && data.doctor.diseasesEn[i]) || d,
            bangla: d
          }));
          setDepartmentDiseases(mappedDiseases);
        }

        // Also fetch diseases for the doctor's department to supplement the list
        if (data.doctor.department) {
          fetchDepartmentDiseases(data.doctor.department);
        }
      } else {
        router.push("/doctor");
      }
    } catch (error) {
      console.error("Error fetching doctor:", error);
      router.push("/doctor");
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartmentDiseases = async (departmentName: string) => {
    try {
      // First, get the department ID by name
      const deptResponse = await fetch(`/api/departments?name=${encodeURIComponent(departmentName)}`);
      const deptData = await deptResponse.json();

      if (deptData.departments && deptData.departments.length > 0) {
        const department = deptData.departments[0];
        // Store department info for language switching
        setDepartmentInfo({
          name: department.name || departmentName,
          nameBn: department.nameBn
        });

        // Then fetch diseases for this department
        const diseaseResponse = await fetch(`/api/diseases?department=${department._id}`);
        const diseaseData = await diseaseResponse.json();

        if (diseaseData.diseases && diseaseData.diseases.length > 0) {
          // Store both English and Bangla names
          const diseasesWithBothNames = diseaseData.diseases
            .map((disease: { name: string, bangla: string }) => ({
              name: disease.name || '',
              bangla: disease.bangla || disease.name || ''
            }))
            .filter((d: { name: string, bangla: string }) => d.name || d.bangla); // Filter out empty diseases

          setDepartmentDiseases(prev => {
            // Merge with existing (doctor-specific) diseases, avoiding duplicates
            const existingNames = new Set(prev.map(d => d.name.toLowerCase()));
            const filteredNew = diseasesWithBothNames.filter((d: any) => !existingNames.has(d.name.toLowerCase()));
            return [...prev, ...filteredNew];
          });
        }
      } else {
        // If department not found, still set the department name
        setDepartmentInfo({
          name: departmentName,
          nameBn: undefined
        });
      }
    } catch (error) {
      console.error("Error fetching department diseases:", error);
    }
  };

  const fetchRelatedDoctors = async () => {
    if (!doctor) return;

    try {
      const response = await fetch(`/api/doctors/${doctorId}/related?language=${language}`);
      const data = await response.json();
      if (response.ok && data.doctors) {
        setRelatedDoctors(data.doctors);
      }
    } catch (error) {
      console.error("Error fetching related doctors:", error);
    }
  };

  const bioText = getLocalizedValue(doctor?.bio, doctor?.bioBn, language);
const words = bioText ? bioText.trim().split(/\s+/) : [];
const needsTruncation = words.length > 35;
const displayedBio = needsTruncation && !bioExpanded
  ? words.slice(0, 35).join(' ') + '...'
  : bioText;


  // Trigger fetchRelatedDoctors when doctor is loaded
  useEffect(() => {
    if (doctor) {
      fetchRelatedDoctors();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doctor, language]);

  if (loading) {
    return <PageLoader />;
  }

  if (!doctor) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-500 mb-4">Doctor not found</p>
            <Link href="/doctor">
              <Button>Back to Doctors</Button>
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }





  const enrichedDoctor = {
    ...doctor,
    // hospitalBn: hospitals.find(h => h.name === doctor.hospital)?.nameBn || doctor.hospitalBn || ""
  };

  const formatSlot = (slot: any): string => {
    const sortedDays = (slot.days || []).sort((a: string, b: string) => daysOfWeek.indexOf(a) - daysOfWeek.indexOf(b));
    if (!sortedDays.length) return "";

    const time = (language === 'bn' && slot.timeBn) ? slot.timeBn : (slot.time || "");
    const isOnCall = time === "On Call" || time === "অন কল";

    if (isOnCall) return time;

    const consecutive = areDaysConsecutive(sortedDays);

    if (language === 'bn') {
      const getBnDay = (d: string) => {
        if ((slot as any).daysBn && Array.isArray((slot as any).daysBn) && (slot as any).daysBn.length === slot.days.length) {
          const idx = slot.days.indexOf(d);
          if (idx !== -1 && (slot as any).daysBn[idx]) return (slot as any).daysBn[idx];
        }
        return getBengaliDay(d);
      };

      if (sortedDays.length === 1) return `${getBnDay(sortedDays[0])} ${time}`;
      if (consecutive) {
        return `${getBnDay(sortedDays[0])} থেকে ${getBnDay(sortedDays[sortedDays.length - 1])} ${time}`;
      }
      return `${sortedDays.map((d: string) => getBnDay(d)).join(", ")} ${time}`;
    } else {
      if (sortedDays.length === 1) return `${sortedDays[0]} ${time}`;
      if (consecutive) {
        return `${sortedDays[0]} to ${sortedDays[sortedDays.length - 1]} ${time}`;
      }
      return `${sortedDays.join(", ")} ${time}`;
    }
  };

  const fees = [doctor.newPatientFee, doctor.reportShowFee].filter(f => f !== undefined && f !== null && f > 0) as number[];
  const minFee = fees.length > 0 ? Math.min(...fees) : doctor.newPatientFee;


  const enrichedRelatedDoctors = relatedDoctors;






  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />


      {/* Facebook-style Cover Photo - Fixed Static */}
      <div className="relative  w-full h-[350px] md:h-[450px] overflow-hidden bg-gradient-to-br from-primary via-primary-dark to-primary">
        {/* Static Cover Image */}
        <div className="absolute inset-0">
          <Image
            src="/hero/d_profile.png"
            alt="Cover"
            fill
            sizes="100vw"
            className="object-cover"
            priority
          />
          {/* Overlay for better text readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/60" />
        </div>
      </div>

      {/* Profile Section - Facebook Style */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* ... (Profile info same as updated previously) ... */}
          <div className="relative">
            {/* Profile Picture - Positioned over cover */}
            <div className="absolute -top-24 md:-top-32 left-0">
              <div className="relative w-40 h-40 md:w-48 md:h-48 rounded-full overflow-hidden border-6 border-white shadow-2xl bg-white ring-4 ring-white">
                {doctor.image ? (
                  <Image
                    src={doctor.image}
                    alt={doctor.name}
                    fill
                    sizes="(max-width: 768px) 160px, 192px"
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary to-primary-dark text-white text-5xl md:text-6xl font-bold">
                    {doctor.name.charAt(0)}
                  </div>
                )}
              </div>
            </div>

            {/* Profile Info - Below profile picture */}
            <div className="pt-28 md:pt-36 pb-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h1
                      className="text-2xl md:text-4xl font-bold text-[#193252] transition-colors duration-300 hover:text-[#00B1C2]"
                    >
                      {getLocalizedValue(doctor.name, doctor.nameBn, language)}
                    </h1>
                  </div>
                  <div className="space-y-2">
                    {/* Specialty */}
                    <section className=" font-bold text-lg md:text-2xl text-[#017991]">
                      {getLocalizedValue(doctor.specialty, doctor.specialtyBn, language)}
                    </section>

                    {/* Degree/Qualification */}
                    <section
                      className="text-lg md:text-xl text-[#193252]  font-semibold"

                    >
                      {getLocalizedValue(doctor.qualification, doctor.qualificationBn, language)}
                    </section>

                    {/* Designation */}
                    {getLocalizedValue(doctor.designation, doctor.designationBn, language) && (
                      <section className=" md:text-lg  text-[#193252] font-medium">
                        {getLocalizedValue(doctor.designation, doctor.designationBn, language)}
                      </section>
                    )}

                    {/* <div className="flex items-start gap-2 pt-1 flex-wrap">
                      <div className="flex flex-col">
                        {Array.from(new Set(availabilityArray.map((s: any) => s.hospital).filter(Boolean))).map((hSlug: any, i) => {
                          const hObj = hospitals.find(h => h.name === hSlug || (h as any).slug === hSlug);
                          const hName = hObj?.name || hSlug;
                          const hNameBn = hObj?.nameBn || hName;
                          return (
                            <div key={i} className="flex gap-2 ">
                              <Building2 className="h-5 w-5 text-primary shrink-0 mt-1" />

                              <p className="md:text-lg font-bold text-gray-800">
                                {language === 'bn' ? hNameBn : hName}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div> */}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Desktop and Tablet */}
          <div className="lg:col-span-2 space-y-6">
            {/* Diseases Treated Section - Show diseases based on department */}
            {departmentDiseases.length > 0 && (
              <Card className="p-8 bg-gradient-to-br from-white to-blue-50 border-2 border-primary/20 shadow-xl">
                <h2
                  className="text-2xl md:text-3xl font-bold  mb-6"
                >
                  {language === 'bn' ? 'যে সকল রোগের চিকিৎসা করা হয়' : 'Diseases Treated'}
                </h2>
                <div className="lg:bg-white lg:p-6 lg:rounded-xl lg:border-2 border-primary/10 lg:shadow-md">
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
                    {departmentDiseases.map((disease, index) => (
                      <li
                        key={index}
                        className="flex items-start gap-3  md:text-lg  text-gray-800"
                      >
                        <section className="text-primary mt-1">•</section>
                        <section>{getLocalizedValue(disease.name, disease.bangla, language)}</section>
                      </li>
                    ))}
                  </ul>
                </div>
              </Card>
            )}

            {/* About Section */}
            {doctor.bio && (
              <Card className="p-8 bg-gradient-to-br from-white to-blue-50 border-2 border-primary/20 shadow-xl">
                <h2 className="text-2xl md:text-3xl font-bold mb-6">
                  {language === 'bn'
                    ? `${getLocalizedValue(doctor.name, doctor.nameBn, language)} সম্পর্কে`
                    : `About ${getLocalizedValue(doctor.name, doctor.nameBn, language)}`}
                </h2>
                <div className="lg:bg-white lg:p-6 rounded-xl lg:border-2 border-primary/10 lg:shadow-md">
                  <p className="md:text-lg text-[#193252] leading-relaxed whitespace-pre-line">
                    {displayedBio} 
                      {needsTruncation && (
                    <button
                      onClick={() => setBioExpanded(!bioExpanded)}
                      className="ml-2 text-primary font-semibold  hover:underline focus:outline-none"
                    >
                      {bioExpanded
                        ? (language === 'bn' ? 'কম দেখুন' : 'See Less')
                        : (language === 'bn' ? 'আরও দেখুন' : 'See More')}
                    </button>
                  )}
                  </p>
                
                </div>
              </Card>
            )}

            {/* Related Doctors - Desktop/Tablet */}
            <div className="hidden lg:block">
              {relatedDoctors.length > 0 && (
                <Card className="p-8 bg-gradient-to-br from-white to-purple-50 border-2 border-primary/20 shadow-xl">
                  <h2
                    className="text-2xl md:text-3xl font-bold  mb-6"

                  >
                    {language === 'bn' ? 'সংশ্লিষ্ট ডাক্তার' : 'Related Doctors'}
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {enrichedRelatedDoctors.map((relatedDoctor, index) => (
                      <DoctorCard key={relatedDoctor._id as string} doctor={relatedDoctor as any} index={index} />
                    ))}
                  </div>
                </Card>
              )}
            </div>
          </div>

          {/* Right Column - Desktop */}
          <div className="hidden lg:block space-y-6">

            <Card id="schedule" className="p-6 bg-gradient-to-br from-white to-indigo-50/50 border-2 border-primary/20 shadow-xl ">
              <h2 className="text-xl md:text-2xl font-bold mb-5 text-gray-900 flex items-center gap-2">
                <Building2 className="h-6 w-6 text-primary" />
                {language === 'bn' ? 'চেম্বার নির্বাচন করুন' : 'Select Chamber'}
              </h2>
              <div className="space-y-4">
                {groupedAvailability.map((group: any, index: number) => {
                  const hospitalSlug = group.hospital;
                  const hObj = hospitals.find(h => h.slug === hospitalSlug || (h as any).slug === hospitalSlug);
                  const hospitalName = hObj?.name;
                  const hospitalBnName = hObj?.nameBn;
                  const hospitalAddress = hObj?.address || '';
                  const hospitalBnAddress = hObj?.addressBn || '';
                  const isSelected = selectedHospitalSlug === hospitalSlug;

                  return (
                    <div
                      key={index}
                      onClick={() => setSelectedHospitalSlug(hospitalSlug)}
                      className={`p-5 border-2 transition-all duration-300 cursor-pointer select-none relative flex flex-col gap-3 group ${isSelected
                        ? "border-primary bg-primary/[0.03] shadow-lg shadow-primary/5 scale-[1.01]"
                        : "border-gray-100 bg-white hover:border-primary/30 hover:bg-gray-50/50 shadow-sm"
                        }`}
                    >
                      {hospitalSlug !== 'unknown' && (
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-1 flex-1">
                            <h1 className={`md:text-lg font-extrabold transition-colors ${isSelected ? 'text-primary' : 'text-gray-800'}`}>
                              {language === 'bn' ? hospitalBnName : hospitalName}
                            </h1>
                            {(hospitalAddress || hospitalBnAddress) && (
                              <div className="flex items-center gap-2 pl-2.5">
                                <MapPin className={`h-4 w-4 shrink-0 transition-colors ${isSelected ? 'text-primary' : 'text-gray-400 group-hover:text-primary/70'}`} />
                                <p className={`md:text-sm font-medium transition-colors ${isSelected ? 'text-primary/80' : 'text-gray-500'}`}>
                                  {language === 'bn' ? hospitalBnAddress : hospitalAddress}
                                </p>
                              </div>
                            )}
                          </div>
                          {/* Custom Radio Button */}
                          <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all mt-0.5 ${isSelected ? 'border-primary bg-primary/10 scale-110' : 'border-gray-300 bg-white'
                            }`}>
                            {isSelected && (
                              <div className="h-2.5 w-2.5 rounded-full bg-primary" />
                            )}
                          </div>
                        </div>
                      )}
                      <div className="space-y-2">
                        {group.slots.map((slot: any, sIdx: number) => (
                          <div key={sIdx} className={`flex items-center gap-2 p-2.5 rounded-xl transition-colors ${isSelected ? 'bg-primary/5' : 'bg-gray-50'
                            }`}>
                            <Clock className={`h-4 w-4 shrink-0 ${isSelected ? 'text-primary' : 'text-gray-400'}`} />
                            <span className={`text-sm font-bold ${isSelected ? 'text-primary-dark' : 'text-gray-600'}`}>
                              {formatSlot(slot)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Book Appointment */}
            <div>
              <div className="space-y-5">
                <Link href={`/doctor/${doctorId}/book?hospital=${selectedHospitalSlug}`}>
                  <Button
                    className="w-full flex justify-center items-center btn-primary btn-slide h-12"
                  >
                    {language === 'bn' ? 'বুক অ্যাপয়েন্টমেন্ট' : 'Book Appointment'}
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />

                  </Button>
                </Link>
              </div>
            </div>

            {/* Fees Section */}
            <Card className="overflow-hidden border-2 border-primary/20 shadow-xl">
              <div className="text-[#193252] p-4 flex items-center justify-center gap-3 border-b border-primary/20">

                <h2 className="text-xl md:text-2xl font-bold">
                  {language === 'bn' ? 'ডাক্তারের পরামর্শ ফি' : 'Consultation Fee'}
                </h2>
              </div>

              <div className="p-6 bg-white">
                <div className="flex flex-col md:flex-row items-stretch justify-center gap-4 md:gap-0 max-w-2xl mx-auto">
                  {/* New Patient Fee */}
                  <div className="flex-1 text-center md:border-r border-primary/10 py-2">
                    <p className="text-sm text-gray-500 font-bold mb-1">
                      {language === 'bn' ? 'নতুন রোগী:' : 'New Patient:'}
                    </p>
                    <p className="text-xl font-bold ">
                      {language === 'bn' ? (doctor.newPatientFeeBn !== undefined && doctor.newPatientFeeBn !== null ? doctor.newPatientFeeBn : '0') : (doctor.newPatientFee !== undefined && doctor.newPatientFee !== null ? doctor.newPatientFee : '0')} ৳
                    </p>
                  </div>

                  {/* Report Show Fee */}
                  <div className="flex-1 text-center py-2">
                    <p className="text-sm text-gray-500 font-bold mb-1">
                      {language === 'bn' ? 'রিপোর্ট দেখানো:' : 'Report Show:'}
                    </p>
                    <p className="text-xl font-bold ">
                      {language === 'bn' ? (doctor.reportShowFeeBn !== undefined && doctor.reportShowFeeBn !== null ? doctor.reportShowFeeBn : '0') : (doctor.reportShowFee !== undefined && doctor.reportShowFee !== null ? doctor.reportShowFee : '0')} ৳
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Hospital Schedule */}


            {/* Doctor Rating */}
            {/* {doctor.rating && doctor.rating > 0 && (
              <Card className="p-6 bg-white border-2 border-primary/10 shadow-lg">
                <h2
                  className="text-xl font-bold  mb-4"
                  
                >
                  ডাক্তার রেটিং
                </h2>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-8 w-8 ${
                          star <= Math.round(doctor.rating!)
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                  <p
                    className="text-2xl font-bold  mb-1"
                    
                  >
                    {doctor.rating.toFixed(2)}
                  </p>
                  <p
                    className="text-sm "
                    
                  >
                    ৫ এর ভেতর {doctor.rating.toFixed(2)}
                  </p>
                  <Button
                    className="mt-4 w-full"
                    
                  >
                    রেট ডাক্তার
                  </Button>
                </div>
              </Card>
            )} */}
          </div>

          {/* Mobile Layout - Reordered */}
          <div className="lg:hidden space-y-6">
            {/* Fees Section - Mobile */}
            <Card className="overflow-hidden border-2 border-primary/20 shadow-xl">
               <div className="text-[#193252] p-4 flex items-center justify-center gap-3 border-b border-primary/20">

                <h2 className="text-xl md:text-2xl font-bold">
                  {language === 'bn' ? 'ডাক্তারের পরামর্শ ফি' : 'Consultation Fee'}
                </h2>
              </div>

              <div className="p-6 bg-white">
                <div className="flex items-center justify-between gap-2">
                  {/* New Patient */}
                  <div className="flex-1 text-center border-r border-primary/10">
                    <p className="text-[10px] text-gray-500 font-bold mb-1 h-8 flex items-center justify-center">
                      {language === 'bn' ? 'নতুন রোগী' : 'New Patient'}
                    </p>
                    <p className="text-lg font-bold ">
                      {language === 'bn' ? (doctor.newPatientFeeBn !== undefined && doctor.newPatientFeeBn !== null ? doctor.newPatientFeeBn : '0') : (doctor.newPatientFee !== undefined && doctor.newPatientFee !== null ? doctor.newPatientFee : '0')} ৳
                    </p>
                  </div>

                  {/* Report Show */}
                  <div className="flex-1 text-center">
                    <p className="text-[10px] text-gray-500 font-bold mb-1 h-8 flex items-center justify-center">
                      {language === 'bn' ? 'রিপোর্ট দেখানো' : 'Report Show'}
                    </p>
                    <p className="text-lg font-bold ">
                      {language === 'bn' ? (doctor.reportShowFeeBn !== undefined && doctor.reportShowFeeBn !== null ? doctor.reportShowFeeBn : '0') : (doctor.reportShowFee !== undefined && doctor.reportShowFee !== null ? doctor.reportShowFee : '0')} ৳
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            <Card id="schedule" className="p-6 bg-gradient-to-br from-white to-indigo-50/50 border-2 border-primary/20 shadow-xl ">
              <h2 className="text-xl md:text-2xl font-bold mb-5 text-gray-900 flex items-center gap-2">
                <Building2 className="h-6 w-6 text-primary" />
                {language === 'bn' ? 'চেম্বার নির্বাচন করুন' : 'Select Chamber'}
              </h2>
              <div className="space-y-4">
                {groupedAvailability.map((group: any, index: number) => {
                  const hospitalSlug = group.hospital;
                  const hObj = hospitals.find(h => h.slug === hospitalSlug || (h as any).slug === hospitalSlug);
                  const hospitalName = hObj?.name || hospitalSlug;
                  const hospitalBnName = hObj?.nameBn || hospitalName;
                  const hospitalAddress = hObj?.address || '';
                  const hospitalBnAddress = hObj?.addressBn || '';
                  const isSelected = selectedHospitalSlug === hospitalSlug;

                  return (
                    <div
                      key={index}
                      onClick={() => setSelectedHospitalSlug(hospitalSlug)}
                      className={`p-5 border-2 transition-all duration-300 cursor-pointer select-none relative flex flex-col gap-3 group ${isSelected
                        ? "border-primary bg-primary/[0.03] shadow-lg shadow-primary/5 scale-[1.01]"
                        : "border-gray-100 bg-white hover:border-primary/30 hover:bg-gray-50/50 shadow-sm"
                        }`}
                    >
                      {hospitalSlug !== 'unknown' && (
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-2.5">
                            <MapPin className={`h-5 w-5 shrink-0 transition-colors ${isSelected ? 'text-primary' : 'text-gray-400 group-hover:text-primary/70'}`} />
                            <div className="flex flex-col gap-1">
                              <p className={`md:text-lg font-extrabold transition-colors ${isSelected ? 'text-primary' : 'text-gray-800'}`}>
                                {language === 'bn' ? hospitalBnName : hospitalName}
                              </p>
                              <p className={`md:text-sm font-medium transition-colors ${isSelected ? 'text-primary/80' : 'text-gray-500'}`}>
                                {language === 'bn' ? hospitalBnAddress : hospitalAddress}
                              </p>
                            </div>
                          </div>
                          {/* Custom Radio Button */}
                          <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${isSelected ? 'border-primary bg-primary/10 scale-110' : 'border-gray-300 bg-white'
                            }`}>
                            {isSelected && (
                              <div className="h-2.5 w-2.5 rounded-full bg-primary" />
                            )}
                          </div>
                        </div>
                      )}
                      <div className="space-y-2 pl-7">
                        {group.slots.map((slot: any, sIdx: number) => (
                          <div key={sIdx} className={`flex items-start gap-2.5 p-2.5 rounded-xl transition-colors ${isSelected ? 'bg-primary/5' : 'bg-gray-50'
                            }`}>
                            <Clock className={`h-4 w-4 shrink-0 mt-0.5 ${isSelected ? 'text-primary' : 'text-gray-400'}`} />
                            <span className={`text-sm font-bold ${isSelected ? 'text-primary-dark' : 'text-gray-600'}`}>
                              {formatSlot(slot)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>



            {/* Book Appointment - Mobile */}
            <Card className="p-6 bg-gradient-to-br from-white to-blue-50 border-2 border-primary/20 shadow-xl">
              <h2 className="text-xl md:text-2xl font-bold mb-5 text-gray-900">
                {language === 'bn' ? 'অ্যাপয়েন্টমেন্ট বুক করুন' : 'Book Appointment'}
              </h2>
              <div className="space-y-5">
                <Link href={`/doctor/${doctorId}/book?hospitalSlug=${encodeURIComponent(selectedHospitalSlug)}`}>
                   <Button
                    className="w-full flex justify-center items-center btn-primary btn-slide h-12"
                  >
                    {language === 'bn' ? 'বুক অ্যাপয়েন্টমেন্ট' : 'Book Appointment'}
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />

                  </Button>
                </Link>
              </div>
            </Card>

            {/* Related Doctors - Mobile (shown after Book Appointment) */}
            {relatedDoctors.length > 0 && (
              <Card className="p-8 bg-gradient-to-br from-white to-purple-50 border-2 border-primary/20 shadow-xl">
                <h2
                  className="text-2xl md:text-3xl font-bold  mb-6"

                >
                  {language === 'bn' ? 'সংশ্লিষ্ট ডাক্তার' : 'Related Doctors'}
                </h2>
                <div className="grid grid-cols-1 gap-5">
                  {enrichedRelatedDoctors.map((relatedDoctor, index) => (
                    <DoctorCard key={relatedDoctor._id as string} doctor={relatedDoctor as any} index={index} />
                  ))}
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

