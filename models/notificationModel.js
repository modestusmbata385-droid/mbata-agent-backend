const { pool } = require('../config/db');

async function create(userId, { title, body, channel }) {
  const { rows } = await pool.query(
    `INSERT INTO notifications (user_id, title, body, channel)
     VALUES ($1, $2, $3, COALESCE($4, 'in_app')) RETURNING *`,
    [userId, title, body, channel]
  );
  return rows[0];
}

async function listForUser(userId, limit = 30) {
  const { rows } = await pool.query(
    'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2',
    [userId, limit]
  );
  return rows;
}

async function markRead(userId, id) {
  const { rows } = await pool.query(
    'UPDATE notifications SET read_at = now() WHERE id = $1 AND user_id = $2 RETURNING *',
    [id, userId]
  );
  return rows[0] || null;
}

async function unreadCount(userId) {
  const { rows } = await pool.query(
    'SELECT COUNT(*) AS count FROM notifications WHERE user_id = $1 AND read_at IS NULL',
    [userId]
  );
  return Number(rows[0].count);
}

module.exports = { create, listForUser, markRead, unreadCount };

