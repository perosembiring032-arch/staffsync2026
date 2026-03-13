const router = require('express').Router();
const { auth, staffOnly, adminOnly } = require('../middleware/auth');
const Permission = require('../models/Permission');
const Staff = require('../models/Staff');

const TOTAL_LIMIT = 1800; // 30 menit dalam detik
const getToday = () => new Date().toISOString().split('T')[0];

const getOrCreate = async (staffId) => {
  let perm = await Permission.findOne({ staffId, date: getToday() });
  if (!perm) perm = await Permission.create({ staffId, date: getToday(), totalLimitSeconds: TOTAL_LIMIT });
  return perm;
};

const buildResponse = (perm) => ({
  totalLimitSeconds: perm.totalLimitSeconds,
  totalUsedSeconds: perm.totalUsedSeconds,
  totalOvertimeSeconds: perm.totalOvertimeSeconds,
  remainingSeconds: Math.max(0, perm.totalLimitSeconds - perm.totalUsedSeconds),
  activeTimer: perm.activeTimer,
  timerStartAt: perm.timerStartAt,
  sessions: perm.sessions,
});

// GET today status (staff)
router.get('/today', auth, staffOnly, async (req, res) => {
  try {
    const perm = await getOrCreate(req.staff._id);
    res.json({ success: true, data: buildResponse(perm) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST start izin (keluar)
router.post('/start', auth, staffOnly, async (req, res) => {
  try {
    const perm = await getOrCreate(req.staff._id);
    if (perm.activeTimer) return res.json({ success: false, message: 'Anda sudah sedang izin' });
    const remaining = perm.totalLimitSeconds - perm.totalUsedSeconds;
    if (remaining <= 0) return res.json({ success: false, message: 'Jatah izin hari ini sudah habis' });

    perm.activeTimer = 'izin';
    perm.timerStartAt = new Date();
    await perm.save();

    res.json({ success: true, message: 'Izin dimulai. Segera kembali!', data: buildResponse(perm) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST stop izin (masuk)
router.post('/stop', auth, staffOnly, async (req, res) => {
  try {
    const perm = await getOrCreate(req.staff._id);
    if (!perm.activeTimer) return res.json({ success: false, message: 'Tidak ada izin yang aktif' });

    const now = new Date();
    const dur = Math.floor((now - perm.timerStartAt) / 1000);
    const remaining = perm.totalLimitSeconds - perm.totalUsedSeconds;
    const overtimeSec = Math.max(0, dur - remaining);
    const usedThisSession = Math.min(dur, remaining);

    perm.sessions.push({
      startAt: perm.timerStartAt,
      endAt: now,
      durationSeconds: dur,
      isOvertime: overtimeSec > 0,
      overtimeSeconds: overtimeSec,
    });

    perm.totalUsedSeconds += usedThisSession;
    perm.totalOvertimeSeconds += overtimeSec;
    perm.activeTimer = null;
    perm.timerStartAt = null;
    await perm.save();

    const msg = overtimeSec > 0
      ? `Kembali dicatat. Overtime ${Math.floor(overtimeSec/60)}m ${overtimeSec%60}s`
      : `Kembali dicatat. Durasi: ${Math.floor(dur/60)}m ${dur%60}s`;
    res.json({ success: true, message: msg, data: buildResponse(perm) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET admin logs
router.get('/admin/logs', auth, adminOnly, async (req, res) => {
  try {
    const today = getToday();
    const staffList = await Staff.find({ role: 'staff', isActive: true });
    const perms = await Permission.find({ date: today });

    const result = staffList.map(s => {
      const p = perms.find(x => x.staffId.toString() === s._id.toString());
      return {
        staffId: s._id,
        fullName: s.fullName || s.name || s.username || '—',
        employeeId: s.employeeId,
        totalUsedSeconds: p?.totalUsedSeconds || 0,
        totalOvertimeSeconds: p?.totalOvertimeSeconds || 0,
        remainingSeconds: p ? Math.max(0, TOTAL_LIMIT - p.totalUsedSeconds) : TOTAL_LIMIT,
        activeTimer: p?.activeTimer || null,
        sessions: p?.sessions || [],
      };
    });

    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
