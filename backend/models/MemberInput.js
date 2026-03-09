const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema({
  memberId: {
    type: String,
    required: true,
    trim: true,
  },
  deposit: {
    type: Number,
    required: true,
    min: [0, 'Deposit cannot be negative'],
  },
  isValid: {
    type: Boolean,
    default: false,
  },
  inputAt: {
    type: Date,
    default: Date.now,
  },
});

const memberInputSchema = new mongoose.Schema({
  staffId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff',
    required: true,
  },
  date: {
    type: String, // YYYY-MM-DD format
    required: true,
  },
  members: [memberSchema],
  targetReached: {
    type: Boolean,
    default: false,
  },
  validCount: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

// Compound index for unique staff+date
memberInputSchema.index({ staffId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('MemberInput', memberInputSchema);
