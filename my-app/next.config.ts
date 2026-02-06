import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export', // Uygulamayı statik dosyalara dönüştürür
  images: {
    unoptimized: true, // Mobil cihazlarda resimlerin bozulmaması için gerekli
  },
  // Eğer eslint hataları build'i engelliyorsa:
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;