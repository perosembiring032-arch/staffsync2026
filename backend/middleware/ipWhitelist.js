const getClientIP = (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  const raw =
    (forwarded ? forwarded.split(',')[0].trim() : null) ||
    req.connection?.remoteAddress ||
    req.ip || '';
  return raw.replace('::ffff:', '').replace('::1', '127.0.0.1');
};

const ipWhitelist = (req, res, next) => {
  req.clientIP = getClientIP(req);
  next();
};

module.exports = { ipWhitelist, getClientIP };