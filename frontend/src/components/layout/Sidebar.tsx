"use client";

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  ClipboardCheck,
  BarChart3,
  School,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Zap,
  Menu,
  X,
  UserCircle,
  Shapes
} from 'lucide-react';

/**
 * Dashboard Sidebar
 * 
 * Animated, collapsible sidebar with role-based navigation.
 * Shows different menu items for admin vs school coordinator.
 */

interface NavItem {
  label: string;
  icon: React.ReactNode;
  href: string;
  badge?: string;
}

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const isAdmin = user?.role === 'admin';

  // Navigation items based on role
  const adminNav: NavItem[] = [
    { label: 'Dashboard', icon: <LayoutDashboard size={20} />, href: '/dashboard' },
    { label: 'Schools', icon: <School size={20} />, href: '/dashboard/schools' },
    { label: 'Workloads', icon: <Shapes size={20} />, href: '/dashboard/workloads' },
    { label: 'Attendance', icon: <ClipboardCheck size={20} />, href: '/dashboard/attendance' },
  ];

  const schoolNav: NavItem[] = [
    { label: 'Dashboard', icon: <LayoutDashboard size={20} />, href: '/dashboard' },
    { label: 'Timetable', icon: <CalendarDays size={20} />, href: '/dashboard/timetable' },
    { label: 'Workloads', icon: <Shapes size={20} />, href: '/dashboard/workloads' },
    { label: 'Attendance', icon: <ClipboardCheck size={20} />, href: '/dashboard/attendance' },
  ];

  const navItems = isAdmin ? adminNav : schoolNav;

  const handleNavigation = (href: string) => {
    router.push(href);
    setMobileOpen(false);
  };

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo Section */}
      <div className="p-4 flex items-center gap-3 border-b border-white/5">
        <motion.div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{
            background: 'linear-gradient(135deg, #6c63ff, #3b82f6)',
            boxShadow: '0 0 20px #6c63ff30'
          }}
          whileHover={{ scale: 1.05 }}
          transition={{ type: 'spring', stiffness: 400 }}
        >
          <Zap size={22} className="text-white" />
        </motion.div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              className="overflow-hidden whitespace-nowrap"
            >
              <h1 className="text-lg font-bold gradient-text">EduNova</h1>
              <p className="text-[10px] text-[#5a5a70] tracking-wider uppercase">
                {isAdmin ? 'Admin Portal' : 'School Portal'}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <motion.button
              key={item.href}
              onClick={() => handleNavigation(item.href)}
              className={`
                w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                transition-all duration-200 relative group
                ${isActive
                  ? 'text-white'
                  : 'text-[#8b8b9e] hover:text-white hover:bg-white/5'
                }
              `}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Active indicator */}
              {isActive && (
                <motion.div
                  layoutId="activeNav"
                  className="absolute inset-0 rounded-xl"
                  style={{
                    background: 'linear-gradient(135deg, #6c63ff15, #3b82f610)',
                    border: '1px solid #6c63ff30',
                  }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
              
              <span className="relative z-10 flex-shrink-0">{item.icon}</span>
              
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    className="relative z-10 overflow-hidden whitespace-nowrap"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>

              {item.badge && !collapsed && (
                <span className="ml-auto bg-[#f43f5e] text-white text-xs px-2 py-0.5 rounded-full relative z-10">
                  {item.badge}
                </span>
              )}
            </motion.button>
          );
        })}
      </nav>

      {/* User Profile Section */}
      <div className="p-3 border-t border-white/5">
        <div className={`flex items-center gap-3 p-2 rounded-xl bg-white/3 ${collapsed ? 'justify-center' : ''}`}>
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold"
            style={{
              background: 'linear-gradient(135deg, #8b5cf6, #6c63ff)',
            }}
          >
            {user?.name?.charAt(0) || 'U'}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.name}</p>
              <p className="text-xs text-[#5a5a70] truncate">{user?.email}</p>
            </div>
          )}
        </div>

        <motion.button
          onClick={handleLogout}
          className={`
            w-full flex items-center gap-3 px-3 py-2.5 mt-2 rounded-xl text-sm
            text-[#8b8b9e] hover:text-[#f43f5e] hover:bg-[#f43f5e10]
            transition-all duration-200
            ${collapsed ? 'justify-center' : ''}
          `}
          whileHover={{ x: 4 }}
          whileTap={{ scale: 0.98 }}
        >
          <LogOut size={18} />
          {!collapsed && <span>Logout</span>}
        </motion.button>
      </div>

      {/* Collapse Button (desktop) */}
      <div className="p-3 border-t border-white/5 hidden md:block">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center p-2 rounded-xl text-[#5a5a70] hover:text-white hover:bg-white/5 transition-all"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Menu Toggle */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed top-4 left-4 z-50 md:hidden p-2 rounded-xl bg-[#12121a] border border-white/10 text-white"
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 left-0 h-screen w-[260px] bg-[#0d0d14] border-r border-white/5 z-50 md:hidden"
          >
            <SidebarContent />
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 72 : 260 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="hidden md:flex flex-col h-screen bg-[#0d0d14]/80 backdrop-blur-xl border-r border-white/5 sticky top-0 flex-shrink-0"
      >
        <SidebarContent />
      </motion.aside>
    </>
  );
}
