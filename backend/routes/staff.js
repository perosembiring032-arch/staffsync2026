const router = require('express').Router();
const bcrypt = require('bcryptjs');
const { auth, adminOnly } = require('../middleware/auth');
const Staff = require('../models/Staff');
const MemberInput = require('../models/MemberInput');

const getToday = () => new Date().toISOString().split('T')[0];

router.get('/', auth, adminOnly, async (req, res) => {
  try {
    const list = await Staff.find({}).select('-password').sort({ createdAt: -1 });
    res.json({ success: true, data: list });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET ranking today
router.get('/ranking/today', auth, adminOnly, async (req, res) => {
  try {
    const inputs = await MemberInput.find({ date: getToday() }).populate('staffId', 'fullName name employeeId username');
    const ranking = inputs.map(inp => {
      const members = inp.members || [];
      const validCount = members.filter(m => m.isValid).length;
      const totalDeposit = members.reduce((s, m) => s + m.deposit, 0);
      return {
        staffId: inp.staffId?._id,
        fullName: inp.staffId?.fullName || inp.staffId?.name || inp.staffId?.username || '—',
        employeeId: inp.staffId?.employeeId || '—',
        username: inp.staffId?.username || '—',
        validCount,
        totalDeposit,
        totalMembers: members.length,
        targetReached: validCount >= 3
      };
    }).sort((a, b) => b.validCount - a.validCount || b.totalDeposit - a.totalDeposit);
    res.json({ success: true, data: ranking });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/create', auth, adminOnly, async (req, res) => {
  try {
    const { username, password, fullName, employeeId, role } = req.body;
    if (!username || !password || !fullName || !employeeId) return res.json({ success: false, message: 'Semua field wajib diisi' });
    const exists = await Staff.findOne({ $or: [{ username }, { employeeId }] });
    if (exists) return res.json({ success: false, message: 'Username atau Employee ID sudah digunakan' });
    const hash = await bcrypt.hash(password, 10);
    const s = await Staff.create({ username, password: hash, fullName, employeeId, role: role || 'staff', isActive: true });
    res.json({ success: true, message: 'Staff berhasil dibuat', data: { id: s._id, username: s.username, fullName: s.fullName, employeeId: s.employeeId, role: s.role } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/:id', auth, adminOnly, async (req, res) => {
  try {
    const { fullName, employeeId, role } = req.body;
    const s = await Staff.findByIdAndUpdate(req.params.id, { fullName, employeeId, role }, { new: true }).select('-password');
    if (!s) return res.json({ success: false, message: 'Staff tidak ditemukan' });
    res.json({ success: true, message: 'Staff diupdate', data: s });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.patch('/:id/toggle', auth, adminOnly, async (req, res) => {
  try {
    const s = await Staff.findById(req.params.id);
    if (!s) return res.json({ success: false, message: 'Staff tidak ditemukan' });
    s.isActive = !s.isActive;
    await s.save();
    res.json({ success: true, message: `Staff ${s.isActive ? 'diaktifkan' : 'dinonaktifkan'}` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.patch('/:id/password', auth, adminOnly, async (req, res) => {
  try {
    const { password } = req.body;
    if (!password || password.length < 6) return res.json({ success: false, message: 'Password minimal 6 karakter' });
    const hash = await bcrypt.hash(password, 10);
    await Staff.findByIdAndUpdate(req.params.id, { password: hash });
    res.json({ success: true, message: 'Password berhasil direset' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    await Staff.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Staff dihapus' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
