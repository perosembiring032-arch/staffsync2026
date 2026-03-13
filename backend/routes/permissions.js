const express = require('express');
const router = express.Router();
const Permission = require('../models/Permission');
const { authMiddleware, staffOnly, adminOnly } = require('../middleware/auth');

const getToday = () => new Date().toISOString().split('T')[0];
const TOTAL_LIMIT = 1800; // 30 menit total per hari

function buildResponse(record) {
  const now = new Date();
  let secondsRunning = 0;
  let timerSecondsLeft = null;

  if (record.activeTimer && record.timerStartAt) {
    secondsRunning = Math.floor((now - record.timerStartAt) / 1000);
    const alreadyUsed = record.totalUsedSeconds;
    const remaining = Math.max(0, TOTAL_LIMIT - alreadyUsed - secondsRunning);
    timerSecondsLeft = remaining; // bisa 0 (artinya overtime)
  }

  const remainingSeconds = Math.max(0, TOTAL_LIMIT - record.totalUsedSeconds);

  return {
    totalLimitSeconds: TOTAL_LIMIT,
    totalUsedSeconds: record.totalUsedSeconds,
    totalOvertimeSeconds: record.totalOvertimeSeconds,
    remainingSeconds,
    activeTimer: record.activeTimer,
    timerStartAt: record.timerStartAt,
    timerSecondsLeft,
    secondsRunning,
    sessions: record.sessions,
  };
}

// POST /api/permissions/start - Staff mulai keluar
router.post('/start', authMiddleware, staffOnly, async (req, res) => {
  try {
    const staffId = req.user._id;
    const today = getToday();
    let record = await Permission.findOne({ staffId, date: today });
    if (!record) record = new Permission({ staffId, date: today });

    if (record.activeTimer) {
      return res.status(400).json({ success: false, message: 'Masih ada izin aktif. Klik Masuk dulu.' });
    }

    const now = new Date();
    record.activeTimer = 'izin';
    record.timerStartAt = now;
    record.sessions.push({ startAt: now });
    await record.save();

    const remaining = Math.max(0, TOTAL_LIMIT - record.totalUsedSeconds);
    const mnt = Math.floor(remaining / 60);
    const dtk = remaining % 60;
    res.json({
      success: true,
      message: `Izin dimulai. Sisa jatah: ${mnt}m ${dtk}s.`,
      data: buildResponse(record),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// POST /api/permissions/stop - Staff kembali
router.post('/stop', authMiddleware, staffOnly, async (req, res) => {
  try {
    const staffId = req.user._id;
    const today = getToday();
    const record = await Permission.findOne({ staffId, date: today });
    if (!record || !record.activeTimer) {
      return res.status(400).json({ success: false, message: 'Tidak ada timer aktif.' });
    }

    const now = new Date();
    const elapsed = Math.floor((now - record.timerStartAt) / 1000);

    // Hitung sisa jatah sebelum sesi ini
    const beforeUsed = record.totalUsedSeconds;
    const remainingBefore = Math.max(0, TOTAL_LIMIT - beforeUsed);

    const actualUsed = Math.min(elapsed, remainingBefore);
    const overtime = Math.max(0, elapsed - remainingBefore);

    record.totalUsedSeconds += actualUsed;
    record.totalOvertimeSeconds += overtime;

    // Update sesi terakhir
    const lastSession = record.sessions[record.sessions.length - 1];
    lastSession.endAt = now;
    lastSession.durationSeconds = elapsed;
    lastSession.isOvertime = overtime > 0;
    lastSession.overtimeSeconds = overtime;

    record.activeTimer = null;
    record.timerStartAt = null;
    await record.save();

    const remainingAfter = Math.max(0, TOTAL_LIMIT - record.totalUsedSeconds);
    let msg = `Kembali! Durasi keluar: ${Math.floor(elapsed/60)}m ${elapsed%60}s.`;
    if (overtime > 0) {
      msg += ` ⚠️ Overtime ${Math.floor(overtime/60)}m ${overtime%60}s!`;
    } else {
      msg += ` Sisa jatah: ${Math.floor(remainingAfter/60)}m ${remainingAfter%60}s.`;
    }

    res.json({ success: true, message: msg, data: buildResponse(record) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// GET /api/permissions/today - Staff lihat status izin hari ini
router.get('/today', authMiddleware, staffOnly, async (req, res) => {
  try {
    const today = getToday();
    const record = await Permission.findOne({ staffId: req.user._id, date: today });
    if (!record) {
      return res.json({ success: true, data: {
        totalLimitSeconds: TOTAL_LIMIT,
        totalUsedSeconds: 0,
        totalOvertimeSeconds: 0,
        remainingSeconds: TOTAL_LIMIT,
        activeTimer: null,
        timerStartAt: null,
        timerSecondsLeft: null,
        secondsRunning: 0,
        sessions: [],
      }});
    }
    res.json({ success: true, data: buildResponse(record) });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// GET /api/permissions/admin/logs - Admin lihat log izin per staff
router.get('/admin/logs', authMiddleware, adminOnly, async (req, res) => {
  try {
    const date = req.query.date || getToday();
    const records = await Permission.find({ date }).populate('staffId', 'name username employeeId');

    const summary = records.map(r => {
      const sessions = r.sessions.map(s => ({
        startAt: s.startAt,
        endAt: s.endAt,
        durationSeconds: s.durationSeconds,
        isOvertime: s.isOvertime,
        overtimeSeconds: s.overtimeSeconds,
      }));

      return {
        staffName: r.staffId?.name || '-',
        username: r.staffId?.username || '-',
        employeeId: r.staffId?.employeeId || '-',
        totalUsedSeconds: r.totalUsedSeconds,
        totalOvertimeSeconds: r.totalOvertimeSeconds,
        remainingSeconds: Math.max(0, TOTAL_LIMIT - r.totalUsedSeconds),
        activeTimer: r.activeTimer,
        sessionCount: r.sessions.length,
        sessions,
      };
    });

    res.json({ success: true, date, data: summary });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;
