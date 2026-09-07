// Section 7: generic module-profile shell. Module-specific relational data
// (transactions, assets, etc.) lives in its own tables keyed by profile_id.
const { pool } = require('../config/db');

async function create(userId, profileType, profileData = {}) {
  const { rows } = await pool.query(
    `INSERT INTO profiles (user_id, profile_type, profile_data)
     VALUES ($1, $2, $3) RETURNING *`,
    [userId, profileType, profileData]
  );
  return rows[0];
}

async function findByUserAndType(userId, profileType) {
  const { rows } = await pool.query(
    'SELECT * FROM profiles WHERE user_id = $1 AND profile_type = $2',
    [userId, profileType]
  );
  return rows[0] || null;
}

async function findById(profileId) {
  const { rows } = await pool.query('SELECT * FROM profiles WHERE id = $1', [profileId]);
  return rows[0] || null;
}

async function listByUser(userId) {
  const { rows } = await pool.query('SELECT * FROM profiles WHERE user_id = $1', [userId]);
  return rows;
}

module.exports = { create, findByUserAndType, findById, listByUser };

