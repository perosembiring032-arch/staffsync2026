const mongoose = require('mongoose');

const breakSessionSchema = new mongoose.Schema({
  staffId:       { type: mongoose.Schema.Types.ObjectId, ref: 'Staff', required: true },
  date:          { type: String, required: true },        // YYYY-MM-DD WIB
  jatahMenit:    { type: Number, required: true },        // 60 atau 120 menit
  startTime:     { type: Date },                          // waktu mulai break
  endTime:       { type: Date },                          // waktu selesai break
  durasiAktual:  { type: Number, default: 0 },            // detik aktual
  overtime:      { type: Number, default: 0 },            // detik telat (0 jika tepat)
  status:        { type: String, enum: ['idle','on_break','done'], default: 'idle' },
}, { timestamps: true });

module.exports = mongoose.model('BreakSession', breakSessionSchema);
