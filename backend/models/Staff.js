const mongoose = require('mongoose');

const staffSchema = new mongoose.Schema({
  username:   { type: String, required: true, unique: true },
  password:   { type: String, required: true },
  fullName:   { type: String, required: true },
  employeeId: { type: String, required: true, unique: true },
  role:       { type: String, enum: ['staff', 'admin'], default: 'staff' },
  isActive:   { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Staff', staffSchema);
