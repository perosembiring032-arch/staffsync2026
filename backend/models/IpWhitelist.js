const mongoose = require('mongoose');
const ipSchema = new mongoose.Schema({ ip: { type: String, required: true, unique: true }, label: String }, { timestamps: true });
module.exports = mongoose.model('IpWhitelist', ipSchema);
