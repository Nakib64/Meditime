"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Loader2, Droplet, Car, Phone, Mail, MapPin, Calendar, User, Clock, Trash2, Check } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { t } from "@/lib/translations";
import { showToast } from "@/lib/toast";
import { formatAvailabilityStatus, formatLastDonation } from "@/lib/blood-donor-utils";

interface BloodDonor {
  _id: string;
  name: string;
  nameBn?: string;
  phoneNumber: string;
  email?: string;
  bloodGroup: string;
  division?: string;
  district?: string;
  thana?: string;
  photo?: string;
  availabilityStatus: string;
  lastDonationDate?: string;
  isApproved: boolean;
  createdAt: string;
}

interface Ambulance {
  _id: string;
  name: string;
  nameBn?: string;
  phoneNumber: string;
  division?: string;
  district?: string;
  thana?: string;
  availabilityStatus: string;
  vehicleType: string;
  isApproved: boolean;
  createdAt: string;
}

export default function PendingServicesPage() {
  const { language } = useLanguage();
  const [bloodDonors, setBloodDonors] = useState<BloodDonor[]>([]);
  const [ambulances, setAmbulances] = useState<Ambulance[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    fetchPendingServices();
  }, []);

  const fetchPendingServices = async () => {
    try {
      setLoading(true);
      const [donorsRes, ambulancesRes] = await Promise.all([
        fetch("/api/blood-donors?admin=true"),
        fetch("/api/ambulances?admin=true"),
      ]);

      const [donorsData, ambulancesData] = await Promise.all([
        donorsRes.json(),
        ambulancesRes.json(),
      ]);

      const pendingDonors = donorsData.bloodDonors?.filter((d: BloodDonor) => !d.isApproved) || [];
      const pendingAmbulances = ambulancesData.ambulances?.filter((a: Ambulance) => !a.isApproved) || [];

      setBloodDonors(pendingDonors);
      setAmbulances(pendingAmbulances);
    } catch (error) {
      console.error("Error fetching pending services:", error);
      showToast.error("Failed to load pending services");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (type: "bloodDonor" | "ambulance", id: string) => {
    try {
      setProcessing(id);
      const endpoint = type === "bloodDonor" ? `/api/blood-donors/${id}` : `/api/ambulances/${id}`;
      
      const response = await fetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isApproved: true }),
      });

      if (response.ok) {
        showToast.success(language === 'bn' ? "অনুমোদিত হয়েছে!" : "Approved successfully!");
        fetchPendingServices();
      } else {
        const result = await response.json();
        showToast.error(result.error || "Failed to approve");
      }
    } catch (error) {
      showToast.error("An error occurred. Please try again.");
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (type: "bloodDonor" | "ambulance", id: string) => {
    if (!confirm(language === 'bn' ? "আপনি কি নিশ্চিত যে আপনি এটি প্রত্যাখ্যান করতে চান?" : "Are you sure you want to reject and delete this request?")) {
      return;
    }

    try {
      setProcessing(id);
      const endpoint = type === "bloodDonor" ? `/api/blood-donors/${id}` : `/api/ambulances/${id}`;
      
      const response = await fetch(endpoint, {
        method: "DELETE",
      });

      if (response.ok) {
        showToast.success(language === 'bn' ? "প্রত্যাখ্যান করা হয়েছে।" : "Rejected and removed.");
        fetchPendingServices();
      } else {
        const result = await response.json();
        showToast.error(result.error || "Failed to reject");
      }
    } catch (error) {
      showToast.error("An error occurred. Please try again.");
    } finally {
      setProcessing(null);
    }
  };

  if (loading && bloodDonors.length === 0 && ambulances.length === 0) {
    return (
      <div className="flex flex-col h-[50vh] items-center justify-center space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-gray-500 font-medium">{t("loading", language)}</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-12">
      <div className="border-b pb-8">
        <h1 className="text-4xl font-black text-gray-900 tracking-tight">{t("pendingServices", language)}</h1>
        <p className="text-gray-500 mt-2 text-lg font-medium">
          {language === 'bn' ? 'রক্তদাতা এবং অ্যাম্বুলেন্স আবেদনের অনুরোধগুলো যাচাই এবং অনুমোদন করুন' : 'Review and verify registration requests for critical medical services'}
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-12 mt-10">
        {/* Pending Blood Donors */}
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black text-gray-800 flex items-center gap-3">
              <div className="bg-red-100 p-2.5 rounded-2xl">
                <Droplet className="h-6 w-6 text-red-600 shadow-sm" />
              </div>
              {t("pendingBloodDonors", language)}
              <span className="ml-2 px-3 py-1 bg-gray-100 text-gray-400 text-sm rounded-full font-black">{bloodDonors.length}</span>
            </h2>
          </div>

          {bloodDonors.length === 0 ? (
            <Card className="p-16 text-center border-dashed border-4 bg-gray-50/50 rounded-[2.5rem] flex flex-col items-center justify-center space-y-4">
               <Check className="h-16 w-16 text-gray-200" />
               <p className="text-gray-400 text-xl font-black">{t("noPendingRequests", language)}</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {bloodDonors.map((donor) => (
                <Card key={donor._id} className="relative p-0 bg-white border-2 border-gray-100 hover:border-red-100 transition-all duration-300 rounded-[2rem] overflow-hidden group">
                   <div className="p-8 space-y-6">
                      <div className="flex items-start gap-6">
                         <div className="relative shrink-0">
                            {donor.photo ? (
                               <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-white shadow-md">
                                  <img src={donor.photo} alt={donor.name} className="w-full h-full object-cover" />
                               </div>
                            ) : (
                               <div className="w-24 h-24 rounded-2xl bg-red-50 flex items-center justify-center">
                                  <User className="h-10 w-10 text-red-200" />
                               </div>
                            )}
                            <div className="absolute -top-3 -right-3 h-10 w-10 bg-red-600 text-white rounded-full flex items-center justify-center font-black text-lg shadow-lg border-4 border-white">
                               {donor.bloodGroup}
                            </div>
                         </div>
                         <div className="flex-1 min-w-0">
                             <h3 className="text-2xl font-black text-gray-900 group-hover:text-red-600 transition-colors">
                                {language === 'bn' && donor.nameBn ? donor.nameBn : donor.name}
                             </h3>
                             <div className="flex flex-wrap gap-4 mt-3">
                                <div className="flex items-center gap-2 text-sm font-black text-gray-600">
                                   <Phone className="h-4 w-4 text-gray-400" />
                                   {donor.phoneNumber}
                                </div>
                                {donor.email && (
                                  <div className="flex items-center gap-2 text-sm font-black text-gray-600">
                                     <Mail className="h-4 w-4 text-gray-400" />
                                     <span className="truncate max-w-[150px]">{donor.email}</span>
                                  </div>
                                )}
                             </div>
                         </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4 bg-gray-50/50 p-6 rounded-2xl border border-gray-100">
                         <div className="space-y-1">
                            <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">{t("location", language)}</p>
                            <p className="text-sm font-bold text-gray-700 truncate">
                               {[donor.thana, donor.district, donor.division].filter(Boolean).join(", ") || 'N/A'}
                            </p>
                         </div>
                         <div className="space-y-1">
                            <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">{t("availabilityStatus", language)}</p>
                            <p className="text-sm font-bold text-gray-700">
                               {formatAvailabilityStatus(donor.availabilityStatus, language)}
                            </p>
                         </div>
                         <div className="space-y-1">
                            <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">{t("lastDonationDate", language)}</p>
                            <p className="text-sm font-bold text-gray-700">
                               {formatLastDonation(donor.lastDonationDate, language)}
                            </p>
                         </div>
                      </div>

                      <div className="flex gap-4">
                         <Button
                           onClick={() => handleApprove("bloodDonor", donor._id)}
                           disabled={processing === donor._id}
                           className="flex-1 h-14 bg-green-600 hover:bg-green-700 text-white font-black rounded-xl shadow-lg shadow-green-100 transition-all active:scale-95"
                         >
                           {processing === donor._id ? <Loader2 className="h-6 w-6 animate-spin" /> : t("approve", language)}
                         </Button>
                         <Button
                           onClick={() => handleReject("bloodDonor", donor._id)}
                           disabled={processing === donor._id}
                           variant="outline"
                           className="flex-1 h-14 border-2 border-red-50 text-red-500 hover:bg-red-50 font-black rounded-xl transition-all"
                         >
                           {processing === donor._id ? <Loader2 className="h-6 w-6 animate-spin" /> : t("reject", language)}
                         </Button>
                      </div>
                   </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Pending Ambulances */}
        <div className="space-y-8">
           <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black text-gray-800 flex items-center gap-3">
              <div className="bg-blue-100 p-2.5 rounded-2xl">
                <Car className="h-6 w-6 text-blue-600 shadow-sm" />
              </div>
              {t("pendingAmbulances", language)}
              <span className="ml-2 px-3 py-1 bg-gray-100 text-gray-400 text-sm rounded-full font-black">{ambulances.length}</span>
            </h2>
          </div>

          {ambulances.length === 0 ? (
            <Card className="p-16 text-center border-dashed border-4 bg-gray-50/50 rounded-[2.5rem] flex flex-col items-center justify-center space-y-4">
               <Check className="h-16 w-16 text-gray-200" />
               <p className="text-gray-400 text-xl font-black">{t("noPendingRequests", language)}</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {ambulances.map((ambulance) => (
                <Card key={ambulance._id} className="relative p-0 bg-white border-2 border-gray-100 hover:border-blue-100 transition-all duration-300 rounded-[2rem] overflow-hidden group">
                    <div className="p-8 space-y-6">
                       <div className="flex items-start justify-between">
                          <div className="space-y-1">
                             <h3 className="text-2xl font-black text-gray-900 group-hover:text-blue-600 transition-colors">
                                {language === 'bn' && ambulance.nameBn ? ambulance.nameBn : ambulance.name}
                             </h3>
                             <div className="flex items-center gap-2 text-sm font-black text-gray-600">
                                <Phone className="h-4 w-4 text-gray-400" />
                                {ambulance.phoneNumber}
                             </div>
                          </div>
                          <div className="bg-blue-50 text-blue-600 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest whitespace-nowrap">
                             {ambulance.vehicleType}
                          </div>
                       </div>

                       <div className="grid grid-cols-1 bg-gray-50/50 p-6 rounded-2xl border border-gray-100">
                          <div className="space-y-1 flex items-center gap-4">
                             <div className="bg-white p-2 rounded-lg">
                                <MapPin className="h-4 w-4 text-blue-400" />
                             </div>
                             <div>
                                <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">{t("location", language)}</p>
                                <p className="text-sm font-bold text-gray-700">
                                   {ambulance.division}{ambulance.district ? `, ${ambulance.district}` : ''}{ambulance.thana ? `, ${ambulance.thana}` : ''}
                                </p>
                             </div>
                          </div>
                       </div>

                       <div className="flex gap-4">
                         <Button
                           onClick={() => handleApprove("ambulance", ambulance._id)}
                           disabled={processing === ambulance._id}
                           className="flex-1 h-14 bg-green-600 hover:bg-green-700 text-white font-black rounded-xl shadow-lg shadow-green-100 transition-all active:scale-95"
                         >
                           {processing === ambulance._id ? <Loader2 className="h-6 w-6 animate-spin" /> : t("approve", language)}
                         </Button>
                         <Button
                           onClick={() => handleReject("ambulance", ambulance._id)}
                           disabled={processing === ambulance._id}
                           variant="outline"
                           className="flex-1 h-14 border-2 border-red-50 text-red-500 hover:bg-red-50 font-black rounded-xl transition-all"
                         >
                           {processing === ambulance._id ? <Loader2 className="h-6 w-6 animate-spin" /> : t("reject", language)}
                         </Button>
                      </div>
                    </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
