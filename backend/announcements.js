const express = require('express');
const router = express.Router();
const Announcement = require('../models/Announcement');
const { authMiddleware, adminOnly } = require('../middleware/auth');

// GET /api/announcements - Semua staff bisa lihat pengumuman aktif
router.get('/', authMiddleware, async (req, res) => {
  try {
    const now = new Date();
    const announcements = await Announcement.find({
      isActive: true,
      $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
    }).sort({ createdAt: -1 }).limit(10);
    res.json({ success: true, data: announcements });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// POST /api/announcements - Admin buat pengumuman
router.post('/', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { title, content, priority = 'normal', expiresAt } = req.body;
    if (!title || !content) return res.status(400).json({ success: false, message: 'Title dan content wajib diisi.' });
    const ann = new Announcement({
      title: title.trim(),
      content: content.trim(),
      priority,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      createdBy: req.user._id,
    });
    await ann.save();
    res.json({ success: true, data: ann, message: 'Pengumuman berhasil dibuat.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// PUT /api/announcements/:id - Admin edit
router.put('/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { title, content, priority, isActive, expiresAt } = req.body;
    const ann = await Announcement.findByIdAndUpdate(req.params.id,
      { title, content, priority, isActive, expiresAt: expiresAt ? new Date(expiresAt) : null },
      { new: true }
    );
    if (!ann) return res.status(404).json({ success: false, message: 'Tidak ditemukan.' });
    res.json({ success: true, data: ann });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// DELETE /api/announcements/:id - Admin hapus
router.delete('/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    await Announcement.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Pengumuman dihapus.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;
