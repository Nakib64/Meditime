"use client";

import { motion, AnimatePresence, useInView, useSpring, useTransform } from "framer-motion";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Heart,
  Search,
  MapPin,
  Phone,
  User,
  Droplet,
  PlusCircle,
  ShieldCheck,
  ChevronRight,
  Filter,
  CheckCircle2,
  Users,
  Loader2,
  Clock,
  RotateCcw
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useLanguage, getLocalizedValue } from "@/contexts/LanguageContext";
import { useState, useEffect, useCallback, useRef } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { homepageTranslations } from "@/lib/homepage-translations";
import { PiDropDuotone, PiCheckCircleDuotone, PiShieldCheckDuotone, PiClockDuotone } from "react-icons/pi";
import toast from "react-hot-toast";
import { formatAvailabilityStatus, formatLastDonation } from "@/lib/blood-donor-utils";

const bloodGroups = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];

/**
 * Counter Component (Matches Homepage)
 */
function Counter({ value, suffix = "" }: { value: number | string; suffix?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.5 });

  const numericValue = typeof value === 'number' ? value : parseInt(value);
  const isNumeric = !isNaN(numericValue);

  const spring = useSpring(0, {
    stiffness: 40,
    damping: 20,
    restDelta: 0.001
  });

  const displayValue = useTransform(spring, (current) => Math.floor(current));

  useEffect(() => {
    if (isInView && isNumeric) {
      spring.set(numericValue);
    }
  }, [isInView, spring, numericValue, isNumeric]);

  return (
    <span ref={ref} className="text-2xl">
      {isNumeric ? <motion.span className="text-4xl">{displayValue}</motion.span> : <motion.span >{value}</motion.span>}
      {suffix}
    </span>
  );
}

