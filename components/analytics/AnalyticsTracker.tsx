"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { trackGlobalPageView, track10sEngagement, trackScrollDepth, pushToDataLayer } from "@/lib/gtm";

const getContentCategory = (pathname: string): string => {
  if (pathname.startsWith("/doctor") || pathname.startsWith("/departments") || pathname.startsWith("/appointments")) {
    return "doctor";
  }
  if (pathname.startsWith("/hospital")) {
    return "hospital";
  }
  if (pathname.startsWith("/diagnostic")) {
    return "diagnostic";
  }
  if (pathname.startsWith("/blood-donor")) {
    return "blood";
  }
  if (pathname.startsWith("/ambulance")) {
    return "ambulance";
  }
  return "general";
};

export default function AnalyticsTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const reportedScrollDepths = useRef<Set<number>>(new Set());

  // 1. Page View Global & 10s Engagement
  useEffect(() => {
    if (!pathname) return;

    const fullUrl = searchParams?.toString() ? `${pathname}?${searchParams.toString()}` : pathname;
    const category = getContentCategory(pathname);

    // Global Page View
    trackGlobalPageView(category, fullUrl);

    // Reset scroll depths on route change
    reportedScrollDepths.current.clear();

    // 10s Engagement Timer
    const timer = setTimeout(() => {
      track10sEngagement(fullUrl);
    }, 10000);

    return () => {
      clearTimeout(timer);
    };
  }, [pathname, searchParams]);

  // 2. Scroll Depth Tracking (25%, 50%, 75%, 90%)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      if (scrollHeight <= 0) return;

      const scrollPercentage = Math.round((scrollTop / scrollHeight) * 100);
      const thresholds = [25, 50, 75, 90];

      thresholds.forEach((threshold) => {
        if (scrollPercentage >= threshold && !reportedScrollDepths.current.has(threshold)) {
          reportedScrollDepths.current.add(threshold);
          trackScrollDepth(threshold, pathname || window.location.pathname);
        }
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [pathname]);

  // 3. Global Video & CTA Tracking Listeners
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Track HTML5 video events
    const handleVideoPlay = (e: Event) => {
      const target = e.target as HTMLVideoElement;
      pushToDataLayer("video_play", {
        video_src: target?.currentSrc || target?.src || "unknown",
        video_duration: target?.duration || 0,
      });
    };

    const handleVideoEnded = (e: Event) => {
      const target = e.target as HTMLVideoElement;
      pushToDataLayer("video_complete", {
        video_src: target?.currentSrc || target?.src || "unknown",
      });
    };

    document.addEventListener("play", handleVideoPlay, true);
    document.addEventListener("ended", handleVideoEnded, true);

    return () => {
      document.removeEventListener("play", handleVideoPlay, true);
      document.removeEventListener("ended", handleVideoEnded, true);
    };
  }, []);

  return null;
}
