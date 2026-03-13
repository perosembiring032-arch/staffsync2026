const router = require('express').Router();
const { auth, adminOnly } = require('../middleware/auth');
const IpWhitelist = require('../models/IpWhitelist');

// GET /myip — return IP client saat ini
router.get('/myip', async (req, res) => {
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim()
           || req.socket?.remoteAddress
           || req.connection?.remoteAddress
           || 'unknown';
  res.json({ success: true, ip });
});

// GET / — list semua IP
router.get('/', auth, adminOnly, async (req, res) => {
  try {
    const list = await IpWhitelist.find({}).sort({ createdAt: -1 });
    res.json({ success: true, data: list });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST / — tambah IP
router.post('/', auth, adminOnly, async (req, res) => {
  try {
    const { ip, label } = req.body;
    if (!ip) return res.json({ success: false, message: 'IP wajib diisi' });
    const exists = await IpWhitelist.findOne({ ip });
    if (exists) return res.json({ success: false, message: 'IP sudah ada' });
    const entry = await IpWhitelist.create({ ip, label, isActive: true });
    res.json({ success: true, message: 'IP ditambahkan', data: entry });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /:id/toggle — toggle aktif
router.patch('/:id/toggle', auth, adminOnly, async (req, res) => {
  try {
    const entry = await IpWhitelist.findById(req.params.id);
    if (!entry) return res.json({ success: false, message: 'IP tidak ditemukan' });
    entry.isActive = !entry.isActive;
    await entry.save();
    res.json({ success: true, data: entry });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /:id — hapus IP
router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    await IpWhitelist.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'IP dihapus' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
