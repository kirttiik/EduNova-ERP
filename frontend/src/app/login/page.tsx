"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Zap, Eye, EyeOff, ArrowRight, Shield, Globe, Users } from 'lucide-react';
import ParticleBackground from '@/components/ui/ParticleBackground';
import { authApi } from '@/lib/api';

/**
 * Login Page
 * 
 * Premium futuristic login experience with particle background,
 * animated form, and demo credential hints.
 */

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  // Redirect if already logged in (deferred to after mount to avoid hydration mismatch)
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    if (!mounted) return;

    const token = localStorage.getItem('edunova_token');
    const userStr = localStorage.getItem('edunova_user');
    
    const isValid = token && userStr && userStr !== 'null' && userStr !== 'undefined';
    
    if (isValid) {
      router.replace('/dashboard');
    } else if (token || userStr) {
      // Clear invalid state to break redirect loops
      localStorage.removeItem('edunova_token');
      localStorage.removeItem('edunova_user');
    }
  }, [mounted, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await authApi.login(email, password);
      
      if (response.success && response.data) {
        localStorage.setItem('edunova_token', response.data.token);
        localStorage.setItem('edunova_user', JSON.stringify(response.data.user));
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemoCredentials = (role: 'admin' | 'school') => {
    if (role === 'admin') {
      setEmail('admin@adanifoundation.org');
    } else {
      setEmail('coordinator1@edunova.in');
    }
    setPassword('password');
  };

  const features = [
    { icon: Shield, label: 'Secure Authentication', desc: 'Enterprise-grade security' },
    { icon: Globe, label: '40+ Schools', desc: 'Centralized monitoring' },
    { icon: Users, label: 'Real-time Tracking', desc: 'Live attendance & timetable' },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex relative overflow-hidden">
      <ParticleBackground />

      {/* Gradient orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full opacity-20"
        style={{ background: 'radial-gradient(circle, #6c63ff20, transparent 70%)' }} />
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full opacity-20"
        style={{ background: 'radial-gradient(circle, #3b82f620, transparent 70%)' }} />

      {/* Left Panel - Branding */}
      <motion.div 
        className="hidden lg:flex flex-col justify-between w-1/2 p-12 relative z-10"
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      >
        <div>
          <div className="flex items-center gap-3 mb-16">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #6c63ff, #3b82f6)', boxShadow: '0 0 30px #6c63ff30' }}>
              <Zap size={26} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold gradient-text">EduNova</h1>
              <p className="text-xs text-[#5a5a70] tracking-widest uppercase">Education OS</p>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            <h2 className="text-5xl font-bold text-white leading-tight mb-6">
              The Future of
              <br />
              <span className="gradient-text">Education Management</span>
            </h2>
            <p className="text-lg text-[#8b8b9e] max-w-md leading-relaxed">
              AI-powered centralized operating system for monitoring timetables, 
              attendance, and performance across 40+ schools managed by Adani Foundation.
            </p>
          </motion.div>
        </div>

        <motion.div 
          className="space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
        >
          {features.map((feature, i) => (
            <motion.div
              key={feature.label}
              className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 + i * 0.1 }}
              whileHover={{ x: 8, background: 'rgba(255,255,255,0.05)' }}
            >
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-[#6c63ff15]">
                <feature.icon size={20} className="text-[#6c63ff]" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">{feature.label}</p>
                <p className="text-xs text-[#5a5a70]">{feature.desc}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      {/* Right Panel - Login Form */}
      <motion.div 
        className="flex-1 flex items-center justify-center p-6 relative z-10"
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #6c63ff, #3b82f6)' }}>
              <Zap size={22} className="text-white" />
            </div>
            <h1 className="text-xl font-bold gradient-text">EduNova</h1>
          </div>

          <motion.div
            className="glass-card p-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">Welcome back</h2>
              <p className="text-sm text-[#8b8b9e]">Sign in to access your dashboard</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 rounded-lg bg-[#f43f5e15] border border-[#f43f5e30] text-[#f43f5e] text-sm"
                >
                  {error}
                </motion.div>
              )}

              <div>
                <label className="block text-xs font-medium text-[#8b8b9e] mb-2 uppercase tracking-wider">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-dark"
                  placeholder="admin@adanifoundation.org"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#8b8b9e] mb-2 uppercase tracking-wider">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-dark pr-10"
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5a5a70] hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <motion.button
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full flex items-center justify-center gap-2 py-3"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Sign In
                    <ArrowRight size={18} />
                  </>
                )}
              </motion.button>
            </form>

            {/* Demo Credentials */}
            <div className="mt-8 pt-6 border-t border-white/5">
              <p className="text-xs text-[#5a5a70] mb-3 text-center uppercase tracking-wider">Quick Access (Demo)</p>
              <div className="grid grid-cols-2 gap-3">
                <motion.button
                  onClick={() => fillDemoCredentials('admin')}
                  className="p-3 rounded-xl bg-[#6c63ff08] border border-[#6c63ff20] text-center hover:bg-[#6c63ff15] transition-all"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <Shield size={18} className="text-[#6c63ff] mx-auto mb-1" />
                  <p className="text-xs font-medium text-white">Admin</p>
                  <p className="text-[10px] text-[#5a5a70]">Foundation HQ</p>
                </motion.button>
                <motion.button
                  onClick={() => fillDemoCredentials('school')}
                  className="p-3 rounded-xl bg-[#3b82f608] border border-[#3b82f620] text-center hover:bg-[#3b82f615] transition-all"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <Globe size={18} className="text-[#3b82f6] mx-auto mb-1" />
                  <p className="text-xs font-medium text-white">School</p>
                  <p className="text-[10px] text-[#5a5a70]">Coordinator</p>
                </motion.button>
              </div>
            </div>
          </motion.div>

          <p className="text-center text-xs text-[#5a5a70] mt-6">
            Powered by Adani Foundation © {new Date().getFullYear()}
          </p>
        </div>
      </motion.div>
    </div>
  );
}
