import { Inter } from 'next/font/google';
import './globals.css';
import ClientLayout from './components/layout/ClientLayout';

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
        {/* Link to the PWA manifest */}
        <link rel="manifest" href="/manifest.json" />
        
        {/* App icons */}
        <link rel="icon" href="/icons/icon-192x192.png" sizes="192x192" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta name="theme-color" content="#3a73c1" />
      </head>
      <body className={inter.className}>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
