"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  DollarSign,
  Users,
  TrendingUp,
  LogOut,
  Copy,
  Share2,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle,
  XCircle,
  Calendar as CalendarIcon,
  Wallet,
  Eye,
  EyeOff,
  Download,
  Menu,
  UserCircle,
  Settings,
  FileText,
  Edit3,
  Save,
  X,
  Phone,
  Mail,
  User,
  CreditCard,
  Shield,
  Award,
  Activity,
  BarChart3,
  RefreshCw,
  Filter,
  TrendingDown as TrendingDownIcon,
  Upload,
  Image as ImageIcon,
} from "lucide-react";
import { FiActivity } from "react-icons/fi";
import { HiOutlineChartBar } from "react-icons/hi";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AffiliateSidebar from "@/components/affiliate-sidebar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select } from "@/components/ui/select";
import { showToast } from "@/lib/toast";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { format } from "date-fns";
import { useLanguage } from "@/contexts/LanguageContext";

interface Affiliate {
  id?: string;
  affiliateCode: string;
  walletBalance: number;
  totalEarned: number;
  totalWithdrawn: number;
  pendingCommissions: number;
  name?: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  referrals: number;
  earnings: number;
  paymentMethod?: string;
  paymentDetails?: string;
  photo?: string;
  isActive?: boolean;
}

interface Commission {
  _id: string;
  commissionAmount: number;
  status: string;
  createdAt: string;
  totalBill: number;
  commissionType: string;
  appointmentId?: {
    patientName: string;
    appointmentDate: string;
  };
}

interface Withdrawal {
  _id: string;
  amount: number;
  status: string;
  createdAt: string;
  processedAt?: string;
}

interface AffiliateRequest {
  _id: string;
  patientName: string;
  patientPhone: string;
  doctorName: string;
  hospitalName: string;
  proofPhoto?: string;
  proofPhotos?: string[];
  appointmentId?: string;
  commissionAmount?: number;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

interface ReferralPatient {
  _id: string;
  serialNumber?: string;
  patientName: string;
  mobileNumber: string;
  gender?: string;
  age?: number;
  patientType: 'old' | 'new' | 'report';
  hospitalName: string;
  appointmentDate: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  createdAt: string;
  doctorId?: {
    name: string;
    qualification: string;
    department?: string;
    hospital?: string;
  };
}

interface ReferralStats {
  total: number;
  pending: number;
  confirmed: number;
  completed: number;
  cancelled: number;
}

export default function EnhancedAffiliateDashboard() {
  const [affiliate, setAffiliate] = useState<Affiliate | null>(null);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [requests, setRequests] = useState<AffiliateRequest[]>([]);
  const [referralPatients, setReferralPatients] = useState<ReferralPatient[]>([]);
  const [referralStats, setReferralStats] = useState<ReferralStats | null>(null);
  const [referralLoading, setReferralLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<any>(null);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportType, setReportType] = useState<'all' | 'monthly' | 'daily' | 'pending' | 'paid'>('all');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [activeTab, setActiveTab] = useState<'overview' | 'commissions' | 'withdrawals' | 'profile' | 'requests' | 'reports' | 'referrals'>('overview');
  const router = useRouter();
  const { language } = useLanguage();

  // Profile editing state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileForm, setProfileForm] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    paymentMethod: '',
    paymentDetails: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  // Request form state
  const [requestForm, setRequestForm] = useState({
    patientName: '',
    patientPhone: '',
    doctorName: '',
    hospitalName: '',
  });
  const [requestSubmitting, setRequestSubmitting] = useState(false);

  // Photo upload state for referral patients
  const [selectedPatient, setSelectedPatient] = useState<ReferralPatient | null>(null);
  const [photoUploadDialogOpen, setPhotoUploadDialogOpen] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoUploadForm, setPhotoUploadForm] = useState({
    doctorName: '',
    hospitalName: '',
  });

  // Hospital search state
  const [hospitalSearchRequest, setHospitalSearchRequest] = useState('');
  const [hospitalSearchPhoto, setHospitalSearchPhoto] = useState('');
  const [showHospitalDropdownRequest, setShowHospitalDropdownRequest] = useState(false);
  const [showHospitalDropdownPhoto, setShowHospitalDropdownPhoto] = useState(false);

  // Common hospital list
  const hospitals = [
    'Square Hospital',
    'United Hospital',
    'Apollo Hospital',
    'Labaid Hospital',
    'Popular Diagnostic Centre',
    'Ibn Sina Hospital',
    'Evercare Hospital',
    'Bangladesh Medical College Hospital',
    'Holy Family Red Crescent Hospital',
    'National Heart Foundation',
    'Dhaka Medical College Hospital',
    'Bangabandhu Sheikh Mujib Medical University',
    'Birdem General Hospital',
    'Ad-Din Hospital',
    'Islami Bank Hospital',
    'Delta Medical College Hospital',
    'Anwar Khan Modern Hospital',
    'Central Hospital',
    'Green Life Hospital',
    'Japan Bangladesh Friendship Hospital',
  ];

