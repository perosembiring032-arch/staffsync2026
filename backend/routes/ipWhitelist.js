const express = require('express');
const router = express.Router();
const IpWhitelist = require('../models/IpWhitelist');
const { authMiddleware, adminOnly } = require('../middleware/auth');
const { getClientIP } = require('../middleware/ipWhitelist');

// GET /api/ip-whitelist — list all
router.get('/', authMiddleware, adminOnly, async (req, res) => {
  try {
    const list = await IpWhitelist.find().sort({ createdAt: -1 });
    res.json({ success: true, data: list });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// GET /api/ip-whitelist/myip — get caller's IP
router.get('/myip', authMiddleware, adminOnly, (req, res) => {
  const ip = getClientIP(req);
  res.json({ success: true, ip });
});

// POST /api/ip-whitelist — add IP
router.post('/', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { ip, label } = req.body;
    if (!ip) return res.status(400).json({ success: false, message: 'IP is required.' });

    const existing = await IpWhitelist.findOne({ ip });
    if (existing) {
      if (!existing.isActive) {
        existing.isActive = true;
        existing.label = label || existing.label;
        await existing.save();
        return res.json({ success: true, message: 'IP re-activated.', data: existing });
      }
      return res.status(400).json({ success: false, message: 'IP already whitelisted.' });
    }

    const entry = await IpWhitelist.create({ ip, label: label || '', addedBy: req.user._id });
    res.status(201).json({ success: true, message: 'IP added to whitelist.', data: entry });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// DELETE /api/ip-whitelist/:id — remove IP
router.delete('/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const entry = await IpWhitelist.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!entry) return res.status(404).json({ success: false, message: 'Not found.' });
    res.json({ success: true, message: 'IP removed from whitelist.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;
