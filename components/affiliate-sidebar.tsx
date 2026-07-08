"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  DollarSign,
  Wallet,
  FileText,
  UserCircle,
  LogOut,
  X,
  Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage, getLocalizedValue } from "@/contexts/LanguageContext";

interface AffiliateSidebarProps {
  activeTab: string;
  onTabChange?: (tabId: string) => void;
  affiliate: {
    fullName: string;
    email: string;
  } | null;
  onLogout: () => void;
}

const menuItems = [
  { id: 'overview', title: 'Overview', titleBn: 'ওভারভিউ', icon: LayoutDashboard },
  { id: 'referrals', title: 'Referral Patients', titleBn: 'রেফারেল রোগী', icon: Users },
  { id: 'commissions', title: 'Commissions', titleBn: 'কমিশন', icon: DollarSign },
  { id: 'withdrawals', title: 'Withdrawals', titleBn: 'উত্তোলন', icon: Wallet },
  { id: 'reports', title: 'Reports', titleBn: 'রিপোর্ট', icon: FileText },
  { id: 'requests', title: 'Requests', titleBn: 'রিকোয়েস্ট', icon: FileText },
  { id: 'profile', title: 'Profile', titleBn: 'প্রোফাইল', icon: UserCircle },
];

export default function AffiliateSidebar({
  activeTab,
  onTabChange,
  affiliate,
  onLogout,
}: AffiliateSidebarProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { language } = useLanguage();
  const router = useRouter();

  const handleItemClick = (tabId: string) => {
    setIsMobileOpen(false);
    if (onTabChange) {
      onTabChange(tabId);
    } else {
      router.push(`/affiliate-program/dashboard?tab=${tabId}`);
    }
  };

  return (
    <>
      {/* Mobile Toggle Bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 px-4 flex items-center justify-between z-40">
        <div className="flex items-center gap-2">
          <img src="/SVG/asset-3.png" alt="Logo" className="h-6 w-auto" />
          <span className="font-bold text-[#00B1C2] text-sm">AFFILIATE</span>
        </div>
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="p-2 hover:bg-gray-100 rounded"
        >
          {isMobileOpen ? <X className="h-6 w-6 text-gray-700" /> : <Menu className="h-6 w-6 text-gray-700" />}
        </button>
      </div>

      {/* Mobile Overlay */}
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
            <Link href="/" className="flex items-center gap-2">
              <img src="/SVG/asset-3.png" alt="Logo" className="h-7 w-auto" />
              <span className="font-bold text-[#00B1C2] text-xs px-1.5 py-0.5 bg-[#00B1C2]/10 rounded">AFFILIATE</span>
            </Link>
            <button
              onClick={() => setIsMobileOpen(false)}
              className="lg:hidden p-1 hover:bg-gray-100 rounded"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          {/* Menu Items */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-[#00B1C2] text-white shadow-md shadow-[#00B1C2]/20"
                      : "text-gray-700 hover:bg-gray-100",
                  )}
                >
                  {Icon && <Icon className="h-5 w-5" />}
                  <span className="text-left">
                    {getLocalizedValue(item.title, item.titleBn, language)}
                  </span>
                </button>
              );
            })}
          </nav>

          {/* Profile Section */}
          <div className="border-t border-gray-200 p-4">
            {affiliate ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-[#00B1C2]/10 flex items-center justify-center">
                    <span className="text-[#00B1C2] font-semibold">
                      {affiliate.fullName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {affiliate.fullName}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {affiliate.email}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onLogout}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  {language === 'bn' ? 'লগআউট' : 'Logout'}
                </button>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-gray-500 mb-2">Not logged in</p>
                <Link
                  href="/affiliate-program"
                  className="text-sm text-[#00B1C2] hover:underline font-medium"
                >
                  Login / Signup
                </Link>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
