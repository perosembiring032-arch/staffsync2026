const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Staff = require('../models/Staff');
const ipWhitelistMiddleware = require('../middleware/ipWhitelist');

const JWT_SECRET = process.env.JWT_SECRET || 'staffang_secret_2024';

router.post('/login', ipWhitelistMiddleware, async (req, res) => {
  try {
    const { username, password } = req.body;
    const staff = await Staff.findOne({ username, isActive: true });
    if (!staff) return res.json({ success: false, message: 'Username atau password salah' });
    const ok = await bcrypt.compare(password, staff.password);
    if (!ok) return res.json({ success: false, message: 'Username atau password salah' });
    const token = jwt.sign({ id: staff._id, role: staff.role }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ success: true, token, user: { id: staff._id, username: staff.username, fullName: staff.fullName, employeeId: staff.employeeId, role: staff.role } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
