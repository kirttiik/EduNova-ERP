"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { schoolsApi } from '@/lib/api';
import { TableSkeleton } from '@/components/ui/LoadingSkeleton';
import { useToast } from '@/components/ui/Toast';
import {
  School, Search, MapPin, Users, UserCheck, TrendingUp,
  MoreVertical, Plus, Filter, ChevronDown
} from 'lucide-react';

/**
 * Schools Management Page (Admin Only)
 * 
 * Displays all schools with search, filtering,
 * and real-time attendance stats per school.
 */

export default function SchoolsPage() {
  const [schools, setSchools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const { showToast } = useToast();
  const router = useRouter();

  useEffect(() => {
    loadSchools();
  }, []);

  const loadSchools = async () => {
    try {
      const response = await schoolsApi.getAll({ search });
      if (response.success) {
        setSchools(response.data || []);
      }
    } catch (error: any) {
      showToast(error.message || 'Failed to load schools', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadSchools();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const filteredSchools = schools;

  if (loading) return <TableSkeleton rows={8} />;

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
            <School className="text-[#6c63ff]" size={28} />
            Schools Directory
          </h1>
          <p className="text-sm text-[#8b8b9e] mt-1">
            Managing {schools.length} institutions across India
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5a5a70]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search schools..."
              className="input-dark pl-10 w-[250px]"
            />
          </div>
          <div className="flex rounded-xl border border-white/10 overflow-hidden">
            <button
              onClick={() => setView('grid')}
              className={`px-3 py-2 text-sm ${view === 'grid' ? 'bg-[#6c63ff20] text-[#6c63ff]' : 'text-[#5a5a70] hover:text-white'} transition-all`}
            >
              Grid
            </button>
            <button
              onClick={() => setView('list')}
              className={`px-3 py-2 text-sm ${view === 'list' ? 'bg-[#6c63ff20] text-[#6c63ff]' : 'text-[#5a5a70] hover:text-white'} transition-all`}
            >
              List
            </button>
          </div>
        </div>
      </motion.div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Schools', value: schools.length, color: '#6c63ff' },
          { label: 'Total Staff', value: schools.reduce((s, sc) => s + (sc.totalStaff || 0), 0), color: '#3b82f6' },
          { label: 'Avg Attendance', value: `${schools.length > 0 ? Math.round(schools.reduce((s, sc) => s + (sc.todayAttendance || 0), 0) / schools.length) : 0}%`, color: '#10b981' },
          { label: 'Teachers', value: schools.reduce((s, sc) => s + (sc.totalTeachers || 0), 0), color: '#f59e0b' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            className="glass-card p-4 text-center"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <p className="text-xs text-[#5a5a70] uppercase tracking-wider mb-1">{stat.label}</p>
            <p className="text-2xl font-bold" style={{ color: stat.color }}>{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Schools Grid */}
      {view === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {filteredSchools.map((school, i) => (
              <motion.div
                key={school.id}
                className="glass-card glass-card-hover p-5 cursor-pointer group"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.03 }}
                whileHover={{ y: -4 }}
                onClick={() => router.push(`/dashboard/workloads?schoolId=${school.id}`)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[#6c63ff15]">
                      <School size={20} className="text-[#6c63ff]" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white group-hover:text-[#6c63ff] transition-colors">
                        {school.name}
                      </h3>
                      <div className="flex items-center gap-1 mt-0.5">
                        <MapPin size={12} className="text-[#5a5a70]" />
                        <span className="text-xs text-[#5a5a70]">{school.location}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-2 rounded-lg bg-white/[0.03]">
                    <p className="text-lg font-bold text-[#3b82f6]">{school.totalStaff || 0}</p>
                    <p className="text-[10px] text-[#5a5a70] uppercase">Staff</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-white/[0.03]">
                    <p className="text-lg font-bold text-[#10b981]">{school.presentToday || 0}</p>
                    <p className="text-[10px] text-[#5a5a70] uppercase">Present</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-white/[0.03]">
                    <p className="text-lg font-bold text-[#f43f5e]">{school.absentToday || 0}</p>
                    <p className="text-[10px] text-[#5a5a70] uppercase">Absent</p>
                  </div>
                </div>

                {/* Attendance bar */}
                <div className="mt-4">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-[#8b8b9e]">Today&apos;s Attendance</span>
                    <span className="text-white font-medium">{school.todayAttendance || 0}%</span>
                  </div>
                  <div className="w-full bg-white/5 rounded-full h-1.5">
                    <motion.div
                      className="h-full rounded-full"
                      style={{
                        background: (school.todayAttendance || 0) > 80 
                          ? 'linear-gradient(90deg, #10b981, #06b6d4)' 
                          : (school.todayAttendance || 0) > 60 
                            ? 'linear-gradient(90deg, #f59e0b, #f97316)'
                            : 'linear-gradient(90deg, #f43f5e, #ec4899)'
                      }}
                      initial={{ width: 0 }}
                      animate={{ width: `${school.todayAttendance || 0}%` }}
                      transition={{ duration: 1, delay: 0.5 + i * 0.05 }}
                    />
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        /* List View */
        <motion.div
          className="glass-card overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>School Name</th>
                  <th>Location</th>
                  <th>Staff</th>
                  <th>Teachers</th>
                  <th>Present</th>
                  <th>Absent</th>
                  <th>Attendance %</th>
                </tr>
              </thead>
              <tbody>
                {filteredSchools.map((school) => (
                  <tr 
                    key={school.id} 
                    className="hover:bg-white/[0.02] cursor-pointer"
                    onClick={() => router.push(`/dashboard/workloads?schoolId=${school.id}`)}
                  >
                    <td>
                      <div className="flex items-center gap-2">
                        <School size={16} className="text-[#6c63ff]" />
                        <span className="font-medium text-white">{school.name}</span>
                      </div>
                    </td>
                    <td className="text-[#8b8b9e]">{school.location}</td>
                    <td className="text-white">{school.totalStaff || 0}</td>
                    <td className="text-white">{school.totalTeachers || 0}</td>
                    <td>
                      <span className="text-[#10b981] font-medium">{school.presentToday || 0}</span>
                    </td>
                    <td>
                      <span className="text-[#f43f5e] font-medium">{school.absentToday || 0}</span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-white/5 rounded-full h-1.5">
                          <div
                            className="h-full rounded-full bg-[#10b981]"
                            style={{ width: `${school.todayAttendance || 0}%` }}
                          />
                        </div>
                        <span className="text-white text-sm font-medium">{school.todayAttendance || 0}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {filteredSchools.length === 0 && (
        <motion.div
          className="text-center py-20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <School size={48} className="text-[#5a5a70] mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No schools found</h3>
          <p className="text-[#8b8b9e] text-sm">Try adjusting your search filters</p>
        </motion.div>
      )}
    </div>
  );
}
