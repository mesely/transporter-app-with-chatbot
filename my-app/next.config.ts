import type { NextConfig } from "next";

const nextConfig: any = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;