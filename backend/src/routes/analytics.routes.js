/**
 * Analytics Routes
 * 
 * Provides aggregated data for dashboard analytics.
 * 
 * GET /api/analytics/dashboard - Overall dashboard stats
 * GET /api/analytics/teachers  - Teacher workload analytics
 * GET /api/analytics/attendance - Attendance analytics
 */

const express = require('express');
const router = express.Router();
const { getAll, getByField } = require('../config/mockDatabase');
const { authenticate } = require('../middleware/auth.middleware');

// GET dashboard overview stats
router.get('/dashboard', authenticate, (req, res) => {
  try {
    const schools = getAll('schools');
    const allStaff = getAll('staff');
    const today = new Date().toISOString().split('T')[0];
    const todayAttendance = getAll('attendance').filter(a => a.date === today);
    const timetableEntries = getAll('timetable');

    const totalSchools = schools.length;
    const totalStaff = allStaff.length;
    const totalTeachers = allStaff.filter(s => s.type === 'teaching').length;
    const totalNonTeaching = allStaff.filter(s => s.type === 'non-teaching').length;
    const presentToday = todayAttendance.filter(a => a.status === 'present').length;
    const absentToday = todayAttendance.filter(a => a.status === 'absent').length;
    const attendanceRate = todayAttendance.length > 0
      ? Math.round((presentToday / todayAttendance.length) * 100)
      : 0;
    
    // Active classes today (unique class entries for today's day)
    const todayDay = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date().getDay()];
    const activeClasses = new Set(
      timetableEntries.filter(t => t.day === todayDay).map(t => `${t.schoolId}-${t.className}`)
    ).size;

    // Subject distribution
    const subjectDist = {};
    timetableEntries.forEach(t => {
      subjectDist[t.subject] = (subjectDist[t.subject] || 0) + 1;
    });
    const subjectDistribution = Object.entries(subjectDist)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    // Designation distribution
    const designationDist = {};
    allStaff.forEach(s => {
      designationDist[s.designation] = (designationDist[s.designation] || 0) + 1;
    });
    const designationDistribution = Object.entries(designationDist)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    // Level distribution
    const levelDist = {};
    allStaff.forEach(s => {
      levelDist[s.level] = (levelDist[s.level] || 0) + 1;
    });
    const levelDistribution = Object.entries(levelDist)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => a.name.localeCompare(b.name));

    // Attendance trend (last 7 days)
    const allAttendance = getAll('attendance');
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayRecords = allAttendance.filter(a => a.date === dateStr);
      const dayPresent = dayRecords.filter(a => a.status === 'present').length;
      last7Days.push({
        date: dateStr,
        day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()],
        total: dayRecords.length,
        present: dayPresent,
        absent: dayRecords.length - dayPresent,
        percentage: dayRecords.length > 0 ? Math.round((dayPresent / dayRecords.length) * 100) : 0
      });
    }

    // Top 5 schools by attendance
    const schoolAttendance = {};
    todayAttendance.forEach(a => {
      if (!schoolAttendance[a.schoolId]) {
        schoolAttendance[a.schoolId] = { name: a.schoolName, total: 0, present: 0 };
      }
      schoolAttendance[a.schoolId].total++;
      if (a.status === 'present') schoolAttendance[a.schoolId].present++;
    });
    const topSchools = Object.values(schoolAttendance)
      .map(s => ({ ...s, percentage: Math.round((s.present / s.total) * 100) }))
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 5);

    // Recent activity
    const recentActivity = [
      { id: 1, action: 'Attendance marked', school: schools[0]?.name, time: '2 min ago', type: 'attendance' },
      { id: 2, action: 'New staff added', school: schools[2]?.name, time: '15 min ago', type: 'staff' },
      { id: 3, action: 'Timetable updated', school: schools[5]?.name, time: '1 hour ago', type: 'timetable' },
      { id: 4, action: 'Low attendance alert', school: schools[8]?.name, time: '2 hours ago', type: 'alert' },
      { id: 5, action: 'New school registered', school: schools[10]?.name, time: '3 hours ago', type: 'school' },
    ];

    res.json({
      success: true,
      data: {
        overview: {
          totalSchools,
          totalStaff,
          totalTeachers,
          totalNonTeaching,
          presentToday,
          absentToday,
          attendanceRate,
          activeClasses,
          totalTimetableEntries: timetableEntries.length
        },
        attendanceTrend: last7Days,
        subjectDistribution,
        designationDistribution,
        levelDistribution,
        topSchools,
        recentActivity
      }
    });
  } catch (error) {
    console.error('Error generating analytics:', error);
    res.status(500).json({ success: false, message: 'Error generating analytics' });
  }
});

// GET teacher workload analytics
router.get('/teachers', authenticate, (req, res) => {
  try {
    const { schoolId } = req.query;
    let timetableEntries = getAll('timetable');
    let staffList = getAll('staff').filter(s => s.type === 'teaching');

    if (req.user.role === 'school_coordinator') {
      timetableEntries = timetableEntries.filter(t => t.schoolId === req.user.schoolId);
      staffList = staffList.filter(s => s.schoolId === req.user.schoolId);
    } else if (schoolId && schoolId !== 'all') {
      timetableEntries = timetableEntries.filter(t => t.schoolId === schoolId);
      staffList = staffList.filter(s => s.schoolId === schoolId);
    }

    // Teacher workload
    const workload = {};
    timetableEntries.forEach(entry => {
      if (!workload[entry.teacherId]) {
        workload[entry.teacherId] = {
          teacherId: entry.teacherId,
          teacherName: entry.teacherName,
          schoolName: entry.schoolName,
          totalPeriods: 0,
          subjects: new Set(),
          classes: new Set(),
          days: new Set()
        };
      }
      workload[entry.teacherId].totalPeriods++;
      workload[entry.teacherId].subjects.add(entry.subject);
      workload[entry.teacherId].classes.add(entry.className);
      workload[entry.teacherId].days.add(entry.day);
    });

    const teacherWorkload = Object.values(workload).map(w => ({
      ...w,
      subjects: Array.from(w.subjects),
      classes: Array.from(w.classes),
      days: Array.from(w.days),
      avgPeriodsPerDay: Math.round(w.totalPeriods / Math.max(w.days.size, 1))
    })).sort((a, b) => b.totalPeriods - a.totalPeriods);

    res.json({ success: true, data: teacherWorkload });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error generating teacher analytics' });
  }
});

module.exports = router;
