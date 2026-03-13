const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const Staff  = require('../models/Staff');
const ipWhitelistMiddleware = require('../middleware/ipWhitelist');

const JWT_SECRET = process.env.JWT_SECRET || 'staffang_secret_2024';

// Helper login
async function handleLogin(req, res, requiredRole) {
  try {
    const { username, password } = req.body;
    if (!username || !password)
      return res.json({ success: false, message: 'Username dan password wajib diisi' });

    const staff = await Staff.findOne({ username, isActive: true });
    if (!staff)
      return res.json({ success: false, message: 'Username atau password salah' });

    const ok = await bcrypt.compare(password, staff.password);
    if (!ok)
      return res.json({ success: false, message: 'Username atau password salah' });

    // Cek role jika diperlukan
    if (requiredRole && staff.role !== requiredRole)
      return res.json({ success: false, message: 'Akses ditolak. Role tidak sesuai.' });

    const token = jwt.sign({ id: staff._id, role: staff.role }, JWT_SECRET, { expiresIn: '24h' });
    res.json({
      success: true,
      token,
      user: {
        id: staff._id,
        username: staff.username,
        fullName: staff.fullName,
        employeeId: staff.employeeId,
        role: staff.role
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// POST /auth/login           → login umum (semua role)
router.post('/login', ipWhitelistMiddleware, (req, res) => handleLogin(req, res, null));

// POST /auth/login/admin     → khusus admin
router.post('/login/admin', ipWhitelistMiddleware, (req, res) => handleLogin(req, res, 'admin'));

// POST /auth/login/staff     → khusus staff
router.post('/login/staff', ipWhitelistMiddleware, (req, res) => handleLogin(req, res, 'staff'));

module.exports = router;
