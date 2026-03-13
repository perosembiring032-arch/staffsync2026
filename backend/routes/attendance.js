const router = require('express').Router();
const { auth, staffOnly, adminOnly } = require('../middleware/auth');
const Attendance = require('../models/Attendance');
const Staff = require('../models/Staff');

const getToday = () => new Date().toISOString().split('T')[0];

router.get('/today', auth, staffOnly, async (req, res) => {
  try {
    const att = await Attendance.findOne({ staffId: req.staff._id, date: getToday() });
    res.json({ success: true, data: att });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/clockin', auth, staffOnly, async (req, res) => {
  try {
    const today = getToday();
    const exists = await Attendance.findOne({ staffId: req.staff._id, date: today });
    if (exists?.clockIn) return res.json({ success: false, message: 'Sudah clock in hari ini' });
    const att = exists || new Attendance({ staffId: req.staff._id, date: today });
    att.clockIn = new Date(); att.isPresent = true;
    await att.save();
    res.json({ success: true, message: 'Clock in berhasil', data: att });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/clockout', auth, staffOnly, async (req, res) => {
  try {
    const att = await Attendance.findOne({ staffId: req.staff._id, date: getToday() });
    if (!att?.clockIn) return res.json({ success: false, message: 'Belum clock in' });
    if (att.clockOut) return res.json({ success: false, message: 'Sudah clock out' });
    att.clockOut = new Date();
    await att.save();
    res.json({ success: true, message: 'Clock out berhasil', data: att });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/admin/today', auth, adminOnly, async (req, res) => {
  try {
    const staffList = await Staff.find({ role: 'staff', isActive: true });
    const atts = await Attendance.find({ date: getToday() });
    const result = staffList.map(s => {
      const a = atts.find(x => x.staffId.toString() === s._id.toString());
      return { staffId: s._id, fullName: s.fullName, employeeId: s.employeeId, clockIn: a?.clockIn, clockOut: a?.clockOut, isPresent: a?.isPresent || false };
    });
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
