'use client';

import { usePathname } from 'next/navigation';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { ReactNode, useState } from 'react';

export default function ClientLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  console.log("Current pathname:", pathname);

  // Hide layout logic for auth pages
  const hideLayout =
  pathname.includes('/auth/login') ||
  pathname.includes('/auth/register') ||
  pathname.includes('/opt-out') ||
  pathname.includes('/claim-shift') ||
  pathname.includes('/opt-out-success') ||
  pathname.includes('/thank-you') ||
  pathname === '/';


  // Sidebar toggle state
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const toggleSidebar = () => setSidebarOpen((prev) => !prev);

  return (
    <>
      {!hideLayout && (
        <>
          <Navbar toggleSidebar={toggleSidebar} />
          <Sidebar isOpen={isSidebarOpen} onClose={() => setSidebarOpen(false)} />
        </>
      )}
      <main className={!hideLayout ? 'mt-16' : ''}>{children}</main>
    </>
  );
}
