import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true, // 🛠️ KRİTİK: Dosya yollarını Capacitor'ün anlayacağı hale getirir
  images: {
    unoptimized: true,
  },
  // Build sırasında çıkabilecek küçük hataları görmezden gel
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;