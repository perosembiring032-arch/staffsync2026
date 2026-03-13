const IpWhitelist = require('../models/IpWhitelist');

const ipWhitelistMiddleware = async (req, res, next) => {
  try {
    const list = await IpWhitelist.find({});
    if (list.length === 0) return next();
    const clientIp = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.connection.remoteAddress || '';
    const allowed = list.some(entry => clientIp.includes(entry.ip));
    if (!allowed) return res.status(403).json({ success: false, message: 'IP not whitelisted' });
    next();
  } catch (err) {
    next();
  }
};

module.exports = ipWhitelistMiddleware;
