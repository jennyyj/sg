import { NextConfig } from 'next';
import withPWA from 'next-pwa';

const isProduction = process.env.NODE_ENV === 'production';

const nextConfig: NextConfig = withPWA({
  pwa: {
    dest: 'public', 
    register: true, 
    skipWaiting: true, 
    disable: !isProduction, 
  },
  // Resolve Prisma Client issue with Vercel
  experimental: {
    forceSwcTransforms: true,
  },
  // Suppress TypeScript build errors in production
  typescript: {
    ignoreBuildErrors: isProduction,
  },
  // Suppress ESLint build errors in production
  eslint: {
    ignoreDuringBuilds: isProduction,
  },
  // Ensure the correct base URL for your environment
  env: {
    NEXT_PUBLIC_BASE_URL:
      process.env.NEXT_PUBLIC_BASE_URL || `https://${process.env.VERCEL_URL}`,
  },
});

export default nextConfig;
