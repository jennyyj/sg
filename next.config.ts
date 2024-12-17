import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Enable production builds to ignore TypeScript errors
  typescript: {
    ignoreBuildErrors: true,
  },
  // Enable production builds to ignore ESLint errors
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
