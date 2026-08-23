import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import Script from "next/script";
import { Suspense } from "react";
import "./globals.css";
import ScrollToTopButton from '@/components/ScrollToTopButton';
import { Toaster } from "react-hot-toast";
import PopupModal from "@/components/popup-modal";
import Providers from "@/components/Providers";
import { BiSolidMessageSquare } from "react-icons/bi";
import GoogleOneTapProvider from "@/components/GoogleOneTapProvider";
import AnalyticsTracker from "@/components/analytics/AnalyticsTracker";

const poppins = Poppins({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-poppins",
  display: "swap",
});

import { FaWhatsapp } from "react-icons/fa";

export const metadata: Metadata = {
  title: "Doctor Appointment in Savar | Meditime",
  description: "Find doctor near you in Savar. Medicine Specialist, Diabetese, Orthopedic Doctors, Gynecologist Doctors and 30+ More Specialities. Book Doctor Serial.",
  icons: {
    icon: [
      { url: "/SVG/asset-8.svg", type: "image/svg+xml" },
      { url: "/icon-48x48.png", sizes: "48x48", type: "image/png" },
      { url: "/icon-96x96.png", sizes: "96x96", type: "image/png" },
      { url: "/icon-144x144.png", sizes: "144x144", type: "image/png" },
      { url: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon.png", sizes: "512x512", type: "image/png" },
      { url: "/favicon.ico", sizes: "48x48 96x96 144x144 192x192" },
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
  const clarityId = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID;

  return (
    <html lang="bn">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        <link
          href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&family=Hind+Siliguri:wght@400;500;600;700&family=Noto+Sans+Bengali:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />

        {/* Google Tag Manager Script */}
        <Script
          id="gtm-script"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-MM2T9W6K');`,
          }}
        />

        {/* Microsoft Clarity Script (if configured) */}
        {clarityId && (
          <Script
            id="clarity-script"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `(function(c,l,a,r,i,t,y){
c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
})(window, document, "clarity", "script", "${clarityId}");`,
            }}
          />
        )}
      </head>
      <body
        className={`${poppins.variable} font-sans antialiased`}
      >
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-MM2T9W6K"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>

        <Suspense fallback={null}>
          <AnalyticsTracker />
        </Suspense>

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