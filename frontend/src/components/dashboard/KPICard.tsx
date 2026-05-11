"use client";

import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

/**
 * KPI Card Component
 * 
 * Animated glass card displaying key performance metrics.
 * Features gradient accent, shimmer effect, and hover animations.
 */

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: { value: number; isPositive: boolean };
  gradient: string; // CSS gradient string
  delay?: number;
}

export default function KPICard({ title, value, subtitle, icon: Icon, trend, gradient, delay = 0 }: KPICardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4, scale: 1.02 }}
      className="glass-card glass-card-hover p-5 relative overflow-hidden group"
    >
      {/* Gradient accent line at top */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px]"
        style={{ background: gradient }}
      />

      {/* Background glow effect */}
      <div
        className="absolute -top-20 -right-20 w-40 h-40 rounded-full opacity-0 group-hover:opacity-20 transition-opacity duration-700"
        style={{ background: gradient, filter: 'blur(40px)' }}
      />

      <div className="flex items-start justify-between relative z-10">
        <div className="flex-1">
          <p className="text-xs font-medium text-[#5a5a70] uppercase tracking-wider mb-2">{title}</p>
          <motion.p
            className="text-3xl font-bold text-white mb-1"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: delay + 0.2 }}
          >
            {value}
          </motion.p>
          {subtitle && (
            <p className="text-xs text-[#8b8b9e] mt-1">{subtitle}</p>
          )}
          {trend && (
            <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${trend.isPositive ? 'text-[#10b981]' : 'text-[#f43f5e]'}`}>
              <span>{trend.isPositive ? '↑' : '↓'}</span>
              <span>{Math.abs(trend.value)}% from last week</span>
            </div>
          )}
        </div>

        <motion.div
          className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{
            background: `${gradient.replace('135deg', '135deg').replace(')', ', 0.15)')}`,
          }}
          whileHover={{ rotate: 15 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          <Icon size={22} style={{ color: gradient.includes('#') ? gradient.split(',')[0].split('#')[1]?.replace(')', '') ? `#${gradient.split('#')[1]?.slice(0, 6)}` : '#6c63ff' : '#6c63ff' }} />
        </motion.div>
      </div>

      {/* Shimmer effect */}
      <div className="shimmer absolute inset-0 pointer-events-none" />
    </motion.div>
  );
}
