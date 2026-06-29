"use client";

import { useEffect, useState, useCallback, useContext } from "react";
import PhoneVerificationModal from "@/components/PhoneVerificationModal";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { ArrowLeft, MapPin, Loader2, RotateCcw, Ticket, Building2, ChevronRight, Gift } from "lucide-react";
import Link from "next/link";
import { showToast } from "@/lib/toast";
import { translations } from "@/lib/translations";
import { useLanguage } from "@/contexts/LanguageContext";
import { IDoctor } from "@/models/Doctor";
import Nav_for_details from "@/components/nav_for_details";
import PageLoader from "@/components/page-loader";

// Convert English number to Bengali
const convertToBengaliNumber = (num: number | string, language: 'en' | 'bn'): string => {
  const str = num.toString();
  if (language === 'en') return str;
  const englishDigits = '0123456789'.split('');
  const bengaliDigits = '0123456789'.split('');
  return str.split('').map(digit => {
    const index = englishDigits.indexOf(digit);
    return index !== -1 ? bengaliDigits[index] : digit;
  }).join('');
};

// Get day name from date
const getDayName = (date: Date): string => {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return days[date.getDay()];
};

export default function BookAppointmentPage() {
  const params = useParams();
  const router = useRouter();

  const { language } = useLanguage();
  const t = (key: keyof typeof translations.en) => translations[language][key] || translations.en[key];
  const doctorId = params?.id as string;

  const days = [
    t('day_1'), // Mon
    t('day_2'), // Tue
    t('day_3'), // Wed
    t('day_4'), // Thu
    t('day_5'), // Fri
    t('day_6'), // Sat
    t('day_0'), // Sun
  ];

  const [doctor, setDoctor] = useState<IDoctor | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [existingAppointments, setExistingAppointments] = useState<string[]>([]);
  const [latestAvailableDates, setLatestAvailableDates] = useState<Date[]>([]);

  // Form data
  const [patientName, setPatientName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [mobileError, setMobileError] = useState("");
  const [gender, setGender] = useState("");
  const [age, setAge] = useState("");
  const [patientType, setPatientType] = useState<"new" | "report">("new");
  const [affiliateCode, setAffiliateCode] = useState("");

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showVerifyModal, setShowVerifyModal] = useState(false);

  // Debounced mobile number check
  useEffect(() => {
    if (!mobileNumber) {
      setMobileError("");
      return;
    }

    const timer = setTimeout(() => {
      if (mobileNumber.length !== 11 || !mobileNumber.startsWith("01")) {
        setMobileError(language === 'bn' ? 'মোবাইল নম্বর অবশ্যই ১১ সংখ্যার হতে হবে এবং ০১ দিয়ে শুরু হতে হবে' : 'Mobile number must be exactly 11 digits starting with 01');
      } else {
        setMobileError("");
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [mobileNumber, language]);

  const searchParams = useSearchParams();
  const hospitalSlugParam = searchParams?.get("hospitalSlug");

  const availabilityArray = doctor ? (Array.isArray(doctor.availability) ? doctor.availability : [doctor.availability]) : [];
  const selectedHospitalSlug = hospitalSlugParam || (availabilityArray.length > 0 ? availabilityArray[0].hospital : null);

  const [hospitals, setHospitals] = useState<any[]>([]);

  const fetchHospitals = useCallback(async () => {
    try {
      const response = await fetch("/api/locations/hospitals");
      const data = await response.json();
      if (response.ok && data.hospitals) {
        setHospitals(data.hospitals);
      }
    } catch (error) {
      console.error("Error fetching hospitals:", error);
    }
  }, []);

  const fetchDoctor = useCallback(async () => {
    try {
      const response = await fetch(`/api/doctors/${doctorId}`);
      const data = await response.json();
      if (response.ok && data.doctor) {
        setDoctor(data.doctor);
      }
    } catch (error) {
      console.error("Error fetching doctor:", error);
    } finally {
      setLoading(false);
    }
  }, [doctorId]);

  const fetchAppointments = useCallback(async () => {
    try {
      const response = await fetch(`/api/appointments?doctorId=${doctorId}`);
      const data = await response.json();
      if (response.ok && data.appointments) {
        // Store booked dates
        const bookedDates = data.appointments
          .filter((apt: any) => apt.status !== 'cancelled')
          .map((apt: any) => {
            const date = new Date(apt.appointmentDate);
            return date.toISOString().split('T')[0];
          });
        setExistingAppointments(bookedDates);
      }
    } catch (error) {
      console.error("Error fetching appointments:", error);
    }
  }, [doctorId]);

  const getAvailableDays = useCallback((): string[] => {
    if (!doctor || !selectedHospitalSlug) return [];
    const availabilityArray = Array.isArray(doctor.availability)
      ? doctor.availability
      : [doctor.availability];

    const hospitalSlots = availabilityArray.filter((s: any) => s.hospital === selectedHospitalSlug);

    const allDays = new Set<string>();
    hospitalSlots.forEach((slot: any) => {
      if (slot.days) {
        slot.days.forEach((day: string) => allDays.add(day));
      }
    });
    return Array.from(allDays);
  }, [doctor, selectedHospitalSlug]);

  // Helper function to get date string in YYYY-MM-DD format
  const getDateString = (date: Date): string => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Get all available dates and update latest 2
  const updateLatestAvailableDates = useCallback(() => {
    if (!doctor) {
      setLatestAvailableDates([]);
      return;
    }

    const availableDays = getAvailableDays();
    if (availableDays.length === 0) {
      setLatestAvailableDates([]);
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Generate available dates for the next 30 days
    const allAvailableDates: Date[] = [];
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      date.setHours(0, 0, 0, 0);
      const dayName = getDayName(date);

      // Check if date is not in the past and matches available days
      if (date >= today && availableDays.includes(dayName)) {
        const dateStr = getDateString(date);
        // Check if date is not already booked
        if (!existingAppointments.includes(dateStr)) {
          allAvailableDates.push(date);
        }
      }
    }

    // Sort dates and take only the latest 2 (first 2 available dates)
    const sortedDates = allAvailableDates.sort((a, b) => a.getTime() - b.getTime());
    const latestTwo = sortedDates.slice(0, 2);
    // Ensure we only set maximum 2 dates
    setLatestAvailableDates(latestTwo.length > 2 ? latestTwo.slice(0, 2) : latestTwo);
  }, [doctor, existingAppointments, getAvailableDays]);

  useEffect(() => {
    if (doctorId) {
      fetchDoctor();
      fetchAppointments();
      fetchHospitals();
    }
  }, [doctorId, fetchDoctor, fetchAppointments, fetchHospitals]);

  // Auto-populate user data from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const userData = localStorage.getItem("user");
      let loggedInUser: any = null;
      if (userData) {
        try {
          loggedInUser = JSON.parse(userData);
          setCurrentUser(loggedInUser);
        } catch (error) {
          console.error("Error parsing user data:", error);
        }
      }

      // Load form inputs from localStorage (priority: localStorage > logged-in user data)
      const savedFormData = localStorage.getItem("patientFormData");
      if (savedFormData) {
        try {
          const parsed = JSON.parse(savedFormData);
          if (parsed.patientName) setPatientName(parsed.patientName);
          if (parsed.mobileNumber) setMobileNumber(parsed.mobileNumber);
          if (parsed.gender) setGender(parsed.gender);
          if (parsed.age) setAge(parsed.age);
          if (parsed.patientType) setPatientType(parsed.patientType);
          if (parsed.affiliateCode) setAffiliateCode(parsed.affiliateCode);
          return;
        } catch (e) {
          console.error("Error parsing saved form data:", e);
        }
      }

      if (loggedInUser) {
        if (loggedInUser.fullName) {
          setPatientName(loggedInUser.fullName);
        }
        if (loggedInUser.phoneNumber) {
          let phone = loggedInUser.phoneNumber.startsWith("+88")
            ? loggedInUser.phoneNumber.slice(3)
            : loggedInUser.phoneNumber;
          if (phone.length === 10 && !phone.startsWith("0")) {
            phone = "0" + phone;
          }
          setMobileNumber(phone);
        }
      }
    }
  }, []);

  // Save form data to localStorage on change
  useEffect(() => {
    if (typeof window !== "undefined" && (patientName || mobileNumber || gender || age || affiliateCode)) {
      localStorage.setItem(
        "patientFormData",
        JSON.stringify({
          patientName,
          mobileNumber,
          gender,
          age,
          patientType,
          affiliateCode,
        })
      );
    }
  }, [patientName, mobileNumber, gender, age, patientType, affiliateCode]);

  // Update latest available dates when doctor or appointments change
  useEffect(() => {
    if (doctor) {
      updateLatestAvailableDates();
    }
  }, [doctor, existingAppointments, updateLatestAvailableDates]);

  // Check if date is in the first 2 available dates (can be booked)
  const isDateAvailable = useCallback((date: Date): boolean => {
    if (latestAvailableDates.length === 0) return false;

    const dateStr = getDateString(date);

    // Only return true if date is in the latestAvailableDates array (first 2)
    return latestAvailableDates.some((availableDate) => {
      return getDateString(availableDate) === dateStr;
    });
  }, [latestAvailableDates]);

  // Check if date matches doctor's schedule and is not booked (to show all available dates)
  const isDateInSchedule = useCallback((date: Date): boolean => {
    if (!doctor) return false;

    const availableDays = getAvailableDays();
    if (availableDays.length === 0) return false;

    const dayName = getDayName(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dateToCheck = new Date(date);
    dateToCheck.setHours(0, 0, 0, 0);

    // Check if date matches schedule and is not booked
    if (dateToCheck >= today && availableDays.includes(dayName)) {
      const dateStr = getDateString(date);
      const isBooked = existingAppointments.includes(dateStr);
      return !isBooked;
    }

    return false;
  }, [doctor, existingAppointments, getAvailableDays]);

  // Check if date matches doctor's schedule but is not in first 2 available dates
  const isDateInScheduleButNotAvailable = useCallback((date: Date): boolean => {
    const isInSchedule = isDateInSchedule(date);
    const isAvailable = isDateAvailable(date);
    // It's in schedule but not in the first 2 available dates
    return isInSchedule && !isAvailable;
  }, [isDateInSchedule, isDateAvailable]);

  // Generate calendar days
  const getCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = (firstDay.getDay() + 6) % 7;

    const days: (Date | null)[] = [];
    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    return days;
  };

  const handleDateSelect = (date: Date) => {
    const dateStr = getDateString(date);

    const isInLatestTwo = latestAvailableDates.some((availableDate) => {
      return getDateString(availableDate) === dateStr;
    });

    if (isInLatestTwo) {
      setSelectedDate(date);
    } else {
      // Show toast notification if trying to select a date that's not in the latest 2
      showToast.error(t('canOnlyBookLatestTwo'));
    }
  };

  const getSlotForDate = (date: Date) => {
    if (!doctor || !selectedHospitalSlug) return null;
    const availabilityArray = Array.isArray(doctor.availability) ? doctor.availability : [doctor.availability];
    const hospitalSlots = availabilityArray.filter((s: any) => s.hospital === selectedHospitalSlug);
    const dayName = getDayName(date);
    return hospitalSlots.find((s: any) => s.days && s.days.includes(dayName));
  };

  const proceedToCheckout = async () => {
    setSubmitting(true);
    try {
      const selectedHospitalObj = hospitals.find(h => h.slug === selectedHospitalSlug || h.name === selectedHospitalSlug);
      const hospitalName = selectedHospitalObj?.name || selectedHospitalSlug;
      const hospitalBn = selectedHospitalObj?.nameBn || hospitalName;

      const slotForDate = getSlotForDate(selectedDate!);
      const formattedMobileNumber = mobileNumber;

      const checkoutData = {
        doctorId: doctor?._id || doctorId,
        doctorSlug: doctorId,
        doctor: {
          _id: doctor?._id,
          name: doctor?.name,
          nameBn: doctor?.nameBn,
          specialty: doctor?.specialty,
          specialtyBn: doctor?.specialtyBn,
          qualification: doctor?.qualification,
          qualificationBn: doctor?.qualificationBn,
          designation: doctor?.designation,
          designationBn: doctor?.designationBn,
          image: doctor?.image,
          availability: doctor?.availability,
        },
        patientName,
        mobileNumber: formattedMobileNumber,
        gender: gender || undefined,
        age: age ? parseInt(age) : undefined,
        patientType,
        hospitalName,
        hospitalBn,
        hospitalSlug: selectedHospitalSlug,
        appointmentDate: selectedDate!.toISOString(),
        appointmentTime: slotForDate?.time || undefined,
        userId: currentUser?._id || currentUser?.id || undefined,
        affiliateCode: affiliateCode || undefined,
        isVerified: true,
      };

      if (typeof window !== "undefined") {
        localStorage.setItem("pendingBooking", JSON.stringify(checkoutData));
      }

      router.push(`/doctor/${doctorId}/book/checkout`);
    } catch (error) {
      console.error("Error preparing checkout:", error);
      alert("Something went wrong, please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHospitalSlug || !selectedDate) {
      alert("Please select a date and ensure hospital is selected.");
      return;
    }

    if (mobileNumber.length !== 11 || !mobileNumber.startsWith("01")) {
      setMobileError(language === 'en' ? "Please provide 11 digits number (starting with 01). Example: 01XXXXXXXXX" : "অনুগ্রহ করে 11 ডিজিটের নম্বরটি দিন (01 দিয়ে শুরু করুন)। যেমন: 01XXXXXXXXX");
      return;
    }

    if (mobileError) {
      alert(mobileError);
      return;
    }

    // Check if phone verification is needed — ALWAYS verify phone number
    setShowVerifyModal(true);
  };

  const handleVerifySuccess = async () => {
    if (currentUser) {
      const updatedUser = { ...currentUser, isPhoneVerified: true };
      setCurrentUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
      try {
        await fetch("/api/profile/verify-status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: currentUser._id || currentUser.id, isPhoneVerified: true })
        });
      } catch (e) {
        console.error("Failed to sync verification state to server:", e);
      }
    }
    await proceedToCheckout();
  };

  const changeMonth = (direction: number) => {
    const today = new Date();
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    const proposed = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + direction, 1);
    // Only allow current month and next month
    const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    if (proposed >= currentMonthStart && proposed <= nextMonth) {
      setCurrentMonth(proposed);
    }
  };

  if (loading) {
    return (
      <PageLoader/>
    );
  }

  if (!doctor) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="text-center">
            <p className="text-gray-500 mb-4">Doctor not found</p>
            <Link href="/doctor">
              <Button>Back to Doctors</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const calendarDays = getCalendarDays();
  const currentYear = currentMonth.getFullYear();
  const currentMonthIndex = currentMonth.getMonth();

  return (
    <div className="min-h-screen bg-gray-50">
      <Nav_for_details />


      <div className="max-w-7xl mx-auto mt-16 px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Hospital Info & Calendar */}
          <div className="lg:col-span-2 space-y-6">
            {/* Hospital Info Display */}
            <Card className="p-6 bg-gradient-to-br from-white to-green-50 border-2 border-primary/20 shadow-xl">
              <h2
                className="text-2xl font-bold mb-5"
              >
                {t('hospital')}
              </h2>
              <div className="relative">
                {selectedHospitalSlug ? (
                  (() => {
                    const hObj = hospitals.find(h => h.slug === selectedHospitalSlug || h.name === selectedHospitalSlug);
                    const hName = hObj?.name || selectedHospitalSlug;
                    const hNameBn = hObj?.nameBn || hName;
                    return (
                      <div className="p-4 bg-primary text-white rounded-xl border-2 border-primary shadow-lg">
                        <h3 className="text-lg font-semibold flex items-center gap-2" >
                          <Building2 className="h-5 w-5" />
                          {language === 'bn' ? hNameBn : hName}
                        </h3>
                      </div>
                    );
                  })()
                ) : (
                  <h3 className=" p-4 bg-gray-50 rounded-xl" >
                    {t('noHospitalAssigned')}
                  </h3>
                )}
              </div>
            </Card>

            {/* Calendar */}
            {selectedHospitalSlug && (
              <Card className="p-6 bg-gradient-to-br from-white to-green-50 border-2 border-primary/20 shadow-xl">
                <h2
                  className="text-2xl font-bold mb-5"
                >
                  {t('selectDate')}
                </h2>

                {/* Calendar - smaller on desktop, larger text */}
                <div className="max-w-md mx-auto lg:max-w-full">
                  {/* Calendar Header */}
                  <div className="flex items-center justify-between mb-4">
                    <button
                      onClick={() => changeMonth(-1)}
                      className="p-2 rounded-lg hover:bg-primary/10 transition-colors disabled:opacity-30"
                      disabled={currentMonth.getMonth() === new Date().getMonth() && currentMonth.getFullYear() === new Date().getFullYear()}
                    >
                      <ArrowLeft className="h-5 w-5 text-primary" />
                    </button>
                    <h3
                      className="text-lg lg:text-xl font-bold "

                    >
                      {t(`month_${currentMonthIndex}` as any)} {convertToBengaliNumber(currentYear, language)}
                    </h3>
                    <button
                      onClick={() => changeMonth(1)}
                      className="p-2 rounded-lg hover:bg-primary/10 transition-colors disabled:opacity-30"
                      disabled={(() => { const n = new Date(); return currentMonth.getMonth() === n.getMonth() + 1 || (currentMonth.getMonth() === 11 && n.getMonth() === 10); })()}
                    >
                      <ArrowLeft className="h-5 w-5 text-primary rotate-180" />
                    </button>
                  </div>

                  {/* Unselect Date Button */}
                  {selectedDate && (
                    <div className="mb-3 flex justify-end">
                      <button
                        onClick={() => setSelectedDate(null)}
                        className="text-sm text-red-500 hover:text-red-700 font-medium flex items-center gap-1 transition-colors"
                      >
                        {t('unSelectDate')}
                      </button>
                    </div>
                  )}

                  {/* Calendar Days Header */}
                  <div className="grid grid-cols-7 gap-1 mb-3">
                    {days.map((day, index) => (
                      <div
                        key={index}
                        className="text-center font-semibold text-gray-700 py-1 text-xs md:text-xl"

                      >
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Calendar Grid */}
                  <div className="grid grid-cols-7 gap-3 lg:gap-6">
                    {calendarDays.map((date, index) => {
                      if (!date) {
                        return <div key={index} className="aspect-square" />;
                      }

                      const isAvailable = isDateAvailable(date);
                      const isInScheduleButNotAvailable = isDateInScheduleButNotAvailable(date);
                      const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();
                      const isToday = date.toDateString() === new Date().toDateString();

                      return (
                        <button
                          key={index}
                          onClick={() => {
                            if (isAvailable) {
                              handleDateSelect(date);
                            } else if (isInScheduleButNotAvailable) {
                              showToast.error(t('pleaseSelectLatestTwo'));
                            }
                          }}
                          disabled={!isAvailable && !isInScheduleButNotAvailable}
                          className={`aspect-square rounded-full transition-all font-semibold flex items-center justify-center md:text-2xl text-sm ${isSelected
                              ? "bg-primary text-white"
                              : isAvailable
                                ? "bg-primary/10 text-primary border-none hover:bg-primary/20 hover:scale-105"
                                : isInScheduleButNotAvailable
                                  ? "bg-white text-primary border-2 border-primary hover:bg-primary/5 hover:scale-105"
                                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
                            } `}
                        >
                          {convertToBengaliNumber(date.getDate(), language)}
                        </button>
                      );
                    })}
                  </div>

                  {selectedDate && (
                    <div className="mt-5 p-4 bg-primary/10 rounded-xl border-2 border-primary/20">
                      <p
                        className="text-base font-semibold text-gray-900"
                      >
                        {t('selectedDate')}: {language === 'en' ? getDayName(selectedDate) : t(`day_long_${selectedDate.getDay()}` as any)}, {convertToBengaliNumber(selectedDate.getDate(), language)} {t(`month_${selectedDate.getMonth()}` as any)}, {convertToBengaliNumber(selectedDate.getFullYear(), language)}
                      </p>
                    </div>
                  )}
                </div>
              </Card>
            )}
          </div>

          {/* Right Column - Form */}
          <div className="space-y-6">
            <Card className="p-6 bg-gradient-to-br from-white to-green-50 border-2 border-primary/20 shadow-xl">
              <div className="flex items-center justify-between mb-5">
                <h2
                  className="text-2xl font-bold "
                >
                  {t('patientInfo')}
                </h2>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setPatientName("");
                    setMobileNumber("");
                    setGender("");
                    setAge("");
                    setPatientType("new");
                    setAffiliateCode("");
                    if (typeof window !== "undefined") {
                      localStorage.removeItem("patientFormData");
                    }
                  }}
                  className="flex items-center gap-2 text-gray-600 hover:text-primary hover:border-primary"
                >
                  <RotateCcw className="h-4 w-4" />
                  {t('resetForm')}
                </Button>
              </div>

              {/* Required fields notice */}
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600 flex items-center gap-2" >
                  <span className="text-red-500 font-bold">*</span>
                  {t('requiredFieldsNotice')}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-2">
                {/* Patient Name - Required */}
                <div>
                  <Label htmlFor="patientName" className="flex items-center gap-1" >
                    {t('patientName')} <span className="text-red-500 font-bold">*</span>
                  </Label>
                  <Input
                    id="patientName"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    required
                    placeholder={t('patientNamePlaceholder')}
                    className={`mt-1 rounded-none h-10 ${!patientName ? '' : 'border-primary bg-green-50/30'}`}
                  />
                </div>

                {/* Mobile Number - Required */}
                <div>
                  <Label htmlFor="mobileNumber" className="flex items-center gap-1" >
                    {t('mobileNumber')} <span className="text-red-500 font-bold">*</span>
                  </Label>
                  <div className="relative flex items-center mt-1">
                    <span className="absolute left-3 flex items-center gap-1.5 text-gray-500 text-sm border-r pr-2 h-6 border-gray-300 pointer-events-none select-none">
                      <img src="https://flagcdn.com/w40/bd.png" alt="BD" className="w-6 h-4 rounded-sm object-cover" />
                      <span>+88</span>
                    </span>
                    <Input
                      id="mobileNumber"
                      type="tel"
                      value={mobileNumber}
                      maxLength={11}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 11);
                        setMobileNumber(val);
                      }}
                      onBlur={() => {
                        if (mobileNumber.length > 0 && (mobileNumber.length < 11 || !mobileNumber.startsWith("01"))) {
                          setMobileError(language === 'bn' ? "অনুগ্রহ করে 11 ডিজিটের নম্বরটি দিন (01 দিয়ে শুরু করুন)। যেমন: 01XXXXXXXXX" : 'Please provide 11 digits number (starting with 01). Example: 01XXXXXXXXX');
                        }
                      }}
                      required
                      placeholder={language === 'bn' ? '০১XXXXXXXXX' : '01XXXXXXXXX'}
                      className={`pl-[5rem] h-10 w-full rounded-none ${
                        mobileError
                          ? 'border-red-400 bg-red-50'
                          : !mobileNumber
                          ? ''
                          : 'border-primary bg-green-50/30'
                      }`}
                    />
                  </div>
                  {mobileError && (
                    <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                       {mobileError}
                    </p>
                  )}
                 
                </div>

                {/* Gender - Optional */}
                <div>
                  <Label htmlFor="gender" >
                    {t('gender')}
                  </Label>
                  <select
                    id="gender"
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="mt-1 w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white"
                  >
                    <option value="">{t('selectGenderOption')}</option>
                    <option value="male">{t('male')}</option>
                    <option value="female">{t('female')}</option>
                    <option value="others">{t('others')}</option>
                  </select>
                </div>

                {/* Age - Optional */}
                <div>
                  <Label htmlFor="age" >
                    {t('age')}
                  </Label>
                  <Input
                    id="age"
                    type="number"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder={t('agePlaceholder')}
                    className="mt-1 h-10 border-2 border-gray-200"
                    min="0"
                  />
                </div>

                {/* Affiliate Code - with Serial Input Option */}
                <div className="p-4 bg-primary/10 rounded-xl border-2 border-primary/20">
                  <Label htmlFor="affiliateCode" className="flex items-center gap-2 text-primary" >
                    <Gift className="h-4 w-4" />
                    {t('serialAffiliateCodeLabel')}
                  </Label>
                  <Input
                    id="affiliateCode"
                    value={affiliateCode}
                    onChange={(e) => setAffiliateCode(e.target.value.toUpperCase())}
                    placeholder={t('serialAffiliateCodePlaceholder')}
                    className={`mt-2 h-10 border-2 border-primary focus:border-primary bg-white ${!affiliateCode ? '' : 'border-primary bg-green-50/30'}`}
                  />
                  <p className="mt-2 text-xs text-primary" >
                    {t('enterReferralCode')}
                  </p>
                </div>

                {/* Patient Type - Required */}
                <div>
                  <Label className="flex items-center gap-1" >
                    {t('patientType')} <span className="text-red-500 font-bold">*</span>
                  </Label>
                  <div className="mt-2 space-y-2">
                    {[
                      { value: "new", label: t('newPatient') },
                      { value: "report", label: t('reportShowing') },
                    ].map((type) => (
                      <label
                        key={type.value}
                        className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all hover:bg-primary/5 ${patientType === type.value
                            ? "border-primary bg-primary/10 shadow-sm"
                            : "border-gray-200 bg-white"
                          }`}
                      >
                        <input
                          type="radio"
                          name="patientType"
                          value={type.value}
                          checked={patientType === type.value}
                          onChange={(e) => setPatientType(e.target.value as "new" | "report")}
                          className="w-4 h-4 text-primary accent-primary"
                        />
                        <span>
                          {type.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Validation Warning */}
                {(!selectedHospitalSlug || !selectedDate) && (
                  <div className="p-3 bg-yellow-50 border border-yellow-300 rounded-lg">
                    <p className="text-sm text-yellow-700" >
                      {!selectedHospitalSlug && "⚠️ " + t('noHospitalAssigned')}
                      {!selectedHospitalSlug && !selectedDate && " " + (language === 'en' ? "and" : "এবং") + " "}
                      {!selectedDate && "⚠️ " + t('selectDateRequired')}
                    </p>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={!selectedHospitalSlug || !selectedDate || !patientName || !mobileNumber || submitting}
                  className="w-full btn-primary btn-slide disabled:opacity-50 text-md h-12 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      {language === 'en' ? 'Waiting...' : 'অপেক্ষা করুন...'}
                    </>
                  ) : (
                    <div className="flex justify-center items-center gap-2">
                      {language === 'en' ? 'Review Appointment' : 'অ্যাপয়েন্টমেন্ট রিভিউ করুন'}
                      <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </div>
                  )}
                </Button>
              </form>
            </Card>
          </div>
        </div>
      </div>
      <PhoneVerificationModal
        isOpen={showVerifyModal}
        onClose={() => setShowVerifyModal(false)}
        phoneNumber={mobileNumber}
        onVerifySuccess={handleVerifySuccess}
        language={language}
      />
      <Footer />
    </div>
  );
}
