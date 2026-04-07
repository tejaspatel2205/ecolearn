import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    allowedDevOrigins: [
      'localhost:3000',
      '127.0.0.1:3000',
      '192.168.137.54:3000',
      '192.168.61.169:3000'
    ]
  }
};

export default nextConfig;
