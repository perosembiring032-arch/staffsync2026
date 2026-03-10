const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  staffId: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff', required: true },
  date: { type: String, required: true }, // "2026-03-10"
  clockIn: { type: Date, default: null },
  clockOut: { type: Date, default: null },
  status: { type: String, enum: ['hadir', 'absen', 'terlambat'], default: 'hadir' },
  notes: { type: String, default: '' },
});

attendanceSchema.index({ staffId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
