const IpWhitelist = require('../models/IpWhitelist');

const getClientIP = (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  const raw =
    (forwarded ? forwarded.split(',')[0].trim() : null) ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    req.ip || '';
  return raw.replace('::ffff:', '').replace('::1', '127.0.0.1');
};

const ipWhitelist = async (req, res, next) => {
  try {
    const clientIP = getClientIP(req);
    const records = await IpWhitelist.find({ isActive: true });

    // Database kosong = mode setup, izinkan semua
    if (records.length === 0) {
      req.clientIP = clientIP;
      return next();
    }

    const allowed = records.some(r =>
      r.ip === clientIP ||
      r.ip === '0.0.0.0' ||
      r.ip === '127.0.0.1'
    );

    if (!allowed) {
      return res.status(403).json({
        success: false,
        message: `Access denied. IP ${clientIP} tidak terdaftar. Hubungi admin.`,
        clientIP,
      });
    }

    req.clientIP = clientIP;
    next();
  } catch (err) {
    // Error = tetap izinkan agar tidak lockout
    req.clientIP = '';
    next();
  }
};

module.exports = { ipWhitelist, getClientIP };
