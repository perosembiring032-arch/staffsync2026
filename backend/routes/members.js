const router = require('express').Router();
const { auth, staffOnly, adminOnly } = require('../middleware/auth');
const MemberInput = require('../models/MemberInput');

const MIN_DEPOSIT = 10000;
const VALID_DEPOSIT = 50000;

const getToday = () => new Date().toISOString().split('T')[0];

// GET today's input (staff)
router.get('/today', auth, staffOnly, async (req, res) => {
  try {
    const input = await MemberInput.findOne({ staffId: req.staff._id, date: getToday() });
    const members = input?.members || [];
    const validCount = members.filter(m => m.isValid).length;
    const totalDeposit = members.reduce((s, m) => s + m.deposit, 0);
    let breakAllowed = '0';
    if (validCount >= 3) breakAllowed = '2';
    else if (validCount >= 1) breakAllowed = '1';
    res.json({ success: true, data: { members, validCount, totalDeposit, breakAllowed, targetMet: validCount >= 3, targetReached: validCount >= 3 } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST add member
router.post('/add', auth, staffOnly, async (req, res) => {
  try {
    const { memberId, deposit } = req.body;
    if (!memberId || !deposit) return res.json({ success: false, message: 'Member ID dan deposit wajib diisi' });
    const dep = Number(deposit);
    if (isNaN(dep) || dep < MIN_DEPOSIT) return res.json({ success: false, message: `Deposit minimal Rp ${MIN_DEPOSIT.toLocaleString('id-ID')}` });

    const today = getToday();
    let input = await MemberInput.findOne({ staffId: req.staff._id, date: today });
    if (!input) input = new MemberInput({ staffId: req.staff._id, date: today, members: [] });

    const isDup = input.members.some(m => m.memberId === memberId);
    if (isDup) return res.json({ success: false, message: 'Member ID sudah ada hari ini' });

    const isValid = dep >= VALID_DEPOSIT;
    input.members.push({ memberId, deposit: dep, isValid });
    const validCount = input.members.filter(m => m.isValid).length;
    input.targetMet = validCount >= 3;
    await input.save();

    res.json({ success: true, message: `Member berhasil ditambahkan${isValid ? '' : ' (deposit di bawah Rp 50.000, tidak valid untuk target)'}`, data: input.members });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT edit member by index
router.put('/edit/:index', auth, staffOnly, async (req, res) => {
  try {
    const idx = parseInt(req.params.index);
    const { memberId, deposit } = req.body;
    const dep = Number(deposit);
    if (isNaN(dep) || dep < MIN_DEPOSIT) return res.json({ success: false, message: `Deposit minimal Rp ${MIN_DEPOSIT.toLocaleString('id-ID')}` });

    const input = await MemberInput.findOne({ staffId: req.staff._id, date: getToday() });
    if (!input || !input.members[idx]) return res.json({ success: false, message: 'Member tidak ditemukan' });

    const isDup = input.members.some((m, i) => m.memberId === memberId && i !== idx);
    if (isDup) return res.json({ success: false, message: 'Member ID sudah ada hari ini' });

    input.members[idx].memberId = memberId;
    input.members[idx].deposit = dep;
    input.members[idx].isValid = dep >= VALID_DEPOSIT;
    const validCount = input.members.filter(m => m.isValid).length;
    input.targetMet = validCount >= 3;
    input.markModified('members');
    await input.save();

    res.json({ success: true, message: 'Member berhasil diupdate', data: input.members });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET all staff inputs today (admin) - /admin/today
router.get('/admin/today', auth, adminOnly, async (req, res) => {
  try {
    const inputs = await MemberInput.find({ date: getToday() }).populate('staffId', 'fullName name username employeeId');
    res.json({ success: true, data: inputs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET all staff summary - /admin/all (supports ?date=YYYY-MM-DD)
router.get('/admin/all', auth, adminOnly, async (req, res) => {
  try {
    const date = req.query.date || getToday();
    const inputs = await MemberInput.find({ date }).populate('staffId', 'fullName name username employeeId');
    const data = inputs.map(inp => {
      const members = inp.members || [];
      const validCount = members.filter(m => m.isValid).length;
      const totalDeposit = members.reduce((s, m) => s + m.deposit, 0);
      return {
        staffId: inp.staffId?._id,
        name: inp.staffId?.fullName || inp.staffId?.name || inp.staffId?.username || '—',
        fullName: inp.staffId?.fullName || inp.staffId?.name || inp.staffId?.username || '—',
        employeeId: inp.staffId?.employeeId || '—',
        username: inp.staffId?.username || '—',
        members,
        validCount,
        totalDeposit,
        targetReached: validCount >= 3,
        date: inp.date
      };
    });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET history (admin) - /admin/history
router.get('/admin/history', auth, adminOnly, async (req, res) => {
  try {
    const inputs = await MemberInput.find({}).populate('staffId', 'fullName name username employeeId').sort({ date: -1 }).limit(200);
    res.json({ success: true, data: inputs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
