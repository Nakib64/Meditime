"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Home } from "lucide-react";
import UserSidebar from "@/components/user-sidebar";
import { useLanguage } from "@/contexts/LanguageContext";

interface User {
  id: string;
  fullName: string;
  email?: string;
  phoneNumber: string;
  role?: string;
}

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { language } = useLanguage();

  useEffect(() => {
    const checkUser = async () => {
      if (typeof window !== "undefined") {
        const userData = localStorage.getItem("user");
        if (userData) {
          try {
            const parsedUser = JSON.parse(userData);
            if (parsedUser.role === 'user' || !parsedUser.role) {
              // Verify session with the server
              const verifyRes = await fetch("/api/auth/verify");
              if (verifyRes.ok) {
                setUser(parsedUser);
              } else {
                console.warn("Session expired on backend");
                localStorage.removeItem("user");
                localStorage.removeItem("myDiagnosticBookings");
                try {
                  await fetch("/api/auth/logout", { method: "POST" });
                } catch (err) {
                  console.error("Logout error:", err);
                }
                router.push("/login");
              }
            } else {
              router.push("/");
            }
          } catch (error) {
            console.error("Error parsing user data or verifying session:", error);
            localStorage.removeItem("user");
            router.push("/login");
          }
        } else {
          router.push("/login");
        }
      }
      setLoading(false);
    };

    checkUser();
    window.addEventListener("storage", checkUser);
    window.addEventListener("userLogin", checkUser);
    window.addEventListener("userLogout", checkUser);

    return () => {
      window.removeEventListener("storage", checkUser);
      window.removeEventListener("userLogin", checkUser);
      window.removeEventListener("userLogout", checkUser);
    };
  }, [router]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      localStorage.removeItem("user");
      setUser(null);
      // Use window.location.href for a hard redirect to ensure all states are cleared
      window.location.href = "/";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-50 relative">
      <UserSidebar user={user} onLogout={handleLogout} />

      {/* Floating Back to Home Button */}
      <Link
        href="/"
        className="fixed md:hidden top-4 right-4 sm:top-5 sm:right-6 z-40 flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white text-gray-700 hover:text-primary shadow-lg border border-gray-100 hover:bg-gray-50 transition-all duration-200 active:scale-95 group font-bold text-xs sm:text-sm print:hidden"
        title={language === 'bn' ? 'হোমে ফিরুন' : 'Back to Home'}
      >
        <Home className="h-5 w-5 text-gray-600 group-hover:text-primary transition-colors" />
        <span className="hidden sm:inline">{language === 'bn' ? 'হোমে ফিরুন' : 'Back to Home'}</span>
      </Link>

      <main className="flex-1 lg:ml-64 overflow-y-auto">
        <div className="p-6 lg:p-10">
          {children}
        </div>
      </main>
    </div>
  );
}

