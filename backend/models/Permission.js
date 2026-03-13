const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  startAt:         Date,
  endAt:           Date,
  durationSeconds: { type: Number, default: 0 },
  isOvertime:      { type: Boolean, default: false },
  overtimeSeconds: { type: Number, default: 0 },
}, { _id: false });

const permissionSchema = new mongoose.Schema({
  staffId:             { type: mongoose.Schema.Types.ObjectId, ref: 'Staff', required: true },
  date:                { type: String, required: true },
  totalLimitSeconds:   { type: Number, default: 1800 },
  totalUsedSeconds:    { type: Number, default: 0 },
  totalOvertimeSeconds:{ type: Number, default: 0 },
  activeTimer:         { type: String, default: null },
  timerStartAt:        { type: Date, default: null },
  sessions:            [sessionSchema],
}, { timestamps: true });

module.exports = mongoose.model('Permission', permissionSchema);
