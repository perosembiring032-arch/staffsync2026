const jwt = require('jsonwebtoken');
const Staff = require('../models/Staff');

const JWT_SECRET = process.env.JWT_SECRET || 'staffang_secret_2024';

const auth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ success: false, message: 'No token' });
    const decoded = jwt.verify(token, JWT_SECRET);
    const staff = await Staff.findById(decoded.id).select('-password');
    if (!staff || !staff.isActive) return res.status(401).json({ success: false, message: 'Unauthorized' });
    req.staff = staff;
    next();
  } catch (err) {
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

const adminOnly = (req, res, next) => {
  if (req.staff?.role !== 'admin') return res.status(403).json({ success: false, message: 'Admin only' });
  next();
};

const staffOnly = (req, res, next) => {
  if (req.staff?.role !== 'staff') return res.status(403).json({ success: false, message: 'Staff only' });
  next();
};

module.exports = { auth, adminOnly, staffOnly };
