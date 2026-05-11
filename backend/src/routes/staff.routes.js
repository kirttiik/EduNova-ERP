/**
 * Staff Routes
 * 
 * CRUD operations for staff (teaching + non-teaching).
 * 
 * GET    /api/staff         - List all staff (with filters)
 * GET    /api/staff/:id     - Get staff by ID
 * POST   /api/staff         - Create new staff member
 * PUT    /api/staff/:id     - Update staff member
 * DELETE /api/staff/:id     - Delete staff member
 */

const express = require('express');
const router = express.Router();
const { getAll, getById, getByField, add, update, remove } = require('../config/mockDatabase');
const { authenticate, isSchoolCoordinator } = require('../middleware/auth.middleware');

// GET all staff (with filters)
router.get('/', authenticate, (req, res) => {
  try {
    const { schoolId, type, designation, level, search, page = 1, limit = 50 } = req.query;
    
    let staffList = getAll('staff');
    
    // Filter by school if user is school coordinator
    if (req.user.role === 'school_coordinator') {
      staffList = staffList.filter(s => s.schoolId === req.user.schoolId);
    } else if (schoolId && schoolId !== 'all') {
      staffList = staffList.filter(s => s.schoolId === schoolId);
    }

    if (type && type !== 'all') {
      staffList = staffList.filter(s => s.type === type);
    }
    if (designation && designation !== 'all') {
      staffList = staffList.filter(s => s.designation === designation);
    }
    if (level && level !== 'all') {
      staffList = staffList.filter(s => s.level === level);
    }
    if (search) {
      const q = search.toLowerCase();
      staffList = staffList.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.designation.toLowerCase().includes(q) ||
        (s.schoolName && s.schoolName.toLowerCase().includes(q))
      );
    }

    // Pagination
    const startIndex = (parseInt(page) - 1) * parseInt(limit);
    const paginatedStaff = staffList.slice(startIndex, startIndex + parseInt(limit));

    res.json({
      success: true,
      data: paginatedStaff,
      total: staffList.length,
      page: parseInt(page),
      totalPages: Math.ceil(staffList.length / parseInt(limit))
    });
  } catch (error) {
    console.error('Error fetching staff:', error);
    res.status(500).json({ success: false, message: 'Error fetching staff' });
  }
});

// GET staff by ID
router.get('/:id', authenticate, (req, res) => {
  try {
    const member = getById('staff', req.params.id);
    if (!member) return res.status(404).json({ success: false, message: 'Staff not found' });
    res.json({ success: true, data: member });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching staff member' });
  }
});

// POST create staff
router.post('/', authenticate, isSchoolCoordinator, (req, res) => {
  try {
    const schoolId = req.user.role === 'admin' ? req.body.schoolId : req.user.schoolId;
    const school = getById('schools', schoolId);
    
    const member = add('staff', {
      ...req.body,
      schoolId,
      schoolName: school ? school.name : req.body.schoolName,
      status: 'active'
    });
    
    res.status(201).json({ success: true, data: member });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creating staff member' });
  }
});

// PUT update staff
router.put('/:id', authenticate, isSchoolCoordinator, (req, res) => {
  try {
    const member = update('staff', req.params.id, req.body);
    if (!member) return res.status(404).json({ success: false, message: 'Staff not found' });
    res.json({ success: true, data: member });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating staff member' });
  }
});

// DELETE staff
router.delete('/:id', authenticate, isSchoolCoordinator, (req, res) => {
  try {
    const result = remove('staff', req.params.id);
    if (!result) return res.status(404).json({ success: false, message: 'Staff not found' });
    res.json({ success: true, message: 'Staff member deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting staff member' });
  }
});

module.exports = router;
