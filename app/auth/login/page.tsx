'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
  
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
  
      // Safely parse the response
      let data;
      try {
        data = await response.json();
      } catch {
        throw new Error('Invalid response from server');
      }
  
      if (response.ok) {
        localStorage.setItem('token', data.token);
        router.push('/jobs'); // Redirect to jobs page after successful login
      } else {
        alert(data.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('Error logging in. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="w-full max-w-md p-6 text-center">
        <h1 className="text-2xl font-bold mb-8 text-[#3a73c1]">
          WELCOME BACK
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Username"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            className="w-full px-4 py-3 rounded-full border-2 border-[#3a73c1] text-center text-[#52ace4] placeholder-[#52ace4] focus:outline-none focus:border-[#52ace4]"
          />

          <input
            type="password"
            placeholder="Password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            className="w-full px-4 py-3 rounded-full border-2 border-[#3a73c1] text-center text-[#52ace4] placeholder-[#52ace4] focus:outline-none focus:border-[#52ace4]"
          />

          <button
            type="submit"
            className="w-full px-4 py-3 rounded-full border-2 border-[#3a73c1] text-[#3a73c1] font-bold hover:bg-[#f0f8ff] transition-colors flex items-center justify-between"
          >
            <span>LOG IN</span>
            <span>➜</span>
          </button>
        </form>

        <p className="mt-6 text-[#3a73c1] font-bold">
          Don&apos;t have an account?{' '}
          <Link href="/auth/register" className="text-[#52ace4]">
            REGISTER HERE
          </Link>
        </p>
      </div>
    </div>
  );
}