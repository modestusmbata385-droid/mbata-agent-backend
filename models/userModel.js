// Data access for the `users` table (Section 27).
const { pool } = require('../config/db');

async function createUser({ fullName, email, phoneNumber, passwordHash }) {
  const { rows } = await pool.query(
    `INSERT INTO users (full_name, email, phone_number, password_hash)
     VALUES ($1, $2, $3, $4)
     RETURNING id, full_name, email, phone_number, email_verified_at, created_at`,
    [fullName, email, phoneNumber, passwordHash]
  );
  return rows[0];
}

async function findByEmail(email) {
  const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  return rows[0] || null;
}

async function findById(id) {
  const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
  return rows[0] || null;
}

async function markEmailVerified(userId) {
  await pool.query('UPDATE users SET email_verified_at = now(), updated_at = now() WHERE id = $1', [userId]);
}

async function setPendingEmail(userId, pendingEmail) {
  await pool.query('UPDATE users SET pending_email = $1, updated_at = now() WHERE id = $2', [pendingEmail, userId]);
}

async function commitPendingEmail(userId) {
  await pool.query(
    `UPDATE users SET email = pending_email, pending_email = NULL, updated_at = now()
     WHERE id = $1`,
    [userId]
  );
}

async function updatePasswordHash(userId, passwordHash) {
  await pool.query('UPDATE users SET password_hash = $1, updated_at = now() WHERE id = $2', [passwordHash, userId]);
}

module.exports = {
  createUser,
  findByEmail,
  findById,
  markEmailVerified,
  setPendingEmail,
  commitPendingEmail,
  updatePasswordHash,
};

