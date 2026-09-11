// OTP generation + hashing helpers (Section 3: 6-digit, single-use, hashed at rest).
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const env = require('../config/env');

function generateOtp(length = env.otp.length) {
  const max = 10 ** length;
  const num = crypto.randomInt(0, max);
  return String(num).padStart(length, '0');
}

async function hashOtp(otp) {
  return bcrypt.hash(otp, 10);
}

async function compareOtp(otp, hash) {
  return bcrypt.compare(otp, hash);
}

module.exports = { generateOtp, hashOtp, compareOtp };
