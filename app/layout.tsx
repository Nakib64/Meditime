import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import ScrollToTopButton from '@/components/ScrollToTopButton';
import { Toaster } from "react-hot-toast";
import PopupModal from "@/components/popup-modal";
import Providers from "@/components/Providers";
import { BiSolidMessageSquare } from "react-icons/bi";
import GoogleOneTapProvider from "@/components/GoogleOneTapProvider";

const poppins = Poppins({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-poppins",
  display: "swap",
});

import { FaWhatsapp } from "react-icons/fa";

export const metadata: Metadata = {
  title: "Book Doctors, Tests & Hospital Appointments Online | Meditime",
  description: "Book appointments with top doctors, diagnostic tests, and hospitals near you. Fast, easy, and trusted healthcare booking platform in Bangladesh.",
  icons: {
    icon: [
      { url: "/SVG/asset-8.svg", type: "image/svg+xml" },
      { url: "/icon.png", sizes: "512x512", type: "image/png" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    shortcut: "/SVG/asset-8.svg",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="bn">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        <link
          href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&family=Hind+Siliguri:wght@400;500;600;700&family=Noto+Sans+Bengali:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className={`${poppins.variable} font-sans antialiased`}
      >
        <Providers>
          {/* Global Floating WhatsApp Button */}
          <a
            href="https://wa.me/8801610384444"
            target="_blank"
            rel="noopener noreferrer"
            className="fixed bottom-24 print:hidden right-8 z-50 w-12 h-12 bg-[var(--background-dark)] text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-all duration-300 group"
            aria-label="Contact us on WhatsApp"
          >
            <BiSolidMessageSquare className="w-7 h-7" />
            <span className="absolute right-full mr-3 bg-slate-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
              Chat on WhatsApp
            </span>
          </a>
          <ScrollToTopButton />
          <PopupModal />
          <GoogleOneTapProvider />
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#fff',
                color: '#333',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                padding: '16px',
                fontSize: '14px',
              },
              success: {
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#fff',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}