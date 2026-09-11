// user_sessions: refresh-token-backed sessions (Section 31).
const { pool } = require('../config/db');

async function createSession(userId, refreshTokenHash, expiresAt) {
  const { rows } = await pool.query(
    `INSERT INTO user_sessions (user_id, refresh_token_hash, expires_at)
     VALUES ($1, $2, $3) RETURNING id`,
    [userId, refreshTokenHash, expiresAt]
  );
  return rows[0];
}

async function findActiveSessionsForUser(userId) {
  const { rows } = await pool.query(
    'SELECT * FROM user_sessions WHERE user_id = $1 AND expires_at > now()',
    [userId]
  );
  return rows;
}

async function deleteSession(sessionId) {
  await pool.query('DELETE FROM user_sessions WHERE id = $1', [sessionId]);
}

async function deleteAllSessionsForUser(userId) {
  await pool.query('DELETE FROM user_sessions WHERE user_id = $1', [userId]);
}

module.exports = { createSession, findActiveSessionsForUser, deleteSession, deleteAllSessionsForUser };
