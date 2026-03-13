const mongoose = require('mongoose');

const permissionSchema = new mongoose.Schema({
  staffId: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff', required: true },
  date: { type: String, required: true },

  // Single izin - total 30 menit per hari
  totalLimitSeconds: { type: Number, default: 1800 }, // 30 menit
  totalUsedSeconds: { type: Number, default: 0 },     // total sudah dipakai
  totalOvertimeSeconds: { type: Number, default: 0 }, // total overtime

  activeTimer: { type: String, enum: ['izin', null], default: null },
  timerStartAt: { type: Date, default: null },

  // Log setiap keluar-masuk
  sessions: [{
    startAt: { type: Date },
    endAt: { type: Date, default: null },
    durationSeconds: { type: Number, default: 0 },
    isOvertime: { type: Boolean, default: false },
    overtimeSeconds: { type: Number, default: 0 },
  }],
});

permissionSchema.index({ staffId: 1, date: 1 }, { unique: true });
module.exports = mongoose.model('Permission', permissionSchema);
