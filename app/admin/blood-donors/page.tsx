"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Edit, Loader2, MapPin, Phone, Mail, Calendar, User, Search } from "lucide-react";
import Image from "next/image";
import { useLanguage } from "@/contexts/LanguageContext";
import { t } from "@/lib/translations";
import { showToast } from "@/lib/toast";
import { formatAvailabilityStatus, formatLastDonation } from "@/lib/blood-donor-utils";

interface BloodDonor {
  _id: string;
  name: string;
  nameBn?: string; // added
  phoneNumber: string;
  email?: string;
  bloodGroup: string;
  division?: string;
  divisionBn?: string; // added
  district?: string;
  districtBn?: string; // added
  thana?: string;
  thanaBn?: string; // added
  photo?: string;
  availabilityStatus: string;
  lastDonationDate?: string;
}

export default function BloodDonorsPage() {
  const { language } = useLanguage();
  const [bloodDonors, setBloodDonors] = useState<BloodDonor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchBloodDonors();
  }, []);

  const fetchBloodDonors = async () => {
    try {
      const response = await fetch("/api/blood-donors");
      const data = await response.json();
      if (response.ok) {
        setBloodDonors(data.bloodDonors);
      }
    } catch (error) {
      console.error("Error fetching blood donors:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this blood donor?")) return;

    try {
      const response = await fetch(`/api/blood-donors/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setBloodDonors(bloodDonors.filter((donor) => donor._id !== id));
        alert("Blood donor deleted successfully");
      } else {
        const data = await response.json();
        alert(data.error || "Failed to delete blood donor");
      }
    } catch (error) {
      console.error("Error deleting blood donor:", error);
      alert("Failed to delete blood donor");
    }
  };

  const filteredDonors = bloodDonors.filter(d => 
    d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (d.nameBn && d.nameBn.includes(searchQuery)) ||
    d.phoneNumber.includes(searchQuery) ||
    d.bloodGroup.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading && bloodDonors.length === 0) {
    return (
      <div className="flex flex-col h-[50vh] items-center justify-center space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-gray-500 font-medium">{t("loading", language)}</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b pb-8">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">
             {t("allBloodDonors", language)}
          </h1>
          <p className="text-gray-500 mt-2 text-lg font-medium">
            {t("bloodDonorsSubTitle", language)}
          </p>
        </div>
        <Link href="/admin/blood-donors/create">
          <Button className="bg-primary hover:bg-primary/90 text-white px-8 py-7 text-xl font-black rounded-2xl shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95">
            <Plus className="h-6 w-6 mr-2" />
            {t("createBloodDonor", language)}
          </Button>
        </Link>
      </div>

      <div className="relative group max-w-2xl">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400 group-focus-within:text-primary transition-colors" />
        </div>
        <input
          type="text"
          placeholder={t("searchByNameOrPhone", language)}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 h-14 text-lg border-2 border-gray-100 rounded-2xl bg-white shadow-sm focus:ring-primary focus:border-primary transition-all pr-4 font-bold outline-none"
        />
      </div>

      {filteredDonors.length === 0 ? (
        <Card className="p-20 text-center border-dashed border-4 bg-gray-50/50 rounded-[2.5rem]">
           <div className="max-w-md mx-auto space-y-6">
              <div className="bg-white p-8 rounded-full w-28 h-28 flex items-center justify-center mx-auto shadow-md">
                 <User className="h-14 w-14 text-gray-200" />
              </div>
              <p className="text-gray-500 text-2xl font-black tracking-tight">
                 {bloodDonors.length === 0 ? t("noBloodDonors", language) : (language === 'bn' ? 'কোনো রক্তদাতা পাওয়া যায়নি' : 'No blood donors match your search')}
              </p>
              {bloodDonors.length === 0 && (
                <Link href="/admin/blood-donors/create">
                   <Button className="bg-primary text-white h-16 px-10 text-xl font-black rounded-2xl shadow-xl shadow-primary/10">
                      <Plus className="h-6 w-6 mr-2" />
                      {t("createFirstBloodDonor", language)}
                   </Button>
                </Link>
              )}
           </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDonors.map((donor) => (
            <Card key={donor._id} className="p-6 rounded-[2rem] border-none shadow-lg hover:shadow-xl transition-all bg-white relative overflow-hidden flex flex-col h-full">
              <div className="flex items-center gap-4 mb-6">
                <div className="relative w-16 h-16 rounded-2xl overflow-hidden bg-slate-100 ring-4 ring-slate-50 flex items-center justify-center">
                  <Image src={'/blood-drop.png'} alt={donor.name} width={64} height={64} className="h-8 w-8" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-lg text-slate-900 ">{language === 'bn' && donor.nameBn ? donor.nameBn : donor.name}</h3>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-medium text-slate-500">{donor.phoneNumber}</span>
                  </div>
                </div>
                <div className="ml-auto w-12 h-12 rounded-xl bg-primary text-white flex items-center justify-center font-black text-lg shadow-lg shadow-primary/20 shrink-0">{donor.bloodGroup}</div>
              </div>

              <div className="space-y-3 mb-6 flex-1">
                <div className="flex items-center justify-between gap-2 text-sm">
                  <span className="text-slate-500 font-medium">{t("availabilityStatus", language)} : </span>
                  <span className={`font-bold ${donor.availabilityStatus === 'Available' ? 'text-green-500' : 'text-orange-500'}`}>
                    {formatAvailabilityStatus(donor.availabilityStatus, language)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2 text-sm">
                  <span className="text-slate-500 font-medium">{language === 'en' ? "Last Donation : " : "শেষ রক্তদান : "}</span>
                  <span className="font-bold text-slate-700">{formatLastDonation(donor.lastDonationDate, language)}</span>
                </div>
                {(donor.division || donor.district || donor.thana) && (
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <span className="text-slate-500 font-medium">{t("location", language)} : </span>
                    <span className="font-bold text-slate-700 text-right truncate max-w-[60%]">
                      {[
                        language === 'bn' ? donor.thanaBn || donor.thana : donor.thana,
                        language === 'bn' ? donor.districtBn || donor.district : donor.district,
                        language === 'bn' ? donor.divisionBn || donor.division : donor.division,
                      ].filter(Boolean).join(", ")}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Link href={`/admin/blood-donors/edit/${donor._id}`} className="flex-1">
                  <Button variant="outline" className="w-full h-10 font-bold text-slate-600 rounded-xl">
                    <Edit className="h-4 w-4 mr-2" />
                    {t("edit", language)}
                  </Button>
                </Link>
                <Button 
                  variant="outline" 
                  className="flex-1 h-10 font-bold text-red-500 hover:text-red-600 hover:bg-red-50 border-red-100 rounded-xl"
                  onClick={() => handleDelete(donor._id)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {t("delete", language)}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
