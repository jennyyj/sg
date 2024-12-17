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
      <body className={inter.className}>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
