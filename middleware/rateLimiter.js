// Section 4 / 35: login & OTP endpoints need rate limiting and cooldowns.
// Wired here so routes can attach it now; thresholds move to config as auth is built.
const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Please try again later.' },
});

const otpRequestLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 1,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Please wait before requesting another OTP.' },
});

module.exports = { loginLimiter, otpRequestLimiter };
