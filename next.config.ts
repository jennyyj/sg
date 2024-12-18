// next.config.ts
import { NextConfig } from 'next';
import withPWA from 'next-pwa';

const isProduction = process.env.NODE_ENV === 'production';

export default withPWA({
  pwa: {
    dest: 'public',
    disable: !isProduction,
  },
  experimental: {
    forceSwcTransforms: true, // Fix Prisma SWC issue
  },
});
