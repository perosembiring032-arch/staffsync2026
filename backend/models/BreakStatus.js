const mongoose = require('mongoose');

const breakStatusSchema = new mongoose.Schema({
  staffId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' },
  date:      String,
  breakType: String,
  startAt:   Date,
  endAt:     Date,
  isActive:  { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('BreakStatus', breakStatusSchema);
