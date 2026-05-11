"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { attendanceApi, schoolsApi, staffApi } from '@/lib/api';
import { TableSkeleton } from '@/components/ui/LoadingSkeleton';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/context/AuthContext';
import {
  ClipboardCheck, Search, Calendar, UserCheck, UserX,
  Save, AlertTriangle, ChevronRight, CheckCircle2, Users
} from 'lucide-react';

export default function AttendancePage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  
  const [records, setRecords] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [schools, setSchools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Filters
  const [filterSchool, setFilterSchool] = useState('all');
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const [search, setSearch] = useState('');
  
  // Attendance State (for marking)
  const [attendanceState, setAttendanceState] = useState<Record<string, { status: string, remarks: string }>>({});
  
  const { showToast } = useToast();
  const isToday = filterDate === new Date().toISOString().split('T')[0];
  const canMark = !isAdmin && isToday; // Only coordinators can mark, and only for today

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    loadAttendance();
  }, [filterSchool, filterDate]);

  const loadInitialData = async () => {
    if (isAdmin) {
      try {
        const res = await schoolsApi.getAll();
        if (res.success) setSchools(res.data || []);
      } catch (error) {
        console.error(error);
      }
    }
    loadAttendance();
  };

  const loadAttendance = async () => {
    try {
      setLoading(true);
      const params: any = { date: filterDate };
      if (isAdmin && filterSchool !== 'all') params.schoolId = filterSchool;

      const res = await attendanceApi.getAll(params);
      
      if (res.success) {
        setRecords(res.data || []);
        
        // If it's today and we're a coordinator, also fetch staff to ensure we show everyone
        if (canMark) {
          const staffRes = await staffApi.getAll({ schoolId: user?.schoolId });
          if (staffRes.success) {
            setStaff(staffRes.data || []);
            
            // Initialize attendance state mapping
            const existingRecords = res.data || [];
            const newState: Record<string, { status: string, remarks: string }> = {};
            
            staffRes.data.forEach((member: any) => {
              const existing = existingRecords.find((r: any) => r.staffId === member.id);
              newState[member.id] = {
                status: existing ? existing.status : 'present', // default to present for quick fill
                remarks: existing ? existing.remarks : ''
              };
            });
            setAttendanceState(newState);
          }
        }
      }
    } catch (error: any) {
      showToast(error.message || 'Failed to load attendance', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!canMark) return;
    
    try {
      setSaving(true);
      
      const payload = staff.map(member => ({
        staffId: member.id,
        staffName: member.name,
        designation: member.designation,
        level: member.level,
        type: member.type,
        date: filterDate,
        status: attendanceState[member.id].status,
        remarks: attendanceState[member.id].remarks
      }));

      const response = await attendanceApi.mark(payload);
      
      if (response.success) {
        showToast('Attendance saved successfully', 'success');
        loadAttendance(); // Reload to get updated records
      }
    } catch (error: any) {
      showToast(error.message || 'Failed to save attendance', 'error');
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = (staffId: string) => {
    if (!canMark) return;
    setAttendanceState(prev => ({
      ...prev,
      [staffId]: {
        ...prev[staffId],
        status: prev[staffId].status === 'present' ? 'absent' : 'present',
        // clear remarks if changed to present
        remarks: prev[staffId].status === 'absent' ? '' : prev[staffId].remarks
      }
    }));
  };

  const updateRemarks = (staffId: string, remarks: string) => {
    if (!canMark) return;
    setAttendanceState(prev => ({
      ...prev,
      [staffId]: {
        ...prev[staffId],
        remarks
      }
    }));
  };

  // Determine what list to show based on role and edit mode
  let displayList = canMark ? staff : records;
  
  if (search) {
    const q = search.toLowerCase();
    displayList = displayList.filter(item => 
      (item.name || item.staffName).toLowerCase().includes(q)
    );
  }

  const presentCount = canMark 
    ? Object.values(attendanceState).filter(s => s.status === 'present').length
    : records.filter(r => r.status === 'present').length;
    
  const absentCount = canMark 
    ? Object.values(attendanceState).filter(s => s.status === 'absent').length
    : records.filter(r => r.status === 'absent').length;

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
            <ClipboardCheck className="text-[#10b981]" size={28} />
            Daily Attendance
          </h1>
          <p className="text-sm text-[#8b8b9e] mt-1">
            {canMark ? 'Mark today\'s staff attendance' : 'View daily attendance records'}
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

          <div className="relative">
            <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5a5a70]" />
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="input-dark pl-10 w-auto py-2"
              max={new Date().toISOString().split('T')[0]} // Cannot pick future dates
            />
          </div>

          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5a5a70]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search staff..."
              className="input-dark pl-10 w-[200px] py-2"
            />
          </div>

          {canMark && (
            <button 
              onClick={handleSave}
              disabled={saving}
              className="btn-primary flex items-center gap-2 py-2"
            >
              {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={16} />}
              Save Attendance
            </button>
          )}
        </div>
      </motion.div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <motion.div className="glass-card p-4 flex items-center justify-between" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div>
            <p className="text-xs text-[#5a5a70] uppercase tracking-wider mb-1">Total Staff</p>
            <p className="text-2xl font-bold text-white">{displayList.length}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
            <Users size={20} className="text-[#8b8b9e]" />
          </div>
        </motion.div>
        <motion.div className="glass-card p-4 flex items-center justify-between border border-[#10b98120]" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div>
            <p className="text-xs text-[#10b981] uppercase tracking-wider mb-1">Present</p>
            <p className="text-2xl font-bold text-[#10b981]">{presentCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#10b98115] flex items-center justify-center">
            <UserCheck size={20} className="text-[#10b981]" />
          </div>
        </motion.div>
        <motion.div className="glass-card p-4 flex items-center justify-between border border-[#f43f5e20]" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <div>
            <p className="text-xs text-[#f43f5e] uppercase tracking-wider mb-1">Absent</p>
            <p className="text-2xl font-bold text-[#f43f5e]">{absentCount}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#f43f5e15] flex items-center justify-center">
            <UserX size={20} className="text-[#f43f5e]" />
          </div>
        </motion.div>
      </div>

      {/* Attendance List */}
      <div className="glass-card overflow-hidden">
        {loading ? (
          <TableSkeleton rows={8} />
        ) : displayList.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Staff Member</th>
                  <th>Designation</th>
                  {isAdmin && <th>School</th>}
                  <th>Status</th>
                  <th>{canMark ? 'Remarks (if absent)' : 'Remarks'}</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {displayList.map((item, i) => {
                    const name = canMark ? item.name : item.staffName;
                    const isPresent = canMark ? attendanceState[item.id]?.status === 'present' : item.status === 'present';
                    const remarks = canMark ? attendanceState[item.id]?.remarks || '' : item.remarks || '-';
                    
                    return (
                      <motion.tr
                        key={item.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.02 }}
                        className="hover:bg-white/[0.02]"
                      >
                        <td>
                          <p className="font-medium text-white">{name}</p>
                          <p className="text-xs text-[#8b8b9e]">{item.type === 'teaching' ? 'Teaching' : 'Non-Teaching'}</p>
                        </td>
                        <td>
                          <span className="text-sm text-white">{item.designation}</span>
                        </td>
                        {isAdmin && (
                          <td className="text-sm text-[#8b8b9e]">{item.schoolName}</td>
                        )}
                        <td>
                          {canMark ? (
                            <button
                              onClick={() => toggleStatus(item.id)}
                              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                                isPresent 
                                  ? 'bg-[#10b98115] text-[#10b981] border border-[#10b98130]' 
                                  : 'bg-[#f43f5e15] text-[#f43f5e] border border-[#f43f5e30]'
                              }`}
                            >
                              {isPresent ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                              {isPresent ? 'Present' : 'Absent'}
                            </button>
                          ) : (
                            <span className={`flex items-center gap-2 px-3 py-1.5 w-fit rounded-lg text-sm font-medium ${
                              isPresent 
                                ? 'bg-[#10b98115] text-[#10b981] border border-[#10b98130]' 
                                : 'bg-[#f43f5e15] text-[#f43f5e] border border-[#f43f5e30]'
                            }`}>
                              {isPresent ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                              {isPresent ? 'Present' : 'Absent'}
                            </span>
                          )}
                        </td>
                        <td>
                          {canMark ? (
                            <input
                              type="text"
                              value={remarks}
                              onChange={(e) => updateRemarks(item.id, e.target.value)}
                              placeholder={!isPresent ? "Reason for absence..." : ""}
                              disabled={isPresent}
                              className={`input-dark py-1.5 text-sm w-full max-w-[300px] ${isPresent ? 'opacity-30 cursor-not-allowed' : ''}`}
                            />
                          ) : (
                            <span className="text-sm text-[#8b8b9e]">{remarks}</span>
                          )}
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-20">
            <ClipboardCheck size={48} className="text-[#5a5a70] mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No records found</h3>
            <p className="text-[#8b8b9e] text-sm">
              {isAdmin ? 'No attendance records for the selected filters.' : 'There is no staff data to display.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
