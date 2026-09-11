// user_security: failed-attempt counter + temporary lock (Section 4).
const { pool } = require('../config/db');

async function getOrCreate(userId) {
  const { rows } = await pool.query('SELECT * FROM user_security WHERE user_id = $1', [userId]);
  if (rows[0]) return rows[0];
  const inserted = await pool.query(
    'INSERT INTO user_security (user_id) VALUES ($1) RETURNING *',
    [userId]
  );
  return inserted.rows[0];
}

async function registerFailedAttempt(userId, maxAttempts, lockMinutes) {
  const current = await getOrCreate(userId);
  const nextAttempts = current.failed_attempts + 1;

  if (nextAttempts >= maxAttempts) {
    await pool.query(
      `UPDATE user_security
       SET failed_attempts = 0, locked_until = now() + interval '${lockMinutes} minutes', updated_at = now()
       WHERE user_id = $1`,
      [userId]
    );
    return { locked: true };
  }

  await pool.query(
    'UPDATE user_security SET failed_attempts = $1, updated_at = now() WHERE user_id = $2',
    [nextAttempts, userId]
  );
  return { locked: false, attempts: nextAttempts };
}

async function resetAttempts(userId) {
  await pool.query(
    'UPDATE user_security SET failed_attempts = 0, locked_until = NULL, updated_at = now() WHERE user_id = $1',
    [userId]
  );
}

async function isLocked(userId) {
  const row = await getOrCreate(userId);
  return Boolean(row.locked_until && new Date(row.locked_until) > new Date());
}

module.exports = { getOrCreate, registerFailedAttempt, resetAttempts, isLocked };
