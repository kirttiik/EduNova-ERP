/**
 * Timetable Routes
 * 
 * Manages class schedules and teacher assignments.
 * 
 * GET    /api/timetable          - Get timetable entries (filtered)
 * GET    /api/timetable/teacher/:id - Get teacher's timetable
 * POST   /api/timetable          - Create timetable entry
 * PUT    /api/timetable/:id      - Update timetable entry
 * DELETE /api/timetable/:id      - Delete timetable entry
 * POST   /api/timetable/bulk     - Bulk create/update entries
 */

const express = require('express');
const router = express.Router();
const { getAll, getById, getByField, add, update, remove } = require('../config/mockDatabase');
const { authenticate, isSchoolCoordinator } = require('../middleware/auth.middleware');

// GET timetable entries
router.get('/', authenticate, (req, res) => {
  try {
    const { schoolId, teacherId, day, className, subject, search } = req.query;
    
    let entries = getAll('timetable');

    // Scope to school for coordinator
    if (req.user.role === 'school_coordinator') {
      entries = entries.filter(e => e.schoolId === req.user.schoolId);
    } else if (schoolId && schoolId !== 'all') {
      entries = entries.filter(e => e.schoolId === schoolId);
    }

    if (teacherId) entries = entries.filter(e => e.teacherId === teacherId);
    if (day && day !== 'all') entries = entries.filter(e => e.day === day);
    if (className && className !== 'all') entries = entries.filter(e => e.className === className);
    if (subject && subject !== 'all') entries = entries.filter(e => e.subject === subject);
    
    if (search) {
      const q = search.toLowerCase();
      entries = entries.filter(e =>
        e.teacherName.toLowerCase().includes(q) ||
        e.className.toLowerCase().includes(q) ||
        e.subject.toLowerCase().includes(q) ||
        (e.schoolName && e.schoolName.toLowerCase().includes(q))
      );
    }

    // Sort by time slot
    entries.sort((a, b) => a.timeSlot.localeCompare(b.timeSlot));

    res.json({ success: true, data: entries, total: entries.length });
  } catch (error) {
    console.error('Error fetching timetable:', error);
    res.status(500).json({ success: false, message: 'Error fetching timetable' });
  }
});

// GET teacher's timetable
router.get('/teacher/:id', authenticate, (req, res) => {
  try {
    const entries = getByField('timetable', 'teacherId', req.params.id);
    
    // Group by day
    const grouped = {};
    entries.forEach(entry => {
      if (!grouped[entry.day]) grouped[entry.day] = [];
      grouped[entry.day].push(entry);
    });

    // Sort each day's entries by time
    Object.keys(grouped).forEach(day => {
      grouped[day].sort((a, b) => a.timeSlot.localeCompare(b.timeSlot));
    });

    res.json({ success: true, data: { entries, grouped }, total: entries.length });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching teacher timetable' });
  }
});

// POST create entry
router.post('/', authenticate, isSchoolCoordinator, (req, res) => {
  try {
    const schoolId = req.user.role === 'admin' ? req.body.schoolId : req.user.schoolId;
    const entry = add('timetable', { ...req.body, schoolId });
    res.status(201).json({ success: true, data: entry });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creating timetable entry' });
  }
});

// PUT update entry
router.put('/:id', authenticate, isSchoolCoordinator, (req, res) => {
  try {
    const entry = update('timetable', req.params.id, req.body);
    if (!entry) return res.status(404).json({ success: false, message: 'Entry not found' });
    res.json({ success: true, data: entry });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating entry' });
  }
});

// DELETE entry
router.delete('/:id', authenticate, isSchoolCoordinator, (req, res) => {
  try {
    const result = remove('timetable', req.params.id);
    if (!result) return res.status(404).json({ success: false, message: 'Entry not found' });
    res.json({ success: true, message: 'Entry deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting entry' });
  }
});

// POST bulk create/update
router.post('/bulk', authenticate, isSchoolCoordinator, (req, res) => {
  try {
    const { entries } = req.body;
    const schoolId = req.user.role === 'admin' ? req.body.schoolId : req.user.schoolId;
    
    const results = entries.map(entry => add('timetable', { ...entry, schoolId }));
    
    res.status(201).json({ 
      success: true, 
      data: results, 
      message: `${results.length} entries created` 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error in bulk operation' });
  }
});

module.exports = router;
