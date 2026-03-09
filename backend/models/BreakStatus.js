const mongoose = require('mongoose');

const breakStatusSchema = new mongoose.Schema({
  staffId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff',
    required: true,
  },
  date: {
    type: String, // YYYY-MM-DD
    required: true,
  },
  targetReached: {
    type: Boolean,
    default: false,
  },
  breakHours: {
    type: Number,
    default: 1, // Default penalty break (1 hour)
  },
}, {
  timestamps: true,
});

breakStatusSchema.index({ staffId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('BreakStatus', breakStatusSchema);
