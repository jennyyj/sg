import { Inter } from 'next/font/google';
import './globals.css';
import ClientLayout from './components/layout/ClientLayout';
import LoadingScreen from './components/LoadingScreen'; 
import { Suspense } from 'react';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'ShiftGrab',
  description: 'Connecting Businesses to Workers Instantly',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/icons/C.png" sizes="192x192" />
        <link rel="apple-touch-icon" href="/icons/C.png" />
        <meta name="theme-color" content="#ffffff" />
      </head>
      <body className={inter.className}>
        {/* Use Suspense to integrate the loading screen */}
        <Suspense fallback={<LoadingScreen />}>
          <ClientLayout>{children}</ClientLayout>
        </Suspense>
      </body>
    </html>
  );
}
