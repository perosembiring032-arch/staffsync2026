const ipWhitelist = (req, res, next) => {
  // Only enforce for admin login attempts
  const allowedIPs = (process.env.ADMIN_ALLOWED_IPS || '127.0.0.1')
    .split(',')
    .map(ip => ip.trim());

  const clientIP =
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    req.ip;

  // Normalize IPv6 loopback
  const normalizedIP = clientIP === '::1' ? '127.0.0.1' : 
    clientIP?.replace('::ffff:', '') || '';

  const isAllowed = allowedIPs.some(allowedIP => {
    const normalizedAllowed = allowedIP === '::1' ? '127.0.0.1' : 
      allowedIP.replace('::ffff:', '');
    return normalizedIP === normalizedAllowed || clientIP === allowedIP;
  });

  if (!isAllowed) {
    console.warn(`⚠️ Admin login blocked from IP: ${clientIP}`);
    return res.status(403).json({
      success: false,
      message: 'Access denied. Your IP address is not authorized for admin access.',
      ip: normalizedIP,
    });
  }

  next();
};

module.exports = { ipWhitelist };
