import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    domains: ["i.ibb.co", "i.ibb.co.com", "wordpress.meditime.com.bd", "cdn.codeopx.com", "i.imgbb.com", "lh3.googleusercontent.com"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "wordpress.meditime.com.bd",
      },
      {
        protocol: "https",
        hostname: "i.imgbb.com",
      },
      {
        protocol: "https",
        hostname: "i.ibb.co",
      },
      {
        protocol: "https",
        hostname: "picsum.photos",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "i.pravatar.cc",
      },
      {
        protocol: "https",
        hostname: "plus.unsplash.com",
      },
    ],
    localPatterns: [
      {
        pathname: "/**",
        search: "?*",
      },
    ],
  },
};

export default nextConfig;
