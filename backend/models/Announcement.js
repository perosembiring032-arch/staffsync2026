const mongoose = require('mongoose');
const annSchema = new mongoose.Schema({ title: String, content: String, createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' } }, { timestamps: true });
module.exports = mongoose.model('Announcement', annSchema);
