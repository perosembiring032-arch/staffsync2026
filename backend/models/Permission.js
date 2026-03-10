const mongoose = require('mongoose');

const permissionSchema = new mongoose.Schema({
  staffId: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff', required: true },
  date: { type: String, required: true },

  toiletUsed: { type: Boolean, default: false },
  toiletStartAt: { type: Date, default: null },
  toiletEndAt: { type: Date, default: null },
  toiletDurationSeconds: { type: Number, default: 0 },

  smoke1Used: { type: Boolean, default: false },
  smoke1StartAt: { type: Date, default: null },
  smoke1EndAt: { type: Date, default: null },
  smoke1DurationSeconds: { type: Number, default: 0 },

  smoke2Used: { type: Boolean, default: false },
  smoke2StartAt: { type: Date, default: null },
  smoke2EndAt: { type: Date, default: null },
  smoke2DurationSeconds: { type: Number, default: 0 },

  activeTimer: { type: String, enum: ['toilet', 'smoke_1', 'smoke_2', null], default: null },
  timerStartAt: { type: Date, default: null },

  logs: [{
    type: { type: String },
    action: { type: String, enum: ['start', 'stop', 'overtime'] },
    at: { type: Date, default: Date.now },
    durationSeconds: { type: Number, default: 0 },
  }],
});

permissionSchema.index({ staffId: 1, date: 1 }, { unique: true });
module.exports = mongoose.model('Permission', permissionSchema);
