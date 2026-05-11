/**
 * Attendance Routes
 * 
 * Manages daily attendance records.
 * 
 * GET    /api/attendance         - Get attendance (filtered by date, school, etc.)
 * POST   /api/attendance/mark    - Mark/update attendance (bulk)
 * GET    /api/attendance/summary - Get attendance summary
 */

const express = require('express');
const router = express.Router();
const { getAll, getByField, bulkUpsertAttendance } = require('../config/mockDatabase');
const { authenticate, isSchoolCoordinator } = require('../middleware/auth.middleware');

// GET attendance records
router.get('/', authenticate, (req, res) => {
  try {
    const { schoolId, date, type, designation, level, status, search } = req.query;
    
    let records = getAll('attendance');

    // Scope to school for coordinator
    if (req.user.role === 'school_coordinator') {
      records = records.filter(r => r.schoolId === req.user.schoolId);
    } else if (schoolId && schoolId !== 'all') {
      records = records.filter(r => r.schoolId === schoolId);
    }

    if (date) records = records.filter(r => r.date === date);
    if (type && type !== 'all') records = records.filter(r => r.type === type);
    if (designation && designation !== 'all') records = records.filter(r => r.designation === designation);
    if (level && level !== 'all') records = records.filter(r => r.level === level);
    if (status && status !== 'all') records = records.filter(r => r.status === status);
    
    if (search) {
      const q = search.toLowerCase();
      records = records.filter(r =>
        r.staffName.toLowerCase().includes(q) ||
        (r.schoolName && r.schoolName.toLowerCase().includes(q))
      );
    }

    // Sort by name
    records.sort((a, b) => a.staffName.localeCompare(b.staffName));

    const present = records.filter(r => r.status === 'present').length;
    const absent = records.filter(r => r.status === 'absent').length;

    res.json({
      success: true,
      data: records,
      total: records.length,
      summary: {
        total: records.length,
        present,
        absent,
        percentage: records.length > 0 ? Math.round((present / records.length) * 100) : 0
      }
    });
  } catch (error) {
    console.error('Error fetching attendance:', error);
    res.status(500).json({ success: false, message: 'Error fetching attendance' });
  }
});

// POST mark attendance (bulk)
router.post('/mark', authenticate, isSchoolCoordinator, (req, res) => {
  try {
    const { records } = req.body;
    const schoolId = req.user.role === 'admin' ? req.body.schoolId : req.user.schoolId;

    if (!records || !Array.isArray(records)) {
      return res.status(400).json({
        success: false,
        message: 'Records array is required'
      });
    }

    // Add schoolId to each record
    const enrichedRecords = records.map(r => ({
      ...r,
      schoolId: r.schoolId || schoolId
    }));

    const count = bulkUpsertAttendance(enrichedRecords);

    res.json({
      success: true,
      message: `${count} attendance records saved`,
      count
    });
  } catch (error) {
    console.error('Error marking attendance:', error);
    res.status(500).json({ success: false, message: 'Error marking attendance' });
  }
});

// GET attendance summary (for analytics)
router.get('/summary', authenticate, (req, res) => {
  try {
    const { schoolId, startDate, endDate } = req.query;
    let records = getAll('attendance');

    if (req.user.role === 'school_coordinator') {
      records = records.filter(r => r.schoolId === req.user.schoolId);
    } else if (schoolId && schoolId !== 'all') {
      records = records.filter(r => r.schoolId === schoolId);
    }

    if (startDate) records = records.filter(r => r.date >= startDate);
    if (endDate) records = records.filter(r => r.date <= endDate);

    // Group by date
    const byDate = {};
    records.forEach(r => {
      if (!byDate[r.date]) byDate[r.date] = { total: 0, present: 0, absent: 0 };
      byDate[r.date].total++;
      if (r.status === 'present') byDate[r.date].present++;
      else byDate[r.date].absent++;
    });

    // Calculate percentages
    const trends = Object.keys(byDate)
      .sort()
      .map(date => ({
        date,
        ...byDate[date],
        percentage: Math.round((byDate[date].present / byDate[date].total) * 100)
      }));

    // School-wise summary
    const bySchool = {};
    records.forEach(r => {
      if (!bySchool[r.schoolId]) {
        bySchool[r.schoolId] = { schoolId: r.schoolId, schoolName: r.schoolName, total: 0, present: 0, absent: 0 };
      }
      bySchool[r.schoolId].total++;
      if (r.status === 'present') bySchool[r.schoolId].present++;
      else bySchool[r.schoolId].absent++;
    });

    const schoolSummary = Object.values(bySchool).map(s => ({
      ...s,
      percentage: Math.round((s.present / s.total) * 100)
    }));

    res.json({
      success: true,
      data: { trends, schoolSummary }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error generating summary' });
  }
});

module.exports = router;
