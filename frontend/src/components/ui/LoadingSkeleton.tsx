"use client";

import { motion } from 'framer-motion';

/**
 * Loading Skeleton Component
 * 
 * Animated shimmer loading placeholder for various content types.
 */

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'card' | 'circle' | 'rectangular';
  width?: string | number;
  height?: string | number;
  count?: number;
}

function SkeletonLine({ className, width, height }: { className?: string; width?: string | number; height?: string | number }) {
  return (
    <div
      className={`relative overflow-hidden rounded-lg bg-white/5 ${className || ''}`}
      style={{ width: width || '100%', height: height || '16px' }}
    >
      <motion.div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)',
        }}
        animate={{
          x: ['-100%', '100%'],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="glass-card p-5 space-y-4">
      <SkeletonLine height={12} width="40%" />
      <SkeletonLine height={32} width="60%" />
      <SkeletonLine height={10} width="80%" />
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="glass-card p-4 space-y-3">
      <div className="flex gap-4 pb-3 border-b border-white/5">
        {[1, 2, 3, 4, 5].map(i => (
          <SkeletonLine key={i} height={12} width={`${Math.random() * 60 + 40}px`} />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 py-2">
          {[1, 2, 3, 4, 5].map(j => (
            <SkeletonLine key={j} height={14} width={`${Math.random() * 80 + 60}px`} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 p-6 animate-pulse">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <CardSkeleton key={i} />
        ))}
      </div>
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass-card p-6">
          <SkeletonLine height={12} width="30%" className="mb-4" />
          <SkeletonLine height={200} />
        </div>
        <div className="glass-card p-6">
          <SkeletonLine height={12} width="30%" className="mb-4" />
          <SkeletonLine height={200} />
        </div>
      </div>
    </div>
  );
}

export default SkeletonLine;
