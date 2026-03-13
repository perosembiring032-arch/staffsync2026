const express = require('express');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/database');

const app = express();
connectDB();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 500 }));

// ── Serve frontend statis (admin, staff, landing page) ──
app.use(express.static(path.join(__dirname, '../frontend')));

// ── API routes ──
app.use('/api/auth',          require('./routes/auth'));
app.use('/api/members',       require('./routes/members'));
app.use('/api/permissions',   require('./routes/permissions'));
app.use('/api/staff',         require('./routes/staff'));
app.use('/api/announcements', require('./routes/announcements'));
app.use('/api/attendance',    require('./routes/attendance'));
app.use('/api/ipwhitelist',   require('./routes/ipWhitelist'));

// ── Fallback 404 ──
app.use((req, res) => {
  res.status(404).send('Halaman tidak ditemukan');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
