const router = require('express').Router();
const { auth, adminOnly } = require('../middleware/auth');
const IpWhitelist = require('../models/IpWhitelist');

router.get('/', auth, adminOnly, async (req, res) => {
  try {
    const list = await IpWhitelist.find({}).sort({ createdAt: -1 });
    res.json({ success: true, data: list });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/', auth, adminOnly, async (req, res) => {
  try {
    const { ip, label } = req.body;
    if (!ip) return res.json({ success: false, message: 'IP wajib diisi' });
    const exists = await IpWhitelist.findOne({ ip });
    if (exists) return res.json({ success: false, message: 'IP sudah ada' });
    const entry = await IpWhitelist.create({ ip, label });
    res.json({ success: true, message: 'IP ditambahkan', data: entry });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    await IpWhitelist.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'IP dihapus' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