export default function BloodDonorPage() {
  const { language } = useLanguage() as { language: 'en' | 'bn' };
  const [selectedGroup, setSelectedGroup] = useState("");
  const [divisions, setDivisions] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [thanas, setThanas] = useState<any[]>([]);
  const [selectedDivision, setSelectedDivision] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedThana, setSelectedThana] = useState("");
  const [donors, setDonors] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const tH = homepageTranslations[language].hospitalsPage;

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    nameBn: "",
    phoneNumber: "",
    bloodGroup: "A+",
    division: "",
    district: "",
    thana: "",
    availabilityStatus: "Available",
    lastDonationDate: "Never",
  });

  const fetchDivisions = useCallback(async () => {
    try {
      const res = await fetch("/api/locations/divisions");
      const data = await res.json();
      if (res.ok) setDivisions(data.divisions);
    } catch (error) {
      console.error("Error fetching divisions:", error);
    }
  }, []);

  const fetchDistricts = useCallback(async (divisionId: string, target: 'filter' | 'modal' = 'filter') => {
    try {
      const div = divisions.find(d => d._id === divisionId || d.name === divisionId);
      if (!div) return;
      const res = await fetch(`/api/locations/districts?division=${div._id}`);
      const data = await res.json();
      if (res.ok) {
        if (target === 'filter') setDistricts(data.districts);
        return data.districts;
      }
    } catch (error) {
      console.error("Error fetching districts:", error);
    }
  }, [divisions]);

  const fetchThanas = useCallback(async (districtId: string, target: 'filter' | 'modal' = 'filter') => {
    try {
      const dist = districts.find(d => d._id === districtId || d.name === districtId);
      if (!dist) return;
      const res = await fetch(`/api/locations/thanas?district=${dist._id}`);
      const data = await res.json();
      if (res.ok) {
        if (target === 'filter') setThanas(data.thanas);
        return data.thanas;
      }
    } catch (error) {
      console.error("Error fetching districts:", error);
    }
  }, [districts]);

  useEffect(() => {
    fetchDivisions();
  }, [fetchDivisions]);

  useEffect(() => {
    if (selectedDivision) {
      fetchDistricts(selectedDivision);
    } else {
      setDistricts([]);
    }
    setSelectedDistrict("");
  }, [selectedDivision, fetchDistricts]);

  useEffect(() => {
    if (selectedDistrict) {
      fetchThanas(selectedDistrict);
    } else {
      setThanas([]);
    }
  }, [selectedDistrict, fetchThanas]);

  const performSearch = async (group = selectedGroup, divisionId = selectedDivision, districtId = selectedDistrict, thanaId = selectedThana) => {
    setLoading(true);
    try {
      let url = `/api/blood-donors?`;
      if (group) url += `bloodGroup=${encodeURIComponent(group)}&`;
      if (divisionId) {
        const div = divisions.find(d => d._id === divisionId);
        if (div) url += `division=${encodeURIComponent(div.name)}&`;
      }
      if (districtId) {
        const dist = districts.find(d => d._id === districtId);
        if (dist) url += `district=${encodeURIComponent(dist.name)}&`;
      }
      if (thanaId) {
        const th = thanas.find(t => t._id === thanaId);
        if (th) url += `thana=${encodeURIComponent(th.name)}&`;
      }

      const res = await fetch(url);
      const data = await res.json();
      if (res.ok) {
        setDonors(data.bloodDonors);
      }
    } catch (error) {
      console.error("Error searching donors:", error);
    } finally {
      setLoading(false);
    }
  };



  // Modal Specific States
  const [modalDistricts, setModalDistricts] = useState<any[]>([]);
  const [modalThanas, setModalThanas] = useState<any[]>([]);

  const handleModalDivisionChange = async (val: string) => {
    setFormData(prev => ({ ...prev, division: val, district: "", thana: "" }));
    const dists = await fetchDistricts(val, 'modal');
    if (dists) setModalDistricts(dists);
  };

  const handleModalDistrictChange = async (val: string) => {
    setFormData(prev => ({ ...prev, district: val, thana: "" }));
    const districtObj = modalDistricts.find(d => d.name === val);
    if (!districtObj) return;
    const response = await fetch(`/api/locations/thanas?district=${districtObj._id}`);
    const data = await response.json();
    if (response.ok) setModalThanas(data.thanas);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/blood-donors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (response.ok) {
        toast.success(language === 'bn' ? "আবেদন সফলভাবে জমা হয়েছে!" : "Application submitted successfully!");
        setIsModalOpen(false);  
        
        setFormData({
          name: "",
          nameBn: "",
          phoneNumber: "",
          bloodGroup: "A+",
          division: "",
          district: "",
          thana: "",
          availabilityStatus: "Available",
          lastDonationDate: "Never",
        });
      } else {
        const data = await response.json();
        toast.error(data.error || "Something went wrong");
      }
    } catch (error) {
      toast.error("Network error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const scrollToJoin = () => {
    const section = document.getElementById("join-section");
    if (section) section.scrollIntoView({ behavior: "smooth" });
  };

  const t = {
    title: { en: "Find a Blood Donor", bn: "কারো জীবনের গল্পে আপনিও হোন একজন হিরো" },
    subtitle: { en: "Meditime connects life-saving blood donors with patients in need across Bangladesh.", bn: "সমগ্র বাংলাদেশ জুড়ে মুমূর্ষু মানুষের পাশে জীবন রক্ষাকারী রক্তদাতাদের পৌঁছে দিচ্ছে মেডিটাইম।" },
    searchBtn: { en: "Search Donors", bn: "দাতা খুঁজুন" },
    becomeDonor: { en: "Become a Blood Donor", bn: "রক্তদাতা হোন" },
    socialProof: {
      quantity: { en: "Register Donor", bn: "নিবন্ধিত দাতা" },
      success: { en: "Successful Register", bn: "সফল নিবন্ধন" },
      verified: { en: "Verified Donor", bn: "ভেরিফাইড দাতা" },
      responseTime: { en: "Response Time", bn: "রেসপন্স টাইম" },
      verifiedLabel: { en: "Trusted & Secure", bn: "বিশ্বস্ত ও নিরাপদ" },
      responseTimeLabel: { en: "30 Minutes", bn: "৩০ মিনিট" },
    },
    card: {
      address: { en: "Address", bn: "ঠিকানা" },
      status: { en: "Status", bn: "অবস্থা" },
      verified: { en: "Verified", bn: "ভেরিফাইড" },
      callNow: { en: "Call Now", bn: "কল করুন" }
    }
  };

  const socialProof = [
    { label: t.socialProof.quantity[language], value: 1000, suffix: "+", icon: PiDropDuotone },
    { label: t.socialProof.success[language], value: 1000, suffix: "+", icon: PiCheckCircleDuotone },
    { label: t.socialProof.verified[language], value: t.socialProof.verifiedLabel[language], suffix: "", icon: PiShieldCheckDuotone },
    { label: t.socialProof.responseTime[language], value: t.socialProof.responseTimeLabel[language], suffix: "", icon: PiClockDuotone },
  ];

  useEffect(() => {
    performSearch(selectedGroup, selectedDivision, selectedDistrict, selectedThana);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedGroup, selectedDivision, selectedDistrict, selectedThana]);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      {/* ── NEW HERO SECTION (Using Service Component Image) ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="relative  h-[450px] md:h-[650px] w-full overflow-hidden"
      >
        <div
          className="absolute inset-0 bg-cover bg-[position:95%_center] lg:bg-center bg-no-repeat"
          style={{
            backgroundImage: "url('/hero/blood.png')",
          }}
        />
        <div className="relative z-20 h-full flex flex-col max-w-7xl mx-auto justify-center px-4 sm:px-6 lg:px-8 text-center lg:text-left  ">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <h1 className="text-2xl md:text-5xl lg:text-[50px] font-bold text-white mb-6 drop-shadow-2xl leading-tight">
              {language === 'en' ? "Be a Hero in Someone's Story" : "কারো জীবনের গল্পে নায়ক হয়ে উঠুন"}
            </h1>
            <p className="text-[16px] md:text-xl text-white max-w-2xl mb-8">
              {t.subtitle[language]}
            </p>

            <Button
              onClick={scrollToJoin}
              className="btn-primary btn-slide h-14 text-md md:text-lg"
            >
              {language === 'en' ? "Be a Donor" : "রক্তদাতা হোন"}
              <ChevronRight className="w-5 h-5" />
            </Button>
          </motion.div>
        </div>
      </motion.div>

      {/* ── Social Proof Section (Using Primary Color) ── */}
      <div className="relative mt-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-18">
          {socialProof.map(({ value, suffix, label, icon: Icon }, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
            >
              <div className="btn-slide group flex flex-col items-center text-center rounded-3xl btn-primary min-h-[100px] h-full justify-center">
                <div className=" pt-4 transition-all duration-300 group-hover:scale-110 group-hover:brightness-125">
                  <Icon size={56} height="duotone" />
                </div>
                <div className="text-[32px] md:text-[30px] font-bold text-white mb-1 leading-none">
                  <Counter value={value} suffix={suffix} />
                </div>
                <div className="text-[14px] lg:pb-4 md:text-[16px] text-teal-100/70 font-bold uppercase tracking-wider">
                  {label}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Original Search Section (Using Primary Color) */}
      <section className="py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="p-8 rounded-[3rem] shadow-2xl border-none bg-white mb-12">
            <h3 className="text-2xl font-black text-slate-900 mb-8 flex items-center gap-2">
              {loading ? (
                <Loader2 className="w-6 h-6 text-primary animate-spin" />
              ) : (
                <Search className="w-6 h-6 text-primary" />
              )}
              {t.title[language]}
            </h3>

            <div className="space-y-6">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">
                  {language === 'en' ? "Blood Group" : "রক্তের গ্রুপ"}
                </label>
                <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
                  {bloodGroups.map(group => (
                    <button
                      key={group}
                      onClick={() => setSelectedGroup(group === selectedGroup ? "" : group)}
                      className={`h-12 rounded-xl font-bold flex items-center justify-center transition-all ${selectedGroup === group
                        ? "bg-primary text-white shadow-lg shadow-primary/20"
                        : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                        }`}
                    >
                      {group}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">
                    {language === 'en' ? "Division" : "বিভাগ"}
                  </label>
                  <select
                    value={selectedDivision}
                    onChange={(e) => {
                      setSelectedDivision(e.target.value);
                      setSelectedDistrict("");
                      setSelectedThana("");
                    }}
                    className="w-full h-14 px-4 bg-slate-50 border-none rounded-xl font-medium focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="">{language === 'en' ? "Select Division" : "বিভাগ নির্বাচন করুন"}</option>
                    {divisions.map((div) => (
                      <option key={div._id} value={div._id}>
                        {div.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">
                    {language === 'en' ? "District" : "জেলা"}
                  </label>
                  <select
                    value={selectedDistrict}
                    onChange={(e) => {
                      setSelectedDistrict(e.target.value);
                      setSelectedThana("");
                    }}
                    disabled={!selectedDivision}
                    className="w-full h-14 px-4 bg-slate-50 border-none rounded-xl font-medium focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
                  >
                    <option value="">{language === 'en' ? "Select District" : "জেলা নির্বাচন করুন"}</option>
                    {districts.map((dist) => (
                      <option key={dist._id} value={dist._id}>
                        {dist.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">
                    {language === 'en' ? "Thana" : "থানা"}
                  </label>
                  <select
                    value={selectedThana}
                    onChange={(e) => setSelectedThana(e.target.value)}
                    disabled={!selectedDistrict}
                    className="w-full h-14 px-4 bg-slate-50 border-none rounded-xl font-medium focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
                  >
                    <option value="">{language === 'en' ? "Select Thana" : "থানা নির্বাচন করুন"}</option>
                    {thanas.map((thana) => (
                      <option key={thana._id} value={thana._id}>
                        {thana.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <AnimatePresence>
                {(selectedGroup || selectedDivision || selectedDistrict || selectedThana) && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex justify-end pt-4 border-t border-slate-100 overflow-hidden"
                  >
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedGroup("");
                        setSelectedDivision("");
                        setSelectedDistrict("");
                        setSelectedThana("");
                      }}
                      className="flex items-center gap-2 px-5 py-2.5 text-sm text-slate-600 hover:text-slate-900 border-slate-200 hover:border-slate-300 transition-all duration-200"
                    >
                      <RotateCcw className="h-4 w-4" />
                      {language === 'bn' ? 'রিসেট' : 'Reset'}
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </Card>

          {/* Results Grid */}
          <AnimatePresence>
            {donors?.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                id="results"
                className=""
              >
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-black text-slate-900">
                    {language === 'en' ? "Search Results" : "অনুসন্ধানের ফলাফল"}
                    <span className="ml-3 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm">
                      {donors.length}
                    </span>
                  </h2>
                </div>

                {donors.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {donors.map((donor) => (
                      <motion.div key={donor._id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                        <Card className="p-6 rounded-[2rem] border-none shadow-lg hover:shadow-xl transition-all bg-white relative overflow-hidden">
                          <div className="flex items-center gap-4 mb-6">
                            <div className="relative w-14 h-14 rounded-2xl overflow-hidden bg-slate-100 ring-4 ring-slate-50 flex items-center justify-center">
                              <Image src={'/blood-drop.png'} alt={donor.name} width={50} height={50} className="h-6 w-6" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <h3 className="font-bold text-lg text-slate-900 ">{getLocalizedValue(donor.name, donor.nameBn, language)}</h3>

                              </div>
                              {donor.isApproved && (
                                <span className="text-[10px] font-bold text-primary uppercase bg-primary/5 px-2 py-0.5 rounded border border-primary/10">
                                  {t.card.verified[language]}
                                </span>
                              )}
                              <div className="flex items-center gap-2 mt-1">
                              </div>
                            </div>
                            <div className="ml-auto w-12 h-12 rounded-xl bg-primary text-white flex items-center justify-center font-black text-lg shadow-lg shadow-primary/20 shrink-0">{donor.bloodGroup}</div>
                          </div>

                          <div className="space-y-3 mb-6">
                            <div className="flex items-center justify-between gap-2 text-sm">
                              <span className="text-slate-500 font-medium">{t.card.status[language]} : </span>
                              <span className={`font-bold ${donor.availabilityStatus === 'Available' ? 'text-green-500' : 'text-orange-500'}`}>
                                {formatAvailabilityStatus(donor.availabilityStatus, language)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between gap-2 text-sm">
                              <span className="text-slate-500 font-medium">{language === 'en' ? "Last Donation : " : "শেষ রক্তদান : "}</span>
                              <span className="font-bold text-slate-700">{formatLastDonation(donor.lastDonationDate, language)}</span>
                            </div>
                            <div className="flex items-center justify-between gap-2 text-sm">
                              <span className="text-slate-500 font-medium">{language === 'en' ? "Address : " : "ঠিকানা : "}</span>
                              <span className="font-bold text-slate-700">
                                {language === 'bn'
                                  ? [donor.thanaBn || donor.thana, donor.districtBn || donor.district].filter(Boolean).join(", ")
                                  : [donor.thana, donor.district].filter(Boolean).join(", ") || 'N/A'}
                              </span>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <a href={`tel:${donor.phoneNumber}`} className="btn-primary btn-slide h-10 flex-1 flex items-center justify-center gap-2 text-sm rounded-xl">
                              <Phone className="w-4 h-4 fill-white" />
                              {t.card.callNow[language]}
                            </a>
                          </div>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-20 bg-white rounded-[3rem] border-2 border-dashed border-slate-200">
                    <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-6"><Users className="w-10 h-10 text-slate-300" /></div>
                    <h3 className="text-xl font-black text-slate-900 mb-2">{language === 'en' ? "No Donors Found" : "কোনো রক্তদাতা পাওয়া যায়নি"}</h3>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* ── Join Section (Using Primary Color) ── */}
      <section id="join-section" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="relative">
              <div className="aspect-[4/5] relative rounded-[3rem] overflow-hidden shadow-2xl">
                <Image src="/hero/blood2.png" alt="Blood Donation" fill className="object-cover" />
              </div>
              <div className="absolute bottom-10 -right-10 bg-white p-8 rounded-[2rem] shadow-2xl border border-slate-100 hidden md:block max-w-[280px]">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-green-100 text-green-600 flex items-center justify-center"><CheckCircle2 className="w-6 h-6" /></div>
                  <p className="font-black text-slate-800">{language === 'en' ? "Free Service" : "ফ্রি সার্ভিস"}</p>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">
                  {language === 'en' ? "MediTime doesn't charge users for blood donor services. It's built for society." : "মেডিটাইম রক্তদাতার সেবার জন্য কোন চার্জ নেয় না। এটি সমাজের জন্য নির্মিত।"}
                </p>
              </div>
            </div>

            <div>
              <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-8 leading-tight">
                {language === 'en' ? "Be a Hero in Someone's Story" : "কারো জীবনের গল্পে নায়ক হয়ে উঠুন"}
              </h2>
              <div className="space-y-10">
                {[
                  { icon: <Users className="w-6 h-6" />, title: { en: "Community Driven", bn: "কমিউনিটি ভিত্তিক" }, desc: { en: "Our platform is built by the community for the community. Every donor is a verified hero.", bn: "আমাদের প্ল্যাটফর্মটি কমিউনিটির জন্য নির্মিত। প্রতিটি রক্তদাতা আমাদের কাছে নায়ক।" } },
                  { icon: <ShieldCheck className="w-6 h-6" />, title: { en: "Secure Contact", bn: "নিরাপদ যোগাযোগ" }, desc: { en: "We ensure that your contact information is protected and only shared with verified users in need.", bn: "আমরা নিশ্চিত করি আপনার যোগাযোগের তথ্য নিরাপদ এবং শুধুমাত্র প্রয়োজনে যাচাইকৃত ব্যক্তিদের সাথে শেয়ার করা হয়।" } }
                ].map((item, i) => (
                  <div key={i} className="flex gap-6">
                    <div className="w-14 h-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center shrink-0">{item.icon}</div>
                    <div>
                      <h4 className="text-xl font-bold text-slate-900 mb-2">{item.title[language]}</h4>
                      <p className="text-slate-500 leading-relaxed">{item.desc[language]}</p>
                    </div>
                  </div>
                ))}

                <div className="pt-6">
                  {/* MODAL TRIGGER BUTTON */}
                  <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                    <DialogTrigger asChild>
                      <Button className="h-16 px-10 btn-primary btn-slide">
                        <PlusCircle className="w-6 h-6" />
                        {t.becomeDonor[language]}
                        <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle className="text-primary">{t.becomeDonor[language]}</DialogTitle>
                        <DialogDescription>{language === 'bn' ? 'রক্তদাতা হিসেবে আবেদন করতে নিচের ফর্মটি পূরণ করুন।' : 'Fill out the form below to apply as a blood donor.'}</DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2"><Label>{language === 'bn' ? 'পূর্ণ নাম (English)' : 'Full Name (English)'} *</Label><Input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="John Doe" /></div>
                          <div className="space-y-2"><Label>{language === 'bn' ? 'পূর্ণ নাম (বাংলা)' : 'Full Name (বাংলা)'}</Label><Input value={formData.nameBn} onChange={e => setFormData({ ...formData, nameBn: e.target.value })} placeholder="জন ডো" /></div>
                          <div className="space-y-2">
                            <Label>{language === 'bn' ? 'ফোন নম্বর' : 'Phone Number'} *</Label>
                            <div className="relative flex items-center">
                              <span className="absolute left-3 flex items-center gap-1.5 text-gray-500 text-sm border-r pr-2 h-6 border-gray-300 pointer-events-none select-none">
                                <img src="https://flagcdn.com/w40/bd.png" alt="BD" className="w-6 h-4 rounded-sm object-cover" />
                                <span>+88</span>
                              </span>
                              <Input
                                required
                                type="tel"
                                maxLength={11}
                                placeholder="01XXXXXXXXX"
                                value={formData.phoneNumber}
                                onChange={(e) => {
                                  const val = e.target.value.replace(/\D/g, '').slice(0, 11);
                                  setFormData({ ...formData, phoneNumber: val });
                                }}
                                className="pl-[5rem] w-full"
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>{language === 'bn' ? 'রক্তের গ্রুপ' : 'Blood Group'} *</Label>
                            <select required value={formData.bloodGroup} onChange={e => setFormData({ ...formData, bloodGroup: e.target.value })} className="w-full h-10 px-3 border border-gray-300 rounded-md bg-white">{bloodGroups.map(g => <option key={g} value={g}>{g}</option>)}</select>
                          </div>
                          <div className="space-y-2">
                            <Label>{language === 'bn' ? 'বিভাগ' : 'Division'} *</Label>
                            <select required value={formData.division} onChange={e => handleModalDivisionChange(e.target.value)} className="w-full h-10 px-3 border border-gray-300 rounded-md bg-white">
                              <option value="">{tH.selectDivision}</option>
                              {divisions.map(d => <option key={d._id} value={d.name}>{d.name}</option>)}
                            </select>
                          </div>
                          <div className="space-y-2">
                            <Label>{language === 'bn' ? 'জেলা' : 'District'} *</Label>
                            <select required value={formData.district} onChange={e => handleModalDistrictChange(e.target.value)} disabled={!formData.division} className="w-full h-10 px-3 border border-gray-300 rounded-md bg-white disabled:opacity-50">
                              <option value="">{tH.selectDistrict}</option>
                              {modalDistricts.map(d => <option key={d._id} value={d.name}>{d.name}</option>)}
                            </select>
                          </div>
                          <div className="space-y-2">
                            <Label>{language === 'bn' ? 'থানা' : 'Thana'} *</Label>
                            <select required value={formData.thana} onChange={e => setFormData({ ...formData, thana: e.target.value })} disabled={!formData.district} className="w-full h-10 px-3 border border-gray-300 rounded-md bg-white disabled:opacity-50">
                              <option value="">{tH.selectThana}</option>
                              {modalThanas.map(d => <option key={d._id} value={d.name}>{d.name}</option>)}
                            </select>
                          </div>
                          <div className="space-y-2">
                            <Label>{language === 'bn' ? 'অবস্থা' : 'Status'} *</Label>
                            <select required value={formData.availabilityStatus} onChange={e => setFormData({ ...formData, availabilityStatus: e.target.value })} className="w-full h-10 px-3 border border-gray-300 rounded-md bg-white">
                              <option value="Available">{language === 'bn' ? 'উপলব্ধ' : 'Available'}</option>
                              <option value="Unavailable">{language === 'bn' ? 'অনুপলব্ধ' : 'Unavailable'}</option>
                              <option value="Recently Donated">{language === 'bn' ? 'সম্প্রতি দিয়েছেন' : 'Recently Donated'}</option>
                            </select>
                          </div>
                          <div className="space-y-2">
                            <Label>{language === 'bn' ? 'শেষ রক্তদান' : 'Last Donation'} *</Label>
                            <select required value={formData.lastDonationDate} onChange={e => setFormData({ ...formData, lastDonationDate: e.target.value })} className="w-full h-10 px-3 border border-gray-300 rounded-md bg-white">
                              <option value="Never">{language === 'bn' ? 'কখনো নয়' : 'Never'}</option>
                              <option value="Within 3 months">{language === 'bn' ? '৩ মাসের মধ্যে' : 'Within 3 months'}</option>
                              <option value="Over 3 months ago">{language === 'bn' ? '৩ মাসের বেশি আগে' : 'Over 3 months ago'}</option>
                            </select>
                          </div>
                        </div>
                        <div className="pt-4"><Button type="submit" disabled={isSubmitting} className="w-full bg-primary hover:bg-primary/90 text-white font-bold">{isSubmitting ? (language === 'bn' ? 'প্রক্রিয়াধীন...' : 'Submitting...') : (language === 'bn' ? 'আবেদন জমা দিন' : 'Submit Application')}</Button></div>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="bg-[var(--background-dark)] rounded-[3.5rem] p-12 md:p-24 text-center relative overflow-hidden">
            <div className="absolute top-0 left-1/2 w-full h-full " />
            <div className="relative z-10">
              <h2 className="text-3xl md:text-6xl font-black text-white mb-8">{language === 'en' ? "Emergency Need?" : "জরুরি প্রয়োজন?"}</h2>
              <p className="text-white/80 text-xl mb-12 max-w-2xl mx-auto font-medium">{language === 'en' ? "Our support team is available 24/7 to help you find blood in critical situations." : "আপনার জরুরি অবস্থায় রক্তদাতা খুঁজে পেতে আমাদের সাপোর্ট টিম ২৪/৭ প্রস্তুত।"}</p>
              <div className="flex flex-wrap justify-center gap-6">
                <a href={`tel:${"+8801610384444"}`}>

                  <Button className="h-16 px-12 bg-white text-primary text-xl shadow-2xl transition-all active:scale-95">
                    <Phone className="w-6 h-6 mr-3 fill-current" />+8801610384444
                  </Button>
                </a>

              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
