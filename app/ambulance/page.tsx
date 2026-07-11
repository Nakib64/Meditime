"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { MapPin, Phone, Car, Loader2, Search, CheckCircle, BadgeCheck, FileText, X, Contact, ChevronRight, RotateCcw } from "lucide-react";
import { motion, useInView, useSpring, useTransform, AnimatePresence } from "framer-motion";
import { useLanguage, getLocalizedValue } from "@/contexts/LanguageContext";
import { Input } from "@/components/ui/input";
import { homepageTranslations } from "@/lib/homepage-translations";
import { PiAmbulanceDuotone, PiCheckCircleDuotone, PiClockDuotone, PiShieldCheckDuotone, PiPlusCircleDuotone } from "react-icons/pi";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import toast from "react-hot-toast";

interface Ambulance {
  _id: string;
  name: string;
  nameBn?: string;
  phoneNumber: string;
  division?: string;
  divisionBn?: string;
  district?: string;
  districtBn?: string;
  thana?: string;
  thanaBn?: string;
  availabilityStatus: 'Available' | 'On Call' | 'Unavailable';
  vehicleType: string;
  isApproved: boolean;
  ambulanceNumber?: string;
}

interface Division {
  _id: string;
  name: string;
}

interface District {
  _id: string;
  name: string;
  division: Division;
}

interface Thana {
  _id: string;
  name: string;
  district: District;
}

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

