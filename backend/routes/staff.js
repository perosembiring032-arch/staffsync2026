const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const Staff = require('../models/Staff');
const { authMiddleware, adminOnly } = require('../middleware/auth');

// GET /api/staff - Admin lists all staff
router.get('/', authMiddleware, adminOnly, async (req, res) => {
  try {
    const staffList = await Staff.find({ role: 'staff' })
      .select('-password')
      .sort({ employeeId: 1 });

    res.json({ success: true, data: staffList });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// POST /api/staff - Admin creates staff
router.post('/', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { name, username, password, employeeId } = req.body;

    if (!name || !username || !password || !employeeId) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    const existing = await Staff.findOne({
      $or: [
        { username: username.toLowerCase() },
        { employeeId },
      ],
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Username or Employee ID already exists.',
      });
    }

    const hashed = await bcrypt.hash(password, 12);
    const staff = await Staff.create({
      name,
      username: username.toLowerCase(),
      password: hashed,
      role: 'staff',
      employeeId,
    });

    res.status(201).json({
      success: true,
      message: 'Staff created successfully.',
      data: {
        id: staff._id,
        name: staff.name,
        username: staff.username,
        employeeId: staff.employeeId,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// PUT /api/staff/:id - Admin updates staff
router.put('/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { name, password, isActive } = req.body;
    const updateData = {};

    if (name) updateData.name = name;
    if (typeof isActive === 'boolean') updateData.isActive = isActive;
    if (password) {
      updateData.password = await bcrypt.hash(password, 12);
    }

    const staff = await Staff.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).select('-password');

    if (!staff) {
      return res.status(404).json({ success: false, message: 'Staff not found.' });
    }

    res.json({ success: true, message: 'Staff updated.', data: staff });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// DELETE /api/staff/:id - Admin deactivates staff
router.delete('/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const staff = await Staff.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    ).select('-password');

    if (!staff) {
      return res.status(404).json({ success: false, message: 'Staff not found.' });
    }

    res.json({ success: true, message: 'Staff deactivated.', data: staff });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// GET /api/staff/ranking - Performance ranking
router.get('/ranking/today', authMiddleware, adminOnly, async (req, res) => {
  try {
    const MemberInput = require('../models/MemberInput');
    const today = new Date().toISOString().split('T')[0];

    const inputs = await MemberInput.find({ date: today })
      .populate('staffId', 'name username employeeId');

    const ranking = inputs
      .map(i => ({
        name: i.staffId?.name,
        username: i.staffId?.username,
        employeeId: i.staffId?.employeeId,
        validCount: i.validCount,
        targetReached: i.targetReached,
        totalDeposit: i.members.reduce((sum, m) => sum + (m.isValid ? m.deposit : 0), 0),
      }))
      .sort((a, b) => b.validCount - a.validCount || b.totalDeposit - a.totalDeposit);

    res.json({ success: true, data: ranking });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;
