const express = require('express');
const router = express.Router();
const Permission = require('../models/Permission');
const { authMiddleware, staffOnly, adminOnly } = require('../middleware/auth');

const getToday = () => new Date().toISOString().split('T')[0];
const TIMER_SECONDS = 600; // 10 menit

const fieldMap = {
  toilet: { used: 'toiletUsed', startAt: 'toiletStartAt', endAt: 'toiletEndAt', dur: 'toiletDurationSeconds' },
  smoke_1: { used: 'smoke1Used', startAt: 'smoke1StartAt', endAt: 'smoke1EndAt', dur: 'smoke1DurationSeconds' },
  smoke_2: { used: 'smoke2Used', startAt: 'smoke2StartAt', endAt: 'smoke2EndAt', dur: 'smoke2DurationSeconds' },
};

function buildResponse(record) {
  const now = new Date();
  let timerSecondsLeft = null;
  if (record.activeTimer && record.timerStartAt) {
    const elapsed = Math.floor((now - record.timerStartAt) / 1000);
    timerSecondsLeft = Math.max(0, TIMER_SECONDS - elapsed);
  }
  return {
    toiletUsed: record.toiletUsed,
    toiletStartAt: record.toiletStartAt,
    toiletEndAt: record.toiletEndAt,
    toiletDurationSeconds: record.toiletDurationSeconds,
    smoke1Used: record.smoke1Used,
    smoke1StartAt: record.smoke1StartAt,
    smoke1EndAt: record.smoke1EndAt,
    smoke1DurationSeconds: record.smoke1DurationSeconds,
    smoke2Used: record.smoke2Used,
    smoke2StartAt: record.smoke2StartAt,
    smoke2EndAt: record.smoke2EndAt,
    smoke2DurationSeconds: record.smoke2DurationSeconds,
    activeTimer: record.activeTimer,
    timerStartAt: record.timerStartAt,
    timerSecondsLeft,
    logs: record.logs,
  };
}

// POST /api/permissions/start - Staff mulai timer izin
router.post('/start', authMiddleware, staffOnly, async (req, res) => {
  try {
    const { type } = req.body;
    if (!fieldMap[type]) return res.status(400).json({ success: false, message: 'Tipe izin tidak valid.' });
    const staffId = req.user._id;
    const today = getToday();
    let record = await Permission.findOne({ staffId, date: today });
    if (!record) record = new Permission({ staffId, date: today });

    // Cek jika ada timer aktif
    if (record.activeTimer) return res.status(400).json({ success: false, message: 'Ada izin yang sedang berjalan. Tekan Masuk dulu.' });

    const f = fieldMap[type];
    if (record[f.used]) return res.status(400).json({ success: false, message: 'Izin ini sudah dipakai hari ini.' });

    const now = new Date();
    record.activeTimer = type;
    record.timerStartAt = now;
    record[f.startAt] = now;
    record.logs.push({ type, action: 'start', at: now, durationSeconds: 0 });
    await record.save();

    res.json({ success: true, message: 'Timer izin dimulai. Kamu punya 10 menit.', data: buildResponse(record) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// POST /api/permissions/stop - Staff kembali (stop timer)
router.post('/stop', authMiddleware, staffOnly, async (req, res) => {
  try {
    const staffId = req.user._id;
    const today = getToday();
    const record = await Permission.findOne({ staffId, date: today });
    if (!record || !record.activeTimer) return res.status(400).json({ success: false, message: 'Tidak ada timer aktif.' });

    const now = new Date();
    const elapsed = Math.floor((now - record.timerStartAt) / 1000);
    const type = record.activeTimer;
    const f = fieldMap[type];

    record[f.endAt] = now;
    record[f.dur] = elapsed;
    record[f.used] = true;

    // Jika overtime (lebih dari 10 menit), kurangi dari izin berikutnya otomatis
    const overtime = Math.max(0, elapsed - TIMER_SECONDS);
    let overtimeMsg = '';
    if (overtime > 0) {
      record.logs.push({ type, action: 'overtime', at: now, durationSeconds: overtime });
      // Auto-consume next available izin for overtime
      const order = ['toilet', 'smoke_1', 'smoke_2'];
      const nextIdx = order.indexOf(type) + 1;
      for (let i = nextIdx; i < order.length; i++) {
        const nf = fieldMap[order[i]];
        if (!record[nf.used]) {
          record[nf.used] = true;
          record[nf.startAt] = new Date(record.timerStartAt.getTime() + TIMER_SECONDS * 1000);
          record[nf.endAt] = now;
          record[nf.dur] = overtime;
          record.logs.push({ type: order[i], action: 'overtime', at: now, durationSeconds: overtime });
          overtimeMsg = ` Overtime ${Math.floor(overtime/60)}m ${overtime%60}s — Izin ${i+1} otomatis terpotong.`;
          break;
        }
      }
    }

    record.activeTimer = null;
    record.timerStartAt = null;
    record.logs.push({ type, action: 'stop', at: now, durationSeconds: elapsed });
    await record.save();

    res.json({ success: true, message: `Izin selesai. Durasi: ${Math.floor(elapsed/60)}m ${elapsed%60}s.${overtimeMsg}`, data: buildResponse(record) });
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
        toiletUsed: false, toiletStartAt: null, toiletEndAt: null, toiletDurationSeconds: 0,
        smoke1Used: false, smoke1StartAt: null, smoke1EndAt: null, smoke1DurationSeconds: 0,
        smoke2Used: false, smoke2StartAt: null, smoke2EndAt: null, smoke2DurationSeconds: 0,
        activeTimer: null, timerStartAt: null, timerSecondsLeft: null, logs: [],
      }});
    }
    res.json({ success: true, data: buildResponse(record) });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// GET /api/permissions/admin/logs - Admin lihat log izin
router.get('/admin/logs', authMiddleware, adminOnly, async (req, res) => {
  try {
    const date = req.query.date || getToday();
    const records = await Permission.find({ date }).populate('staffId', 'name username employeeId');
    const logs = [];
    records.forEach(r => {
      r.logs.forEach(log => {
        if (log.action === 'start') {
          logs.push({
            staffName: r.staffId?.name,
            username: r.staffId?.username,
            employeeId: r.staffId?.employeeId,
            type: log.type,
            action: log.action,
            usedAt: log.at,
            durationSeconds: log.durationSeconds,
          });
        }
      });
      // Also include end info
      const endLogs = r.logs.filter(l => l.action === 'stop' || l.action === 'overtime');
      endLogs.forEach(log => {
        logs.push({
          staffName: r.staffId?.name,
          username: r.staffId?.username,
          employeeId: r.staffId?.employeeId,
          type: log.type,
          action: log.action,
          usedAt: log.at,
          durationSeconds: log.durationSeconds,
        });
      });
    });
    logs.sort((a, b) => new Date(b.usedAt) - new Date(a.usedAt));

    // Also build summary per staff
    const summary = records.map(r => ({
      staffName: r.staffId?.name,
      employeeId: r.staffId?.employeeId,
      toiletUsed: r.toiletUsed, toiletDur: r.toiletDurationSeconds,
      smoke1Used: r.smoke1Used, smoke1Dur: r.smoke1DurationSeconds,
      smoke2Used: r.smoke2Used, smoke2Dur: r.smoke2DurationSeconds,
      activeTimer: r.activeTimer,
    }));

    res.json({ success: true, date, data: logs, summary });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;
