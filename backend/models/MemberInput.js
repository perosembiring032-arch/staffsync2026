const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema({
  memberId:  String,
  deposit:   Number,
  isValid:   Boolean,
});

const memberInputSchema = new mongoose.Schema({
  staffId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Staff', required: true },
  date:       { type: String, required: true },
  members:    [memberSchema],
  targetMet:  { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('MemberInput', memberInputSchema);
