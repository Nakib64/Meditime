"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Facebook, Instagram, Youtube, Linkedin, MessageCircle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { homepageTranslations } from "@/lib/homepage-translations";

export default function Footer() {
  const { language } = useLanguage();
  const t = homepageTranslations[language].footer;
  const [email, setEmail] = useState("");

  const services = [
    { href: "/doctor",     label: t.links.doctor },
    { href: "/service",    label: t.links.video },
    { href: "/hospital",   label: t.links.hospital },
    { href: "/diagnostic", label: t.links.diagnostic },
    { href: "/ambulance",  label: t.links.ambulance },
  ];

  const resources = [
    { href: "/membership",        label: t.links.membership },
    { href: "/blog",              label: t.links.blog },
    { href: "/offer",             label: t.links.offer },
    { href: "/affiliate-program", label: t.links.affiliate },
    { href: "/blood-donor",       label: t.links.blood },
  ];

  const socialLinks = [
    { icon: MessageCircle, href: "https://wa.me/01610384444",             label: "WhatsApp"  },
    { icon: Facebook,      href: "https://www.facebook.com/meditime.com.bd", label: "Facebook"  },
    { icon: Instagram,     href: "#", label: "Instagram" },
    { icon: Linkedin,      href: "#", label: "LinkedIn"  },
    { icon: Youtube,       href: "https://www.youtube.com/@Meditimehealth", label: "YouTube"   },
  ];

  // Figma exact values
  // bg: #111827  |  teal: #3DB5A0  |  divider: rgba(255,255,255,0.08)
  // body-text: #9CA3AF  |  input-bg: #1F2937

  return (
    <footer className="w-full" style={{ backgroundColor: "#193252", color: "#9CA3AF" }}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">

        {/* ── TOP ROW ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center py-8 sm:py-12 border-b border-white/5">
          {/* Tagline / Get Started */}
          <div>
            <h3 className="text-xl sm:text-3xl font-bold text-white leading-tight">
              {t.getStarted}
            </h3>
          </div>

          {/* Email pill */}
          <div
            className="flex items-center bg-white/5 rounded-full border border-white/10 p-1.5 w-full max-w-lg lg:ml-auto transition-all focus-within:border-[#3DB5A0]/50 focus-within:ring-4 focus-within:ring-[#3DB5A0]/5 shadow-inner"
          >
            <input
              type="email"
              placeholder={t.emailPlaceholder}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 bg-transparent border-none focus:ring-0 outline-none text-[15px] px-6 py-2 text-white placeholder:text-slate-500 min-w-0"
            />
            <button
              className="shrink-0 btn-primary btn-slide text-[13px] font-bold text-white px-8 py-3 rounded-full transition-all shadow-lg active:scale-95"
            >
              {t.sendEmail}
            </button>
          </div>
        </div>

        {/* ── 4-COLUMN BOTTOM SECTION ─────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 py-12">
          
          {/* Column 1: Logo, Slogan, Get In Touch, Social Icons */}
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-3">
              <Link href="/" className="inline-block">
                <Image
                  src="/SVG/asset-3.png"
                  alt="Meditime"
                  width={180}
                  height={40}
                  priority
                  className="h-8 w-auto object-contain brightness-0 invert"
                />
              </Link>
               <p className="text-[16px] text-slate-400 leading-relaxed">
                {t.tagline}
              </p>
              <p className="text-[11px] leading-relaxed text-slate-400 max-w-[240px]">
                {t.slogan}
              </p>
            </div>

            <div className="flex flex-col gap-4 mt-2">
              <h4 className="text-[14px] font-bold text-white uppercase tracking-wider">
                {t.getInTouch}
              </h4>
             
              <div className="flex items-center gap-3">
                {socialLinks.map((s, i) => {
                  const Icon = s.icon;
                  return (
                    <a
                      key={i}
                      href={s.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={s.label}
                      className="w-10 h-10 rounded-xl flex items-center justify-center border border-white/5 bg-white/5 text-white hover:bg-primary hover:border-primary hover:text-white transition-all transform hover:-translate-y-1 shadow-lg"
                    >
                      <Icon size={18} />
                    </a>
                  );
                })}
              </div>
            </div>
          </div>


          {/* Services */}
          <div>
            <h4
              className="text-base font-bold mb-5"
              style={{ color: "#FFFFFF" }}
            >
              {t.services}
            </h4>
            <ul className="flex flex-col gap-3">
              {services.map((s, i) => (
                <li key={i}>
                  <Link
                    href={s.href}
                    className="text-sm transition-colors hover:text-[#3DB5A0]"
                    style={{ color: "#9CA3AF", textDecoration: "none" }}
                  >
                    {s.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4
              className="text-base font-bold mb-5"
              style={{ color: "#FFFFFF" }}
            >
              {t.resources}
            </h4>
            <ul className="flex flex-col gap-3">
              {resources.map((r, i) => (
                <li key={i}>
                  <Link
                    href={r.href}
                    className="text-sm transition-colors hover:text-[#3DB5A0]"
                    style={{ color: "#9CA3AF", textDecoration: "none" }}
                  >
                    {r.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4
              className="text-base font-bold mb-5"
              style={{ color: "#FFFFFF" }}
            >
              {t.contact}
            </h4>
            <ul className="flex flex-col gap-2.5">
              <li
                className="text-sm font-semibold"
                style={{ color: "#FFFFFF" }}
              >
                Medi Time
              </li>
              <li className="text-sm" style={{ color: "#9CA3AF" }}>
                Health Care IT Services
              </li>
              <li className="text-sm" style={{ color: "#9CA3AF" }}>
                {t.addressLabel}
              </li>
              <li>
                <a
                  href="mailto:support@meditime.com.bd"
                  className="text-sm transition-colors hover:text-[#3DB5A0]"
                  style={{ color: "#9CA3AF", textDecoration: "none" }}
                >
                  support@meditime.com.bd
                </a>
              </li>
              <li>
                <a
                  href="tel:+8801610384444"
                  className="text-sm transition-colors hover:text-[#3DB5A0]"
                  style={{ color: "#9CA3AF", textDecoration: "none" }}
                >
                  +880- 1610 38 4444
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* ── COPYRIGHT BAR ────────────────────────────────────────────── */}
        <div
          className="flex flex-col md:flex-row items-center justify-between gap-3 py-6"
        >
          <p className="text-sm" style={{ color: "#6B7280", opacity: 0.7 }}>
            {t.copyRight}
          </p>
          <div className="flex items-center gap-4 sm:gap-8 flex-wrap">
            {[
              { href: "/about",   label: t.aboutUs },
              { href: "/privacy", label: t.privacyPolicy },
              { href: "/terms",   label: t.termsConditions },
            ].map((link, i) => (
              <Link
                key={i}
                href={link.href}
                className="text-sm transition-colors hover:text-[#3DB5A0]"
                style={{ color: "#9CA3AF", textDecoration: "none" }}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

      </div>
    </footer>
  );
}