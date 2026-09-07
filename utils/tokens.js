// JWT access tokens + opaque refresh tokens (Section 31: secure session handling).
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const env = require('../config/env');

function signAccessToken(user) {
  return jwt.sign({ sub: user.id, email: user.email }, env.jwt.secret, {
    expiresIn: env.jwt.expiresIn,
  });
}

function generateRefreshToken() {
  return crypto.randomBytes(48).toString('hex');
}

async function hashRefreshToken(token) {
  return bcrypt.hash(token, 10);
}

async function compareRefreshToken(token, hash) {
  return bcrypt.compare(token, hash);
}

function refreshExpiryDate() {
  // env.jwt.refreshExpiresIn is like "7d" — parse days/hours/minutes simply.
  const match = /^(\d+)([dhm])$/.exec(env.jwt.refreshExpiresIn);
  const now = new Date();
  if (!match) return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const [, amountStr, unit] = match;
  const amount = Number(amountStr);
  const msPerUnit = { d: 86400000, h: 3600000, m: 60000 };
  return new Date(now.getTime() + amount * msPerUnit[unit]);
}

module.exports = {
  signAccessToken,
  generateRefreshToken,
  hashRefreshToken,
  compareRefreshToken,
  refreshExpiryDate,
};

