"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Navbar_for_details from "@/components/nav_for_details";
import { ArrowLeft, Loader2, CheckCircle2, Download, CreditCard, Home } from "lucide-react";
import Link from "next/link";
import { showToast } from "@/lib/toast";

import { generateDiagnosticBookingPDF } from "@/lib/diagnostic-pdf";
import DiagnosticInvoice from "@/components/diagnostic/DiagnosticInvoice";
import Loading from "@/app/loading";
import { useLanguage } from "@/contexts/LanguageContext";
import { trackTestPurchase } from "@/lib/gtm";

export default function DiagnosticSuccessPage() {
  const router = useRouter();
  const { language } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [bookedTests, setBookedTests] = useState<any[]>([]);
  const [selectedVenue, setSelectedVenue] = useState<any | null>(null);
  const [checkoutData, setCheckoutData] = useState<any | null>(null);
    const [agreed, setAgreed] = useState(false);

  const [payLater, setPayLater] = useState(false);
  const [bookingComplete, setBookingComplete] = useState(false);
  const [savedBookingData, setSavedBookingData] = useState<any | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedTests = localStorage.getItem("diagnosticCart");
      const savedVenue = localStorage.getItem("diagnosticVenue");
      const savedCheckout = localStorage.getItem("diagnosticCheckout");
      
      if (savedTests && savedVenue && savedCheckout) {
        try {
          const checkoutParsed = JSON.parse(savedCheckout);
          if (!checkoutParsed.isVerified) {
            showToast.error("Please complete phone verification first.");
            router.push("/diagnostic");
            return;
          }
          setBookedTests(JSON.parse(savedTests));
          setSelectedVenue(JSON.parse(savedVenue));
          setCheckoutData(checkoutParsed);
        } catch (e) {
          showToast.error("Invalid checkout data. Redirecting...");
          router.push("/diagnostic");
          return;
        }
      } else {
        showToast.error("Missing booking data. Redirecting...");
        router.push("/diagnostic");
      }
      setLoading(false);
    }
  }, [router]);

  const bookingRef = useMemo(() => {
    return savedBookingData?.bookingId || "";
  }, [savedBookingData]);

  const handleBook = async () => {
    setSubmitting(true);
    
    try {
      const userData = localStorage.getItem("user");
      let userId = null;
      if (userData) {
        const user = JSON.parse(userData);
        userId = user.id || user._id;
      }

      const payload = {
        userId,
        patientName: checkoutData.patientName,
        mobileNumber: checkoutData.mobileNumber,
        gender: checkoutData.gender,
        age: checkoutData.age,
        patientType: checkoutData.patientType,
        appointmentDate: checkoutData.appointmentDate,
        venueId: selectedVenue._id,
        tests: bookedTests,
        affiliateCode: checkoutData.affiliateCode,
        totalPrice: bookedTests.reduce((a: number, b: any) => a + (b.price || 0), 0)
      };

      const res = await fetch("/api/diagnostic/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error("Failed to secure diagnostic booking.");
      }

      const responseData = await res.json();
      const confirmedBooking = responseData.booking;
      
      // Store rich data 
      const bookingToSave = {
        ...confirmedBooking, 
        bookingId: confirmedBooking.bookingId,
        venueId: selectedVenue,
        tests: bookedTests
      };
      
      const prevBookings = JSON.parse(localStorage.getItem("myDiagnosticBookings") || "[]");
      localStorage.setItem("myDiagnosticBookings", JSON.stringify([bookingToSave, ...prevBookings]));

      // Trigger GTM conversion event (test_purchase)
      const total = bookedTests.reduce((a: number, b: any) => a + (b.price || 0), 0);
      trackTestPurchase({
        booking_id: confirmedBooking.bookingId || confirmedBooking._id,
        selected_hospital: selectedVenue?.name || "",
        appointment_date: checkoutData?.appointmentDate ? new Date(checkoutData.appointmentDate).toISOString().split("T")[0] : "",
        test_count: bookedTests.length,
        subtotal: total,
        total_due: total,
        platform_fee: 0,
        discount: 0,
        booking_method: "pay_at_hospital",
        items: bookedTests.map((t: any) => ({
          test_name: t.name,
          test_category: (t.departments && t.departments[0]) || t.category || "General",
          test_price: t.price,
        })),
        user_data: {
          patient_name: checkoutData?.patientName,
          phone: checkoutData?.mobileNumber,
        },
      });
      
      showToast.success("Booking confirmed successfully!");
      setBookingComplete(true);
      setSavedBookingData(bookingToSave);
      setSubmitting(false);

      localStorage.removeItem("diagnosticCart");
      localStorage.removeItem("diagnosticVenue");
      localStorage.removeItem("diagnosticCheckout");

      // Auto-download PDF
      setTimeout(() => {
        generateDiagnosticBookingPDF(bookingToSave);
      }, 500);
      
    } catch (error) {
      console.error(error);
      showToast.error("System encountered an error finalizing the booking.");
      setSubmitting(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (savedBookingData) {
      await generateDiagnosticBookingPDF(savedBookingData);
    } else {
      // Fallback object construct if state is lost somehow but data is still active
      const fallbackBooking = {
        patientName: checkoutData?.patientName,
        mobileNumber: checkoutData?.mobileNumber,
        appointmentDate: checkoutData?.appointmentDate,
        venueId: selectedVenue,
        tests: bookedTests,
        totalPrice: bookedTests.reduce((a: number, b: any) => a + (b.price || 0), 0),
        bookingId: bookingRef, 
      };
      await generateDiagnosticBookingPDF(fallbackBooking as any);
    }
  };

  if (loading) {
    return (
      <Loading />
    );
  }

  if (!selectedVenue || !checkoutData) return null;

  const totalPrice = bookedTests.reduce((a: number, b: any) => a + (b.price || 0), 0);

  // Collect unique recommendations for on-screen display
  const uniqueRecs = Array.from(new Set(bookedTests.flatMap((t: any) => t.recommendations || []))).slice(0, 4) as string[];

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Navbar_for_details />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-20">
     
        {/* Invoice Preview Component */}
        <DiagnosticInvoice 
          selectedVenue={selectedVenue}
          checkoutData={checkoutData}
          bookedTests={bookedTests}
          totalPrice={totalPrice}
          bookingRef={bookingRef}
          uniqueRecs={uniqueRecs}
        />

        {/* Action Buttons */}
        <div className="mt-8 space-y-4">
          {/* Download Button - Only after booking success */}
          {bookingComplete && (
            <div className="flex justify-center">
              <Button 
                onClick={handleDownloadPDF}
                className="gap-3 bg-[#FF6B00] hover:bg-[#E65D00] text-white font-bold text-lg px-12 py-6 rounded-2xl shadow-xl shadow-[#FF6B00]/20 hover:shadow-2xl hover:shadow-[#FF6B00]/30 transition-all"
              >
                <Download className="w-5 h-5" />
                Download PDF
              </Button>
            </div>
          )}

          
            <div className="bg-white p-3 lg:p-6 border border-slate-200 rounded-xl">
                  {/* Agreement Checkbox */}
              <div className="mb-5">
                <div className="flex items-start gap-3">
                  <div className="relative mt-0.5 flex-shrink-0">
                    <input
                      type="checkbox"
                      id="agree-checkbox"
                      checked={agreed}
                      onChange={(e) => setAgreed(e.target.checked)}
                      className="sr-only"
                    />
                    <label
                      htmlFor="agree-checkbox"
                      className={`w-5 h-5 rounded border-2 transition-all flex items-center justify-center cursor-pointer select-none ${agreed
                        ? "bg-primary border-primary"
                        : "bg-white border-slate-300 hover:border-primary"
                        }`}
                    >
                      {agreed && (
                        <svg
                          className="w-3 h-3 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={3}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </label>
                  </div>
                  <label
                    htmlFor="agree-checkbox"
                    className="text-sm text-slate-600 leading-relaxed cursor-pointer select-none"
                  >
                    <span>
                      {language === 'en' ? "I agree to the" : "আমি "}
                    </span>
                    <Link href="/terms" className="text-primary hover:underline">
                      {language == 'en' ? "Terms and Conditions and Privacy Policy" : "শর্তাবলী এবং গোপনীয়তা নীতি "}
                    </Link>
                    <span>
                      {language === 'en' ? "" : "মেনে নিচ্ছি"}
                    </span>
                  </label>
                </div>
              </div>

           

              {/* Action Buttons */}
              <div className="grid grid-cols-1 md:grid-cols-2  gap-3">
                <Button
                  variant="outline"
                  onClick={handleBook}
                  className="w-full btn-slidex bg-white  transition-all order-2 lg:order-none"
                  disabled={!agreed || submitting}
                >
                  {language == 'en' ? "Pay later" : "পরে পে করুন"}
                </Button>

                <Button
                  className={` font-bold order-1 lg:order-none py-3 text-base transition-all hover:scale-100 ${agreed && !submitting
                    ? "btn-primary btn-slide"
                    : "bg-slate-200 text-slate-400 cursor-not-allowed"
                    }`}
                >
                  {/* {submitting ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      {language == 'en' ? "Confirming..." : "নিশ্চিত হচ্ছে..."}
                    </>
                  ) : ( */}
                    <>
                      <CreditCard className="h-5 w-5 mr-2" />
                      {language == 'en' ? "Pay now" : "এখন পেমেন্ট করুন"}
                    </>
                  {/* )} */}
                </Button>
              </div>

               <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <p className="text-sm text-primary">
                    {language == 'en' ? "Confirm your booking via secure online payment or pay the fee directly at the chamber."
                      : "নিরাপদ অনলাইন পেমেন্টের মাধ্যমে বুকিং নিশ্চিত করুন অথবা চেম্বারে গিয়ে সরাসরি ফি প্রদান করুন।"}
                  </p>
                </div>

                
        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6 print:hidden">
          <Link href={`/diagnostic`}>
            <Button
              variant="outline"
              className="w-full sm:w-auto hover:border-primary hover:text-primary transition-all"
              
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              { language === 'bn' ? "ফিরে যান": "Back"}
            </Button>
          </Link>
          <Link href="/">
            <Button
              className="w-full sm:w-auto btn-primary btn-slide"
              
            >
              <Home className="h-4 w-4 mr-2" />
              {language === 'bn' ? "হোমে ফিরে যান": "Back To Home"}
            </Button>
          </Link>
        </div>
            </div>

          {/* Pay Later / Confirm */}
         

          {bookingComplete && (
            <div className="bg-primary/10 text-primary border border-primary p-6 rounded-2xl flex items-center justify-center gap-3 text-center">
              <CheckCircle2 className="w-6 h-6 shrink-0" />
              <p className="font-bold">{language == 'en' ? "Your booking has been confirmed successfully! Present this summary at the hospital." : "আপনার বুকিং সফলভাবে নিশ্চিত হয়েছে! হাসপাতালের যেকোনো শাখায় এই সারাংশ দেখান।"}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
