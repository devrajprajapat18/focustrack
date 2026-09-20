import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  async headers() {
    const headers = [
      { key: "X-DNS-Prefetch-Control", value: "on" },
      { key: "X-XSS-Protection", value: "1; mode=block" },
    ];
    // HSTS only over production HTTPS — sending it on http://localhost
    // can pin local browsers to HTTPS and break dev.
    if (process.env.NODE_ENV === "production") {
      headers.push({
        key: "Strict-Transport-Security",
        value: "max-age=63072000; includeSubDomains; preload",
      });
    }
    return [
      {
        source: "/(.*)",
        headers,
      },
    ];
  },
};

export default nextConfig;
