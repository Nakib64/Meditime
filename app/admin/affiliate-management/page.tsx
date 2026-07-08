"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { CheckCircle, XCircle, Clock, Search, Filter } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { showToast } from "@/lib/toast";

interface AffiliateRequest {
  _id: string;
  affiliateId: {
    fullName: string;
    email: string;
    phoneNumber: string;
    affiliateCode: string;
    paymentMethod?: string;
    paymentDetails?: string;
  };
  patientName: string;
  patientPhone: string;
  doctorName: string;
  hospitalName: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export default function AffiliateManagementPage() {
  const [requests, setRequests] = useState<AffiliateRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const response = await fetch("/api/admin/affiliate-requests");
      const data = await response.json();
      if (response.ok) {
        setRequests(data.requests || []);
      }
    } catch (error) {
      console.error("Error fetching requests:", error);
      showToast.error("Failed to fetch requests");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (requestId: string, newStatus: string) => {
    try {
      if (newStatus === "approved") {
        const commissionInput = prompt("Enter commission amount for this referral (BDT):", "500");
        if (commissionInput === null) return; // User cancelled

        const commissionAmount = parseFloat(commissionInput);
        if (isNaN(commissionAmount) || commissionAmount <= 0) {
          showToast.error("Please enter a valid positive commission amount");
          return;
        }

        const response = await fetch("/api/admin/affiliate-requests/approve", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ requestId, commissionAmount }),
        });

        const data = await response.json();
        if (response.ok) {
          showToast.success(`Request approved with ৳${commissionAmount} commission credited!`);
          fetchRequests();
        } else {
          showToast.error(data.error || "Failed to approve request");
        }
      } else {
        const response = await fetch("/api/admin/affiliate-requests", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ requestId, status: newStatus }),
        });

        const data = await response.json();
        if (response.ok) {
          showToast.success("Request rejected successfully");
          fetchRequests();
        } else {
          showToast.error(data.error || "Failed to update status");
        }
      }
    } catch (error) {
      console.error("Error updating status:", error);
      showToast.error("An error occurred");
    }
  };

  const filteredRequests = requests.filter((req) => {
    const matchesSearch = 
      req.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.patientPhone.includes(searchTerm) ||
      req.affiliateId?.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.affiliateId?.affiliateCode.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || req.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Affiliate Management</h1>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search requests..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      <Card className="overflow-hidden border-gray-200 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-4 px-6 font-semibold text-gray-600 text-sm">Date</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-600 text-sm">Affiliate</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-600 text-sm">Payment Info</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-600 text-sm">Patient Details</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-600 text-sm">Doctor/Hospital</th>
                <th className="text-center py-4 px-6 font-semibold text-gray-600 text-sm">Status</th>
                <th className="text-right py-4 px-6 font-semibold text-gray-600 text-sm">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-500">
                    No requests found
                  </td>
                </tr>
              ) : (
                filteredRequests.map((req) => (
                  <tr key={req._id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-4 px-6 text-sm text-gray-600">
                      {format(new Date(req.createdAt), 'MMM dd, yyyy')}
                      <div className="text-xs text-gray-400 mt-1">
                        {format(new Date(req.createdAt), 'h:mm a')}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm">
                      <div className="font-medium text-gray-900">{req.affiliateId?.fullName || 'Unknown'}</div>
                      <div className="text-xs text-gray-500">{req.affiliateId?.affiliateCode}</div>
                      <div className="text-xs text-gray-500">{req.affiliateId?.phoneNumber}</div>
                    </td>
                    <td className="py-4 px-6 text-sm">
                      <div className="font-medium text-gray-900 capitalize">{req.affiliateId?.paymentMethod || 'N/A'}</div>
                      <div className="text-xs text-gray-500">{req.affiliateId?.paymentDetails || 'N/A'}</div>
                    </td>
                    <td className="py-4 px-6 text-sm">
                      <div className="font-medium text-gray-900">{req.patientName}</div>
                      <div className="text-xs text-gray-500">{req.patientPhone}</div>
                    </td>
                    <td className="py-4 px-6 text-sm">
                      <div className="font-medium text-gray-900">{req.doctorName}</div>
                      <div className="text-xs text-gray-500">{req.hospitalName}</div>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${
                        req.status === 'approved'
                          ? 'bg-green-50 text-green-700 border-green-200'
                          : req.status === 'rejected'
                          ? 'bg-red-50 text-red-700 border-red-200'
                          : 'bg-orange-50 text-orange-700 border-orange-200'
                      }`}>
                        {req.status === 'approved' ? (
                          <CheckCircle className="h-3.5 w-3.5" />
                        ) : req.status === 'rejected' ? (
                          <XCircle className="h-3.5 w-3.5" />
                        ) : (
                          <Clock className="h-3.5 w-3.5" />
                        )}
                        {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      {req.status === 'pending' && (
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleStatusUpdate(req._id, 'approved')}
                            className="bg-green-600 hover:bg-green-700 text-white h-8 px-3"
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleStatusUpdate(req._id, 'rejected')}
                            className="h-8 px-3"
                          >
                            Reject
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
