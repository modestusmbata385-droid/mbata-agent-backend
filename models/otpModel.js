// Generic OTP record handling, shared by email_verifications and password_resets
// (Section 3/5: single-use, expiring, attempt-limited).
const { pool } = require('../config/db');
const env = require('../config/env');

const TABLES = {
  emailVerification: 'email_verifications',
  passwordReset: 'password_resets',
};

async function invalidateOutstanding(table, userId) {
  await pool.query(
    `UPDATE ${table} SET consumed_at = now() WHERE user_id = $1 AND consumed_at IS NULL`,
    [userId]
  );
}

async function createOtp(table, userId, otpHash) {
  const { rows } = await pool.query(
    `INSERT INTO ${table} (user_id, otp_hash, expires_at)
     VALUES ($1, $2, now() + interval '${env.otp.expiryMinutes} minutes')
     RETURNING id, created_at, expires_at`,
    [userId, otpHash]
  );
  return rows[0];
}

async function findLatestActive(table, userId) {
  const { rows } = await pool.query(
    `SELECT * FROM ${table}
     WHERE user_id = $1 AND consumed_at IS NULL
     ORDER BY created_at DESC LIMIT 1`,
    [userId]
  );
  return rows[0] || null;
}

async function incrementAttempts(table, id) {
  await pool.query(`UPDATE ${table} SET attempts = attempts + 1 WHERE id = $1`, [id]);
}

async function consume(table, id) {
  await pool.query(`UPDATE ${table} SET consumed_at = now() WHERE id = $1`, [id]);
}

module.exports = { TABLES, invalidateOutstanding, createOtp, findLatestActive, incrementAttempts, consume };
