"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { staffApi, schoolsApi } from '@/lib/api';
import { TableSkeleton } from '@/components/ui/LoadingSkeleton';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/context/AuthContext';
import {
  Users, Search, Filter, Plus, MoreVertical, Edit, Trash2, X,
  MapPin, CheckCircle, AlertCircle, Calendar, BookOpen, Clock
} from 'lucide-react';
import { timetableApi } from '@/lib/api';

export default function StaffPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  
  const [staffList, setStaffList] = useState<any[]>([]);
  const [schools, setSchools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterSchool, setFilterSchool] = useState('all');
  
  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', designation: '', level: 'L1', type: 'teaching', subject: '', phone: '' });
  const [submitting, setSubmitting] = useState(false);

  // Workload Modal State
  const [workloadModal, setWorkloadModal] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<any>(null);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [teacherWorkload, setTeacherWorkload] = useState<any>({});
  const [loadingWorkload, setLoadingWorkload] = useState(false);
  
  // Subject Workload Modal State
  const [subjectModal, setSubjectModal] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [subjectWorkload, setSubjectWorkload] = useState<any>({});
  const [loadingSubject, setLoadingSubject] = useState(false);
  
  const { showToast } = useToast();

  useEffect(() => {
    loadData();
  }, [filterType, filterSchool]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const loadData = async () => {
    try {
      setLoading(true);
      const params: any = { search };
      if (filterType !== 'all') params.type = filterType;
      if (isAdmin && filterSchool !== 'all') params.schoolId = filterSchool;

      const [staffRes, schoolsRes] = await Promise.all([
        staffApi.getAll(params),
        isAdmin ? schoolsApi.getAll() : Promise.resolve({ success: true, data: [] })
      ]);

      if (staffRes.success) {
        setStaffList(staffRes.data || []);
      }
      if (schoolsRes.success) {
        setSchools(schoolsRes.data || []);
      }
    } catch (error: any) {
      showToast(error.message || 'Failed to load staff data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this staff member?')) return;
    
    try {
      const response = await staffApi.delete(id);
      if (response.success) {
        showToast('Staff member deleted successfully', 'success');
        loadData();
      }
    } catch (error: any) {
      showToast(error.message || 'Failed to delete staff member', 'error');
    }
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const response = await staffApi.create(formData);
      if (response.success) {
        showToast('Staff added successfully', 'success');
        setShowModal(false);
        setFormData({ name: '', designation: '', level: 'L1', type: 'teaching', subject: '', phone: '' });
        loadData();
      }
    } catch (error: any) {
      showToast(error.message || 'Failed to add staff', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const openWorkload = async (teacher: any) => {
    setSelectedTeacher(teacher);
    setWorkloadModal(true);
    setLoadingWorkload(true);
    try {
      const res = await timetableApi.getTeacherTimetable(teacher.id);
      if (res.success) {
        setTeacherWorkload(res.data?.grouped || {});
      }
    } catch (error) {
      showToast('Failed to load teacher workload', 'error');
    } finally {
      setLoadingWorkload(false);
    }
  };

  const openSubjectWorkload = async (subject: string) => {
    setSelectedSubject(subject);
    setSubjectModal(true);
    setLoadingSubject(true);
    try {
      const { timetableApi } = await import('@/lib/api');
      const params: any = { subject };
      if (isAdmin && filterSchool !== 'all') params.schoolId = filterSchool;
      else if (!isAdmin && user?.schoolId) params.schoolId = user.schoolId;

      const res = await timetableApi.getAll(params);
      if (res.success) {
        const grouped: any = {};
        (res.data || []).forEach((entry: any) => {
          if (!grouped[entry.day]) grouped[entry.day] = [];
          grouped[entry.day].push(entry);
        });
        Object.keys(grouped).forEach(day => {
          grouped[day].sort((a: any, b: any) => a.timeSlot.localeCompare(b.timeSlot));
        });
        setSubjectWorkload(grouped);
      }
    } catch (error) {
      showToast('Failed to load subject workload', 'error');
    } finally {
      setLoadingSubject(false);
    }
  };

  const getDatesInRange = (start: string, end: string) => {
    if (!start || !end) return [];
    
    const dateArray = [];
    const [sYear, sMonth, sDay] = start.split('-').map(Number);
    const [eYear, eMonth, eDay] = end.split('-').map(Number);
    
    let currentDate = new Date(sYear, sMonth - 1, sDay);
    const stopDate = new Date(eYear, eMonth - 1, eDay);
    
    if (stopDate < currentDate) return []; // Invalid range
    
    // Limit to max 30 days to prevent browser hanging
    let i = 0;
    while (currentDate <= stopDate && i < 30) {
      dateArray.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
      i++;
    }
    return dateArray;
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
            <Users className="text-[#3b82f6]" size={28} />
            Staff Directory
          </h1>
          <p className="text-sm text-[#8b8b9e] mt-1">
            Manage teaching and non-teaching personnel
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {isAdmin && (
            <select
              value={filterSchool}
              onChange={(e) => setFilterSchool(e.target.value)}
              className="input-dark w-auto py-2"
            >
              <option value="all">All Schools</option>
              {schools.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          )}
          
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="input-dark w-auto py-2"
          >
            <option value="all">All Roles</option>
            <option value="teaching">Teaching Staff</option>
            <option value="non-teaching">Non-Teaching Staff</option>
          </select>

          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5a5a70]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, designation..."
              className="input-dark pl-10 w-[250px] py-2"
            />
          </div>

          {!isAdmin && (
            <button 
              onClick={() => setShowModal(true)}
              className="btn-primary flex items-center gap-2 py-2"
            >
              <Plus size={16} />
              Add Staff
            </button>
          )}
        </div>
      </motion.div>

      {/* Staff List */}
      <div className="glass-card overflow-hidden">
        {loading ? (
          <TableSkeleton rows={8} />
        ) : staffList.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Role Details</th>
                  <th>Type</th>
                  {isAdmin && <th>School</th>}
                  <th>Contact</th>
                  {!isAdmin && <th className="text-right">Actions</th>}
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {staffList.map((staff, i) => (
                    <motion.tr
                      key={staff.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ delay: i * 0.02 }}
                      className="hover:bg-white/[0.02]"
                    >
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                            style={{ background: 'linear-gradient(135deg, #3b82f620, #06b6d420)', color: '#3b82f6' }}>
                            {staff.name.charAt(0)}
                          </div>
                          <div>
                            <p 
                              className={`font-medium text-white transition-colors ${staff.type === 'teaching' ? 'cursor-pointer hover:text-[#3b82f6] underline decoration-[#3b82f6]/50 underline-offset-4' : ''}`}
                              onClick={() => staff.type === 'teaching' && openWorkload(staff)}
                            >
                              {staff.name}
                            </p>
                            <p className="text-xs text-[#8b8b9e]">{staff.id.substring(0, 8)}</p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <p className="text-white text-sm">{staff.designation}</p>
                        <p className="text-xs text-[#5a5a70]">
                          Level {staff.level} 
                          {staff.subject && (
                            <>
                              {' '}•{' '}
                              <span 
                                className="cursor-pointer text-[#8b5cf6] hover:underline decoration-[#8b5cf6]/50 underline-offset-2 transition-colors font-medium"
                                onClick={() => openSubjectWorkload(staff.subject)}
                              >
                                {staff.subject}
                              </span>
                            </>
                          )}
                        </p>
                      </td>
                      <td>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          staff.type === 'teaching' 
                            ? 'bg-[#8b5cf615] text-[#8b5cf6] border border-[#8b5cf630]' 
                            : 'bg-[#06b6d415] text-[#06b6d4] border border-[#06b6d430]'
                        }`}>
                          {staff.type === 'teaching' ? 'Teaching' : 'Non-Teaching'}
                        </span>
                      </td>
                      {isAdmin && (
                        <td>
                          <div className="flex items-center gap-1.5 text-[#8b8b9e] text-sm">
                            <MapPin size={12} className="text-[#5a5a70]" />
                            <span className="truncate max-w-[150px]">{staff.schoolName}</span>
                          </div>
                        </td>
                      )}
                      <td className="text-sm text-[#8b8b9e]">
                        {staff.phone}
                      </td>
                      {!isAdmin && (
                        <td>
                          <div className="flex items-center justify-end gap-2">
                            <button className="p-1.5 text-[#5a5a70] hover:text-[#3b82f6] transition-colors rounded-lg hover:bg-[#3b82f615]">
                              <Edit size={16} />
                            </button>
                            <button 
                              onClick={() => handleDelete(staff.id)}
                              className="p-1.5 text-[#5a5a70] hover:text-[#f43f5e] transition-colors rounded-lg hover:bg-[#f43f5e15]"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      )}
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-20">
            <Users size={48} className="text-[#5a5a70] mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No staff members found</h3>
            <p className="text-[#8b8b9e] text-sm">Try adjusting your filters or search query</p>
          </div>
        )}
      </div>

      {/* Add Staff Modal */}
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
                <h2 className="text-xl font-bold text-white">Add New Staff</h2>
                <button onClick={() => setShowModal(false)} className="text-[#5a5a70] hover:text-white">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleAddStaff} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-[#8b8b9e] mb-1 uppercase">Name</label>
                  <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="input-dark" placeholder="Full Name" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-[#8b8b9e] mb-1 uppercase">Type</label>
                    <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="input-dark">
                      <option value="teaching">Teaching</option>
                      <option value="non-teaching">Non-Teaching</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#8b8b9e] mb-1 uppercase">Level</label>
                    <select value={formData.level} onChange={e => setFormData({...formData, level: e.target.value})} className="input-dark">
                      <option value="L1">L1</option><option value="L2">L2</option><option value="L3">L3</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-[#8b8b9e] mb-1 uppercase">Designation</label>
                    <input type="text" required value={formData.designation} onChange={e => setFormData({...formData, designation: e.target.value})} className="input-dark" placeholder="e.g. TGT" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#8b8b9e] mb-1 uppercase">Phone</label>
                    <input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="input-dark" placeholder="+91..." />
                  </div>
                </div>

                {formData.type === 'teaching' && (
                  <div>
                    <label className="block text-xs font-medium text-[#8b8b9e] mb-1 uppercase">Subject</label>
                    <input type="text" required value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} className="input-dark" placeholder="e.g. Mathematics" />
                  </div>
                )}

                <div className="pt-4 flex justify-end gap-3">
                  <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                  <button type="submit" disabled={submitting} className="btn-primary">
                    {submitting ? 'Saving...' : 'Save Staff'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Teacher Workload Modal */}
      <AnimatePresence>
        {workloadModal && selectedTeacher && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
              onClick={() => setWorkloadModal(false)} 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="glass-card w-full max-w-4xl p-6 relative z-10 max-h-[90vh] flex flex-col"
            >
              <div className="flex items-center justify-between mb-6 flex-shrink-0">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <BookOpen className="text-[#3b82f6]" size={24} />
                    Teacher Workload
                  </h2>
                  <p className="text-sm text-[#8b8b9e] mt-1">Viewing schedule for <span className="text-white font-medium">{selectedTeacher.name}</span></p>
                </div>
                <button onClick={() => setWorkloadModal(false)} className="text-[#5a5a70] hover:text-white">
                  <X size={20} />
                </button>
              </div>

              <div className="flex items-center gap-4 mb-6 bg-white/[0.02] p-3 rounded-xl border border-white/5 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <Calendar size={16} className="text-[#5a5a70]" />
                  <span className="text-sm text-[#8b8b9e]">Date Range:</span>
                </div>
                <input 
                  type="date" 
                  value={startDate} 
                  onChange={(e) => setStartDate(e.target.value)} 
                  className="input-dark py-1.5 text-sm"
                />
                <span className="text-[#5a5a70]">to</span>
                <input 
                  type="date" 
                  value={endDate} 
                  onChange={(e) => setEndDate(e.target.value)} 
                  className="input-dark py-1.5 text-sm"
                />
              </div>

              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                {loadingWorkload ? (
                  <div className="flex justify-center items-center py-20">
                    <div className="w-8 h-8 border-2 border-[#3b82f630] border-t-[#3b82f6] rounded-full animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-6">
                    {getDatesInRange(startDate, endDate).map(date => {
                      const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
                      const formattedDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                      const dayEntries = teacherWorkload[dayName] || [];

                      if (dayEntries.length === 0) return null;

                      return (
                        <div key={formattedDate} className="bg-white/[0.02] border border-white/5 rounded-xl overflow-hidden">
                          <div className="bg-white/[0.03] px-4 py-2 border-b border-white/5 flex justify-between items-center">
                            <h3 className="font-medium text-white">{formattedDate}</h3>
                            <span className="text-xs text-[#8b8b9e] px-2 py-1 bg-white/5 rounded-full">{dayName}</span>
                          </div>
                          <div className="p-4">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="text-left text-[#5a5a70]">
                                  <th className="pb-2 font-medium">Time Slot</th>
                                  <th className="pb-2 font-medium">Class & Section</th>
                                  <th className="pb-2 font-medium">Subject</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-white/5">
                                {dayEntries.map((entry: any, idx: number) => (
                                  <tr key={idx} className="text-white hover:bg-white/[0.02]">
                                    <td className="py-2 flex items-center gap-2">
                                      <Clock size={14} className="text-[#8b5cf6]" />
                                      {entry.timeSlot}
                                    </td>
                                    <td className="py-2">
                                      {entry.className} <span className="text-[#8b8b9e]">({entry.section || 'All'})</span>
                                    </td>
                                    <td className="py-2 text-[#3b82f6]">{entry.subject}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      );
                    })}
                    
                    {getDatesInRange(startDate, endDate).every(d => !(teacherWorkload[d.toLocaleDateString('en-US', { weekday: 'long' })]?.length > 0)) && (
                      <div className="text-center py-10">
                        <Calendar size={32} className="text-[#5a5a70] mx-auto mb-3" />
                        <p className="text-[#8b8b9e]">No classes scheduled in this date range.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Subject Workload Modal */}
      <AnimatePresence>
        {subjectModal && selectedSubject && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
              onClick={() => setSubjectModal(false)} 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="glass-card w-full max-w-4xl p-6 relative z-10 max-h-[90vh] flex flex-col"
            >
              <div className="flex items-center justify-between mb-6 flex-shrink-0">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <BookOpen className="text-[#8b5cf6]" size={24} />
                    Subject Workload
                  </h2>
                  <p className="text-sm text-[#8b8b9e] mt-1">Viewing timeline for <span className="text-white font-medium">{selectedSubject}</span></p>
                </div>
                <button onClick={() => setSubjectModal(false)} className="text-[#5a5a70] hover:text-white">
                  <X size={20} />
                </button>
              </div>

              <div className="flex items-center gap-4 mb-6 bg-white/[0.02] p-3 rounded-xl border border-white/5 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <Calendar size={16} className="text-[#5a5a70]" />
                  <span className="text-sm text-[#8b8b9e]">Date Range:</span>
                </div>
                <input 
                  type="date" 
                  value={startDate} 
                  onChange={(e) => setStartDate(e.target.value)} 
                  className="input-dark py-1.5 text-sm"
                />
                <span className="text-[#5a5a70]">to</span>
                <input 
                  type="date" 
                  value={endDate} 
                  onChange={(e) => setEndDate(e.target.value)} 
                  className="input-dark py-1.5 text-sm"
                />
              </div>

              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                {loadingSubject ? (
                  <div className="flex justify-center items-center py-20">
                    <div className="w-8 h-8 border-2 border-[#8b5cf630] border-t-[#8b5cf6] rounded-full animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-6">
                    {getDatesInRange(startDate, endDate).map(date => {
                      const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
                      const formattedDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                      const dayEntries = subjectWorkload[dayName] || [];

                      if (dayEntries.length === 0) return null;

                      return (
                        <div key={formattedDate} className="bg-white/[0.02] border border-white/5 rounded-xl overflow-hidden">
                          <div className="bg-white/[0.03] px-4 py-2 border-b border-white/5 flex justify-between items-center">
                            <h3 className="font-medium text-white">{formattedDate}</h3>
                            <span className="text-xs text-[#8b8b9e] px-2 py-1 bg-white/5 rounded-full">{dayName}</span>
                          </div>
                          <div className="p-4">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="text-left text-[#5a5a70]">
                                  <th className="pb-2 font-medium">Time Slot</th>
                                  <th className="pb-2 font-medium">Class & Section</th>
                                  <th className="pb-2 font-medium">Teacher</th>
                                  {isAdmin && <th className="pb-2 font-medium">School</th>}
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-white/5">
                                {dayEntries.map((entry: any, idx: number) => (
                                  <tr key={idx} className="text-white hover:bg-white/[0.02]">
                                    <td className="py-2 flex items-center gap-2">
                                      <Clock size={14} className="text-[#3b82f6]" />
                                      {entry.timeSlot}
                                    </td>
                                    <td className="py-2">
                                      {entry.className} <span className="text-[#8b8b9e]">({entry.section || 'All'})</span>
                                    </td>
                                    <td className="py-2 text-[#10b981]">{entry.teacherName}</td>
                                    {isAdmin && <td className="py-2 text-[#8b8b9e] truncate max-w-[150px]">{entry.schoolName}</td>}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      );
                    })}
                    
                    {getDatesInRange(startDate, endDate).every(d => !(subjectWorkload[d.toLocaleDateString('en-US', { weekday: 'long' })]?.length > 0)) && (
                      <div className="text-center py-10">
                        <Calendar size={32} className="text-[#5a5a70] mx-auto mb-3" />
                        <p className="text-[#8b8b9e]">No classes scheduled for {selectedSubject} in this date range.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
