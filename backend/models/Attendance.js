const mongoose = require('mongoose');
const attSchema = new mongoose.Schema({
  staffId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' },
  date:     String,
  clockIn:  Date,
  clockOut: Date,
  isPresent:{ type: Boolean, default: false },
}, { timestamps: true });
module.exports = mongoose.model('Attendance', attSchema);
