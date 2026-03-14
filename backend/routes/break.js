const router = require('express').Router();
const { auth, staffOnly, adminOnly } = require('../middleware/auth');
const BreakSession = require('../models/BreakSession');
const MemberInput  = require('../models/MemberInput');
const Staff        = require('../models/Staff');

const getToday = () => {
  const wib = new Date(new Date().getTime() + 7 * 60 * 60 * 1000);
  return wib.toISOString().split('T')[0];
};

// Hitung jatah break (menit) berdasarkan validCount
function hitungJatah(validCount) {
  if (validCount <= 0) return 0;
  if (validCount <= 2) return 60;
  return 120;
}

// ── GET /break/today ── status break staff hari ini
router.get('/today', auth, staffOnly, async (req, res) => {
  try {
    const today = getToday();
    // Ambil validCount dari memberinput hari ini
    const MemberInput = require('../models/MemberInput');
    const mi = await MemberInput.findOne({ staffId: req.user.id, date: today });
    const validCount = mi ? mi.members.filter(m => m.deposit >= 50000).length : 0;
    const jatahMenit = hitungJatah(validCount);

    let session = await BreakSession.findOne({ staffId: req.user.id, date: today });
    if (!session) {
      return res.json({ success: true, data: {
        status: 'idle', jatahMenit, validCount,
        startTime: null, endTime: null, durasiAktual: 0, overtime: 0
      }});
    }
    res.json({ success: true, data: {
      status: session.status,
      jatahMenit: session.jatahMenit,
      validCount,
      startTime: session.startTime,
      endTime:   session.endTime,
      durasiAktual: session.durasiAktual,
      overtime:  session.overtime,
    }});
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// ── POST /break/start ── mulai break
router.post('/start', auth, staffOnly, async (req, res) => {
  try {
    const today = getToday();
    const mi = await MemberInput.findOne({ staffId: req.user.id, date: today });
    const validCount = mi ? mi.members.filter(m => m.deposit >= 50000).length : 0;
    const jatahMenit = hitungJatah(validCount);

    if (jatahMenit === 0) return res.status(400).json({ success: false, message: 'Belum ada member valid, tidak dapat break.' });

    let session = await BreakSession.findOne({ staffId: req.user.id, date: today });
    if (session && session.status === 'on_break') return res.status(400).json({ success: false, message: 'Break sedang berjalan.' });
    if (session && session.status === 'done')    return res.status(400).json({ success: false, message: 'Break hari ini sudah selesai.' });

    if (!session) {
      session = new BreakSession({ staffId: req.user.id, date: today, jatahMenit });
    }
    session.startTime = new Date();
    session.status    = 'on_break';
    await session.save();

    res.json({ success: true, message: 'Break dimulai!', data: { startTime: session.startTime, jatahMenit } });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// ── POST /break/end ── selesai break
router.post('/end', auth, staffOnly, async (req, res) => {
  try {
    const today = getToday();
    const session = await BreakSession.findOne({ staffId: req.user.id, date: today });

    if (!session || session.status !== 'on_break') return res.status(400).json({ success: false, message: 'Tidak ada break yang sedang berjalan.' });

    const endTime     = new Date();
    const durasiDetik = Math.round((endTime - session.startTime) / 1000);
    const jatahDetik  = session.jatahMenit * 60;
    const overtime    = Math.max(0, durasiDetik - jatahDetik);

    session.endTime      = endTime;
    session.durasiAktual = durasiDetik;
    session.overtime     = overtime;
    session.status       = 'done';
    await session.save();

    const overtimeMenit = Math.round(overtime / 60);
    res.json({ success: true, message: overtime > 0 ? `Break selesai. Telat ${overtimeMenit} menit!` : 'Break selesai tepat waktu!',
      data: { durasiAktual: durasiDetik, overtime, overtimeMenit, jatahMenit: session.jatahMenit }
    });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// ── GET /break/admin/today ── admin lihat semua break hari ini
router.get('/admin/today', auth, adminOnly, async (req, res) => {
  try {
    const today = getToday();
    const sessions = await BreakSession.find({ date: today })
      .populate('staffId', 'fullName name username employeeId');

    const result = sessions.map(s => ({
      _id:         s._id,
      nama:        s.staffId?.fullName || s.staffId?.name || s.staffId?.username || '—',
      employeeId:  s.staffId?.employeeId || '—',
      jatahMenit:  s.jatahMenit,
      status:      s.status,
      startTime:   s.startTime,
      endTime:     s.endTime,
      durasiAktual: s.durasiAktual,
      overtime:    s.overtime,
      overtimeMenit: Math.round(s.overtime / 60),
    }));

    res.json({ success: true, data: result });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// ── GET /break/admin/all ── admin histori semua break (opsional ?date=)
router.get('/admin/all', auth, adminOnly, async (req, res) => {
  try {
    const filter = {};
    if (req.query.date) filter.date = req.query.date;
    const sessions = await BreakSession.find(filter).sort({ createdAt: -1 }).limit(200)
      .populate('staffId', 'fullName name username employeeId');

    const result = sessions.map(s => ({
      _id:         s._id,
      date:        s.date,
      nama:        s.staffId?.fullName || s.staffId?.name || s.staffId?.username || '—',
      employeeId:  s.staffId?.employeeId || '—',
      jatahMenit:  s.jatahMenit,
      status:      s.status,
      startTime:   s.startTime,
      endTime:     s.endTime,
      durasiAktual: s.durasiAktual,
      overtime:    s.overtime,
      overtimeMenit: Math.round(s.overtime / 60),
    }));

    res.json({ success: true, data: result });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

module.exports = router;
