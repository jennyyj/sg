import type { NextConfig } from 'next';
import withPWA from 'next-pwa';

const nextConfig: NextConfig = withPWA ({
  pwa: {
    dest: 'public', // Output folder for the service worker
    register: true, // Auto-register the service worker
    skipWaiting: true, // Instantly update the app after changes
    disable: process.env.NODE_ENV === 'development', // Disable in development
  },
  // Enable production builds to ignore TypeScript errors
  typescript: {
    ignoreBuildErrors: true,
  },
  // Enable production builds to ignore ESLint errors
  eslint: {
    ignoreDuringBuilds: true,
  },
});

export default nextConfig;
