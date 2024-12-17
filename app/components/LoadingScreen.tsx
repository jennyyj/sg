'use client';

import { useState, useEffect } from 'react';

export default function LoadingScreen() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 2000); // Show loading screen for 2s
    return () => clearTimeout(timer);
  }, []);

  return loading ? (
    <div className="fixed inset-0 flex items-center justify-center bg-[#3a73c1]">
      <img src="/icons/icon-512x512.png" alt="Logo" className="w-32 h-32" />
    </div>
  ) : null;
}
