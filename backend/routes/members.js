const express = require('express');
const router = express.Router();
const MemberInput = require('../models/MemberInput');
const BreakStatus = require('../models/BreakStatus');
const { authMiddleware, staffOnly, adminOnly } = require('../middleware/auth');

const DAILY_TARGET = 3;
const MIN_DEPOSIT = 50000;

const getToday = () => new Date().toISOString().split('T')[0];

const updateBreakStatus = async (staffId, date, validCount) => {
  const targetReached = validCount >= DAILY_TARGET;
  const breakHours = targetReached ? 2 : 1;

  await BreakStatus.findOneAndUpdate(
    { staffId, date },
    { targetReached, breakHours },
    { upsert: true, new: true }
  );
};

// POST /api/members/input - Staff adds a member
router.post('/input', authMiddleware, staffOnly, async (req, res) => {
  try {
    const { memberId, deposit } = req.body;
    const staffId = req.user._id;
    const today = getToday();

    // Validation
    if (!memberId || memberId.trim() === '') {
      return res.status(400).json({ success: false, message: 'Member ID is required.' });
    }

    if (!deposit && deposit !== 0) {
      return res.status(400).json({ success: false, message: 'Deposit amount is required.' });
    }

    const depositNum = Number(deposit);
    if (isNaN(depositNum) || !Number.isFinite(depositNum)) {
      return res.status(400).json({ success: false, message: 'Deposit must be a valid number.' });
    }

    // Find or create today's record
    let record = await MemberInput.findOne({ staffId, date: today });

    if (!record) {
      record = new MemberInput({ staffId, date: today, members: [] });
    }

    // Check max 3 members
    if (record.members.length >= DAILY_TARGET) {
      return res.status(400).json({
        success: false,
        message: `Maximum ${DAILY_TARGET} members per day already reached.`,
      });
    }

    // Check duplicate member ID
    const isDuplicate = record.members.some(
      m => m.memberId.toLowerCase() === memberId.trim().toLowerCase()
    );
    if (isDuplicate) {
      return res.status(400).json({
        success: false,
        message: 'Member ID already entered today.',
      });
    }

    const isValid = depositNum >= MIN_DEPOSIT;
    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: `Deposit must be at least ${MIN_DEPOSIT.toLocaleString()}. Entry rejected.`,
        minDeposit: MIN_DEPOSIT,
        yourDeposit: depositNum,
      });
    }

    // Add member
    record.members.push({
      memberId: memberId.trim(),
      deposit: depositNum,
      isValid: true,
    });

    // Recalculate valid count
    const validCount = record.members.filter(m => m.isValid).length;
    record.validCount = validCount;
    record.targetReached = validCount >= DAILY_TARGET;

    await record.save();

    // Update break status
    await updateBreakStatus(staffId, today, validCount);

    res.json({
      success: true,
      message: 'Member added successfully.',
      data: {
        memberId: memberId.trim(),
        deposit: depositNum,
        isValid: true,
        validCount,
        targetReached: record.targetReached,
        breakHours: record.targetReached ? 2 : 1,
      },
    });
  } catch (error) {
    console.error('Input error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// GET /api/members/today - Staff views today's entries
router.get('/today', authMiddleware, staffOnly, async (req, res) => {
  try {
    const today = getToday();
    const record = await MemberInput.findOne({ staffId: req.user._id, date: today });

    if (!record) {
      return res.json({
        success: true,
        data: {
          members: [],
          validCount: 0,
          targetReached: false,
          breakHours: 1,
          remaining: DAILY_TARGET,
        },
      });
    }

    const breakStatus = await BreakStatus.findOne({ staffId: req.user._id, date: today });

    res.json({
      success: true,
      data: {
        members: record.members,
        validCount: record.validCount,
        targetReached: record.targetReached,
        breakHours: breakStatus?.breakHours || 1,
        remaining: Math.max(0, DAILY_TARGET - record.validCount),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// GET /api/members/admin/all - Admin views all staff today
router.get('/admin/all', authMiddleware, adminOnly, async (req, res) => {
  try {
    const date = req.query.date || getToday();
    const Staff = require('../models/Staff');

    const allStaff = await Staff.find({ role: 'staff', isActive: true }).select('name username employeeId');
    const inputs = await MemberInput.find({ date });
    const breaks = await BreakStatus.find({ date });
    const Permission = require('../models/Permission');
    const permissions = await Permission.find({ date });

    const inputMap = {};
    inputs.forEach(i => { inputMap[i.staffId.toString()] = i; });

    const breakMap = {};
    breaks.forEach(b => { breakMap[b.staffId.toString()] = b; });

    const permMap = {};
    permissions.forEach(p => { permMap[p.staffId.toString()] = p; });

    const result = allStaff.map(s => {
      const sid = s._id.toString();
      const input = inputMap[sid];
      const brk = breakMap[sid];
      const perm = permMap[sid];

      return {
        staffId: s._id,
        name: s.name,
        username: s.username,
        employeeId: s.employeeId,
        validCount: input?.validCount || 0,
        targetReached: input?.targetReached || false,
        breakHours: brk?.breakHours || 1,
        toiletUsed: perm?.toiletUsed || false,
        smoke1Used: perm?.smoke1Used || false,
        smoke2Used: perm?.smoke2Used || false,
      };
    });

    // Stats
    const reached = result.filter(r => r.targetReached).length;
    const failed = result.filter(r => !r.targetReached).length;

    res.json({
      success: true,
      date,
      stats: {
        total: allStaff.length,
        reached,
        failed,
        notStarted: result.filter(r => r.validCount === 0).length,
      },
      data: result,
    });
  } catch (error) {
    console.error('Admin all error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// GET /api/members/admin/staff/:staffId - Admin views specific staff history
router.get('/admin/staff/:staffId', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { staffId } = req.params;
    const { days = 7 } = req.query;

    const records = await MemberInput.find({ staffId })
      .sort({ date: -1 })
      .limit(Number(days));

    res.json({ success: true, data: records });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;
