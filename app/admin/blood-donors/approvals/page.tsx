"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Droplet, Phone, MapPin, Loader2, Check, X, ShieldCheck } from "lucide-react";
import { showToast } from "@/lib/toast";
import { useLanguage, getLocalizedValue } from "@/contexts/LanguageContext";
import { t } from "@/lib/translations";
import { formatAvailabilityStatus, formatLastDonation } from "@/lib/blood-donor-utils";

interface BloodDonor {
  _id: string;
  name: string;
  nameBn?: string;
  phoneNumber: string;
  bloodGroup: string;
  division?: string;
  divisionBn?: string;
  district?: string;
  districtBn?: string;
  thana?: string;
  thanaBn?: string;
  availabilityStatus: string;
  lastDonationDate?: string;
  isApproved: boolean;
}

export default function BloodDonorApprovalsPage() {
  const { language } = useLanguage();
  const [donors, setDonors] = useState<BloodDonor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPendingDonors();
  }, []);

  const fetchPendingDonors = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/blood-donors?admin=true&isApproved=false");
      const data = await response.json();
      if (response.ok) {
        setDonors(data.bloodDonors);
      }
    } catch (error) {
      console.error("Error fetching pending donors:", error);
      showToast.error("Failed to fetch applications");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      const response = await fetch(`/api/blood-donors/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isApproved: true }),
      });

      if (response.ok) {
        setDonors(donors.filter((d) => d._id !== id));
        showToast.success(language === 'bn' ? "অনুমোদিত হয়েছে!" : "Donor approved!");
      } else {
        const data = await response.json();
        showToast.error(data.error || "Failed to approve");
      }
    } catch (error) {
      showToast.error("Network error");
    }
  };

  const handleReject = async (id: string) => {
    if (!confirm(language === 'bn' ? "আপনি কি নিশ্চিত যে আপনি এই আবেদনটি বাতিল করতে চান?" : "Are you sure you want to reject this application?")) return;

    try {
      const response = await fetch(`/api/blood-donors/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setDonors(donors.filter((d) => d._id !== id));
        showToast.success(language === 'bn' ? "বাতিল করা হয়েছে" : "Application rejected and removed");
      } else {
        showToast.error("Failed to reject");
      }
    } catch (error) {
      showToast.error("Network error");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col h-[50vh] items-center justify-center space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-red-600" />
        <p className="text-gray-500 font-medium">{language === 'bn' ? 'লোড হচ্ছে...' : 'Loading applications...'}</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-10">
      <div className="border-b pb-8">
        <h1 className="text-4xl font-black text-gray-900 tracking-tight flex items-center gap-4">
          <Droplet className="h-10 w-10 text-red-600 fill-current" />
          {language === 'bn' ? 'রক্তদাতা অনুমোদন' : 'Blood Donor Approvals'}
        </h1>
        <p className="text-gray-500 mt-2 text-lg font-medium">
          {language === 'bn' ? 'নতুন রক্তদাতা আবেদনগুলো পর্যালোচনা করুন' : 'Review and manage new blood donor partner applications'}
        </p>
      </div>

      {donors.length === 0 ? (
        <Card className="p-20 text-center border-dashed border-4 bg-gray-50/50 rounded-[2.5rem]">
          <div className="max-w-md mx-auto space-y-4">
            <div className="bg-white p-8 rounded-full w-28 h-28 flex items-center justify-center mx-auto shadow-md">
              <Check className="h-14 w-14 text-green-400" />
            </div>
            <p className="text-gray-500 text-2xl font-black tracking-tight">
              {language === 'bn' ? 'কোনো পেন্ডিং আবেদন নেই' : 'No pending applications'}
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {donors.map((donor) => (
            <Card key={donor._id} className="p-6 bg-white border-2 border-gray-100 rounded-[2rem] shadow-sm overflow-hidden">
              <div className="flex flex-col md:flex-row justify-between gap-6">
                <div className="flex items-start gap-6">
                  <div className="h-20 w-20 rounded-2xl bg-red-50 flex items-center justify-center shrink-0">
                    <Droplet className="h-10 w-10 text-red-600 fill-current" />
                  </div>
                  <div className="space-y-4 flex-1">
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">
                        {getLocalizedValue(donor.name, donor.nameBn, language)}
                      </h3>
                      <p className="text-red-600 font-black text-xl uppercase tracking-wider">{donor.bloodGroup}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-3 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <span className="font-bold">{language === 'bn' ? 'ফোন' : 'Phone'}:</span>
                        <a href={`tel:${donor.phoneNumber}`} className="text-red-600 hover:underline">{donor.phoneNumber}</a>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span className="font-bold">{language === 'bn' ? 'ঠিকানা' : 'Address'}:</span>
                        <span>
                          {language === 'bn' ? 
                            [donor.thanaBn || donor.thana, donor.districtBn || donor.district, donor.divisionBn || donor.division].filter(Boolean).join(", ") :
                            [donor.thana, donor.district, donor.division].filter(Boolean).join(", ")
                          }
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Check className="h-4 w-4 text-gray-400" />
                        <span className="font-bold">{language === 'bn' ? 'অবস্থা' : 'Status'}:</span>
                        <span className="font-medium">{formatAvailabilityStatus(donor.availabilityStatus, language)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Droplet className="h-4 w-4 text-gray-400" />
                        <span className="font-bold">{language === 'bn' ? 'শেষ রক্তদান' : 'Last Donation'}:</span>
                        <span className="font-medium">{formatLastDonation(donor.lastDonationDate, language)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-row md:flex-col gap-3 justify-center">
                  <Button 
                    onClick={() => handleApprove(donor._id)}
                    className="bg-green-600 hover:bg-green-700 text-white font-bold h-12 px-8 rounded-xl shadow-lg shadow-green-100"
                  >
                    <Check className="h-5 w-5 mr-2" />
                    {language === 'bn' ? 'অনুমোদন দিন' : 'Approve'}
                  </Button>
                  <Button 
                    onClick={() => handleReject(donor._id)}
                    variant="outline"
                    className="border-2 border-red-100 text-red-600 hover:bg-red-50 font-bold h-12 px-8 rounded-xl"
                  >
                    <X className="h-5 w-5 mr-2" />
                    {language === 'bn' ? 'বাতিল করুন' : 'Reject'}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
