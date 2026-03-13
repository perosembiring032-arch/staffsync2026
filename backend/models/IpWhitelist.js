const mongoose = require('mongoose');
const ipSchema = new mongoose.Schema({
  ip:       { type: String, required: true, unique: true },
  label:    { type: String, default: '' },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });
module.exports = mongoose.model('IpWhitelist', ipSchema);
