const mongoose = require('mongoose');

const staffSchema = new mongoose.Schema({
  username:   { type: String, required: true, unique: true },
  password:   { type: String, required: true },
  fullName:   { type: String, default: '' },
  name:       { type: String, default: '' },
  employeeId: { type: String, required: true, unique: true },
  role:       { type: String, enum: ['staff', 'admin'], default: 'staff' },
  isActive:   { type: Boolean, default: true },
}, { timestamps: true });

// Virtual: ambil nama dari fullName atau name atau username
staffSchema.virtual('displayName').get(function() {
  return this.fullName || this.name || this.username || '—';
});

module.exports = mongoose.model('Staff', staffSchema);
