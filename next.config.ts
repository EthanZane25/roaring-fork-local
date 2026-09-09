import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "i.ebayimg.com" }
    ]
  },
  poweredByHeader: false,
  compress: true
};

export default nextConfig;
