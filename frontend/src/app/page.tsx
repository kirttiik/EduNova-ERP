"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Root Page - Redirects to login or dashboard based on auth state.
 * Uses a mounted guard to avoid hydration mismatches with localStorage.
 */
export default function Home() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  // Wait for client-side mount before accessing localStorage
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const token = localStorage.getItem('edunova_token');
    const userStr = localStorage.getItem('edunova_user');

    const isValid =
      token &&
      userStr &&
      userStr !== 'null' &&
      userStr !== 'undefined';

    if (isValid) {
      router.replace('/dashboard');
    } else {
      localStorage.removeItem('edunova_token');
      localStorage.removeItem('edunova_user');
      router.replace('/login');
    }
  }, [mounted, router]);

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center animate-pulse"
          style={{ background: 'linear-gradient(135deg, #6c63ff, #3b82f6)' }}>
          <span className="text-2xl text-white font-bold">E</span>
        </div>
        <p className="text-[#5a5a70] text-sm">Loading EduNova...</p>
      </div>
    </div>
  );
}