export default function AmbulancePage() {
  const [ambulances, setAmbulances] = useState<Ambulance[]>([]);
  const [loading, setLoading] = useState(true);

  // Location filters
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [thanas, setThanas] = useState<Thana[]>([]);

  // Filters
  const [selectedDivision, setSelectedDivision] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedThana, setSelectedThana] = useState("");
  const [availabilityStatusFilter, setAvailabilityStatusFilter] = useState("");
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState("");

  const { language } = useLanguage() as { language: 'en' | 'bn' };
  const t = homepageTranslations[language].ambulance;
  const tH = homepageTranslations[language].hospitalsPage;

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    nameBn: "",
    phoneNumber: "",
    division: "",
    district: "",
    thana: "",
    vehicleType: "AC Ambulance",
    availabilityStatus: "Available",
    ambulanceNumber: "",
    drivingLicence: "",
  });

  const fetchDivisions = async () => {
    try {
      const response = await fetch("/api/locations/divisions");
      const data = await response.json();
      if (response.ok) setDivisions(data.divisions);
    } catch (error) {
      console.error("Error fetching divisions:", error);
    }
  };

  const fetchDistricts = useCallback(async (divisionName: string, target: 'filter' | 'modal' = 'filter') => {
    try {
      const division = divisions.find(d => d.name === divisionName);
      if (!division) return;
      const response = await fetch(`/api/locations/districts?division=${division._id}`);
      const data = await response.json();
      if (response.ok) {
        if (target === 'filter') setDistricts(data.districts);
        return data.districts;
      }
    } catch (error) {
      console.error("Error fetching districts:", error);
    }
  }, [divisions]);

  const fetchThanas = useCallback(async (districtName: string, target: 'filter' | 'modal' = 'filter') => {
    try {
      const district = districts.find(d => d.name === districtName);
      if (!district) return;
      const response = await fetch(`/api/locations/thanas?district=${district._id}`);
      const data = await response.json();
      if (response.ok) {
        if (target === 'filter') setThanas(data.thanas);
        return data.thanas;
      }
    } catch (error) {
      console.error("Error fetching thanas:", error);
    }
  }, [districts]);

  // Modal Specific Location States
  const [modalDistricts, setModalDistricts] = useState<District[]>([]);
  const [modalThanas, setModalThanas] = useState<Thana[]>([]);

  const handleModalDivisionChange = async (val: string) => {
    setFormData(prev => ({ ...prev, division: val, district: "", thana: "" }));
    const dists = await fetchDistricts(val, 'modal');
    if (dists) setModalDistricts(dists);
  };

  const handleModalDistrictChange = async (val: string) => {
    setFormData(prev => ({ ...prev, district: val, thana: "" }));
    // Need to find the district object to get ID for thanas
    const districtObj = modalDistricts.find(d => d.name === val);
    if (!districtObj) return;
    const response = await fetch(`/api/locations/thanas?district=${districtObj._id}`);
    const data = await response.json();
    if (response.ok) setModalThanas(data.thanas);
  };

  const fetchAmbulances = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedDivision) params.append("division", selectedDivision);
      if (selectedDistrict) params.append("district", selectedDistrict);
      if (selectedThana) params.append("thana", selectedThana);
      if (availabilityStatusFilter) params.append("availabilityStatus", availabilityStatusFilter);
      if (vehicleTypeFilter) params.append("vehicleType", vehicleTypeFilter);

      const response = await fetch(`/api/ambulances?${params.toString()}`);
      const data = await response.json();
      if (response.ok) setAmbulances(data.ambulances);
    } catch (error) {
      console.error("Error fetching ambulances:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDivisions();
    fetchAmbulances();
  }, []);

  useEffect(() => {
    if (selectedDivision && divisions.length > 0) {
      fetchDistricts(selectedDivision);
      setSelectedDistrict("");
      setSelectedThana("");
    } else if (!selectedDivision) {
      setDistricts([]);
      setThanas([]);
    }
  }, [selectedDivision, divisions, fetchDistricts]);

  useEffect(() => {
    if (selectedDistrict && districts.length > 0) {
      fetchThanas(selectedDistrict);
      setSelectedThana("");
    } else if (!selectedDistrict) {
      setThanas([]);
    }
  }, [selectedDistrict, districts, fetchThanas]);

  useEffect(() => {
    fetchAmbulances();
  }, [selectedDivision, selectedDistrict, selectedThana, availabilityStatusFilter, vehicleTypeFilter]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/ambulances", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (response.ok) {
        toast.success(language === 'bn' ? "আবেদন সফলভাবে পাঠানো হয়েছে!" : "Application submitted successfully!");
        setIsModalOpen(false);
        setFormData({
          name: "",
          nameBn: "",
          phoneNumber: "",
          division: "",
          district: "",
          thana: "",
          vehicleType: "AC Ambulance",
          availabilityStatus: "Available",
          ambulanceNumber: "",
          drivingLicence: "",
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

  const socialProof = [
    { label: t.socialProof.quantity, value: 1000, suffix: "+", icon: PiAmbulanceDuotone },
    { label: t.socialProof.success, value: 1000, suffix: "+", icon: PiCheckCircleDuotone },
    { label: t.socialProof.verified, value: t.socialProof.verifiedLabel, suffix: "", icon: PiShieldCheckDuotone },
    { label: t.socialProof.responseTime, value: t.socialProof.responseTimeLabel, suffix: "", icon: PiClockDuotone },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="relative  h-[450px] md:h-[650px] w-full overflow-hidden"
      >
        <div
          className="absolute inset-0 bg-cover bg-[position:80%_center] lg:bg-center bg-no-repeat"
          style={{
            backgroundImage: "url('/hero/ambulance.png')",
          }}
        />
        <div className="relative z-20 h-full flex items-center justify-center px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl w-full mx-auto text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <h1 className="text-2xl md:text-6xl lg:text-[50px] font-bold text-white mb-6 drop-shadow-2xl leading-tight">
                {t.title}
              </h1>
              <p className="text-[16px] md:text-xl text-white/95 mb-8 drop-shadow-lg max-w-3xl leading-relaxed">
                {t.subtitle}
              </p>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* ── Social Proof Section ── */}
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
                <div className="pt-4 text-[#20E7E7] transition-all duration-300 group-hover:scale-110 group-hover:brightness-125">
                  <Icon size={50} height="duotone" />
                </div>
                <div className="text-[30px] font-bold text-white ">
                  <Counter value={value} suffix={suffix} />
                </div>
                <div className="text-[16px]  lg:pb-4 text-teal-100/70 font-bold uppercase tracking-wider">
                  {label}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 py-8 mt-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Filters (Original Design Style) */}
          <Card className="p-6 mb-8 border border-gray-200">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <h2 className="text-xl font-bold text-[#009A98]">{t.findByLocation}</h2>
              <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogTrigger asChild>
                  <Button className="btn-primary btn-slide font-semibold flex justify-center items-center gap-2">
                    {t.becomePartnerBtn}
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{t.becomePartnerBtn}</DialogTitle>
                    <DialogDescription>
                      {language === 'bn' ? 'অ্যাম্বুলেন্স পার্টনার হিসেবে আবেদন করতে নিচের ফর্মটি পূরণ করুন।' : 'Fill out the form below to apply as an ambulance partner.'}
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>{language === 'bn' ? 'অ্যাম্বুলেন্সের নাম (English)' : 'Ambulance Name (English)'} *</Label>
                        <Input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. City Ambulance" />
                      </div>
                      <div className="space-y-2">
                        <Label>{language === 'bn' ? 'অ্যাম্বুলেন্সের নাম (বাংলা)' : 'Ambulance Name (Bangla)'}</Label>
                        <Input value={formData.nameBn} onChange={e => setFormData({ ...formData, nameBn: e.target.value })} placeholder="উদা: সিটি অ্যাম্বুলেন্স" />
                      </div>
                      <div className="space-y-2">
                        <Label>{language === 'bn' ? 'ফোন নম্বর' : 'Phone Number'} *</Label>
                        <Input required value={formData.phoneNumber} onChange={e => setFormData({ ...formData, phoneNumber: e.target.value })} placeholder="+880" />
                      </div>
                      <div className="space-y-2">
                        <Label>{language === 'bn' ? 'গাড়ির নম্বর' : 'Vehicle Number'} *</Label>
                        <Input required value={formData.ambulanceNumber} onChange={e => setFormData({ ...formData, ambulanceNumber: e.target.value })} placeholder="DHAKA-METRO-KA-1234" />
                      </div>
                      <div className="space-y-2">
                        <Label>{language === 'bn' ? 'ড্রাইভিং লাইসেন্স নম্বর' : 'Driving Licence'} *</Label>
                        <Input required value={formData.drivingLicence} onChange={e => setFormData({ ...formData, drivingLicence: e.target.value })} />
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
                        <Label>{language === 'bn' ? 'গাড়ির ধরন' : 'Vehicle Type'} *</Label>
                        <select required value={formData.vehicleType} onChange={e => setFormData({ ...formData, vehicleType: e.target.value })} className="w-full h-10 px-3 border border-gray-300 rounded-md bg-white">
                          <option value="AC Ambulance">{t.types.ac}</option>
                          <option value="Non AC Ambulance">{t.types.nonAc}</option>
                          <option value="ICU Ambulance">{t.types.icu}</option>
                          <option value="Freezing Ambulance">{t.types.freezing}</option>
                          <option value="NICU Ambulance">{t.types.nicu}</option>
                          <option value="Air Ambulance">{t.types.air}</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label>{language === 'bn' ? 'অবস্থা' : 'Status'} *</Label>
                        <select required value={formData.availabilityStatus} onChange={e => setFormData({ ...formData, availabilityStatus: e.target.value })} className="w-full h-10 px-3 border border-gray-300 rounded-md bg-white">
                          <option value="Available">{t.statuses.available}</option>
                          <option value="On Call">{t.statuses.onCall}</option>
                          <option value="Unavailable">{t.statuses.unavailable}</option>
                        </select>
                      </div>
                    </div>
                    <div className="pt-4">
                      <Button type="submit" disabled={isSubmitting} className="w-full btn-primary btn-slide flex justify-center items-center gap-2">
                        {isSubmitting ? (language === 'bn' ? 'প্রক্রিয়াধীন...' : 'Submitting...') : (language === 'bn' ? 'আবেদন জমা দিন' : 'Submit Application')}
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">{tH.division}</Label>
                <select
                  value={selectedDivision}
                  onChange={(e) => setSelectedDivision(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm bg-white"
                >
                  <option value="">{tH.selectDivision}</option>
                  {divisions.map((div) => <option key={div._id} value={div.name}>{div.name}</option>)}
                </select>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">{tH.district}</Label>
                <select
                  value={selectedDistrict}
                  onChange={(e) => setSelectedDistrict(e.target.value)}
                  disabled={!selectedDivision}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 text-sm bg-white"
                >
                  <option value="">{tH.selectDistrict}</option>
                  {districts.map((dist) => <option key={dist._id} value={dist.name}>{dist.name}</option>)}
                </select>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">{tH.thana}</Label>
                <select
                  value={selectedThana}
                  onChange={(e) => setSelectedThana(e.target.value)}
                  disabled={!selectedDistrict}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 text-sm bg-white"
                >
                  <option value="">{tH.selectThana}</option>
                  {thanas.map((thana) => <option key={thana._id} value={thana.name}>{thana.name}</option>)}
                </select>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">{t.card.status}</Label>
                <select
                  value={availabilityStatusFilter}
                  onChange={(e) => setAvailabilityStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm bg-white"
                >
                  <option value="">{language === 'bn' ? 'সব অবস্থা' : 'All Status'}</option>
                  <option value="Available">{t.statuses.available}</option>
                  <option value="On Call">{t.statuses.onCall}</option>
                  <option value="Unavailable">{t.statuses.unavailable}</option>
                </select>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">{t.card.type}</Label>
                <select
                  value={vehicleTypeFilter}
                  onChange={(e) => setVehicleTypeFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm bg-white"
                >
                  <option value="">{language === 'bn' ? 'সব ধরন' : 'All Types'}</option>
                  <option value="AC Ambulance">{t.types.ac}</option>
                  <option value="Non AC Ambulance">{t.types.nonAc}</option>
                  <option value="ICU Ambulance">{t.types.icu}</option>
                  <option value="Freezing Ambulance">{t.types.freezing}</option>
                  <option value="NICU Ambulance">{t.types.nicu}</option>
                  <option value="Air Ambulance">{t.types.air}</option>
                </select>
              </div>
            </div>
            <AnimatePresence>
              {(selectedDivision ||
                selectedDistrict ||
                selectedThana ||
                availabilityStatusFilter ||
                vehicleTypeFilter) && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-6 flex justify-end pt-4 border-t border-gray-100 overflow-hidden"
                  >
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedDivision("");
                        setSelectedDistrict("");
                        setSelectedThana("");
                        setAvailabilityStatusFilter("");
                        setVehicleTypeFilter("");
                      }}
                      className="flex items-center gap-2 px-5 py-2.5 text-sm text-gray-600 hover:text-gray-900 border-gray-200 hover:border-gray-300 transition-all duration-200"
                    >
                      <RotateCcw className="h-4 w-4" />
                      {language === 'bn' ? 'রিসেট' : 'Reset'}
                    </Button>
                  </motion.div>
                )}
            </AnimatePresence>
          </Card>

          {/* Ambulance List (Original Design Style) */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : ambulances.length === 0 ? (
            <Card className="p-12 text-center">
              <Car className="h-16 w-16 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 text-lg">No ambulances found</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {ambulances.map((ambulance, index) => (
                <motion.div
                  key={ambulance._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                >
                  <Card className="p-6 hover:shadow-lg transition-shadow relative overflow-hidden">
                    <div className="space-y-4">
                      <div className="flex items-start gap-4">
                        <div className="h-16 w-16 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <Car className="h-8 w-8 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="grid grid-cols-4 justify-between gap-2">
                            <h3 className="text-xl col-span-3 font-semibold wrap">
                              {getLocalizedValue(ambulance.name, ambulance.nameBn, language)}
                            </h3>
                            {ambulance.isApproved && (
                              <span className="text-[10px] font-bold text-primary uppercase
                                flex justify-end w-full h-fit">
                                <p className="flex items-center bg-primary/10 p-2 w-fit gap-1 rounded-md">
                                  {t.card.verified}
                                </p>

                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{ambulance.vehicleType}</p>
                        </div>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex items-start gap-2 text-gray-600">
                          <Contact className="h-4 w-4 shrink-0 mt-0.5" />
                          <span>
                            <strong>{t.card.vehicleNumber}:</strong> {ambulance.ambulanceNumber}
                          </span>
                        </div>
                        <div className="flex items-start gap-2 text-gray-600">
                          <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
                          <span>
                            <strong>{t.card.address}:</strong> {language === 'bn' ?
                              [ambulance.thanaBn, ambulance.districtBn].filter(Boolean).join(", ") :
                              [ambulance.thana, ambulance.district].filter(Boolean).join(", ")
                            }
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-gray-600">
                          <CheckCircle className="h-4 w-4" />
                          <div className="flex items-center gap-2">
                            <strong>{t.card.status}:</strong>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${ambulance.availabilityStatus === "Available" ? "bg-green-100 text-green-700" :
                              ambulance.availabilityStatus === "On Call" ? "bg-yellow-100 text-yellow-700" :
                                "bg-red-100 text-red-700"
                              }`}>
                              {ambulance.availabilityStatus === 'Available' ? t.statuses.available :
                                ambulance.availabilityStatus === 'On Call' ? t.statuses.onCall : t.statuses.unavailable}
                            </span>
                          </div>
                        </div>

                        <div className="pt-2">
                          <a href={`tel:${ambulance.phoneNumber}`} className="block">
                            <Button className="w-full btn-primary btn-slide text-white font-bold flex items-center justify-center gap-2">
                              <Phone className="h-4 w-4" />
                              {t.card.callNow}
                            </Button>
                          </a>
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
