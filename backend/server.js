require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const rateLimit = require('express-rate-limit');

const connectDB = require('./config/database');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { success: false, message: 'Too many requests. Try again later.' },
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many login attempts. Try again in 15 minutes.' },
});

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? [process.env.ALLOWED_ORIGIN || 'https://staffsync.site', 'https://staffsync2026.onrender.com']
    : '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use('/api/', limiter);

// Serve static frontend files
app.use(express.static(path.join(__dirname, '../frontend')));

// API Routes
app.use('/api/auth', loginLimiter, require('./routes/auth'));
app.use('/api/members', require('./routes/members'));
app.use('/api/permissions', require('./routes/permissions'));
app.use('/api/staff', require('./routes/staff'));
app.use('/api/ip-whitelist', require('./routes/ipWhitelist'));
app.use('/api/announcements', require('./routes/announcements'));
app.use('/api/attendance', require('./routes/attendance'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Staff Monitor API running',
    timestamp: new Date().toISOString(),
  });
});

// Serve frontend pages
app.get('/admin*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/admin/index.html'));
});
app.get('/staff*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/staff/index.html'));
});
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Internal server error.' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
