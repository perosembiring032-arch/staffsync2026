const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();

const Staff = require('../models/Staff');
const { ipWhitelist } = require('../middleware/ipWhitelist');
const { authMiddleware } = require('../middleware/auth');

// Helper: get today's date YYYY-MM-DD
const getToday = () => new Date().toISOString().split('T')[0];

// POST /api/auth/login/admin
router.post('/login/admin', ipWhitelist, async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required.',
      });
    }

    const admin = await Staff.findOne({ username: username.toLowerCase(), role: 'admin' });
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials.',
      });
    }

    if (!admin.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account deactivated.',
      });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials.',
      });
    }

    const token = jwt.sign(
      { id: admin._id, role: admin.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    res.json({
      success: true,
      message: 'Admin login successful.',
      token,
      user: {
        id: admin._id,
        name: admin.name,
        username: admin.username,
        role: admin.role,
        employeeId: admin.employeeId,
      },
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// POST /api/auth/login/staff
router.post('/login/staff', ipWhitelist, async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required.',
      });
    }

    const staff = await Staff.findOne({ username: username.toLowerCase(), role: 'staff' });
    if (!staff) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials.',
      });
    }

    if (!staff.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account deactivated. Contact admin.',
      });
    }

    const isMatch = await bcrypt.compare(password, staff.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials.',
      });
    }

    const token = jwt.sign(
      { id: staff._id, role: staff.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    res.json({
      success: true,
      message: 'Login successful.',
      token,
      user: {
        id: staff._id,
        name: staff.name,
        username: staff.username,
        role: staff.role,
        employeeId: staff.employeeId,
      },
    });
  } catch (error) {
    console.error('Staff login error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// GET /api/auth/me
router.get('/me', authMiddleware, async (req, res) => {
  res.json({
    success: true,
    user: req.user,
  });
});

// POST /api/auth/logout
router.post('/logout', authMiddleware, (req, res) => {
  res.json({ success: true, message: 'Logged out successfully.' });
});

module.exports = router;