  useEffect(() => {
    const affiliateData = localStorage.getItem("affiliate");
    if (!affiliateData) {
      router.push("/affiliate-program");
      return;
    }

    try {
      const parsedData = JSON.parse(affiliateData);
      setAffiliate(parsedData);
      setProfileForm({
        fullName: parsedData.fullName || parsedData.name || '',
        email: parsedData.email || '',
        phoneNumber: parsedData.phoneNumber || '',
        paymentMethod: parsedData.paymentMethod || '',
        paymentDetails: parsedData.paymentDetails || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      fetchWalletData(parsedData.affiliateCode);
      if (parsedData.id) {
        fetchRequests(parsedData.id);
      }

      // Check URL search parameters for default tab
      if (typeof window !== "undefined") {
        const urlParams = new URLSearchParams(window.location.search);
        const tabParam = urlParams.get('tab');
        if (tabParam && ['overview', 'commissions', 'withdrawals', 'profile', 'requests', 'reports', 'referrals'].includes(tabParam)) {
          setActiveTab(tabParam as any);
        }
      }
    } catch (error) {
      console.error("Error parsing affiliate data:", error);
      localStorage.removeItem("affiliate");
      router.push("/affiliate-program");
    }
  }, [router]);

  const fetchWalletData = async (code: string) => {
    try {
      const response = await fetch(`/api/affiliate/wallet?affiliateCode=${code}`);
      const data = await response.json();
      
      if (response.ok) {
        setCommissions(data.commissions || []);
        setWithdrawals(data.withdrawals || []);
        
        // Update affiliate wallet data
        if (data.wallet) {
          setAffiliate(prev => prev ? {
            ...prev,
            walletBalance: data.wallet.balance,
            totalEarned: data.wallet.totalEarned,
            totalWithdrawn: data.wallet.totalWithdrawn,
            pendingCommissions: data.wallet.pendingCommissions,
          } : null);
        }
      }
    } catch (error) {
      console.error('Error fetching wallet data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRequests = async (affiliateId: string) => {
    try {
      const response = await fetch(`/api/affiliate/request?affiliateId=${affiliateId}`);
      const data = await response.json();
      if (response.ok) {
        setRequests(data.requests || []);
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
    }
  };

  const fetchReferralPatients = async (affiliateCode: string) => {
    setReferralLoading(true);
    try {
      const response = await fetch(`/api/affiliate/referrals?affiliateCode=${affiliateCode}`);
      const data = await response.json();
      if (response.ok) {
        setReferralPatients(data.appointments || []);
        setReferralStats(data.stats || null);
      }
    } catch (error) {
      console.error('Error fetching referral patients:', error);
    } finally {
      setReferralLoading(false);
    }
  };

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!affiliate?.id) return;

    setRequestSubmitting(true);
    try {
      const response = await fetch('/api/affiliate/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          affiliateId: affiliate.id,
          ...requestForm,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        showToast.success(language === 'bn' ? "অনুরোধ সফলভাবে সাবমিট করা হয়েছে!" : "Request submitted successfully!");
        setRequestForm({
          patientName: '',
          patientPhone: '',
          doctorName: '',
          hospitalName: '',
        });
        fetchRequests(affiliate.id);
        setActiveTab('requests');
      } else {
        showToast.error(data.error || "Failed to submit request");
      }
    } catch (error) {
      showToast.error("An error occurred. Please try again.");
    } finally {
      setRequestSubmitting(false);
    }
  };

  const hasProofBeenSent = (patientId: string) => {
    return requests.some(req => 
      req.appointmentId === patientId && 
      (req.proofPhoto || (req.proofPhotos && req.proofPhotos.length > 0))
    );
  };

  const getRequestStatus = (patientId: string) => {
    const request = requests.find(req => req.appointmentId === patientId);
    return request ? request.status : null;
  };

  const handlePatientClick = (patient: ReferralPatient) => {
    if (hasProofBeenSent(patient._id)) {
      return;
    }
    setSelectedPatient(patient);
    setPhotoUploadForm({
      doctorName: patient.doctorId?.name || '',
      hospitalName: patient.hospitalName || '',
    });
    setPhotoUploadDialogOpen(true);
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const validFiles: File[] = [];
    const previews: string[] = [];

    files.forEach((file) => {
      if (!file.type.startsWith('image/')) {
        showToast.error(`${file.name} is not an image file`);
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        showToast.error(`${file.name} is larger than 10MB`);
        return;
      }
      validFiles.push(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        previews.push(reader.result as string);
        if (previews.length === validFiles.length) {
          setPhotoPreviews([...previews]);
        }
      };
      reader.readAsDataURL(file);
    });

    setSelectedPhotos([...selectedPhotos, ...validFiles]);
  };

  const removePhoto = (index: number) => {
    setSelectedPhotos(selectedPhotos.filter((_, i) => i !== index));
    setPhotoPreviews(photoPreviews.filter((_, i) => i !== index));
  };

  const handlePhotoUpload = async () => {
    if (selectedPhotos.length === 0 || !selectedPatient || !affiliate?.id) {
      showToast.error('Please select at least one photo');
      return;
    }

    if (!photoUploadForm.doctorName || !photoUploadForm.hospitalName) {
      showToast.error('Please fill in doctor and hospital name');
      return;
    }

    setUploadingPhoto(true);
    try {
      const uploadPromises = selectedPhotos.map(async (photo) => {
        const formData = new FormData();
        formData.append('image', photo);

        const uploadResponse = await fetch('/api/upload/imgbb', {
          method: 'POST',
          body: formData,
        });

        const uploadData = await uploadResponse.json();

        if (!uploadResponse.ok || !uploadData.url) {
          throw new Error(uploadData.error || 'Failed to upload photo');
        }

        return uploadData.url;
      });

      const photoUrls = await Promise.all(uploadPromises);

      const response = await fetch('/api/affiliate/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          affiliateId: affiliate.id,
          patientName: selectedPatient.patientName,
          patientPhone: selectedPatient.mobileNumber,
          doctorName: photoUploadForm.doctorName,
          hospitalName: photoUploadForm.hospitalName,
          proofPhotos: photoUrls,
          appointmentId: selectedPatient._id,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        showToast.success(language === 'bn' ? "ফটো সফলভাবে সাবমিট করা হয়েছে!" : "Photos submitted successfully!");
        setPhotoUploadDialogOpen(false);
        setSelectedPhotos([]);
        setPhotoPreviews([]);
        setSelectedPatient(null);
        setPhotoUploadForm({ doctorName: '', hospitalName: '' });
        fetchRequests(affiliate.id);
      } else {
        showToast.error(data.error || "Failed to submit photos");
      }
    } catch (error: any) {
      showToast.error(error.message || "An error occurred. Please try again.");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const refreshData = async () => {
    if (affiliate?.affiliateCode) {
      setLoading(true);
      await fetchWalletData(affiliate.affiliateCode);
      if (activeTab === 'reports') {
        await fetchReports();
      }
      if (activeTab === 'referrals') {
        await fetchReferralPatients(affiliate.affiliateCode);
      }
      showToast.success(language === 'bn' ? "তথ্য রিফ্রেশ করা হয়েছে!" : "Data refreshed!");
    }
  };

  const fetchReports = useCallback(async () => {
    if (!affiliate?.affiliateCode) return;
    
    setReportsLoading(true);
    try {
      const params = new URLSearchParams({
        affiliateCode: affiliate.affiliateCode,
        type: reportType,
      });
      
      if (reportType === 'monthly') {
        params.append('month', selectedMonth.toString());
        params.append('year', selectedYear.toString());
      }
      
      const response = await fetch(`/api/affiliate/reports?${params}`);
      const data = await response.json();
      
      if (response.ok) {
        setReports(data);
      } else {
        showToast.error(data.error || "Failed to fetch reports");
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
      showToast.error("Failed to fetch reports");
    } finally {
      setReportsLoading(false);
    }
  }, [affiliate?.affiliateCode, reportType, selectedMonth, selectedYear, language]);

  useEffect(() => {
    if (activeTab === 'reports' && affiliate?.affiliateCode) {
      fetchReports();
    }
  }, [activeTab, fetchReports, affiliate?.affiliateCode]);

  useEffect(() => {
    if (activeTab === 'referrals' && affiliate?.affiliateCode) {
      fetchReferralPatients(affiliate.affiliateCode);
      if (affiliate.id) {
        fetchRequests(affiliate.id);
      }
      
      const interval = setInterval(() => {
        fetchReferralPatients(affiliate.affiliateCode);
        if (affiliate.id) {
          fetchRequests(affiliate.id);
        }
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [activeTab, affiliate?.affiliateCode, affiliate?.id]);

  const handleLogout = () => {
    localStorage.removeItem("affiliate");
    showToast.success(language === 'bn' ? "সফলভাবে লগআউট করা হয়েছে!" : "Successfully logged out!");
    router.push("/affiliate-program");
  };

  const copyAffiliateCode = () => {
    if (affiliate?.affiliateCode) {
      navigator.clipboard.writeText(affiliate.affiliateCode);
      showToast.success(language === 'bn' ? "কোড কপি করা হয়েছে!" : "Affiliate code copied!");
    }
  };

  const copyReferralLink = () => {
    if (affiliate?.affiliateCode) {
      const referralLink = `${window.location.origin}?ref=${affiliate.affiliateCode}`;
      navigator.clipboard.writeText(referralLink);
      showToast.success(language === 'bn' ? "লিঙ্ক কপি করা হয়েছে!" : "Referral link copied!");
    }
  };

  const handleProfileUpdate = async () => {
    if (!affiliate) return;

    setProfileLoading(true);
    try {
      const updateData: any = {
        affiliateId: affiliate.id,
        affiliateCode: affiliate.affiliateCode,
        fullName: profileForm.fullName,
        email: profileForm.email,
        phoneNumber: profileForm.phoneNumber,
        paymentMethod: profileForm.paymentMethod,
        paymentDetails: profileForm.paymentDetails,
      };

      if (changingPassword && profileForm.newPassword) {
        if (profileForm.newPassword !== profileForm.confirmPassword) {
          showToast.error(language === 'bn' ? "পাসওয়ার্ড ম্যাচ করেনি!" : "New passwords do not match");
          setProfileLoading(false);
          return;
        }
        updateData.currentPassword = profileForm.currentPassword;
        updateData.newPassword = profileForm.newPassword;
      }

      const response = await fetch('/api/affiliate/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      const result = await response.json();

      if (response.ok) {
        const updatedAffiliate = { ...affiliate, ...result.affiliate };
        localStorage.setItem("affiliate", JSON.stringify(updatedAffiliate));
        setAffiliate(updatedAffiliate);
        setIsEditingProfile(false);
        setChangingPassword(false);
        setProfileForm(prev => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        }));
        showToast.success(language === 'bn' ? "প্রোফাইল আপডেট করা হয়েছে!" : "Profile updated successfully!");
      } else {
        showToast.error(result.error || "Failed to update profile");
      }
    } catch (error) {
      showToast.error("An error occurred. Please try again.");
    } finally {
      setProfileLoading(false);
    }
  };

  if (loading || !affiliate) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#00B1C2] mx-auto mb-4"></div>
          <p className="text-[#017991] text-base font-medium">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Prepare chart data
  const monthlyData = commissions
    .filter(c => c.status === 'approved' || c.status === 'paid')
    .reduce((acc: any[], commission) => {
      const month = format(new Date(commission.createdAt), 'MMM');
      const existing = acc.find(item => item.month === month);
      if (existing) {
        existing.amount += commission.commissionAmount;
      } else {
        acc.push({ month, amount: commission.commissionAmount });
      }
      return acc;
    }, []);

  const statusData = [
    { name: 'Approved', value: commissions.filter(c => c.status === 'approved').length, color: '#10b981' },
    { name: 'Pending', value: commissions.filter(c => c.status === 'pending').length, color: '#f59e0b' },
    { name: 'Paid', value: commissions.filter(c => c.status === 'paid').length, color: '#00B1C2' },
  ];

  const stats = [
    {
      icon: Wallet,
      title: "Available Balance",
      titleBn: "উপলব্ধ ব্যালেন্স",
      value: `৳${(affiliate.walletBalance || 0).toLocaleString()}`,
      change: "+12%",
      trend: "up",
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-600",
    },
    {
      icon: TrendingUp,
      title: "Total Earned",
      titleBn: "মোট আয়",
      value: `৳${(affiliate.totalEarned || 0).toLocaleString()}`,
      change: "+8%",
      trend: "up",
      iconBg: "bg-blue-50",
      iconColor: "text-blue-600",
    },
    {
      icon: Users,
      title: "Total Referrals",
      titleBn: "মোট রেফারেল",
      value: (affiliate.referrals || 0).toString(),
      change: "+5",
      trend: "up",
      iconBg: "bg-purple-50",
      iconColor: "text-purple-600",
    },
    {
      icon: Clock,
      title: "Pending",
      titleBn: "পেন্ডিং",
      value: `৳${(affiliate.pendingCommissions || 0).toLocaleString()}`,
      change: `${commissions.filter(c => c.status === 'pending').length} items`,
      trend: "neutral",
      iconBg: "bg-orange-50",
      iconColor: "text-orange-600",
    },
  ];

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      {/* Decoupled Administrative Sidebar */}
      <AffiliateSidebar
        activeTab={activeTab}
        onTabChange={(tabId) => setActiveTab(tabId as any)}
        affiliate={affiliate}
        onLogout={handleLogout}
      />

      {/* Main Administrative Dashboard content area */}
      <main className="flex-1 lg:ml-64 overflow-y-auto h-screen relative pt-16 lg:pt-0" style={{ WebkitOverflowScrolling: 'touch' }}>
        <div className="p-6 lg:p-8">
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 pb-5 border-b border-gray-200">
            <div>
              <h1 className="text-2xl font-bold text-[#193252] tracking-tight">
                {language === 'bn' ? 'স্বাগতম, ' : 'Welcome, '}{affiliate.fullName || affiliate.name}!
              </h1>
              <p className="text-gray-500 text-sm mt-1">
                {affiliate.email} | Affiliate Code: <span className="font-bold text-[#00B1C2]">{affiliate.affiliateCode}</span>
              </p>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                onClick={refreshData}
                variant="outline"
                className="border-gray-200 text-gray-700 hover:bg-gray-50 bg-white flex-1 sm:flex-none text-sm font-medium"
              >
                <RefreshCw className="h-4 w-4 mr-2 text-[#00B1C2]" />
                <span>{language === 'bn' ? 'রিফ্রেশ' : 'Refresh'}</span>
              </Button>
              <Button
                onClick={handleLogout}
                variant="outline"
                className="border-red-100 text-red-600 hover:bg-red-50 bg-white flex-1 sm:flex-none text-sm font-medium"
              >
                <LogOut className="h-4 w-4 mr-2" />
                <span>{language === 'bn' ? 'লগআউট' : 'Logout'}</span>
              </Button>
            </div>
          </div>

          <div className="max-w-7xl mx-auto">
            <AnimatePresence mode="wait">
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <motion.div
                  key="overview"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.2 }}
                >
                  {/* Stats Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {stats.map((stat, index) => {
                      const IconComponent = stat.icon;
                      const TrendIcon = stat.trend === "up" ? ArrowUpRight : stat.trend === "down" ? ArrowDownRight : Clock;
                      
                      return (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <Card className="p-6 bg-white border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 rounded-2xl relative overflow-hidden group">
                            <div className="flex items-start justify-between relative z-10">
                              <div className="flex-1">
                                <p className="text-xs text-gray-500 mb-1 font-semibold uppercase tracking-wider">
                                  {language === 'bn' ? stat.titleBn : stat.title}
                                </p>
                                <p className="text-3xl font-bold text-[#193252] mb-2">
                                  {stat.value}
                                </p>
                                <div className="flex items-center gap-1 text-sm">
                                  <TrendIcon className={`h-4 w-4 ${stat.trend === 'up' ? 'text-green-600' : stat.trend === 'down' ? 'text-red-600' : 'text-gray-400'}`} />
                                  <span className={`${stat.trend === 'up' ? 'text-green-600' : stat.trend === 'down' ? 'text-red-600' : 'text-gray-400'} font-semibold`}>
                                    {stat.change}
                                  </span>
                                </div>
                              </div>
                              <div className={`h-12 w-12 rounded-xl ${stat.iconBg} flex items-center justify-center transform group-hover:scale-105 transition-transform`}>
                                <IconComponent className={`h-6 w-6 ${stat.iconColor}`} />
                              </div>
                            </div>
                          </Card>
                        </motion.div>
                      );
                    })}
                  </div>

                  {/* Charts Section */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    {/* Earnings Chart */}
                    <motion.div
                      initial={{ opacity: 0, x: -15 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 }}
                      className="lg:col-span-2"
                    >
                      <Card className="p-6 bg-white border border-gray-200 shadow-sm rounded-2xl">
                        <div className="flex items-center justify-between mb-6">
                          <div>
                            <h3 className="text-lg font-bold text-[#193252] flex items-center gap-2">
                              <HiOutlineChartBar className="h-5 w-5 text-[#00B1C2]" />
                              <span>Earnings Overview</span>
                            </h3>
                            <p className="text-xs text-gray-500 mt-1">Monthly commission trends</p>
                          </div>
                        </div>
                        
                        <ResponsiveContainer width="100%" height={280}>
                          <AreaChart data={monthlyData}>
                            <defs>
                              <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#00B1C2" stopOpacity={0.2}/>
                                <stop offset="95%" stopColor="#00B1C2" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis dataKey="month" stroke="#64748b" style={{ fontSize: 12 }} />
                            <YAxis stroke="#64748b" style={{ fontSize: 12 }} />
                            <Tooltip 
                              contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', color: '#193252' }}
                              formatter={(value: any) => `৳${value.toLocaleString()}`}
                            />
                            <Area 
                              type="monotone" 
                              dataKey="amount" 
                              stroke="#00B1C2" 
                              strokeWidth={3}
                              fill="url(#colorAmount)" 
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </Card>
                    </motion.div>

                    {/* Status Distribution */}
                    <motion.div
                      initial={{ opacity: 0, x: 15 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      <Card className="p-6 bg-white border border-gray-200 shadow-sm rounded-2xl h-full">
                        <div className="mb-4">
                          <h3 className="text-lg font-bold text-[#193252] flex items-center gap-2">
                            <FiActivity className="h-5 w-5 text-[#00B1C2]" />
                            <span>Commission Status</span>
                          </h3>
                          <p className="text-xs text-gray-500 mt-1">Breakdown by status</p>
                        </div>
                        
                        <ResponsiveContainer width="100%" height={240}>
                          <PieChart>
                            <Pie
                              data={statusData}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={80}
                              paddingAngle={5}
                              dataKey="value"
                            >
                              {statusData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }} />
                            <Legend wrapperStyle={{ fontSize: 12 }} />
                          </PieChart>
                        </ResponsiveContainer>
                      </Card>
                    </motion.div>
                  </div>

                  {/* Affiliate Code & Withdrawal CTA */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Affiliate Code */}
                    <motion.div
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                    >
                      <Card className="p-6 bg-gradient-to-br from-[#00B1C2]/5 to-[#017991]/5 border border-[#00B1C2]/20 h-full rounded-2xl">
                        <h3 className="text-lg font-bold text-[#193252] mb-4 flex items-center gap-2">
                          <Award className="h-5 w-5 text-[#00B1C2]" />
                          Your Affiliate Code
                        </h3>
                        
                        <div className="bg-white rounded-xl p-4 mb-4 border border-gray-200 shadow-sm">
                          <div className="flex items-center justify-between">
                            <code className="text-3xl font-bold text-[#00B1C2] tracking-wider font-mono">
                              {affiliate.affiliateCode}
                            </code>
                            <button
                              onClick={copyAffiliateCode}
                              className="p-2.5 hover:bg-gray-100 rounded-lg transition-colors border border-gray-100"
                            >
                              <Copy className="h-5 w-5 text-[#017991]" />
                            </button>
                          </div>
                        </div>
                        
                        <Button
                          onClick={copyReferralLink}
                          className="w-full bg-[#00B1C2] hover:bg-[#017d7b] text-white shadow-sm"
                        >
                          <Share2 className="h-4 w-4 mr-2" />
                          Copy Referral Link
                        </Button>
                      </Card>
                    </motion.div>

                    {/* Withdrawal CTA */}
                    <motion.div
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                    >
                      <Card className="p-6 bg-gradient-to-br from-emerald-50 to-teal-50/50 border border-emerald-100 h-full rounded-2xl">
                        <h3 className="text-lg font-bold text-[#193252] mb-4 flex items-center gap-2">
                          <Wallet className="h-5 w-5 text-emerald-600" />
                          Request Withdrawal
                        </h3>
                        
                        <div className="mb-4">
                          <p className="text-xs text-gray-500 mb-1 uppercase tracking-wider font-semibold">Available Balance</p>
                          <p className="text-4xl font-bold text-emerald-600">
                            ৳{(affiliate.walletBalance || 0).toLocaleString()}
                          </p>
                        </div>
                        
                        <Button
                          onClick={() => router.push('/affiliate-program/withdrawal')}
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                          disabled={(affiliate.walletBalance || 0) === 0}
                        >
                          <DollarSign className="h-4 w-4 mr-2" />
                          Request Withdrawal
                        </Button>
                        
                        {(affiliate.walletBalance || 0) === 0 && (
                          <p className="text-xs text-gray-400 mt-2 text-center">
                            No balance available for withdrawal
                          </p>
                        )}
                      </Card>
                    </motion.div>
                  </div>
                </motion.div>
              )}

              {/* Referral Patients Tab */}
              {activeTab === 'referrals' && (
                <motion.div
                  key="referrals"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                >
                  {/* Referral Stats Cards */}
                  {referralStats && (
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                      {[
                        { label: 'মোট রোগী', value: referralStats.total, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-100' },
                        { label: 'পেন্ডিং', value: referralStats.pending, color: 'text-orange-600', bg: 'bg-orange-50 border-orange-100' },
                        { label: 'কনফার্মড', value: referralStats.confirmed, color: 'text-cyan-600', bg: 'bg-cyan-50 border-cyan-100' },
                        { label: 'সম্পন্ন', value: referralStats.completed, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100' },
                        { label: 'বাতিল', value: referralStats.cancelled, color: 'text-red-600', bg: 'bg-red-50 border-red-100' },
                      ].map((item, idx) => (
                        <Card key={idx} className={`p-4 text-center border rounded-2xl ${item.bg}`}>
                          <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
                          <p className="text-xs text-gray-600 mt-1 font-medium">{item.label}</p>
                        </Card>
                      ))}
                    </div>
                  )}

                  <Card className="p-6 bg-white border border-gray-200 shadow-sm rounded-2xl">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-3">
                      <div>
                        <h3 className="text-lg font-bold text-[#193252] flex items-center gap-2 mb-1">
                          <Users className="h-5 w-5 text-[#00B1C2]" />
                          রেফারেল রোগী তালিকা
                        </h3>
                        <p className="text-xs text-gray-500">
                          আপনার রেফারেল কোড ব্যবহার করে বুক করা রোগীদের তথ্য
                        </p>
                      </div>
                      <Button
                        onClick={() => affiliate?.affiliateCode && fetchReferralPatients(affiliate.affiliateCode)}
                        variant="outline"
                        size="sm"
                        disabled={referralLoading}
                        className="border-gray-200 text-gray-700 hover:bg-gray-50 bg-white w-full sm:w-auto text-xs"
                      >
                        <RefreshCw className={`h-3.5 w-3.5 mr-1 text-[#00B1C2] ${referralLoading ? 'animate-spin' : ''}`} />
                        <span>রিফ্রেশ</span>
                      </Button>
                    </div>

                    {referralLoading ? (
                      <div className="flex items-center justify-center py-12">
                        <RefreshCw className="h-8 w-8 animate-spin text-[#00B1C2]" />
                      </div>
                    ) : (
                      <div className="overflow-x-auto -mx-6 sm:mx-0">
                        <table className="w-full min-w-[900px] text-left">
                          <thead>
                            <tr className="border-b border-gray-200 bg-gray-50/50">
                              <th className="py-3 px-4 font-semibold text-gray-600 text-xs uppercase">সিরিয়াল</th>
                              <th className="py-3 px-4 font-semibold text-gray-600 text-xs uppercase">রোগীর নাম</th>
                              <th className="py-3 px-4 font-semibold text-gray-600 text-xs uppercase">মোবাইল</th>
                              <th className="py-3 px-4 font-semibold text-gray-600 text-xs uppercase">ডাক্তার</th>
                              <th className="py-3 px-4 font-semibold text-gray-600 text-xs uppercase">চেম্বার</th>
                              <th className="py-3 px-4 font-semibold text-gray-600 text-xs uppercase">তারিখ</th>
                              <th className="py-3 px-4 font-semibold text-gray-600 text-xs uppercase text-center">রোগীর ধরন</th>
                              <th className="py-3 px-4 font-semibold text-gray-600 text-xs uppercase text-center">স্ট্যাটাস</th>
                              <th className="py-3 px-4 font-semibold text-gray-600 text-xs uppercase text-center">অ্যাকশন</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {referralPatients.length === 0 ? (
                              <tr>
                                <td colSpan={9} className="text-center py-12 text-gray-500">
                                  <Users className="h-12 w-12 mx-auto mb-3 opacity-30 text-[#017991]" />
                                  <p className="font-semibold text-gray-600">এখনো কোন রোগী আপনার রেফারেল কোড ব্যবহার করেনি</p>
                                  <p className="text-xs text-gray-400 mt-1">আপনার কোড: <span className="text-[#00B1C2] font-bold font-mono">{affiliate?.affiliateCode}</span></p>
                                </td>
                              </tr>
                            ) : (
                              referralPatients.map((patient) => (
                                <tr key={patient._id} className="hover:bg-gray-50/50 transition-colors">
                                  <td className="py-4 px-4 text-xs font-mono">
                                    {patient.serialNumber ? (
                                      <span className="text-[#00B1C2] font-bold">{patient.serialNumber}</span>
                                    ) : (
                                      <span className="text-yellow-700 text-xs px-2 py-0.5 bg-yellow-50 rounded border border-yellow-200">অপেক্ষমান</span>
                                    )}
                                  </td>
                                  <td className="py-4 px-4 text-sm text-[#193252]">
                                    <div className="font-semibold">{patient.patientName}</div>
                                    {patient.gender && (
                                      <div className="text-xs text-gray-500 mt-0.5">
                                        {patient.gender === 'male' ? 'পুরুষ' : patient.gender === 'female' ? 'মহিলা' : 'অন্যান্য'}
                                        {patient.age && `, ${patient.age} বছর`}
                                      </div>
                                    )}
                                  </td>
                                  <td className="py-4 px-4 text-sm text-gray-600">
                                    {patient.mobileNumber}
                                  </td>
                                  <td className="py-4 px-4 text-sm text-[#193252]">
                                    {patient.doctorId ? (
                                      <div>
                                        <div className="font-semibold">{patient.doctorId.name}</div>
                                        <div className="text-xs text-gray-500">{patient.doctorId.qualification}</div>
                                      </div>
                                    ) : (
                                      'N/A'
                                    )}
                                  </td>
                                  <td className="py-4 px-4 text-sm text-gray-600">
                                    {patient.hospitalName}
                                  </td>
                                  <td className="py-4 px-4 text-sm text-gray-600">
                                    {format(new Date(patient.appointmentDate), 'MMM dd, yyyy')}
                                  </td>
                                  <td className="py-4 px-4 text-center">
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                      patient.patientType === 'new'
                                        ? 'bg-green-50 text-green-700 border border-green-200'
                                        : patient.patientType === 'old'
                                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                        : 'bg-purple-50 text-purple-700 border border-purple-200'
                                    }`}>
                                      {patient.patientType === 'new' ? 'নতুন' : patient.patientType === 'old' ? 'পুরাতন' : 'রিপোর্ট'}
                                    </span>
                                  </td>
                                  <td className="py-4 px-4 text-center">
                                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                                      patient.status === 'completed'
                                        ? 'bg-green-50 text-green-700 border border-green-200'
                                        : patient.status === 'confirmed'
                                        ? 'bg-cyan-50 text-cyan-700 border border-cyan-200'
                                        : patient.status === 'cancelled'
                                        ? 'bg-red-50 text-red-700 border border-red-200'
                                        : 'bg-orange-50 text-orange-700 border border-orange-200'
                                    }`}>
                                      {patient.status === 'completed' || patient.status === 'confirmed' ? (
                                        <CheckCircle className="h-3 w-3" />
                                      ) : patient.status === 'cancelled' ? (
                                        <XCircle className="h-3 w-3" />
                                      ) : (
                                        <Clock className="h-3 w-3" />
                                      )}
                                      {patient.status === 'pending' ? 'পেন্ডিং' : 
                                       patient.status === 'confirmed' ? 'কনফার্মড' : 
                                       patient.status === 'completed' ? 'সম্পন্ন' : 'বাতিল'}
                                    </span>
                                  </td>
                                  <td className="py-4 px-4 text-center">
                                    {hasProofBeenSent(patient._id) ? (
                                      <div className="flex flex-col items-center gap-1">
                                        <span className="inline-flex items-center px-2.5 py-1 bg-green-50 text-green-700 border border-green-200 rounded-lg text-xs font-semibold">
                                          <CheckCircle className="h-3.5 w-3.5 mr-1" />
                                          সম্পন্ন
                                        </span>
                                        {getRequestStatus(patient._id) && (
                                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                                            getRequestStatus(patient._id) === 'approved'
                                              ? 'bg-green-100 text-green-800'
                                              : getRequestStatus(patient._id) === 'rejected'
                                              ? 'bg-red-100 text-red-800'
                                              : 'bg-orange-100 text-orange-800'
                                          }`}>
                                            {getRequestStatus(patient._id) === 'approved' ? 'অনুমোদিত' : 
                                             getRequestStatus(patient._id) === 'rejected' ? 'বাতিল' : 
                                             'পেন্ডিং'}
                                          </span>
                                        )}
                                      </div>
                                    ) : (
                                      <Button
                                        onClick={() => handlePatientClick(patient)}
                                        size="sm"
                                        className="bg-[#00B1C2] hover:bg-[#017d7b] text-white shadow-sm text-xs font-medium"
                                      >
                                        <Upload className="h-3.5 w-3.5 mr-1" />
                                        প্রমাণ পাঠান
                                      </Button>
                                    )}
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </Card>

                  {/* Info Card */}
                  <Card className="mt-6 p-4 bg-[#00B1C2]/5 border border-[#00B1C2]/15 rounded-xl">
                    <div className="flex items-start gap-3">
                      <Shield className="h-5 w-5 text-[#017991] mt-0.5" />
                      <div>
                        <p className="text-sm text-[#193252]">
                          <span className="font-bold text-[#017991]">নোট:</span> এই তালিকায় শুধুমাত্র সেই রোগীরা দেখানো হচ্ছে যারা বুকিং এর সময় আপনার রেফারেল কোড (<span className="font-bold text-[#00B1C2]">{affiliate?.affiliateCode}</span>) ব্যবহার করেছেন। আপনি রোগীদের তথ্য এবং অ্যাপয়েন্টমেন্ট স্ট্যাটাস দেখতে পারবেন, কিন্তু স্ট্যাটাস পরিবর্তন করতে পারবেন না।
                        </p>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              )}

              {/* Commissions Tab */}
              {activeTab === 'commissions' && (
                <motion.div
                  key="commissions"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                >
                  <Card className="p-6 bg-white border border-gray-200 shadow-sm rounded-2xl">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-bold text-[#193252] flex items-center gap-2">
                        <DollarSign className="h-5 w-5 text-[#00B1C2]" />
                        Commission History
                      </h3>
                    </div>

                    <div className="overflow-x-auto -mx-6 sm:mx-0">
                      <table className="w-full min-w-[640px] text-left">
                        <thead>
                          <tr className="border-b border-gray-200 bg-gray-50/50">
                            <th className="py-3 px-4 font-semibold text-gray-600 text-xs uppercase">Date</th>
                            <th className="py-3 px-4 font-semibold text-gray-600 text-xs uppercase">Patient</th>
                            <th className="py-3 px-4 font-semibold text-gray-600 text-xs uppercase text-right">Bill</th>
                            <th className="py-3 px-4 font-semibold text-gray-600 text-xs uppercase text-right">Commission</th>
                            <th className="py-3 px-4 font-semibold text-gray-600 text-xs uppercase text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {commissions.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="text-center py-12 text-gray-500">
                                <DollarSign className="h-12 w-12 mx-auto mb-3 opacity-30 text-[#017991]" />
                                <p className="font-semibold text-gray-600">No commission records yet</p>
                              </td>
                            </tr>
                          ) : (
                            commissions.map((commission) => (
                              <tr key={commission._id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="py-4 px-4 text-sm text-gray-500">
                                  {format(new Date(commission.createdAt), 'MMM dd, yyyy')}
                                </td>
                                <td className="py-4 px-4 text-sm font-semibold text-[#193252]">
                                  {commission.appointmentId?.patientName || 'N/A'}
                                </td>
                                <td className="py-4 px-4 text-sm text-right text-gray-600">
                                  ৳{commission.totalBill.toLocaleString()}
                                </td>
                                <td className="py-4 px-4 text-sm text-right font-bold text-emerald-600">
                                  ৳{commission.commissionAmount.toLocaleString()}
                                </td>
                                <td className="py-4 px-4 text-center">
                                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                                    commission.status === 'approved' || commission.status === 'paid'
                                      ? 'bg-green-50 text-green-700 border border-green-200'
                                      : 'bg-orange-50 text-orange-700 border border-orange-200'
                                  }`}>
                                    {commission.status === 'approved' || commission.status === 'paid' ? (
                                      <CheckCircle className="h-3 w-3" />
                                    ) : (
                                      <Clock className="h-3 w-3" />
                                    )}
                                    <span className="capitalize">{commission.status}</span>
                                  </span>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                </motion.div>
              )}

              {/* Withdrawals Tab */}
              {activeTab === 'withdrawals' && (
                <motion.div
                  key="withdrawals"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                >
                  <Card className="p-6 bg-white border border-gray-200 shadow-sm rounded-2xl">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-3">
                      <h3 className="text-lg font-bold text-[#193252] flex items-center gap-2">
                        <Wallet className="h-5 w-5 text-[#00B1C2]" />
                        Withdrawal History
                      </h3>
                      <Button
                        onClick={() => router.push('/affiliate-program/withdrawal')}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold w-full sm:w-auto shadow-sm"
                        disabled={(affiliate.walletBalance || 0) === 0}
                      >
                        <DollarSign className="h-4 w-4 mr-2" />
                        <span>New Withdrawal</span>
                      </Button>
                    </div>

                    <div className="overflow-x-auto -mx-6 sm:mx-0">
                      <table className="w-full min-w-[560px] text-left">
                        <thead>
                          <tr className="border-b border-gray-200 bg-gray-50/50">
                            <th className="py-3 px-4 font-semibold text-gray-600 text-xs uppercase">Date</th>
                            <th className="py-3 px-4 font-semibold text-gray-600 text-xs uppercase text-right">Amount</th>
                            <th className="py-3 px-4 font-semibold text-gray-600 text-xs uppercase text-center">Status</th>
                            <th className="py-3 px-4 font-semibold text-gray-600 text-xs uppercase">Processed At</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {withdrawals.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="text-center py-12 text-gray-500">
                                <Wallet className="h-12 w-12 mx-auto mb-3 opacity-30 text-[#017991]" />
                                <p className="font-semibold text-gray-600">No withdrawal requests yet</p>
                              </td>
                            </tr>
                          ) : (
                            withdrawals.map((withdrawal) => (
                              <tr key={withdrawal._id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="py-4 px-4 text-sm text-gray-500">
                                  {format(new Date(withdrawal.createdAt), 'MMM dd, yyyy')}
                                </td>
                                <td className="py-4 px-4 text-sm text-right font-bold text-[#193252]">
                                  ৳{withdrawal.amount.toLocaleString()}
                                </td>
                                <td className="py-4 px-4 text-center">
                                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                                    withdrawal.status === 'approved'
                                      ? 'bg-green-50 text-green-700 border border-green-200'
                                      : withdrawal.status === 'rejected'
                                      ? 'bg-red-50 text-red-700 border border-red-200'
                                      : 'bg-orange-50 text-orange-700 border border-orange-200'
                                  }`}>
                                    {withdrawal.status === 'approved' ? (
                                      <CheckCircle className="h-3 w-3" />
                                    ) : withdrawal.status === 'rejected' ? (
                                      <XCircle className="h-3 w-3" />
                                    ) : (
                                      <Clock className="h-3 w-3" />
                                    )}
                                    <span className="capitalize">{withdrawal.status}</span>
                                  </span>
                                </td>
                                <td className="py-4 px-4 text-sm text-gray-500">
                                  {withdrawal.processedAt 
                                    ? format(new Date(withdrawal.processedAt), 'MMM dd, yyyy')
                                    : '-'
                                  }
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                </motion.div>
              )}

              {/* Requests Tab */}
              {activeTab === 'requests' && (
                <motion.div
                  key="requests"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                >
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Request Form */}
                    <Card className="p-6 bg-white border border-gray-200 shadow-sm rounded-2xl lg:col-span-1 h-fit">
                      <h3 className="text-lg font-bold text-[#193252] mb-6 flex items-center gap-2">
                        <FileText className="h-5 w-5 text-[#00B1C2]" />
                        Submit New Request
                      </h3>
                      <form onSubmit={handleRequestSubmit} className="space-y-4">
                        <div>
                          <Label className="text-gray-700 text-sm font-semibold">Patient Name</Label>
                          <Input
                            required
                            value={requestForm.patientName}
                            onChange={(e) => setRequestForm({...requestForm, patientName: e.target.value})}
                            className="bg-white border-gray-300 text-gray-900 focus:border-[#00B1C2] focus:ring-[#00B1C2] mt-1"
                            placeholder="Enter patient name"
                          />
                        </div>
                        <div>
                          <Label className="text-gray-700 text-sm font-semibold">Patient Phone</Label>
                          <Input
                            required
                            value={requestForm.patientPhone}
                            onChange={(e) => setRequestForm({...requestForm, patientPhone: e.target.value})}
                            className="bg-white border-gray-300 text-gray-900 focus:border-[#00B1C2] focus:ring-[#00B1C2] mt-1"
                            placeholder="Enter phone number"
                          />
                        </div>
                        <div>
                          <Label className="text-gray-700 text-sm font-semibold">Doctor Name</Label>
                          <Input
                            required
                            value={requestForm.doctorName}
                            onChange={(e) => setRequestForm({...requestForm, doctorName: e.target.value})}
                            className="bg-white border-gray-300 text-gray-900 focus:border-[#00B1C2] focus:ring-[#00B1C2] mt-1"
                            placeholder="Enter doctor name"
                          />
                        </div>
                        <div className="relative">
                          <Label className="text-gray-700 text-sm font-semibold">Hospital Name</Label>
                          <Input
                            required
                            value={hospitalSearchRequest || requestForm.hospitalName}
                            onChange={(e) => {
                              setHospitalSearchRequest(e.target.value);
                              setRequestForm({...requestForm, hospitalName: e.target.value});
                              setShowHospitalDropdownRequest(true);
                            }}
                            onFocus={() => setShowHospitalDropdownRequest(true)}
                            className="bg-white border-gray-300 text-gray-900 focus:border-[#00B1C2] focus:ring-[#00B1C2] mt-1"
                            placeholder="Search hospital name"
                          />
                          {showHospitalDropdownRequest && (
                            <>
                              <div 
                                className="fixed inset-0 z-10" 
                                onClick={() => setShowHospitalDropdownRequest(false)}
                              />
                              <div className="absolute z-20 w-full mt-1 max-h-60 overflow-auto bg-white border border-gray-200 rounded-lg shadow-xl divide-y divide-gray-50">
                                {hospitals
                                  .filter(h => h.toLowerCase().includes((hospitalSearchRequest || requestForm.hospitalName).toLowerCase()))
                                  .map((hospital, index) => (
                                    <div
                                      key={index}
                                      onClick={() => {
                                        setRequestForm({...requestForm, hospitalName: hospital});
                                        setHospitalSearchRequest(hospital);
                                        setShowHospitalDropdownRequest(false);
                                      }}
                                      className="px-4 py-2 hover:bg-[#00B1C2]/10 cursor-pointer text-[#193252] transition-colors text-sm"
                                    >
                                      {hospital}
                                    </div>
                                  ))}
                                {hospitals.filter(h => h.toLowerCase().includes((hospitalSearchRequest || requestForm.hospitalName).toLowerCase())).length === 0 && (
                                  <div className="px-4 py-2 text-gray-500 text-sm">No hospitals found</div>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                        <Button 
                          type="submit" 
                          className="w-full bg-[#00B1C2] hover:bg-[#017d7b] text-white shadow-sm mt-4 text-sm font-semibold"
                          disabled={requestSubmitting}
                        >
                          {requestSubmitting ? 'Submitting...' : 'Submit Request'}
                        </Button>
                      </form>
                    </Card>

                    {/* Requests List */}
                    <Card className="p-6 bg-white border border-gray-200 shadow-sm rounded-2xl lg:col-span-2">
                      <h3 className="text-lg font-bold text-[#193252] mb-6">Request History</h3>
                      <div className="overflow-x-auto -mx-6 sm:mx-0">
                        <table className="w-full min-w-[640px] text-left">
                          <thead>
                            <tr className="border-b border-gray-200 bg-gray-50/50">
                              <th className="py-3 px-4 font-semibold text-gray-600 text-xs uppercase">Date</th>
                              <th className="py-3 px-4 font-semibold text-gray-600 text-xs uppercase">Patient</th>
                              <th className="py-3 px-4 font-semibold text-gray-600 text-xs uppercase">Doctor/Hospital</th>
                              <th className="py-3 px-4 font-semibold text-gray-600 text-xs uppercase text-center">Photos</th>
                              <th className="py-3 px-4 font-semibold text-gray-600 text-xs uppercase text-center">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {requests.length === 0 ? (
                              <tr>
                                <td colSpan={5} className="text-center py-12 text-gray-500">
                                  <FileText className="h-12 w-12 mx-auto mb-3 opacity-30 text-[#017991]" />
                                  <p className="font-semibold text-gray-600">No requests submitted yet</p>
                                </td>
                              </tr>
                            ) : (
                              requests.map((req) => (
                                <tr key={req._id} className="hover:bg-gray-50/50 transition-colors">
                                  <td className="py-4 px-4 text-sm text-gray-500">
                                    {format(new Date(req.createdAt), 'MMM dd, yyyy')}
                                  </td>
                                  <td className="py-4 px-4 text-sm text-[#193252]">
                                    <div className="font-semibold">{req.patientName}</div>
                                    <div className="text-xs text-gray-500 mt-0.5">{req.patientPhone}</div>
                                  </td>
                                  <td className="py-4 px-4 text-sm text-[#193252]">
                                    <div className="font-semibold">{req.doctorName}</div>
                                    <div className="text-xs text-gray-500 mt-0.5">{req.hospitalName}</div>
                                  </td>
                                  <td className="py-4 px-4 text-center">
                                    {(req.proofPhotos && req.proofPhotos.length > 0) || req.proofPhoto ? (
                                      <Dialog>
                                        <DialogTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-[#00B1C2] hover:text-[#017991] font-semibold text-xs bg-[#00B1C2]/5 border border-[#00B1C2]/10"
                                          >
                                            <ImageIcon className="h-3.5 w-3.5 mr-1" />
                                            {((req.proofPhotos && req.proofPhotos.length > 0) ? req.proofPhotos.length : 1)} Photo(s)
                                          </Button>
                                        </DialogTrigger>
                                        <DialogContent className="max-w-[95vw] sm:max-w-4xl bg-white border border-gray-200 text-[#193252] shadow-2xl">
                                          <DialogHeader>
                                            <DialogTitle className="text-[#193252]">Proof Photos</DialogTitle>
                                          </DialogHeader>
                                          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[70vh] overflow-y-auto p-1">
                                            {req.proofPhotos && req.proofPhotos.length > 0 ? (
                                              req.proofPhotos.map((photo, idx) => (
                                                <div key={idx} className="relative rounded-lg overflow-hidden border border-gray-200">
                                                  <img
                                                    src={photo}
                                                    alt={`Proof ${idx + 1}`}
                                                    className="w-full h-auto"
                                                  />
                                                </div>
                                              ))
                                            ) : req.proofPhoto ? (
                                              <div className="relative rounded-lg overflow-hidden border border-gray-200">
                                                <img
                                                  src={req.proofPhoto}
                                                  alt="Proof"
                                                  className="w-full h-auto"
                                                />
                                              </div>
                                            ) : null}
                                          </div>
                                        </DialogContent>
                                      </Dialog>
                                    ) : (
                                      <span className="text-gray-400 text-xs font-semibold">No photos</span>
                                    )}
                                  </td>
                                  <td className="py-4 px-4 text-center">
                                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                                      req.status === 'approved'
                                        ? 'bg-green-50 text-green-700 border border-green-200'
                                        : req.status === 'rejected'
                                        ? 'bg-red-50 text-red-700 border border-red-200'
                                        : 'bg-orange-50 text-orange-700 border border-orange-200'
                                    }`}>
                                      <span className="capitalize">{req.status}</span>
                                    </span>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </Card>
                  </div>
                </motion.div>
              )}

              {/* Reports Tab */}
              {activeTab === 'reports' && (
                <motion.div
                  key="reports"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                >
                  <div className="space-y-6">
                    {/* Report Type Selector */}
                    <Card className="p-6 bg-white border border-gray-200 shadow-sm rounded-2xl">
                      <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center gap-4 mb-6">
                        <h3 className="text-lg font-bold text-[#193252] flex items-center gap-2">
                          <BarChart3 className="h-5 w-5 text-[#00B1C2]" />
                          রিপোর্ট
                        </h3>
                        <div className="flex gap-1.5 overflow-x-auto w-full sm:w-auto sm:ml-auto scrollbar-hide border border-gray-100 rounded-lg p-1 bg-gray-50/50">
                          {(['all', 'monthly', 'daily', 'pending', 'paid'] as const).map((type) => (
                            <Button
                              key={type}
                              onClick={() => setReportType(type)}
                              variant={reportType === type ? "default" : "ghost"}
                              className={
                                reportType === type
                                  ? "bg-[#00B1C2] hover:bg-[#017d7b] text-white text-xs font-semibold shadow-sm"
                                  : "text-gray-500 hover:text-gray-800 text-xs font-semibold"
                              }
                              size="sm"
                            >
                              {type === 'all' ? 'সব' : type === 'monthly' ? 'মাসিক' : type === 'daily' ? 'দৈনিক' : type === 'pending' ? 'পেন্ডিং' : 'পেইড'}
                            </Button>
                          ))}
                        </div>
                      </div>

                      {reportType === 'monthly' && (
                        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center pt-2 border-t border-gray-100">
                          <div className="w-full sm:w-auto">
                            <Label className="text-gray-700 text-sm font-semibold">মাস</Label>
                            <select
                              value={selectedMonth}
                              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                              className="mt-1.5 w-full sm:w-48 px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 text-sm focus:border-[#00B1C2] focus:ring-1 focus:ring-[#00B1C2]"
                            >
                              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                                <option key={m} value={m}>
                                  {new Date(2000, m - 1).toLocaleString('default', { month: 'long' })}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="w-full sm:w-auto">
                            <Label className="text-gray-700 text-sm font-semibold">বছর</Label>
                            <select
                              value={selectedYear}
                              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                              className="mt-1.5 w-full sm:w-48 px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 text-sm focus:border-[#00B1C2] focus:ring-1 focus:ring-[#00B1C2]"
                            >
                              {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map((y) => (
                                <option key={y} value={y}>
                                  {y}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      )}
                    </Card>

                    {reportsLoading ? (
                      <div className="flex items-center justify-center py-12">
                        <RefreshCw className="h-8 w-8 animate-spin text-[#00B1C2]" />
                      </div>
                    ) : reports ? (
                      <>
                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                          <Card className="p-5 border border-blue-100 bg-blue-50/50 rounded-2xl shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">কোড সাবমিশন</p>
                              <Users className="h-5 w-5 text-blue-600" />
                            </div>
                            <p className="text-3xl font-bold text-[#193252]">
                              {reports.summary?.totalAffiliateCodeSubmissions || 0}
                            </p>
                            <p className="text-xs text-gray-500 mt-1.5">মোট বুকিং রেফারেল</p>
                          </Card>

                          <Card className="p-5 border border-green-100 bg-green-50/50 rounded-2xl shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">মোট পেইড</p>
                              <CheckCircle className="h-5 w-5 text-green-600" />
                            </div>
                            <p className="text-3xl font-bold text-green-700">
                              ৳{(reports.summary?.totalPaid || 0).toLocaleString()}
                            </p>
                            <p className="text-xs text-gray-500 mt-1.5">অনুমোদিত ও পেইড কমিশন</p>
                          </Card>

                          <Card className="p-5 border border-orange-100 bg-orange-50/50 rounded-2xl shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">মোট আনপেইড</p>
                              <Clock className="h-5 w-5 text-orange-600" />
                            </div>
                            <p className="text-3xl font-bold text-orange-700">
                              ৳{(reports.summary?.totalUnpaid || 0).toLocaleString()}
                            </p>
                            <p className="text-xs text-gray-500 mt-1.5">পেন্ডিং + অনুমোদিত ব্যালেন্স</p>
                          </Card>

                          <Card className="p-5 border border-purple-100 bg-purple-50/50 rounded-2xl shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">পেন্ডিং</p>
                              <TrendingDownIcon className="h-5 w-5 text-purple-600" />
                            </div>
                            <p className="text-3xl font-bold text-purple-700">
                              ৳{(reports.summary?.totalPending || 0).toLocaleString()}
                            </p>
                            <p className="text-xs text-gray-500 mt-1.5">অপেক্ষমান কমিশন পরিমাণ</p>
                          </Card>
                        </div>

                        {/* Monthly Breakdown Chart */}
                        {reports.monthlyBreakdown && reports.monthlyBreakdown.length > 0 && (
                          <Card className="p-6 bg-white border border-gray-200 shadow-sm rounded-2xl">
                            <h4 className="text-base font-bold text-[#193252] mb-4">মাসিক রিপোর্ট</h4>
                            <ResponsiveContainer width="100%" height={300}>
                              <BarChart data={reports.monthlyBreakdown}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                <XAxis dataKey="month" stroke="#64748b" style={{ fontSize: 12 }} />
                                <YAxis stroke="#64748b" style={{ fontSize: 12 }} />
                                <Tooltip
                                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', color: '#193252' }}
                                  formatter={(value: any) => `৳${value.toLocaleString()}`}
                                />
                                <Legend wrapperStyle={{ fontSize: 12 }} />
                                <Bar dataKey="paid" fill="#10b981" name="পেইড" />
                                <Bar dataKey="unpaid" fill="#f59e0b" name="আনপেইড" />
                                <Bar dataKey="pending" fill="#ef4444" name="পেন্ডিং" />
                              </BarChart>
                            </ResponsiveContainer>
                          </Card>
                        )}

                        {/* Daily Breakdown Chart */}
                        {reportType === 'daily' || reportType === 'all' ? (
                          <Card className="p-6 bg-white border border-gray-200 shadow-sm rounded-2xl">
                            <h4 className="text-base font-bold text-[#193252] mb-4">দৈনিক রিপোর্ট (শেষ ৩০ দিন)</h4>
                            <ResponsiveContainer width="100%" height={300}>
                              <AreaChart data={reports.dailyBreakdown}>
                                <defs>
                                  <linearGradient id="colorDaily" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#00B1C2" stopOpacity={0.2}/>
                                    <stop offset="95%" stopColor="#00B1C2" stopOpacity={0}/>
                                  </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                <XAxis dataKey="dateFormatted" stroke="#64748b" style={{ fontSize: 11 }} />
                                <YAxis stroke="#64748b" style={{ fontSize: 12 }} />
                                <Tooltip
                                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', color: '#193252' }}
                                  formatter={(value: any) => `৳${value.toLocaleString()}`}
                                />
                                <Legend wrapperStyle={{ fontSize: 12 }} />
                                <Area type="monotone" dataKey="commissions" stroke="#00B1C2" fill="url(#colorDaily)" name="কমিশন" />
                                <Area type="monotone" dataKey="appointments" stroke="#10b981" fill="url(#colorDaily)" name="অ্যাপয়েন্টমেন্ট" />
                              </AreaChart>
                            </ResponsiveContainer>
                          </Card>
                        ) : null}

                        {/* Pending Report Table */}
                        {reportType === 'pending' || reportType === 'all' ? (
                          <Card className="p-6 bg-white border border-gray-200 shadow-sm rounded-2xl">
                            <div className="flex items-center justify-between mb-6">
                              <h4 className="text-base font-bold text-[#193252]">পেন্ডিং কমিশন</h4>
                              <span className="px-3 py-1 bg-orange-50 text-orange-700 border border-orange-100 rounded-full text-xs font-bold">
                                {reports.pendingCommissions?.length || 0} টি
                              </span>
                            </div>
                            <div className="overflow-x-auto -mx-6 sm:mx-0">
                              <table className="w-full min-w-[640px] text-left">
                                <thead>
                                  <tr className="border-b border-gray-200 bg-gray-50/50">
                                    <th className="py-3 px-4 font-semibold text-gray-600 text-xs uppercase">তারিখ</th>
                                    <th className="py-3 px-4 font-semibold text-gray-600 text-xs uppercase">রোগী</th>
                                    <th className="py-3 px-4 font-semibold text-gray-600 text-xs uppercase text-right">বিল</th>
                                    <th className="py-3 px-4 font-semibold text-gray-600 text-xs uppercase text-right">কমিশন</th>
                                    <th className="py-3 px-4 font-semibold text-gray-600 text-xs uppercase text-center">স্ট্যাটাস</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                  {reports.pendingCommissions?.length === 0 ? (
                                    <tr>
                                      <td colSpan={5} className="text-center py-12 text-gray-500 text-sm">
                                        কোন পেন্ডিং কমিশন নেই
                                      </td>
                                    </tr>
                                  ) : (
                                    reports.pendingCommissions?.map((commission: any) => (
                                      <tr key={commission._id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="py-4 px-4 text-sm text-gray-500">
                                          {format(new Date(commission.createdAt), 'MMM dd, yyyy')}
                                        </td>
                                        <td className="py-4 px-4 text-sm font-semibold text-[#193252]">
                                          {commission.appointmentId?.patientName || 'N/A'}
                                        </td>
                                        <td className="py-4 px-4 text-sm text-right text-gray-600">
                                          ৳{commission.totalBill?.toLocaleString() || 0}
                                        </td>
                                        <td className="py-4 px-4 text-sm text-right font-bold text-orange-600">
                                          ৳{commission.commissionAmount?.toLocaleString() || 0}
                                        </td>
                                        <td className="py-4 px-4 text-center">
                                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-200">
                                            <Clock className="h-3 w-3" />
                                            <span className="capitalize">{commission.status}</span>
                                          </span>
                                        </td>
                                      </tr>
                                    ))
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </Card>
                        ) : null}

                        {/* Paid/Unpaid Summary Table */}
                        {(reportType === 'paid' || reportType === 'all') && (
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <Card className="p-6 bg-white border border-gray-200 shadow-sm rounded-2xl">
                              <div className="flex items-center justify-between mb-6">
                                <h4 className="text-base font-bold text-[#193252]">পেইড কমিশন</h4>
                                <span className="px-3 py-1 bg-green-50 text-green-700 border border-green-100 rounded-full text-xs font-bold">
                                  {reports.paidCommissions?.length || 0} টি
                                </span>
                              </div>
                              <div className="overflow-x-auto -mx-6 sm:mx-0">
                                <table className="w-full text-left">
                                  <thead>
                                    <tr className="border-b border-gray-200 bg-gray-50/50">
                                      <th className="py-3 px-4 font-semibold text-gray-600 text-xs uppercase">তারিখ</th>
                                      <th className="py-3 px-4 font-semibold text-gray-600 text-xs uppercase text-right">কমিশন</th>
                                      <th className="py-3 px-4 font-semibold text-gray-600 text-xs uppercase text-center">স্ট্যাটাস</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-100">
                                    {reports.paidCommissions?.length === 0 ? (
                                      <tr>
                                        <td colSpan={3} className="text-center py-6 text-gray-400 text-sm">No record</td>
                                      </tr>
                                    ) : (
                                      reports.paidCommissions?.slice(0, 10).map((commission: any) => (
                                        <tr key={commission._id} className="hover:bg-gray-50/50 transition-colors">
                                          <td className="py-4 px-4 text-sm text-gray-500">
                                            {format(new Date(commission.createdAt), 'MMM dd')}
                                          </td>
                                          <td className="py-4 px-4 text-sm text-right font-bold text-green-600">
                                            ৳{commission.commissionAmount?.toLocaleString() || 0}
                                          </td>
                                          <td className="py-4 px-4 text-center">
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
                                              <CheckCircle className="h-3 w-3" />
                                              Paid
                                            </span>
                                          </td>
                                        </tr>
                                      ))
                                    )}
                                  </tbody>
                                </table>
                              </div>
                            </Card>

                            <Card className="p-6 bg-white border border-gray-200 shadow-sm rounded-2xl">
                              <div className="flex items-center justify-between mb-6">
                                <h4 className="text-base font-bold text-[#193252]">আনপেইড কমিশন</h4>
                                <span className="px-3 py-1 bg-orange-50 text-orange-700 border border-orange-100 rounded-full text-xs font-bold">
                                  {reports.unpaidCommissions?.length || 0} টি
                                </span>
                              </div>
                              <div className="overflow-x-auto -mx-6 sm:mx-0">
                                <table className="w-full text-left">
                                  <thead>
                                    <tr className="border-b border-gray-200 bg-gray-50/50">
                                      <th className="py-3 px-4 font-semibold text-gray-600 text-xs uppercase">তারিখ</th>
                                      <th className="py-3 px-4 font-semibold text-gray-600 text-xs uppercase text-right">কমিশন</th>
                                      <th className="py-3 px-4 font-semibold text-gray-600 text-xs uppercase text-center">স্ট্যাটাস</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-100">
                                    {reports.unpaidCommissions?.length === 0 ? (
                                      <tr>
                                        <td colSpan={3} className="text-center py-6 text-gray-400 text-sm">No record</td>
                                      </tr>
                                    ) : (
                                      reports.unpaidCommissions?.slice(0, 10).map((commission: any) => (
                                        <tr key={commission._id} className="hover:bg-gray-50/50 transition-colors">
                                          <td className="py-4 px-4 text-sm text-gray-500">
                                            {format(new Date(commission.createdAt), 'MMM dd')}
                                          </td>
                                          <td className="py-4 px-4 text-sm text-right font-bold text-orange-600">
                                            ৳{commission.commissionAmount?.toLocaleString() || 0}
                                          </td>
                                          <td className="py-4 px-4 text-center">
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                                              <CheckCircle className="h-3 w-3" />
                                              Approved
                                            </span>
                                          </td>
                                        </tr>
                                      ))
                                    )}
                                  </tbody>
                                </table>
                              </div>
                            </Card>
                          </div>
                        )}
                      </>
                    ) : null}
                  </div>
                </motion.div>
              )}

              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <motion.div
                  key="profile"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                >
                  <Card className="p-6 bg-white border border-gray-200 shadow-sm rounded-2xl">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-3 border-b border-gray-100 pb-4">
                      <h3 className="text-lg font-bold text-[#193252] flex items-center gap-2">
                        <UserCircle className="h-5 w-5 text-[#00B1C2]" />
                        Profile Settings
                      </h3>
                      {!isEditingProfile ? (
                        <Button
                          onClick={() => setIsEditingProfile(true)}
                          variant="outline"
                          className="border-gray-200 text-gray-700 hover:bg-gray-50 bg-white text-sm font-semibold w-full sm:w-auto shadow-sm"
                        >
                          <Edit3 className="h-4 w-4 mr-2 text-[#00B1C2]" />
                          <span>Edit Profile</span>
                        </Button>
                      ) : (
                        <div className="flex gap-2 w-full sm:w-auto">
                          <Button
                            onClick={() => {
                              setIsEditingProfile(false);
                              setChangingPassword(false);
                              setProfileForm({
                                fullName: affiliate.fullName || affiliate.name || '',
                                email: affiliate.email || '',
                                phoneNumber: affiliate.phoneNumber || '',
                                paymentMethod: affiliate.paymentMethod || '',
                                paymentDetails: affiliate.paymentDetails || '',
                                currentPassword: '',
                                newPassword: '',
                                confirmPassword: '',
                              });
                            }}
                            variant="outline"
                            className="border-gray-200 text-gray-500 hover:bg-gray-50 bg-white flex-1 sm:flex-none text-sm font-semibold shadow-sm"
                          >
                            <X className="h-4 w-4 mr-2" />
                            <span>Cancel</span>
                          </Button>
                          <Button
                            onClick={handleProfileUpdate}
                            disabled={profileLoading}
                            className="bg-[#00B1C2] hover:bg-[#017d7b] text-white flex-1 sm:flex-none text-sm font-semibold shadow-sm"
                          >
                            {profileLoading ? (
                              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <Save className="h-4 w-4 mr-2" />
                            )}
                            <span>Save Changes</span>
                          </Button>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Personal Information */}
                      <div className="space-y-6">
                        <h4 className="text-base font-bold text-[#193252] flex items-center gap-2 border-b border-gray-50 pb-2">
                          <User className="h-4 w-4 text-[#00B1C2]" />
                          Personal Information
                        </h4>
                        
                        <div>
                          <Label className="text-gray-500 text-xs font-semibold mb-2 uppercase tracking-wider flex items-center gap-1.5">
                            <User className="h-3.5 w-3.5" />
                            Full Name
                          </Label>
                          {isEditingProfile ? (
                            <Input
                              value={profileForm.fullName}
                              onChange={(e) => setProfileForm(prev => ({ ...prev, fullName: e.target.value }))}
                              className="bg-white border-gray-300 text-gray-900 focus:border-[#00B1C2] focus:ring-[#00B1C2] mt-1"
                            />
                          ) : (
                            <p className="text-[#193252] font-semibold text-lg">{affiliate.fullName || affiliate.name}</p>
                          )}
                        </div>

                        <div>
                          <Label className="text-gray-500 text-xs font-semibold mb-2 uppercase tracking-wider flex items-center gap-1.5">
                            <Mail className="h-3.5 w-3.5" />
                            Email Address
                          </Label>
                          {isEditingProfile ? (
                            <Input
                              type="email"
                              value={profileForm.email}
                              onChange={(e) => setProfileForm(prev => ({ ...prev, email: e.target.value }))}
                              className="bg-white border-gray-300 text-gray-900 focus:border-[#00B1C2] focus:ring-[#00B1C2] mt-1"
                            />
                          ) : (
                            <p className="text-[#193252] text-lg font-mono">{affiliate.email}</p>
                          )}
                        </div>

                        <div>
                          <Label className="text-gray-500 text-xs font-semibold mb-2 uppercase tracking-wider flex items-center gap-1.5">
                            <Phone className="h-3.5 w-3.5" />
                            Phone Number
                          </Label>
                          {isEditingProfile ? (
                            <Input
                              value={profileForm.phoneNumber}
                              onChange={(e) => setProfileForm(prev => ({ ...prev, phoneNumber: e.target.value }))}
                              className="bg-white border-gray-300 text-gray-900 focus:border-[#00B1C2] focus:ring-[#00B1C2] mt-1"
                            />
                          ) : (
                            <p className="text-[#193252] text-lg font-mono">{affiliate.phoneNumber}</p>
                          )}
                        </div>

                        <div>
                          <Label className="text-gray-500 text-xs font-semibold mb-2 uppercase tracking-wider flex items-center gap-1.5">
                            <Award className="h-3.5 w-3.5" />
                            Affiliate Code
                          </Label>
                          <div className="flex items-center gap-2">
                            <p className="text-[#00B1C2] text-xl font-bold font-mono">{affiliate.affiliateCode}</p>
                            <button
                              onClick={copyAffiliateCode}
                              className="p-1.5 hover:bg-gray-100 border border-gray-100 rounded transition-colors bg-gray-50/50"
                            >
                              <Copy className="h-4 w-4 text-gray-500" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Payment & Security */}
                      <div className="space-y-6">
                        <h4 className="text-base font-bold text-[#193252] flex items-center gap-2 border-b border-gray-50 pb-2">
                          <CreditCard className="h-4 w-4 text-[#00B1C2]" />
                          Payment Settings
                        </h4>

                        <div>
                          <Label className="text-gray-500 text-xs font-semibold mb-2 uppercase tracking-wider">Payment Method</Label>
                          {isEditingProfile ? (
                            <select
                              value={profileForm.paymentMethod}
                              onChange={(e) => setProfileForm(prev => ({ ...prev, paymentMethod: e.target.value }))}
                              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 text-sm focus:border-[#00B1C2] focus:ring-[#00B1C2] mt-1"
                            >
                              <option value="">Select payment method</option>
                              <option value="bkash">bKash</option>
                              <option value="nagad">Nagad</option>
                            </select>
                          ) : (
                            <p className="text-[#193252] text-lg font-semibold capitalize">{affiliate.paymentMethod || 'Not set'}</p>
                          )}
                        </div>

                        <div>
                          <Label className="text-gray-500 text-xs font-semibold mb-2 uppercase tracking-wider">Payment Details (Account Number)</Label>
                          {isEditingProfile ? (
                            <Input
                              value={profileForm.paymentDetails}
                              onChange={(e) => setProfileForm(prev => ({ ...prev, paymentDetails: e.target.value }))}
                              placeholder="Enter account/phone number"
                              className="bg-white border-gray-300 text-gray-900 focus:border-[#00B1C2] focus:ring-[#00B1C2] mt-1"
                            />
                          ) : (
                            <p className="text-[#193252] text-lg font-mono">{affiliate.paymentDetails || 'Not set'}</p>
                          )}
                        </div>

                        {/* Password Change Section */}
                        {isEditingProfile && (
                          <div className="pt-4 border-t border-gray-100">
                            <div className="flex items-center justify-between mb-4">
                              <h4 className="text-sm font-bold text-[#193252] flex items-center gap-1.5">
                                <Shield className="h-4 w-4 text-[#00B1C2]" />
                                Change Password
                              </h4>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setChangingPassword(!changingPassword)}
                                className="text-gray-500 hover:text-gray-800 text-xs font-bold"
                              >
                                {changingPassword ? 'Cancel' : 'Change'}
                              </Button>
                            </div>

                            {changingPassword && (
                              <div className="space-y-4 pt-2">
                                <div>
                                  <Label className="text-gray-700 text-sm font-medium">Current Password</Label>
                                  <div className="relative mt-1">
                                    <Input
                                      type={showCurrentPassword ? 'text' : 'password'}
                                      value={profileForm.currentPassword}
                                      onChange={(e) => setProfileForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                                      className="bg-white border-gray-300 text-gray-900 pr-10 focus:border-[#00B1C2] focus:ring-[#00B1C2]"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                                    >
                                      {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                  </div>
                                </div>

                                <div>
                                  <Label className="text-gray-700 text-sm font-medium">New Password</Label>
                                  <div className="relative mt-1">
                                    <Input
                                      type={showNewPassword ? 'text' : 'password'}
                                      value={profileForm.newPassword}
                                      onChange={(e) => setProfileForm(prev => ({ ...prev, newPassword: e.target.value }))}
                                      className="bg-white border-gray-300 text-gray-900 pr-10 focus:border-[#00B1C2] focus:ring-[#00B1C2]"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => setShowNewPassword(!showNewPassword)}
                                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                                    >
                                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                  </div>
                                </div>

                                <div>
                                  <Label className="text-gray-700 text-sm font-medium">Confirm New Password</Label>
                                  <div className="relative mt-1">
                                    <Input
                                      type={showConfirmPassword ? 'text' : 'password'}
                                      value={profileForm.confirmPassword}
                                      onChange={(e) => setProfileForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                                      className="bg-white border-gray-300 text-gray-900 pr-10 focus:border-[#00B1C2] focus:ring-[#00B1C2]"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                                    >
                                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Account Stats */}
                    <div className="mt-8 pt-6 border-t border-gray-100">
                      <h4 className="text-base font-bold text-[#193252] mb-4 flex items-center gap-2">
                        <Activity className="h-4 w-4 text-[#00B1C2]" />
                        Account Statistics
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-gray-50/50 border border-gray-100 rounded-xl p-4 text-center">
                          <p className="text-2xl font-bold text-emerald-600">৳{(affiliate.totalEarned || 0).toLocaleString()}</p>
                          <p className="text-xs text-gray-500 mt-1 uppercase font-semibold">Total Earned</p>
                        </div>
                        <div className="bg-gray-50/50 border border-gray-100 rounded-xl p-4 text-center">
                          <p className="text-2xl font-bold text-[#00B1C2]">৳{(affiliate.walletBalance || 0).toLocaleString()}</p>
                          <p className="text-xs text-gray-500 mt-1 uppercase font-semibold">Current Balance</p>
                        </div>
                        <div className="bg-gray-50/50 border border-gray-100 rounded-xl p-4 text-center">
                          <p className="text-2xl font-bold text-purple-600">{affiliate.referrals || 0}</p>
                          <p className="text-xs text-gray-500 mt-1 uppercase font-semibold">Total Referrals</p>
                        </div>
                        <div className="bg-gray-50/50 border border-gray-100 rounded-xl p-4 text-center">
                          <p className="text-2xl font-bold text-blue-600">৳{(affiliate.totalWithdrawn || 0).toLocaleString()}</p>
                          <p className="text-xs text-gray-500 mt-1 uppercase font-semibold">Total Withdrawn</p>
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* Photo Upload Dialog */}
      <Dialog open={photoUploadDialogOpen} onOpenChange={setPhotoUploadDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl bg-white border border-gray-200 text-[#193252] max-h-[90vh] overflow-y-auto shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-[#193252] flex items-center gap-2">
              <ImageIcon className="h-6 w-6 text-[#00B1C2]" />
              প্রমাণ ফটো পাঠান
            </DialogTitle>
          </DialogHeader>
          {selectedPatient && (
            <div className="space-y-4 mt-4 text-[#193252]">
              <div className="bg-gray-50/70 border border-gray-100 rounded-lg p-4">
                <p className="text-xs text-gray-500 mb-1 uppercase tracking-wider font-semibold">রোগীর নাম</p>
                <p className="text-[#193252] font-bold text-base">{selectedPatient.patientName}</p>
                <p className="text-xs text-gray-500 mt-3 mb-1 uppercase tracking-wider font-semibold">মোবাইল</p>
                <p className="text-[#193252] font-medium font-mono">{selectedPatient.mobileNumber}</p>
              </div>

              <div>
                <Label className="text-gray-700 text-sm font-semibold mb-2">ডাক্তারের নাম *</Label>
                <Input
                  value={photoUploadForm.doctorName}
                  onChange={(e) => setPhotoUploadForm({...photoUploadForm, doctorName: e.target.value})}
                  className="bg-white border-gray-300 text-gray-900 focus:border-[#00B1C2] focus:ring-[#00B1C2] mt-1.5"
                  placeholder="ডাক্তারের নাম"
                  required
                />
              </div>

              <div className="relative">
                <Label className="text-gray-700 text-sm font-semibold mb-2">হাসপাতালের নাম *</Label>
                <Input
                  value={hospitalSearchPhoto || photoUploadForm.hospitalName}
                  onChange={(e) => {
                    setHospitalSearchPhoto(e.target.value);
                    setPhotoUploadForm({...photoUploadForm, hospitalName: e.target.value});
                    setShowHospitalDropdownPhoto(true);
                  }}
                  onFocus={() => setShowHospitalDropdownPhoto(true)}
                  className="bg-white border-gray-300 text-gray-900 focus:border-[#00B1C2] focus:ring-[#00B1C2] mt-1.5"
                  placeholder="হাসপাতালের নাম অনুসন্ধান করুন"
                  required
                />
                {showHospitalDropdownPhoto && (
                  <>
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={() => setShowHospitalDropdownPhoto(false)}
                    />
                    <div className="absolute z-20 w-full mt-1 max-h-60 overflow-auto bg-white border border-gray-200 rounded-lg shadow-xl divide-y divide-gray-50">
                      {hospitals
                        .filter(h => h.toLowerCase().includes((hospitalSearchPhoto || photoUploadForm.hospitalName).toLowerCase()))
                        .map((hospital, index) => (
                          <div
                            key={index}
                            onClick={() => {
                              setPhotoUploadForm({...photoUploadForm, hospitalName: hospital});
                              setHospitalSearchPhoto(hospital);
                              setShowHospitalDropdownPhoto(false);
                            }}
                            className="px-4 py-2 hover:bg-[#00B1C2]/10 cursor-pointer text-[#193252] transition-colors text-sm"
                          >
                            {hospital}
                          </div>
                        ))}
                      {hospitals.filter(h => h.toLowerCase().includes((hospitalSearchPhoto || photoUploadForm.hospitalName).toLowerCase())).length === 0 && (
                        <div className="px-4 py-2 text-gray-500 text-sm">কোন হাসপাতাল পাওয়া যায়নি</div>
                      )}
                    </div>
                  </>
                )}
              </div>

              <div>
                <Label className="text-gray-700 text-sm font-semibold mb-2">প্রমাণ ফটো * (একাধিক ফটো নির্বাচন করতে পারেন)</Label>
                <div className="mt-2">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePhotoSelect}
                    className="hidden"
                    id="photo-upload"
                  />
                  <label
                    htmlFor="photo-upload"
                    className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-[#00B1C2]/50 transition-colors bg-gray-50/30 hover:bg-gray-50"
                  >
                    <div className="text-center">
                      <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm text-gray-500 font-semibold">ক্লিক করে ফটো নির্বাচন করুন</p>
                      <p className="text-xs text-gray-400 mt-1">একাধিক ফটো নির্বাচন করতে পারেন</p>
                    </div>
                  </label>
                </div>
                {photoPreviews.length > 0 && (
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {photoPreviews.map((preview, index) => (
                      <div key={index} className="relative rounded-lg overflow-hidden border border-gray-200 bg-gray-50 p-1">
                        <img src={preview} alt={`Preview ${index + 1}`} className="w-full h-32 object-contain bg-white rounded-md" />
                        <button
                          onClick={() => removePhoto(index)}
                          className="absolute top-2 right-2 p-1 bg-red-500 hover:bg-red-600 rounded-full text-white shadow-sm"
                        >
                          <X className="h-4 w-4" />
                        </button>
                        <p className="text-[10px] text-gray-500 mt-1 truncate px-1">{selectedPhotos[index]?.name}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <Button
                  onClick={() => {
                    setPhotoUploadDialogOpen(false);
                    setSelectedPhotos([]);
                    setPhotoPreviews([]);
                    setSelectedPatient(null);
                    setPhotoUploadForm({ doctorName: '', hospitalName: '' });
                  }}
                  variant="outline"
                  className="flex-1 border-gray-200 text-gray-500 hover:text-gray-800 bg-white text-sm font-semibold"
                >
                  বাতিল
                </Button>
                <Button
                  onClick={handlePhotoUpload}
                  disabled={selectedPhotos.length === 0 || uploadingPhoto || !photoUploadForm.doctorName || !photoUploadForm.hospitalName}
                  className="flex-1 bg-[#00B1C2] hover:bg-[#017d7b] text-white shadow-sm text-sm font-semibold"
                >
                  {uploadingPhoto ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      আপলোড হচ্ছে...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      পাঠান
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
