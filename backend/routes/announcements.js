const router = require('express').Router();
const { auth, adminOnly } = require('../middleware/auth');
const Announcement = require('../models/Announcement');

router.get('/', auth, async (req, res) => {
  try {
    const list = await Announcement.find({}).sort({ createdAt: -1 }).limit(10);
    res.json({ success: true, data: list });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/', auth, adminOnly, async (req, res) => {
  try {
    const { title, content } = req.body;
    const ann = await Announcement.create({ title, content, createdBy: req.staff._id });
    res.json({ success: true, message: 'Pengumuman dibuat', data: ann });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    await Announcement.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Pengumuman dihapus' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
