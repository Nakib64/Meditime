"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import { useRouter, usePathname } from "next/navigation";
import { showToast } from "@/lib/toast";
import { useLanguage } from "@/contexts/LanguageContext";

export default function GoogleOneTapProvider() {
  const router = useRouter();
  const pathname = usePathname();
  const { language } = useLanguage() as { language: "en" | "bn" };
  const [scriptLoaded, setScriptLoaded] = useState(false);

  const isAdminRoute = pathname.startsWith('/admin') || pathname === '/admin-login';

  useEffect(() => {
    if (isAdminRoute) return;

    // Wait for script to be loaded and window.google to be available
    if (!scriptLoaded || typeof window === "undefined" || !(window as any).google) return;
    
    // Check if user is already logged in
    const currentUser = localStorage.getItem("user");
    if (currentUser) return;

    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) {
      console.warn("Google Client ID is missing. Set NEXT_PUBLIC_GOOGLE_CLIENT_ID in your environment variables.");
      return;
    }

    const handleCredentialResponse = async (googleResponse: any) => {
      try {
        const res = await fetch("/api/auth/google-one-tap", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ credential: googleResponse.credential }),
        });

        const result = await res.json();

        if (res.ok) {
          localStorage.setItem("user", JSON.stringify(result.user));
          window.dispatchEvent(new Event("userLogin"));
          showToast.success(
            language === "en"
              ? "Logged in successfully!"
              : "সফলভাবে লগইন করা হয়েছে!"
          );
          router.push("/");
          router.refresh();
        } else {
          showToast.error(result.error || "Google login failed");
        }
      } catch (error) {
        showToast.error(
          language === "en"
            ? "An error occurred during Google login."
            : "গুগল লগইন করার সময় একটি সমস্যা হয়েছে।"
        );
      }
    };

    try {
      const google = (window as any).google;
      
      // Initialize ID client
      google.accounts.id.initialize({
        client_id: clientId,
        callback: handleCredentialResponse,
        auto_select: false,
        use_fedcm_for_prompt: false, // Disables FedCM to prevent NetworkErrors in local development
      });

      // Prompt One-Tap (this will show it on every page load/navigation if not logged in)
      google.accounts.id.prompt((notification: any) => {
        if (notification.isNotDisplayed()) {
          console.log("One-Tap not displayed reason:", notification.getNotDisplayedReason());
        } else if (notification.isSkippedMoment()) {
          console.log("One-Tap skipped reason:", notification.getSkippedReason());
        }
      });

      // Automatically detect and render standard Google login buttons if containers are present in the current view
      const loginBtn = document.getElementById("google-login-button");
      if (loginBtn) {
        google.accounts.id.renderButton(loginBtn, {
          theme: "outline",
          size: "large",
          width: "100%",
          text: "signin_with",
          shape: "rectangular",
        });
      }

      const signupBtn = document.getElementById("google-signup-button");
      if (signupBtn) {
        google.accounts.id.renderButton(signupBtn, {
          theme: "outline",
          size: "large",
          width: "100%",
          text: "signin_with",
          shape: "rectangular",
        });
      }
    } catch (err) {
      console.error("Error initializing Google Identity Services:", err);
    }
  }, [scriptLoaded, pathname, language, router, isAdminRoute]);

  if (isAdminRoute) return null;

  return (
    <Script
      src="https://accounts.google.com/gsi/client"
      strategy="afterInteractive"
      onLoad={() => setScriptLoaded(true)}
      onError={(e) => {
        console.error("Google Identity Services script failed to load:", e);
      }}
    />
  );
}
