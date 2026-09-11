// Shared by driver.controller.js and tenant.controller.js: joining a boss
// via connection code, submitting payments, and viewing own balance
// (Sections 14-17). Both roles use the same boss_connections/payment_requests
// tables — only the profile_type differs.
const bossModel = require('../models/bossModel');
const profileService = require('../services/profileService');

function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

async function joinWithCode(userId, profileType, code) {
  const myProfile = await profileService.requireOwnedProfile(userId, profileType);
  const asset = await bossModel.findAssetByCode(code);
  if (!asset) throw httpError(404, 'Invalid connection code.');

  return bossModel.createConnectionRequest(asset.id, myProfile.id);
}

async function listMyConnections(userId, profileType) {
  const myProfile = await profileService.requireOwnedProfile(userId, profileType);
  const connections = await bossModel.listConnectionsForProfile(myProfile.id);

  return Promise.all(connections.map(async (conn) => {
    const summary = await bossModel.getPaymentSummary(conn.id);
    return { ...conn, ...summary };
  }));
}

async function submitPayment(userId, profileType, connectionId, { amount, paymentMethod, reference, note }) {
  if (!(amount > 0)) throw httpError(400, 'Amount must be greater than zero.');

  const myProfile = await profileService.requireOwnedProfile(userId, profileType);
  const connection = await bossModel.findConnection(connectionId);
  if (!connection || connection.connected_profile_id !== myProfile.id) {
    throw httpError(404, 'Connection not found.');
  }
  if (connection.status !== 'active') throw httpError(400, 'This connection is not active yet.');

  // Section 15: submitted as PENDING — never auto-confirmed.
  return bossModel.createPaymentRequest(connectionId, { amount, paymentMethod, reference, note });
}

async function getConnectionDetail(userId, profileType, connectionId) {
  const myProfile = await profileService.requireOwnedProfile(userId, profileType);
  const connection = await bossModel.findConnection(connectionId);
  if (!connection || connection.connected_profile_id !== myProfile.id) {
    throw httpError(404, 'Connection not found.');
  }

  const [summary, history] = await Promise.all([
    bossModel.getPaymentSummary(connectionId),
    bossModel.listPaymentRequests(connectionId),
  ]);

  return { connection, ...summary, history };
}

module.exports = { joinWithCode, listMyConnections, submitPayment, getConnectionDetail };
