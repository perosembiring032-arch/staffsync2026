const router       = require('express').Router();
const { auth, adminOnly } = require('../middleware/auth');
const Announcement = require('../models/Announcement');

// GET /announcements — semua pengumuman aktif (staff & admin bisa akses)
router.get('/', auth, async (req, res) => {
  try {
    const now   = new Date();
    const list  = await Announcement.find({
      $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }]
    }).sort({ createdAt: -1 }).limit(20);
    res.json({ success: true, data: list });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// POST /announcements — buat pengumuman baru (admin only)
router.post('/', auth, adminOnly, async (req, res) => {
  try {
    const { title, content, priority, expiresAt } = req.body;
    if (!title || !content)
      return res.json({ success: false, message: 'Judul dan isi wajib diisi.' });
    const ann = await Announcement.create({
      title, content,
      priority:  priority  || 'normal',
      expiresAt: expiresAt || null,
      createdBy: req.staff._id,
    });
    res.json({ success: true, message: 'Pengumuman berhasil dikirim.', data: ann });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// PUT /announcements/:id — edit pengumuman (admin only)
router.put('/:id', auth, adminOnly, async (req, res) => {
  try {
    const { title, content, priority, expiresAt } = req.body;
    const ann = await Announcement.findByIdAndUpdate(
      req.params.id,
      { title, content, priority, expiresAt: expiresAt || null },
      { new: true }
    );
    if (!ann) return res.json({ success: false, message: 'Pengumuman tidak ditemukan.' });
    res.json({ success: true, message: 'Pengumuman diperbarui.', data: ann });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// DELETE /announcements/:id — hapus pengumuman (admin only)
router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    await Announcement.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Pengumuman dihapus.' });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

module.exports = router;
