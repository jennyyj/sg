'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function OptOutPage() {
  const [name, setName] = useState('');
  const [number, setNumber] = useState('');
  const [message, setMessage] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const prefilledNumber = searchParams.get('number');
    if (prefilledNumber) {
      setNumber(prefilledNumber);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/opt-out', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, number }),
      });

      const data = await response.json();
      if (response.ok) {
        setMessage('You have successfully opted out of messages.');
        setTimeout(() => router.push('/opt-out-success'), 3000); 
      } else {
        setMessage(data.error || 'Failed to opt out.');
      }
    } catch (error) {
      console.error('Error:', error);
      setMessage('An error occurred. Please try again.');
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold text-center text-[#3a73c1] mb-4">Opt Out of Messages</h1>
      <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto">
        <div>
          <label className="block font-medium text-[#3a73c1]">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 rounded-full border-2 border-[#3a73c1] text-center text-[#52ace4] placeholder-[#52ace4] focus:outline-none"
            required
          />
        </div>
        <div>
          <label className="block font-medium text-[#3a73c1]">Phone Number</label>
          <input
            type="text"
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            className="w-full px-4 py-3 rounded-full border-2 border-[#3a73c1] text-center text-[#52ace4] placeholder-[#52ace4] focus:outline-none"
            required
            disabled
          />
        </div>
        <button
          type="submit"
          className="text-[#ff3131] border-2 border-[#ff3131] w-full px-4 py-2 rounded-full hover:bg-[#fff1f1]"
        >
          Opt Out
        </button>
      </form>
      {message && <p className="text-center mt-4 text-[#3a73c1]">{message}</p>}
    </div>
  );
}
