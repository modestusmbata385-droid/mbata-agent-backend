const { pool } = require('../config/db');

async function createAsset(bossProfileId, assetType, details, connectionCode) {
  const { rows } = await pool.query(
    `INSERT INTO assets (boss_profile_id, asset_type, details, connection_code)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [bossProfileId, assetType, details || {}, connectionCode]
  );
  return rows[0];
}

async function listAssetsForBoss(bossProfileId) {
  const { rows } = await pool.query('SELECT * FROM assets WHERE boss_profile_id = $1', [bossProfileId]);
  return rows;
}

async function findAssetByCode(code) {
  const { rows } = await pool.query('SELECT * FROM assets WHERE connection_code = $1', [code]);
  return rows[0] || null;
}

async function findAssetById(id) {
  const { rows } = await pool.query('SELECT * FROM assets WHERE id = $1', [id]);
  return rows[0] || null;
}

async function setPaymentTerms(assetId, { requiredAmount, frequency, gracePeriodDays }) {
  const { rows } = await pool.query(
    `INSERT INTO payment_terms (asset_id, required_amount, frequency, grace_period_days)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [assetId, requiredAmount, frequency || 'daily', gracePeriodDays || 0]
  );
  return rows[0];
}

async function getLatestTerms(assetId) {
  const { rows } = await pool.query(
    'SELECT * FROM payment_terms WHERE asset_id = $1 ORDER BY created_at DESC LIMIT 1',
    [assetId]
  );
  return rows[0] || null;
}

async function createConnectionRequest(assetId, connectedProfileId) {
  const { rows } = await pool.query(
    `INSERT INTO boss_connections (asset_id, connected_profile_id, status)
     VALUES ($1, $2, 'pending') RETURNING *`,
    [assetId, connectedProfileId]
  );
  return rows[0];
}

async function findConnection(id) {
  const { rows } = await pool.query('SELECT * FROM boss_connections WHERE id = $1', [id]);
  return rows[0] || null;
}

async function listConnectionsForAsset(assetId) {
  const { rows } = await pool.query('SELECT * FROM boss_connections WHERE asset_id = $1', [assetId]);
  return rows;
}

async function listConnectionsForProfile(connectedProfileId) {
  const { rows } = await pool.query('SELECT * FROM boss_connections WHERE connected_profile_id = $1', [connectedProfileId]);
  return rows;
}

async function updateConnectionStatus(id, status) {
  const { rows } = await pool.query(
    'UPDATE boss_connections SET status = $1 WHERE id = $2 RETURNING *',
    [status, id]
  );
  return rows[0];
}

async function createPaymentRequest(connectionId, { amount, paymentMethod, reference, note }) {
  const { rows } = await pool.query(
    `INSERT INTO payment_requests (connection_id, amount, payment_method, reference, note)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [connectionId, amount, paymentMethod, reference, note]
  );
  return rows[0];
}

async function findPaymentRequest(id) {
  const { rows } = await pool.query('SELECT * FROM payment_requests WHERE id = $1', [id]);
  return rows[0] || null;
}

async function resolvePaymentRequest(id, status) {
  const { rows } = await pool.query(
    `UPDATE payment_requests SET status = $1, resolved_at = now() WHERE id = $2 RETURNING *`,
    [status, id]
  );
  return rows[0];
}

// Section 16: Remaining = Required Amount - Confirmed Payments (pending excluded).
async function getPaymentSummary(connectionId) {
  const termsQuery = await pool.query(
    `SELECT pt.* FROM payment_terms pt
     JOIN boss_connections bc ON bc.asset_id = pt.asset_id
     WHERE bc.id = $1 ORDER BY pt.created_at DESC LIMIT 1`,
    [connectionId]
  );
  const terms = termsQuery.rows[0] || null;

  const sumsQuery = await pool.query(
    `SELECT
       COALESCE(SUM(amount) FILTER (WHERE status = 'confirmed'), 0) AS confirmed,
       COALESCE(SUM(amount) FILTER (WHERE status = 'pending'), 0) AS pending
     FROM payment_requests WHERE connection_id = $1`,
    [connectionId]
  );
  const confirmed = Number(sumsQuery.rows[0].confirmed);
  const pending = Number(sumsQuery.rows[0].pending);
  const required = terms ? Number(terms.required_amount) : 0;

  return { required, confirmed, pending, remaining: required - confirmed, terms };
}

async function listPaymentRequests(connectionId) {
  const { rows } = await pool.query(
    'SELECT * FROM payment_requests WHERE connection_id = $1 ORDER BY created_at DESC',
    [connectionId]
  );
  return rows;
}

module.exports = {
  createAsset, listAssetsForBoss, findAssetByCode, findAssetById,
  setPaymentTerms, getLatestTerms,
  createConnectionRequest, findConnection, listConnectionsForAsset, listConnectionsForProfile, updateConnectionStatus,
  createPaymentRequest, findPaymentRequest, resolvePaymentRequest, getPaymentSummary, listPaymentRequests,
};

