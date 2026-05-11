/**
 * School Routes
 * 
 * CRUD operations for schools.
 * 
 * GET    /api/schools       - List all schools
 * GET    /api/schools/:id   - Get school by ID
 * POST   /api/schools       - Create new school (admin)
 * PUT    /api/schools/:id   - Update school (admin)
 * DELETE /api/schools/:id   - Delete school (admin)
 */

const express = require('express');
const router = express.Router();
const { getAll, getById, getByField, add, update, remove } = require('../config/mockDatabase');
const { authenticate, isAdmin } = require('../middleware/auth.middleware');

// GET all schools
router.get('/', authenticate, (req, res) => {
  try {
    const { search, status } = req.query;
    let schools = getAll('schools');
    
    if (search) {
      const q = search.toLowerCase();
      schools = schools.filter(s => 
        s.name.toLowerCase().includes(q) || 
        s.location.toLowerCase().includes(q)
      );
    }
    
    if (status && status !== 'all') {
      schools = schools.filter(s => s.status === status);
    }

    // Enrich with staff counts
    const enriched = schools.map(school => {
      const schoolStaff = getByField('staff', 'schoolId', school.id);
      const today = new Date().toISOString().split('T')[0];
      const todayAttendance = getAll('attendance', { schoolId: school.id, date: today });
      const presentCount = todayAttendance.filter(a => a.status === 'present').length;
      
      return {
        ...school,
        totalStaff: schoolStaff.length,
        totalTeachers: schoolStaff.filter(s => s.type === 'teaching').length,
        todayAttendance: todayAttendance.length > 0 
          ? Math.round((presentCount / todayAttendance.length) * 100)
          : 0,
        presentToday: presentCount,
        absentToday: todayAttendance.length - presentCount
      };
    });

    res.json({ success: true, data: enriched, total: enriched.length });
  } catch (error) {
    console.error('Error fetching schools:', error);
    res.status(500).json({ success: false, message: 'Error fetching schools' });
  }
});

// GET school by ID
router.get('/:id', authenticate, (req, res) => {
  try {
    const school = getById('schools', req.params.id);
    if (!school) return res.status(404).json({ success: false, message: 'School not found' });
    
    const schoolStaff = getByField('staff', 'schoolId', school.id);
    res.json({ 
      success: true, 
      data: { 
        ...school, 
        totalStaff: schoolStaff.length,
        totalTeachers: schoolStaff.filter(s => s.type === 'teaching').length,
        totalNonTeaching: schoolStaff.filter(s => s.type === 'non-teaching').length
      } 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching school' });
  }
});

// POST create school
router.post('/', authenticate, isAdmin, (req, res) => {
  try {
    const school = add('schools', { ...req.body, status: 'active' });
    res.status(201).json({ success: true, data: school });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creating school' });
  }
});

// PUT update school
router.put('/:id', authenticate, isAdmin, (req, res) => {
  try {
    const school = update('schools', req.params.id, req.body);
    if (!school) return res.status(404).json({ success: false, message: 'School not found' });
    res.json({ success: true, data: school });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating school' });
  }
});

// DELETE school
router.delete('/:id', authenticate, isAdmin, (req, res) => {
  try {
    const result = remove('schools', req.params.id);
    if (!result) return res.status(404).json({ success: false, message: 'School not found' });
    res.json({ success: true, message: 'School deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting school' });
  }
});

module.exports = router;
