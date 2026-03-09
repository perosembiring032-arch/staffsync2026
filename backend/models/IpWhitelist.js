const mongoose = require('mongoose');

const ipWhitelistSchema = new mongoose.Schema({
  ip: {
    type: String,
    required: true,
    trim: true,
    unique: true,
  },
  label: {
    type: String,
    trim: true,
    default: '',
  },
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff',
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('IpWhitelist', ipWhitelistSchema);
