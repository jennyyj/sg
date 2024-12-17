// next.config.ts
import { NextConfig } from 'next';
import withPWA from 'next-pwa';

const isProduction = process.env.NODE_ENV === 'production';

const nextConfig: NextConfig = withPWA({
  dest: 'public', // Folder for generated service worker
  register: true, // Auto-register the service worker
  skipWaiting: true, // Immediately activate updated service worker
  disable: !isProduction, // Disable PWA in non-production environments
});

export default nextConfig;
