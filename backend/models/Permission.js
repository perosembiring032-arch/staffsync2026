const mongoose = require('mongoose');

const logEntrySchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['toilet', 'smoke_1', 'smoke_2'],
    required: true,
  },
  usedAt: {
    type: Date,
    default: Date.now,
  },
});

const permissionSchema = new mongoose.Schema({
  staffId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff',
    required: true,
  },
  date: {
    type: String, // YYYY-MM-DD
    required: true,
  },
  toiletUsed: {
    type: Boolean,
    default: false,
  },
  smoke1Used: {
    type: Boolean,
    default: false,
  },
  smoke2Used: {
    type: Boolean,
    default: false,
  },
  logs: [logEntrySchema],
}, {
  timestamps: true,
});

permissionSchema.index({ staffId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Permission', permissionSchema);
