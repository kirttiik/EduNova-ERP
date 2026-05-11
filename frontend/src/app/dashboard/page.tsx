"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { analyticsApi } from '@/lib/api';
import { DashboardSkeleton } from '@/components/ui/LoadingSkeleton';
import KPICard from '@/components/dashboard/KPICard';
import {
  School, Users, UserCheck, UserX, CalendarDays, BarChart3, 
  Activity, Bell, TrendingUp, Clock, BookOpen, AlertTriangle
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

/**
 * Main Dashboard Overview Page
 * 
 * Displays KPI cards, attendance trends, charts, and activity feed.
 * Full animated analytics dashboard with real-time data.
 */

const CHART_COLORS = ['#6c63ff', '#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

// Custom chart tooltip
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload) return null;
  return (
    <div className="glass-card p-3 border border-white/10 text-sm">
      <p className="text-[#8b8b9e] text-xs mb-1">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} className="text-white font-medium" style={{ color: entry.color }}>
          {entry.name}: {entry.value}{typeof entry.value === 'number' && entry.name?.includes('ercentage') ? '%' : ''}
        </p>
      ))}
    </div>
  );
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const response = await analyticsApi.getDashboard();
      if (response.success) {
        setData(response.data);
      }
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <DashboardSkeleton />;
  if (!data) return <div className="text-center text-[#5a5a70] py-20">Failed to load dashboard data</div>;

  const { overview, attendanceTrend, subjectDistribution, designationDistribution, levelDistribution, topSchools, recentActivity } = data;

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            Welcome back, <span className="gradient-text">{user?.name?.split(' ')[0]}</span>
          </h1>
          <p className="text-sm text-[#8b8b9e] mt-1">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <motion.div
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#10b98115] border border-[#10b98130]"
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <div className="status-dot active" />
            <span className="text-sm text-[#10b981] font-medium">System Online</span>
          </motion.div>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Schools"
          value={overview.totalSchools}
          subtitle="Active institutions"
          icon={School}
          gradient="linear-gradient(135deg, #6c63ff, #8b5cf6)"
          delay={0}
        />
        <KPICard
          title="Total Staff"
          value={overview.totalStaff}
          subtitle={`${overview.totalTeachers} teachers · ${overview.totalNonTeaching} non-teaching`}
          icon={Users}
          gradient="linear-gradient(135deg, #3b82f6, #06b6d4)"
          delay={0.1}
        />
        <KPICard
          title="Attendance Rate"
          value={`${overview.attendanceRate}%`}
          subtitle={`${overview.presentToday} present today`}
          icon={UserCheck}
          trend={{ value: 3.2, isPositive: true }}
          gradient="linear-gradient(135deg, #10b981, #06b6d4)"
          delay={0.2}
        />
        <KPICard
          title="Active Classes"
          value={overview.activeClasses}
          subtitle="Classes running today"
          icon={BookOpen}
          gradient="linear-gradient(135deg, #f59e0b, #f97316)"
          delay={0.3}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Attendance Trend Chart */}
        <motion.div
          className="glass-card p-6 lg:col-span-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-white">Attendance Trend</h3>
              <p className="text-xs text-[#5a5a70]">Last 7 days overview</p>
            </div>
            <TrendingUp size={20} className="text-[#10b981]" />
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={attendanceTrend}>
              <defs>
                <linearGradient id="gradPresent" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradAbsent" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
              <XAxis dataKey="day" tick={{ fill: '#5a5a70', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#5a5a70', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="present" stroke="#10b981" fill="url(#gradPresent)" strokeWidth={2} name="Present" />
              <Area type="monotone" dataKey="absent" stroke="#f43f5e" fill="url(#gradAbsent)" strokeWidth={2} name="Absent" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Subject Distribution */}
        <motion.div
          className="glass-card p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-white">Subject Distribution</h3>
              <p className="text-xs text-[#5a5a70]">Classes by subject</p>
            </div>
            <BookOpen size={20} className="text-[#6c63ff]" />
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={subjectDistribution}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={3}
                dataKey="value"
              >
                {subjectDistribution.map((_: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {subjectDistribution.slice(0, 6).map((item: any, i: number) => (
              <div key={item.name} className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: CHART_COLORS[i] }} />
                <span className="text-xs text-[#8b8b9e] truncate">{item.name}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Designation Distribution */}
        <motion.div
          className="glass-card p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <h3 className="text-lg font-semibold text-white mb-1">Staff by Designation</h3>
          <p className="text-xs text-[#5a5a70] mb-6">Staff role distribution</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={designationDistribution.slice(0, 8)} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff06" horizontal={false} />
              <XAxis type="number" tick={{ fill: '#5a5a70', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" width={80} tick={{ fill: '#8b8b9e', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" fill="#6c63ff" radius={[0, 6, 6, 0]} name="Count">
                {designationDistribution.slice(0, 8).map((_: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Top Schools */}
        <motion.div
          className="glass-card p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <h3 className="text-lg font-semibold text-white mb-1">Top Schools</h3>
          <p className="text-xs text-[#5a5a70] mb-6">Highest attendance today</p>
          <div className="space-y-4">
            {topSchools.map((school: any, i: number) => (
              <motion.div 
                key={i}
                className="flex items-center gap-3"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 + i * 0.1 }}
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
                  style={{ background: `${CHART_COLORS[i]}20`, color: CHART_COLORS[i] }}>
                  #{i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{school.name}</p>
                  <div className="w-full bg-white/5 rounded-full h-1.5 mt-1.5">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: CHART_COLORS[i] }}
                      initial={{ width: 0 }}
                      animate={{ width: `${school.percentage}%` }}
                      transition={{ duration: 1, delay: 0.9 + i * 0.1 }}
                    />
                  </div>
                </div>
                <span className="text-sm font-medium text-white">{school.percentage}%</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          className="glass-card p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-white">Activity Feed</h3>
              <p className="text-xs text-[#5a5a70]">Recent system activity</p>
            </div>
            <Activity size={20} className="text-[#8b5cf6]" />
          </div>
          <div className="space-y-4">
            {recentActivity.map((activity: any, i: number) => {
              const iconMap: Record<string, any> = {
                attendance: UserCheck,
                staff: Users,
                timetable: CalendarDays,
                alert: AlertTriangle,
                school: School
              };
              const colorMap: Record<string, string> = {
                attendance: '#10b981',
                staff: '#3b82f6',
                timetable: '#6c63ff',
                alert: '#f59e0b',
                school: '#06b6d4'
              };
              const ActivityIcon = iconMap[activity.type] || Activity;
              const color = colorMap[activity.type] || '#6c63ff';
              
              return (
                <motion.div
                  key={activity.id}
                  className="flex items-start gap-3 p-3 rounded-xl hover:bg-white/[0.03] transition-all cursor-pointer group"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9 + i * 0.1 }}
                  whileHover={{ x: 4 }}
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: `${color}15` }}>
                    <ActivityIcon size={16} style={{ color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-medium">{activity.action}</p>
                    <p className="text-xs text-[#5a5a70] truncate">{activity.school}</p>
                  </div>
                  <span className="text-xs text-[#5a5a70] flex-shrink-0">{activity.time}</span>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* Level Distribution */}
      <motion.div
        className="glass-card p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
      >
        <h3 className="text-lg font-semibold text-white mb-1">Staff Level Distribution</h3>
        <p className="text-xs text-[#5a5a70] mb-6">Personnel across all levels</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {levelDistribution.map((level: any, i: number) => (
            <motion.div
              key={level.name}
              className="text-center p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-[#6c63ff30] transition-all"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1 + i * 0.05 }}
              whileHover={{ scale: 1.05, y: -2 }}
            >
              <div className="text-2xl font-bold gradient-text mb-1">{level.value}</div>
              <div className="text-sm text-[#8b8b9e] font-medium">{level.name}</div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
