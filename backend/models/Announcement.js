const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  content: { type: String, required: true, trim: true },
  priority: { type: String, enum: ['normal', 'penting', 'urgent'], default: 'normal' },
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, default: null },
});

module.exports = mongoose.model('Announcement', announcementSchema);
