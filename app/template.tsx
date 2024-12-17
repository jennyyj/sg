'use client';

import { useState } from 'react';
//import Navbar from './components/layout/Navbar';
import Sidebar from './components/layout/Sidebar';

export default function Template({
  children,
}: {
  children: React.ReactNode
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <>
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <main className="pt-16 min-h-screen">
        {children}
      </main>
    </>
  );
}

//if ever need to add navbar back here but this above side bar <Navbar toggleSidebar={toggleSidebar} /> and remove comment from navbar on top
