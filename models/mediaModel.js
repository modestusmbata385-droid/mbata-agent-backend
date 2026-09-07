const { pool } = require('../config/db');

async function record(userId, { filename, originalName, mimeType, sizeBytes, purpose }) {
  const { rows } = await pool.query(
    `INSERT INTO media_files (user_id, filename, original_name, mime_type, size_bytes, purpose)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [userId, filename, originalName, mimeType, sizeBytes, purpose]
  );
  return rows[0];
}

module.exports = { record };

