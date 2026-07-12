"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import NextImage from "next/image";
import {
  LayoutDashboard,
  UserPlus,
  Users,
  Stethoscope,
  Settings,
  LogOut,
  Menu,
  X,
  MapPin,
  Microscope,
  Droplet,
  Car,
  Image,
  Briefcase,
  Building2,
  Clock,
  Wallet,
  Camera,
  FileText,
  DollarSign,
  CreditCard,
  Video,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage, getLocalizedValue } from "@/contexts/LanguageContext";

interface User {
  id: string;
  fullName?: string;
  username?: string;
  email?: string;
  phoneNumber?: string;
  photo?: string;
}

interface SidebarProps {
  user: User | null;
  onLogout: () => void;
}

const menuItems = [
  {
    title: "Dashboard",
    titleBn: "ড্যাশবোর্ড",
    icon: LayoutDashboard,
    href: "/admin",
  },
  {
    title: "Appointments",
    titleBn: "অ্যাপয়েন্টমেন্ট",
    icon: Stethoscope,
    href: "/admin/appointments",
  },
  {
    title: "Video Consultations",
    titleBn: "ভিডিও পরামর্শ",
    icon: Video,
    href: "/admin/video-consultations",
  },
  {
    title: "Live Consultants",
    titleBn: "লাইভ কনসালটেন্ট",
    icon: Video,
    href: "/admin/live-consultants",
  },
  {
    title: "Create Doctor",
    titleBn: "ডাক্তার যোগ করুন",
    icon: UserPlus,
    href: "/admin/doctors/create",
  },
  {
    title: "Hospitals",
    titleBn: "হাসপাতাল",
    icon: Building2,
    href: "/admin/hospitals",
  },
  {
    title: "All Doctors",
    titleBn: "সকল ডাক্তার",
    icon: Users,
    href: "/admin/doctors",
  },
  {
    title: "Departments",
    titleBn: "ডিপার্টমেন্ট",
    icon: Building2,
    href: "/admin/departments",
  },
  {
    title: "Affiliate Withdrawals",
    titleBn: "অ্যাফিলিয়েট উত্তোলন",
    icon: DollarSign,
    href: "/admin/affiliate-withdrawals",
  },
  // {
  //   title: "Doctor-Hospital",
  //   icon: Stethoscope,
  //   href: "/admin/doctor-hospitals",
  // },
  {
    title: "Blood Donor Approvals",
    titleBn: "রক্তদাতা অনুমোদন",
    icon: ShieldCheck,
    href: "/admin/blood-donors/approvals",
  },
  {
    title: "Blood Donors",
    titleBn: "রক্তদাতা",
    icon: Droplet,
    href: "/admin/blood-donors",
  },
  {
    title: "Ambulance Approvals",
    titleBn: "অ্যাম্বুলেন্স অনুমোদন",
    icon: ShieldCheck,
    href: "/admin/ambulances/approvals",
  },
  {
    title: "Ambulances",
    titleBn: "অ্যাম্বুলেন্স",
    icon: Car,
    href: "/admin/ambulances",
  },
  // {
  //   title: "Pending Services",
  //   icon: Clock,
  //   href: "/admin/pending-services",
  // },
  {
    title: "Add Locations",
    titleBn: "লোকেশন যোগ করুন",
    icon: MapPin,
    href: "/admin/locations",
  },
  {
    title: "Add Diseases",
    titleBn: "রোগ যোগ করুন",
    icon: Stethoscope,
    href: "/admin/diseases",
  },
  {
    title: "Diagnostic",
    titleBn: "ডায়াগনস্টিক",
    icon: Microscope,
    href: "/admin/diagnostic",
  },

  {
    title: "Offers",
    titleBn: "অফারসমূহ",
    icon: Image,
    href: "/admin/offers",
  },
  {
    title: "Blogs",
    titleBn: "ব্লগ",
    icon: FileText,
    href: "/admin/blogs",
  },
  {
    title: "Service Sections",
    titleBn: "সার্ভিস সেকশন",
    icon: Briefcase,
    href: "/admin/service-sections",
  },
  {
    title: "Memberships",
    titleBn: "মেম্বারশিপ",
    icon: CreditCard,
    href: "/admin/memberships",
  },
  {
    title: "Membership Cards",
    titleBn: "মেম্বারশিপ কার্ড",
    icon: CreditCard,
    href: "/admin/membership-cards",
  },
  {
    title: "Settings",
    titleBn: "সেটিংস",
    icon: Settings,
    href: "/admin/settings",
  },
  // {
  //   title: "Affiliate Management",
  //   icon: Users,
  //   href: "/admin/affiliate-management",
  // },

  {
    title: "Photo Requests",
    titleBn: "ছবির অনুরোধ",
    icon: Camera,
    href: "/admin/affiliate-photo-requests",
  },
  {
    title: "Affiliate Overview",
    titleBn: "অ্যাফিলিয়েট ওভারভিউ",
    icon: Wallet,
    href: "/admin/affiliate-overview",
  },
  {
    title: "Completed Reports",
    titleBn: "সম্পন্ন রিপোর্ট",
    icon: FileText,
    href: "/admin/affiliate-reports/completed",
  },

  {
    title: "App Image Manager",
    titleBn: "অ্যাপ ছবি ম্যানেজার",
    icon: Image,
    href: "/admin/app-image",
  },
  {
    title: "Contact Messages",
    titleBn: "যোগাযোগ মেসেজ",
    icon: Mail,
    href: "/admin/contacts",
  },
];

export default function Sidebar({ user, onLogout }: SidebarProps) {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { language } = useLanguage();

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-md bg-white shadow-md"
      >
        {isMobileOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <Menu className="h-6 w-6" />
        )}
      </button>

      {/* Overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 z-50 transition-transform duration-300",
          "lg:translate-x-0",
          isMobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-16 flex items-center justify-between px-6 border-b border-gray-200">
            <h1 className="text-xl font-bold text-primary">MEDITIME</h1>
            <button
              onClick={() => setIsMobileOpen(false)}
              className="lg:hidden p-1 hover:bg-gray-100 rounded"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Menu Items */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-white"
                      : "text-gray-700 hover:bg-gray-100",
                  )}
                >
                  {Icon && <Icon className="h-5 w-5" />}
                  <span >
                    {getLocalizedValue(item.title, item.titleBn, language)}
                  </span>
                </Link>
              );
            })}
          </nav>

          {/* Profile Section */}
          <div className="border-t border-gray-200 p-4">
            {user ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  {user.photo ? (
                    <div className="relative h-10 w-10 rounded-full overflow-hidden border border-gray-200">
                      <NextImage
                        src={user.photo}
                        alt={user.fullName?.charAt(0)?.toUpperCase() || "U"}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-primary font-semibold">
                        {(user.fullName || user.username || 'A').charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {user.fullName || user.username}
                    </p>
                    {user.email && (
                      <p className="text-xs text-gray-500 truncate">
                        {user.email}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                 
                  <button
                    onClick={onLogout}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    {language === 'bn' ? 'লগআউট' : 'Logout'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-gray-500 mb-2">Not logged in</p>
                <Link
                  href="/login"
                  className="text-sm text-primary hover:underline"
                >
                  Login
                </Link>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
