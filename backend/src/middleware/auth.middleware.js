/**
 * Authentication Middleware
 * 
 * Verifies JWT tokens and attaches user data to requests.
 * Supports role-based access control (admin, school_coordinator).
 */

const jwt = require('jsonwebtoken');
const { getById } = require('../config/mockDatabase');

/**
 * Verify JWT token from Authorization header
 */
const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Attach user info to request
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired. Please login again.'
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Invalid token.'
    });
  }
};

/**
 * Check if user has admin role
 */
const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.'
    });
  }
  next();
};

/**
 * Check if user is a school coordinator
 */
const isSchoolCoordinator = (req, res, next) => {
  if (req.user.role !== 'school_coordinator' && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. School coordinator or admin privileges required.'
    });
  }
  next();
};

module.exports = { authenticate, isAdmin, isSchoolCoordinator };
