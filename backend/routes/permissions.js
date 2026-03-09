const express = require('express');
const router = express.Router();
const Permission = require('../models/Permission');
const { authMiddleware, staffOnly, adminOnly } = require('../middleware/auth');

const getToday = () => new Date().toISOString().split('T')[0];

const VALID_TYPES = ['toilet', 'smoke_1', 'smoke_2'];

// POST /api/permissions/use - Staff uses a permission
router.post('/use', authMiddleware, staffOnly, async (req, res) => {
  try {
    const { type } = req.body;
    const staffId = req.user._id;
    const today = getToday();

    if (!VALID_TYPES.includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid permission type. Must be: toilet, smoke_1, or smoke_2.',
      });
    }

    let record = await Permission.findOne({ staffId, date: today });
    if (!record) {
      record = new Permission({ staffId, date: today });
    }

    // Check if already used
    const fieldMap = { toilet: 'toiletUsed', smoke_1: 'smoke1Used', smoke_2: 'smoke2Used' };
    const field = fieldMap[type];

    if (record[field]) {
      return res.status(400).json({
        success: false,
        message: `${type.replace('_', ' ')} permission already used today.`,
      });
    }

    record[field] = true;
    record.logs.push({ type, usedAt: new Date() });
    await record.save();

    res.json({
      success: true,
      message: `${type.replace('_', ' ')} permission recorded.`,
      data: {
        toiletUsed: record.toiletUsed,
        smoke1Used: record.smoke1Used,
        smoke2Used: record.smoke2Used,
        logs: record.logs,
      },
    });
  } catch (error) {
    console.error('Permission use error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// GET /api/permissions/today - Staff views today's permissions
router.get('/today', authMiddleware, staffOnly, async (req, res) => {
  try {
    const today = getToday();
    const record = await Permission.findOne({ staffId: req.user._id, date: today });

    if (!record) {
      return res.json({
        success: true,
        data: {
          toiletUsed: false,
          smoke1Used: false,
          smoke2Used: false,
          logs: [],
        },
      });
    }

    res.json({
      success: true,
      data: {
        toiletUsed: record.toiletUsed,
        smoke1Used: record.smoke1Used,
        smoke2Used: record.smoke2Used,
        logs: record.logs,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// GET /api/permissions/admin/logs - Admin views permission logs
router.get('/admin/logs', authMiddleware, adminOnly, async (req, res) => {
  try {
    const date = req.query.date || getToday();

    const records = await Permission.find({ date })
      .populate('staffId', 'name username employeeId');

    const logs = [];
    records.forEach(r => {
      r.logs.forEach(log => {
        logs.push({
          staffName: r.staffId?.name,
          username: r.staffId?.username,
          employeeId: r.staffId?.employeeId,
          type: log.type,
          usedAt: log.usedAt,
        });
      });
    });

    logs.sort((a, b) => new Date(b.usedAt) - new Date(a.usedAt));

    res.json({ success: true, date, data: logs });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;
