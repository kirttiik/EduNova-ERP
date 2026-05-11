/**
 * Authentication Routes
 * 
 * Handles user login, registration, and token management.
 * 
 * POST /api/auth/login    - User login
 * POST /api/auth/register - Register new user (admin only)
 * GET  /api/auth/me       - Get current user profile
 */

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getAll, getByField, add } = require('../config/mockDatabase');
const { authenticate, isAdmin } = require('../middleware/auth.middleware');

// ============================================
// POST /api/auth/login
// ============================================
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Find user by email
    const users = getByField('users', 'email', email);
    const user = users[0];

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Verify password (for demo, accept "password" as default)
    const isValidPassword = await bcrypt.compare(password, user.password) || password === 'password';

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        schoolId: user.schoolId,
        schoolName: user.schoolName || null
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          schoolId: user.schoolId,
          schoolName: user.schoolName || null
        }
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error during login' });
  }
});

// ============================================
// POST /api/auth/register
// ============================================
router.post('/register', authenticate, isAdmin, async (req, res) => {
  try {
    const { email, password, name, role, schoolId } = req.body;

    if (!email || !password || !name || !role) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    // Check if email already exists
    const existing = getByField('users', 'email', email);
    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = add('users', {
      email,
      password: hashedPassword,
      name,
      role,
      schoolId: schoolId || null,
      status: 'active'
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, message: 'Server error during registration' });
  }
});

// ============================================
// GET /api/auth/me
// ============================================
router.get('/me', authenticate, (req, res) => {
  res.json({
    success: true,
    data: {
      id: req.user.id,
      email: req.user.email,
      name: req.user.name,
      role: req.user.role,
      schoolId: req.user.schoolId,
      schoolName: req.user.schoolName
    }
  });
});

module.exports = router;
