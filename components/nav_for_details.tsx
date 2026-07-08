"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, UserCircle, Settings, LogOut as LogOutIcon, Wallet, DollarSign, Globe, Activity } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useLanguage } from "@/contexts/LanguageContext";
import { homepageTranslations } from "@/lib/homepage-translations";

interface User {
  id: string;
  fullName: string;
  email?: string;
  phoneNumber: string;
  role?: string;
}

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [affiliate, setAffiliate] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { language, toggleLanguage } = useLanguage();
  const t = homepageTranslations[language].nav;

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const checkUser = () => {
      if (typeof window !== "undefined") {
        const userData = localStorage.getItem("user");
        if (userData) {
          try {
            const parsed = JSON.parse(userData);
            if (parsed.role === 'admin' || parsed.role === 'superadmin') {
              // Clear legacy admin data from user session
              localStorage.removeItem("user");
              setUser(null);
            } else {
              setUser(parsed);
            }
          } catch (error) {
            console.error("Error parsing user data:", error);
            localStorage.removeItem("user");
          }
        } else {
          setUser(null);
        }

        const affiliateData = localStorage.getItem("affiliate");
        if (affiliateData) {
          try {
            setAffiliate(JSON.parse(affiliateData));
          } catch (error) {
            console.error("Error parsing affiliate data:", error);
            localStorage.removeItem("affiliate");
          }
        } else {
          setAffiliate(null);
        }
      }
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
  }, []);

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

  const navLinks = [
    { href: "/doctor", label: t.doctors },
    { href: "/hospital", label: t.hospitals },
    { href: "/service", label: t.services },
    { href: "/diagnostic", label: t.diagnostic },
    { href: "/membership", label: t.membership },
    { href: "/contact", label: t.contact },
  ];

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [mobileMenuOpen]);

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 border-b border-primary py-4 sm:py-5 bg-[#017991]`}

      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="transition-all duration-300"
            >
              <Link href="/" onClick={() => {
                setMobileMenuOpen(false)
                window.scrollTo({ top: 0, behavior: "smooth" })
              }}>
                <img
                  src="/SVG/asset-3.png"
                  alt="Logo"
                  className="h-8 sm:h-8 md:h-8 w-auto cursor-pointer"
                />
              </Link>
            </motion.div>

            {/* Desktop Navigation Links */}
            <div className="hidden xl:flex items-center gap-4 xl:gap-6 flex-1 justify-center px-4">
              {navLinks.map((link, index) => {
                const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
                return (
                  <motion.div
                    key={link.href}
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.3 }}
                  >
                    <Link
                      href={link.href}
                      className="relative group min-w-[85px] flex items-center justify-center"
                    >
                      <span
                        className={`${language === 'bn'
                          ? "text-[13px] xl:text-[15px] font-bold"
                          : "text-[11px] xl:text-[13px] font-semibold"
                          }  whitespace-nowrap text-center ${isActive
                            ? scrolled ? "text-primary" : "text-primary"
                            : scrolled ? "text-white  hover:border-b-2 group-hover:text-primary" : "hover:border-b-2 text-white group-hover:text-primary"
                          }`}
                      >
                        {link.label}
                      </span>
                      {isActive && (
                        <motion.div
                          layoutId="navbar-indicator"
                          className={`absolute -bottom-1 left-0 right-0 h-0.5 bg-primary rounded-full`}
                          initial={false}
                          transition={{ type: "spring", stiffness: 380, damping: 30 }}
                        />
                      )}
                      {!isActive && (
                        <motion.div
                          className={`absolute -bottom-1 left-0 right-0 h-0.5 rounded-full ${scrolled
                            ? "bg-primary/0 group-hover:bg-primary/50"
                            : "bg-white/0 group-hover:bg-white/50"
                            }`}
                          initial={{ scaleX: 0 }}
                          whileHover={{ scaleX: 1 }}
                          transition={{ duration: 0.3 }}
                        />
                      )}
                    </Link>
                  </motion.div>
                );
              })}
            </div>

            {/* Desktop Right Side Actions */}
            <div className="hidden xl:flex items-center gap-3">
              {/* Language Toggle */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggleLanguage}
                className={`text-xs font-semibold px-3 py-2 rounded-lg h-[50px]  transition-colors duration-300 ${scrolled
                  ? "text-white hover:text-white hover:bg-primary/5"
                  : "text-white hover:text-primary hover:bg-white/10"
                  }`}
                title={language === 'en' ? 'Switch to Bangla' : 'Switch to English'}
              >
                <div className="flex gap-3 items-center">
                  <Globe className="h-4 w-4" />

                  {language === 'en' ? 'বাংলা' : 'English'}
                </div>

              </motion.button>

              {user ? (
                <>
                  <Link
                    href="/user/dashboard"
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white font-bold text-sm shadow-lg shadow-primary/20  transition-all hover:scale-105 active:scale-95"
                  >
                    <Activity className="h-4 w-4" />
                    {language === 'bn' ? 'ড্যাশবোর্ড' : 'Dashboard'}
                  </Link>
                </>
              ) : (
                <>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Link
                      href="/login"
                      className={`text-sm font-semibold px-6 py-2.5 rounded-lg  border border-primary h-full transition-colors duration-300 ${scrolled
                        ? "text-white hover:text-primary hover:bg-primary/5"
                        : "text-white hover:text-primary hover:bg-white/10"
                        }`}
                    >
                      {t.login}
                    </Link>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Link
                      href="/signup"
                      className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 ${scrolled
                        ? "bg-white hover:bg-primary/90 text-primary"
                        : "bg-primary hover:bg-white/35 backdrop-blur-sm text-white"
                        }`}
                    >
                      {t.signup}
                    </Link>
                  </motion.div>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`xl:hidden p-2.5 rounded-lg text-white shadow-sm transition-all active:scale-95 ${scrolled
                ? "bg-primary"
                : "bg-white/25 backdrop-blur-sm hover:bg-white/35"
                }`}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />

            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-80 max-w-[85vw] bg-white shadow-2xl z-50 xl:hidden overflow-y-auto"
            >
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                  <h2 className="text-xl font-bold text-gray-900">Menu</h2>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    aria-label="Close menu"
                  >
                    <X className="h-6 w-6 text-gray-700" />
                  </button>
                </div>

                {/* Language Toggle - Mobile */}
                <div className="px-4 pt-4">
                  <button
                    onClick={toggleLanguage}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-primary text-primary hover:bg-primary/5 transition-all font-semibold"
                  >
                    <Globe className="h-5 w-5" />
                    <span className="text-base">
                      {language === 'en' ? 'বাংলা' : 'English'}
                    </span>
                  </button>
                </div>

                {/* Mobile Navigation Links */}
                <nav className="flex-1 px-4 py-6 space-y-2">
                  {navLinks.map((link, index) => {
                    const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
                    return (
                      <motion.div
                        key={link.href}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05, duration: 0.2 }}
                      >
                        <Link
                          href={link.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className={`block px-4 py-3 rounded-lg text-sm font-bold uppercase tracking-wider transition-all duration-200 ${isActive
                            ? "bg-primary/10 text-primary border-2 border-primary/20"
                            : "text-gray-700 hover:bg-gray-100 hover:text-primary"
                            }`}
                        >
                          {link.label}
                        </Link>
                      </motion.div>
                    );
                  })}
                </nav>

                {/* Mobile User Section */}
                <div className="border-t border-gray-200 p-4 space-y-4">
                  {user ? (
                    <>
                      <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl border border-primary/20">
                        {(user as any)?.photo ? (
                          <div className="relative h-12 w-12 rounded-full overflow-hidden border-2 border-primary/30">
                            <Image
                              src={(user as any).photo}
                              alt={user.fullName || "User"}
                              fill
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary-light to-primary flex items-center justify-center text-white font-bold text-lg">
                            {user.fullName?.charAt(0)?.toUpperCase() || "U"}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-base font-semibold text-gray-800 truncate">{user.fullName}</p>
                          {user.phoneNumber && (
                            <p className="text-sm text-gray-600 truncate">{user.phoneNumber}</p>
                          )}
                        </div>
                      </div>
                      <Link
                        href="/user/dashboard"
                        onClick={() => setMobileMenuOpen(false)}
                        className="block w-full px-4 py-3 bg-primary text-white text-base font-semibold rounded-lg transition-all duration-300 shadow-lg text-center"
                      >
                        {language === 'bn' ? 'ড্যাশবোর্ড' : 'Dashboard'}
                      </Link>

                      {user.role === 'doctor' && (
                        <Link
                          href="/doctor/dashboard"
                          onClick={() => setMobileMenuOpen(false)}
                          className="block w-full px-4 py-3 bg-indigo-600 text-white text-base font-semibold rounded-lg transition-all duration-300 shadow-lg text-center"
                        >
                          Doctor Dashboard
                        </Link>
                      )}
                      {/* Logout removed as per request */}
                    </>
                  ) : (
                    <>
                      <Link
                        href="/login"
                        onClick={() => setMobileMenuOpen(false)}
                        className="block w-full px-4 py-3 text-center text-base font-semibold text-gray-700 hover:text-primary transition-colors duration-300 rounded-lg hover:bg-primary/5 border-2 border-gray-200"
                      >
                        {t.login}
                      </Link>
                      <Link
                        href="/signup"
                        onClick={() => setMobileMenuOpen(false)}
                        className="block w-full px-4 py-3 rounded-full bg-primary hover:bg-primary/90 text-white text-base font-semibold transition-all duration-300 shadow-lg text-center"
                      >
                        {t.signup}
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}