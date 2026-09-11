// Verifies the JWT and attaches req.user. No token issuance logic here yet —
// that belongs to the auth service (Phase 2).
const jwt = require('jsonwebtoken');
const env = require('../config/env');

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  try {
    const payload = jwt.verify(token, env.jwt.secret);
    req.user = { id: payload.sub, ...payload };
    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired session.' });
  }
}

module.exports = { authenticate };
