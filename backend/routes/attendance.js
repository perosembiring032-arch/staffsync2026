const express = require('express');
const router = express.Router();
const Attendance = require('../models/Attendance');
const Staff = require('../models/Staff');
const { authMiddleware, staffOnly, adminOnly } = require('../middleware/auth');

const getToday = () => new Date().toISOString().split('T')[0];

// POST /api/attendance/clockin - Staff clock in
router.post('/clockin', authMiddleware, staffOnly, async (req, res) => {
  try {
    const staffId = req.user._id;
    const today = getToday();
    let rec = await Attendance.findOne({ staffId, date: today });
    if (rec && rec.clockIn) return res.json({ success: false, message: 'Sudah clock-in hari ini.', alreadyDone: true });
    const now = new Date();
    const workStart = new Date(now);
    workStart.setHours(8, 0, 0, 0);
    const status = now > workStart ? 'terlambat' : 'hadir';
    if (!rec) {
      rec = new Attendance({ staffId, date: today, clockIn: now, status });
    } else {
      rec.clockIn = now; rec.status = status;
    }
    await rec.save();
    return res.json({ success: true, data: { clockIn: now, status }, message: `Clock-in berhasil. Status: ${status}` });
  } catch (err) {
    console.error('clockin error:', err);
    return res.status(500).json({ success: false, message: 'Server error: ' + err.message });
  }
});

// POST /api/attendance/clockout - Staff clock out
router.post('/clockout', authMiddleware, staffOnly, async (req, res) => {
  try {
    const staffId = req.user._id;
    const today = getToday();
    const rec = await Attendance.findOne({ staffId, date: today });
    if (!rec || !rec.clockIn) return res.status(400).json({ success: false, message: 'Belum clock-in hari ini.' });
    if (rec.clockOut) return res.status(400).json({ success: false, message: 'Sudah clock-out hari ini.' });
    rec.clockOut = new Date();
    await rec.save();
    const durMs = rec.clockOut - rec.clockIn;
    const durHours = Math.floor(durMs / 3600000);
    const durMin = Math.floor((durMs % 3600000) / 60000);
    res.json({ success: true, data: { clockOut: rec.clockOut, duration: `${durHours}j ${durMin}m` }, message: 'Clock-out berhasil.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// GET /api/attendance/today - Staff lihat status absensi hari ini
router.get('/today', authMiddleware, staffOnly, async (req, res) => {
  try {
    const rec = await Attendance.findOne({ staffId: req.user._id, date: getToday() });
    res.json({ success: true, data: rec || { clockIn: null, clockOut: null, status: null } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// GET /api/attendance/admin/today - Admin lihat semua absensi hari ini
router.get('/admin/today', authMiddleware, adminOnly, async (req, res) => {
  try {
    const date = req.query.date || getToday();
    const allStaff = await Staff.find({ role: 'staff', isActive: true }).select('name username employeeId');
    const records = await Attendance.find({ date });
    const recMap = {};
    records.forEach(r => { recMap[r.staffId.toString()] = r; });
    const result = allStaff.map(s => {
      const r = recMap[s._id.toString()];
      return {
        staffId: s._id, name: s.name, employeeId: s.employeeId,
        clockIn: r?.clockIn || null, clockOut: r?.clockOut || null, status: r?.status || 'absen',
      };
    });
    res.json({ success: true, date, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// GET /api/attendance/admin/history - Admin lihat histori
router.get('/admin/history', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { staffId, days = 7 } = req.query;
    const query = staffId ? { staffId } : {};
    const records = await Attendance.find(query).populate('staffId', 'name employeeId').sort({ date: -1 }).limit(Number(days) * 10);
    res.json({ success: true, data: records });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;
