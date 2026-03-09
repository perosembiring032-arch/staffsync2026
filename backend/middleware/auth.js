const jwt = require('jsonwebtoken');
const Staff = require('../models/Staff');

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
      });
    }

    const token = authHeader.split(' ')[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const staff = await Staff.findById(decoded.id).select('-password');
    if (!staff || !staff.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token or account deactivated.',
      });
    }

    req.user = staff;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired. Please login again.',
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Invalid token.',
    });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin only.',
    });
  }
  next();
};

const staffOnly = (req, res, next) => {
  if (req.user.role !== 'staff') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Staff only.',
    });
  }
  next();
};

module.exports = { authMiddleware, adminOnly, staffOnly };
