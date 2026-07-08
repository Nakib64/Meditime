"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AffiliateSidebar from "@/components/affiliate-sidebar";
import { 
  DollarSign, 
  Loader2, 
  Upload,
  X,
  AlertCircle
} from "lucide-react";
import { showToast } from "@/lib/toast";

interface Affiliate {
  affiliateCode: string;
  walletBalance: number;
  fullName: string;
  email: string;
}

export default function WithdrawalRequestPage() {
  const [affiliate, setAffiliate] = useState<Affiliate | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  // Form state
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");

  const fetchWalletData = async (code: string, baseAffiliate: Affiliate) => {
    try {
      const response = await fetch(`/api/affiliate/wallet?affiliateCode=${code}`);
      const data = await response.json();

      if (response.ok && data.wallet) {
        const updatedAffiliate: Affiliate = {
          ...baseAffiliate,
          walletBalance: data.wallet.balance || 0,
        };

        setAffiliate(updatedAffiliate);
        localStorage.setItem("affiliate", JSON.stringify(updatedAffiliate));
      } else {
        setAffiliate(baseAffiliate);
      }
    } catch (error) {
      console.error("Error fetching wallet data:", error);
      setAffiliate(baseAffiliate);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const affiliateData = localStorage.getItem("affiliate");
    if (!affiliateData) {
      router.push("/affiliate-program");
      return;
    }

    try {
      const parsedData = JSON.parse(affiliateData);
      if (parsedData.affiliateCode) {
        fetchWalletData(parsedData.affiliateCode, parsedData);
      } else {
        setAffiliate(parsedData);
        setLoading(false);
      }
    } catch (error) {
      console.error("Error parsing affiliate data:", error);
      localStorage.removeItem("affiliate");
      router.push("/affiliate-program");
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!affiliate) return;

    const requestedAmount = parseFloat(amount);

    if (!requestedAmount || requestedAmount <= 0) {
      showToast.error("Please enter a valid amount");
      return;
    }

    if (requestedAmount > (affiliate.walletBalance || 0)) {
      showToast.error(`Insufficient balance. Your current balance is ৳${affiliate.walletBalance}`);
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch("/api/affiliate/withdrawal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          affiliateCode: affiliate.affiliateCode,
          amount: requestedAmount,
          notes,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        showToast.success("Withdrawal request submitted successfully!");
        router.push("/affiliate-program/dashboard?tab=withdrawals");
      } else {
        showToast.error(data.error || "Failed to submit withdrawal request");
      }
    } catch (error) {
      console.error("Error submitting withdrawal:", error);
      showToast.error("Failed to submit withdrawal request");
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("affiliate");
    showToast.success("Successfully logged out!");
    router.push("/affiliate-program");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#00B1C2] mx-auto mb-4"></div>
          <p className="text-[#017991] text-base">Loading...</p>
        </div>
      </div>
    );
  }

  if (!affiliate) {
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      {/* Decoupled Administrative Sidebar */}
      <AffiliateSidebar
        activeTab="withdrawals"
        affiliate={affiliate}
        onLogout={handleLogout}
      />

      {/* Main Administrative Withdrawal content area */}
      <main className="flex-1 lg:ml-64 overflow-y-auto h-screen relative pt-16 lg:pt-0" style={{ WebkitOverflowScrolling: 'touch' }}>
        <div className="p-6 lg:p-8">
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 pb-5 border-b border-gray-200">
            <div>
              <h1 className="text-2xl font-bold text-[#193252] tracking-tight">
                উইথড্র রিকোয়েস্ট
              </h1>
              <p className="text-gray-500 text-sm mt-1">
                Available Balance: <span className="font-bold text-emerald-600">৳{(affiliate.walletBalance || 0).toLocaleString()}</span>
              </p>
            </div>
            <Button
              onClick={() => router.push("/affiliate-program/dashboard?tab=withdrawals")}
              variant="outline"
              className="border-gray-200 text-gray-700 hover:bg-gray-50 bg-white shadow-sm text-sm font-semibold"
            >
              Back to Dashboard
            </Button>
          </div>

          <div className="max-w-2xl mx-auto">
            <Card className="p-6 bg-white border border-gray-200 shadow-sm rounded-2xl">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Withdrawal Amount */}
                <div>
                  <Label htmlFor="amount" className="text-gray-700 font-semibold text-sm">
                    Withdrawal Amount (BDT) *
                  </Label>
                  <Input
                    id="amount"
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter amount"
                    className="mt-1.5 bg-white border-gray-300 text-gray-900 focus:border-[#00B1C2] focus:ring-[#00B1C2]"
                    min="1"
                    max={affiliate.walletBalance}
                    required
                  />
                  <p className="text-xs text-gray-400 mt-1.5 font-medium">
                    Maximum allowed BDT: ৳{(affiliate.walletBalance || 0).toLocaleString()}
                  </p>
                </div>

                {/* Notes */}
                <div className="p-4 bg-gray-50/50 border border-gray-100 rounded-xl space-y-2">
                  <h3 className="font-bold text-sm text-[#193252]">
                    Additional Notes (Optional)
                  </h3>
                  <textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add any notes for the admin (optional)..."
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white text-sm focus:outline-none focus:ring-1 focus:ring-[#00B1C2] focus:border-[#00B1C2]"
                    rows={3}
                  />
                </div>

                {/* Info Alert */}
                <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-xl flex gap-3">
                  <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-blue-800 leading-relaxed">
                    <p className="font-bold text-sm mb-1 text-blue-900">Important Info:</p>
                    <ul className="list-disc list-inside space-y-1 font-medium">
                      <li>Your withdrawal request will be reviewed by our admin team.</li>
                      <li>The requested amount will be deducted from your wallet immediately after submission.</li>
                      <li>You can only request up to your current available wallet balance.</li>
                      <li>Processing withdrawals may take 2-5 business days.</li>
                    </ul>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push("/affiliate-program/dashboard?tab=withdrawals")}
                    className="flex-1 border-gray-200 text-gray-500 hover:text-gray-800 bg-white text-sm font-semibold"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm text-sm font-semibold"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Submitting Request...
                      </>
                    ) : (
                      <>
                        <DollarSign className="h-4 w-4 mr-2" />
                        Submit Request
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
