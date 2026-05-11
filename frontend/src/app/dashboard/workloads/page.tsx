"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { timetableApi, staffApi, schoolsApi } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/context/AuthContext';
import { Calendar, Clock, BookOpen, MapPin, Users, School, Shapes, User, Download, ChevronLeft } from 'lucide-react';

export default function WorkloadsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'teacher' | 'subject' | 'class'>('teacher');
  const [filterSchool, setFilterSchool] = useState('all');
  const [schools, setSchools] = useState<any[]>([]);

  // Selectors Data
  const [teachers, setTeachers] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [classes, setClasses] = useState<string[]>([]);

  // Selection
  const [selectedEntity, setSelectedEntity] = useState('');
  
  // Dates
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Data
  const [workloadData, setWorkloadData] = useState<any>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAdmin) {
      schoolsApi.getAll().then(res => { if (res.success) setSchools(res.data || []); });
    }
    // Parse schoolId from URL if present
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const sId = urlParams.get('schoolId');
      if (sId) {
        setFilterSchool(sId);
      }
    }
  }, [isAdmin]);

  useEffect(() => {
    loadSelectors();
    setWorkloadData({});
    setSelectedEntity('');
  }, [activeTab, filterSchool, user?.schoolId]);

  useEffect(() => {
    if (selectedEntity) fetchWorkload();
  }, [selectedEntity, activeTab, filterSchool]);

  const loadSelectors = async () => {
    try {
      const schoolId = isAdmin ? (filterSchool === 'all' ? undefined : filterSchool) : user?.schoolId;
      
      if (activeTab === 'teacher') {
        const res = await staffApi.getAll({ type: 'teaching', ...(schoolId && { schoolId }) });
        if (res.success) setTeachers(res.data || []);
      } else {
        const res = await timetableApi.getAll(schoolId ? { schoolId } : {});
        if (res.success) {
          const subs = new Set<string>();
          const cls = new Set<string>();
          res.data.forEach((e: any) => {
            if (e.subject) subs.add(e.subject);
            if (e.className) cls.add(e.className);
          });
          setSubjects(Array.from(subs).sort());
          setClasses(Array.from(cls).sort());
        }
      }
    } catch (error) {
      console.error(error);
    }
  };

  const fetchWorkload = async () => {
    if (!selectedEntity) return;
    setLoading(true);
    try {
      const params: any = {};
      if (isAdmin && filterSchool !== 'all') params.schoolId = filterSchool;
      else if (!isAdmin && user?.schoolId) params.schoolId = user?.schoolId;

      let rawEntries = [];

      if (activeTab === 'teacher') {
        const res = await timetableApi.getTeacherTimetable(selectedEntity);
        if (res.success) rawEntries = res.data?.entries || [];
      } else if (activeTab === 'subject') {
        params.subject = selectedEntity;
        const res = await timetableApi.getAll(params);
        if (res.success) rawEntries = res.data || [];
      } else if (activeTab === 'class') {
        params.className = selectedEntity;
        const res = await timetableApi.getAll(params);
        if (res.success) rawEntries = res.data || [];
      }

      // Group by day
      const grouped: any = {};
      rawEntries.forEach((entry: any) => {
        if (!grouped[entry.day]) grouped[entry.day] = [];
        grouped[entry.day].push(entry);
      });
      Object.keys(grouped).forEach(day => {
        grouped[day].sort((a: any, b: any) => a.timeSlot.localeCompare(b.timeSlot));
      });
      setWorkloadData(grouped);
    } catch (error) {
      showToast('Failed to load workload data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getDatesInRange = (start: string, end: string) => {
    if (!start || !end) return [];
    const dateArray = [];
    const [sYear, sMonth, sDay] = start.split('-').map(Number);
    const [eYear, eMonth, eDay] = end.split('-').map(Number);
    let currentDate = new Date(sYear, sMonth - 1, sDay);
    const stopDate = new Date(eYear, eMonth - 1, eDay);
    if (stopDate < currentDate) return [];
    
    let i = 0;
    while (currentDate <= stopDate && i < 30) {
      dateArray.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
      i++;
    }
    return dateArray;
  };

  const datesToRender = getDatesInRange(startDate, endDate);

  const exportToExcel = () => {
    if (!selectedEntity || Object.keys(workloadData).length === 0) {
      showToast('No data to export', 'error');
      return;
    }

    let csvContent = 'Date,Day,Time Slot,Class,Section,Subject,Teacher,School\n';
    let hasData = false;

    datesToRender.forEach(date => {
      const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
      const formattedDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      const dayEntries = workloadData[dayName] || [];

      dayEntries.forEach((entry: any) => {
        hasData = true;
        csvContent += `"${formattedDate}","${dayName}","${entry.timeSlot}","${entry.className}","${entry.section || 'All'}","${entry.subject}","${entry.teacherName}","${entry.schoolName || ''}"\n`;
      });
    });

    if (!hasData) {
      showToast('No schedules found in selected date range', 'error');
      return;
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${activeTab}_workload_${selectedEntity}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Download started', 'success');
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
            <Shapes className="text-[#8b5cf6]" size={28} />
            Workload Analytics
          </h1>
          <p className="text-sm text-[#8b8b9e] mt-1">
            Analyze daily schedules by teacher, subject, or class across specific date ranges
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button onClick={exportToExcel} className="btn-secondary flex items-center gap-2 py-2">
            <Download size={16} /> Export CSV
          </button>
          {isAdmin && (
            <select value={filterSchool} onChange={(e) => setFilterSchool(e.target.value)} className="input-dark w-auto py-2">
              <option value="all">All Schools</option>
              {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          )}
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex bg-white/[0.02] border border-white/5 rounded-xl p-1 gap-1">
        <button 
          onClick={() => setActiveTab('teacher')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === 'teacher' ? 'bg-[#3b82f6] text-white shadow-[0_0_15px_#3b82f640]' : 'text-[#8b8b9e] hover:text-white hover:bg-white/5'}`}
        >
          <User size={16} /> Teacher Workload
        </button>
        <button 
          onClick={() => setActiveTab('subject')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === 'subject' ? 'bg-[#8b5cf6] text-white shadow-[0_0_15px_#8b5cf640]' : 'text-[#8b8b9e] hover:text-white hover:bg-white/5'}`}
        >
          <BookOpen size={16} /> Subject Workload
        </button>
        <button 
          onClick={() => setActiveTab('class')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === 'class' ? 'bg-[#10b981] text-white shadow-[0_0_15px_#10b98140]' : 'text-[#8b8b9e] hover:text-white hover:bg-white/5'}`}
        >
          <Users size={16} /> Class Workload
        </button>
      </div>

      <div className="glass-card p-6 min-h-[500px] flex flex-col">
        {/* Controls */}
        {selectedEntity && (
          <div className="flex flex-col md:flex-row gap-4 mb-6 pb-6 border-b border-white/5 items-end">
            <div className="flex-shrink-0">
              <button 
                onClick={() => setSelectedEntity('')}
                className="btn-secondary flex items-center gap-2 py-2 px-3 text-sm h-[42px]"
              >
                <ChevronLeft size={16} /> Back
              </button>
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-[#8b8b9e] mb-2 uppercase">
                {activeTab === 'teacher' ? 'Selected Teacher' : activeTab === 'subject' ? 'Selected Subject' : 'Selected Class'}
              </label>
              <div className="input-dark h-[42px] flex items-center text-white bg-white/[0.02]">
                {activeTab === 'teacher' ? teachers.find(t => t.id === selectedEntity)?.name : 
                 activeTab === 'class' ? `Class ${selectedEntity}` : selectedEntity}
              </div>
            </div>
            <div className="flex-1 flex gap-4">
              <div className="flex-1">
                <label className="block text-xs font-medium text-[#8b8b9e] mb-2 uppercase">From Date</label>
                <div className="relative">
                  <input type="date" style={{ colorScheme: 'dark' }} value={startDate} onChange={e => setStartDate(e.target.value)} className="input-dark relative z-10 cursor-pointer w-full" />
                </div>
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium text-[#8b8b9e] mb-2 uppercase">To Date</label>
                <div className="relative">
                  <input type="date" style={{ colorScheme: 'dark' }} value={endDate} onChange={e => setEndDate(e.target.value)} className="input-dark relative z-10 cursor-pointer w-full" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
          {!selectedEntity ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-2">
              {activeTab === 'teacher' && teachers.map((t: any, i) => (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02 }}
                  onClick={() => setSelectedEntity(t.id)}
                  className="glass-card glass-card-hover p-4 flex items-center gap-4 cursor-pointer group"
                >
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, #3b82f620, #06b6d420)', color: '#3b82f6' }}>
                    {t.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-white font-medium text-sm truncate group-hover:text-[#3b82f6] transition-colors">{t.name}</h3>
                    <p className="text-xs text-[#8b8b9e] truncate">{t.designation}</p>
                  </div>
                </motion.div>
              ))}
              {activeTab === 'subject' && subjects.map((s: string, i) => (
                <motion.div
                  key={s}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02 }}
                  onClick={() => setSelectedEntity(s)}
                  className="glass-card glass-card-hover p-4 flex items-center gap-4 cursor-pointer group"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#8b5cf615] flex items-center justify-center flex-shrink-0">
                    <BookOpen size={20} className="text-[#8b5cf6]" />
                  </div>
                  <h3 className="text-white font-medium text-sm truncate group-hover:text-[#8b5cf6] transition-colors">{s}</h3>
                </motion.div>
              ))}
              {activeTab === 'class' && classes.map((c: string, i) => (
                <motion.div
                  key={c}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02 }}
                  onClick={() => setSelectedEntity(c)}
                  className="glass-card glass-card-hover p-4 flex items-center gap-4 cursor-pointer group"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#10b98115] flex items-center justify-center flex-shrink-0">
                    <Users size={20} className="text-[#10b981]" />
                  </div>
                  <h3 className="text-white font-medium text-sm truncate group-hover:text-[#10b981] transition-colors">Class {c}</h3>
                </motion.div>
              ))}
              
              {/* Empty states for grid */}
              {activeTab === 'teacher' && teachers.length === 0 && <p className="text-[#8b8b9e] col-span-full text-center py-10">No teachers found.</p>}
              {activeTab === 'subject' && subjects.length === 0 && <p className="text-[#8b8b9e] col-span-full text-center py-10">No subjects found.</p>}
              {activeTab === 'class' && classes.length === 0 && <p className="text-[#8b8b9e] col-span-full text-center py-10">No classes found.</p>}
            </div>
          ) : loading ? (
            <div className="flex justify-center items-center h-full py-20">
              <div className={`w-8 h-8 border-2 border-t-transparent rounded-full animate-spin ${activeTab === 'teacher' ? 'border-[#3b82f6]' : activeTab === 'subject' ? 'border-[#8b5cf6]' : 'border-[#10b981]'}`} />
            </div>
          ) : (
            <div className="space-y-6">
              {datesToRender.map(date => {
                const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
                const formattedDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                const dayEntries = workloadData[dayName] || [];

                if (dayEntries.length === 0) return null;

                return (
                  <div key={formattedDate} className="bg-white/[0.02] border border-white/5 rounded-xl overflow-hidden">
                    <div className="bg-white/[0.03] px-4 py-3 border-b border-white/5 flex justify-between items-center">
                      <h3 className="font-medium text-white flex items-center gap-2">
                        <Calendar size={16} className={activeTab === 'teacher' ? 'text-[#3b82f6]' : activeTab === 'subject' ? 'text-[#8b5cf6]' : 'text-[#10b981]'} />
                        {formattedDate}
                      </h3>
                      <span className="text-xs text-[#8b8b9e] px-3 py-1 bg-white/5 rounded-full uppercase tracking-wider font-medium">{dayName}</span>
                    </div>
                    <div className="p-4 overflow-x-auto">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th style={{ width: '150px' }}>Time Slot</th>
                            {activeTab !== 'class' && <th>Class & Section</th>}
                            {activeTab !== 'subject' && <th>Subject</th>}
                            {activeTab !== 'teacher' && <th>Teacher</th>}
                            {isAdmin && <th>School</th>}
                          </tr>
                        </thead>
                        <tbody>
                          {dayEntries.map((entry: any, idx: number) => (
                            <tr key={idx}>
                              <td>
                                <div className="flex items-center gap-2 text-white">
                                  <Clock size={14} className="text-[#5a5a70]" />
                                  <span className="font-medium">{entry.timeSlot}</span>
                                </div>
                              </td>
                              {activeTab !== 'class' && (
                                <td className="text-white">
                                  {entry.className} <span className="text-[#8b8b9e] text-xs ml-1">({entry.section || 'All'})</span>
                                </td>
                              )}
                              {activeTab !== 'subject' && (
                                <td className="text-[#8b5cf6] font-medium">{entry.subject}</td>
                              )}
                              {activeTab !== 'teacher' && (
                                <td className="text-[#10b981] font-medium">{entry.teacherName}</td>
                              )}
                              {isAdmin && (
                                <td>
                                  <div className="flex items-center gap-1.5 text-[#8b8b9e] text-sm">
                                    <MapPin size={12} className="text-[#5a5a70]" />
                                    <span className="truncate max-w-[150px]">{entry.schoolName}</span>
                                  </div>
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
              
              {datesToRender.every(d => !(workloadData[d.toLocaleDateString('en-US', { weekday: 'long' })]?.length > 0)) && (
                <div className="text-center py-20 bg-white/[0.01] rounded-xl border border-white/5 border-dashed">
                  <Calendar size={40} className="text-[#5a5a70] mx-auto mb-4 opacity-50" />
                  <h3 className="text-white font-medium mb-1">No schedules found</h3>
                  <p className="text-[#8b8b9e] text-sm">No classes are scheduled for the selected entity in this date range.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
