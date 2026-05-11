"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { timetableApi, schoolsApi, staffApi } from '@/lib/api';
import { TableSkeleton } from '@/components/ui/LoadingSkeleton';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/context/AuthContext';
import {
  CalendarDays, Search, Filter, Plus, Clock, BookOpen, User, MapPin, X
} from 'lucide-react';

export default function TimetablePage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  
  const [entries, setEntries] = useState<any[]>([]);
  const [schools, setSchools] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [filterSchool, setFilterSchool] = useState('all');
  const [filterDay, setFilterDay] = useState(new Date().toLocaleDateString('en-US', { weekday: 'long' }));
  const [filterTeacher, setFilterTeacher] = useState('all');
  
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ teacherId: '', className: '', section: '', subject: '', day: days[0], timeSlot: '' });
  const [submitting, setSubmitting] = useState(false);
  
  const { showToast } = useToast();


  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    loadTimetable();
    if (isAdmin && filterSchool !== 'all') {
      loadTeachersForSchool(filterSchool);
    } else if (!isAdmin) {
      loadTeachersForSchool(user?.schoolId || '');
    }
  }, [filterSchool, filterDay, filterTeacher]);

  const loadInitialData = async () => {
    if (isAdmin) {
      try {
        const res = await schoolsApi.getAll();
        if (res.success) setSchools(res.data || []);
      } catch (error) {
        console.error(error);
      }
    } else if (user?.schoolId) {
      loadTeachersForSchool(user.schoolId);
    }
    loadTimetable();
  };

  const loadTeachersForSchool = async (schoolId: string) => {
    try {
      const res = await staffApi.getAll({ schoolId, type: 'teaching' });
      if (res.success) setTeachers(res.data || []);
    } catch (error) {
      console.error(error);
    }
  };

  const loadTimetable = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (filterDay !== 'all') params.day = filterDay;
      if (isAdmin && filterSchool !== 'all') params.schoolId = filterSchool;
      if (filterTeacher !== 'all') params.teacherId = filterTeacher;

      const res = await timetableApi.getAll(params);
      if (res.success) {
        setEntries(res.data || []);
      }
    } catch (error: any) {
      showToast(error.message || 'Failed to load timetable', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const selectedTeacher = teachers.find(t => t.id === formData.teacherId);
      const payload = {
        ...formData,
        teacherName: selectedTeacher?.name || ''
      };
      const response = await timetableApi.create(payload);
      if (response.success) {
        showToast('Schedule added successfully', 'success');
        setShowModal(false);
        setFormData({ teacherId: '', className: '', section: '', subject: '', day: days[0], timeSlot: '' });
        loadTimetable();
      }
    } catch (error: any) {
      showToast(error.message || 'Failed to add schedule', 'error');
    } finally {
      setSubmitting(false);
    }
  };

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
            <CalendarDays className="text-[#8b5cf6]" size={28} />
            Timetable Mapping
          </h1>
          <p className="text-sm text-[#8b8b9e] mt-1">
            View and manage class schedules across schools
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {isAdmin && (
            <select
              value={filterSchool}
              onChange={(e) => {
                setFilterSchool(e.target.value);
                setFilterTeacher('all');
              }}
              className="input-dark w-auto py-2"
            >
              <option value="all">All Schools</option>
              {schools.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          )}

          <select
            value={filterDay}
            onChange={(e) => setFilterDay(e.target.value)}
            className="input-dark w-auto py-2"
          >
            <option value="all">All Days</option>
            {days.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          {((isAdmin && filterSchool !== 'all') || !isAdmin) && (
            <select
              value={filterTeacher}
              onChange={(e) => setFilterTeacher(e.target.value)}
              className="input-dark w-auto py-2"
            >
              <option value="all">All Teachers</option>
              {teachers.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          )}

          {!isAdmin && (
            <button 
              onClick={() => setShowModal(true)}
              className="btn-primary flex items-center gap-2 py-2"
            >
              <Plus size={16} />
              Add Schedule
            </button>
          )}
        </div>
      </motion.div>

      {/* Timetable Grid */}
      <div className="glass-card p-6 min-h-[400px]">
        {loading ? (
          <TableSkeleton rows={6} />
        ) : entries.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <AnimatePresence>
              {entries.map((entry, i) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.05 }}
                  className="p-4 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] transition-colors group"
                >
                  <div className="flex items-center justify-between mb-3 border-b border-white/5 pb-3">
                    <div className="flex items-center gap-2">
                      <Clock size={14} className="text-[#8b5cf6]" />
                      <span className="text-sm font-medium text-white">{entry.timeSlot}</span>
                    </div>
                    <span className="text-xs text-[#5a5a70] uppercase">{entry.day}</span>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#3b82f615] flex items-center justify-center flex-shrink-0 mt-0.5">
                        <BookOpen size={14} className="text-[#3b82f6]" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white group-hover:text-[#3b82f6] transition-colors">{entry.subject}</p>
                        <p className="text-xs text-[#8b8b9e]">{entry.className} {entry.section ? `- Sec ${entry.section}` : ''}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#10b98115] flex items-center justify-center flex-shrink-0 mt-0.5">
                        <User size={14} className="text-[#10b981]" />
                      </div>
                      <div>
                        <p className="text-sm text-white">{entry.teacherName}</p>
                        <p className="text-[10px] text-[#5a5a70] uppercase">Teacher</p>
                      </div>
                    </div>

                    {isAdmin && (
                      <div className="flex items-start gap-3 pt-2 border-t border-white/5">
                        <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
                          <MapPin size={12} className="text-[#5a5a70]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-[#8b8b9e] truncate" title={entry.schoolName}>{entry.schoolName}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="text-center py-20">
            <CalendarDays size={48} className="text-[#5a5a70] mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No schedules found</h3>
            <p className="text-[#8b8b9e] text-sm">Try selecting a different day or school</p>
          </div>
        )}
      </div>

      {/* Add Schedule Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
              onClick={() => setShowModal(false)} 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="glass-card w-full max-w-md p-6 relative z-10"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Add Class Schedule</h2>
                <button onClick={() => setShowModal(false)} className="text-[#5a5a70] hover:text-white">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleAddSchedule} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-[#8b8b9e] mb-1 uppercase">Teacher</label>
                  <select required value={formData.teacherId} onChange={e => setFormData({...formData, teacherId: e.target.value})} className="input-dark">
                    <option value="" disabled>Select Teacher</option>
                    {teachers.map(t => (
                      <option key={t.id} value={t.id}>{t.name} ({t.subject || t.designation})</option>
                    ))}
                  </select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-[#8b8b9e] mb-1 uppercase">Class Name</label>
                    <input type="text" required value={formData.className} onChange={e => setFormData({...formData, className: e.target.value})} className="input-dark" placeholder="e.g. 10th" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#8b8b9e] mb-1 uppercase">Section</label>
                    <input type="text" value={formData.section} onChange={e => setFormData({...formData, section: e.target.value})} className="input-dark" placeholder="e.g. A" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#8b8b9e] mb-1 uppercase">Subject Taught</label>
                  <input type="text" required value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} className="input-dark" placeholder="e.g. Science" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-[#8b8b9e] mb-1 uppercase">Day</label>
                    <select value={formData.day} onChange={e => setFormData({...formData, day: e.target.value})} className="input-dark">
                      {days.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#8b8b9e] mb-1 uppercase">Time Slot</label>
                    <input type="text" required value={formData.timeSlot} onChange={e => setFormData({...formData, timeSlot: e.target.value})} className="input-dark" placeholder="09:00 AM - 10:00 AM" />
                  </div>
                </div>

                <div className="pt-4 flex justify-end gap-3">
                  <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                  <button type="submit" disabled={submitting} className="btn-primary">
                    {submitting ? 'Saving...' : 'Save Schedule'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
