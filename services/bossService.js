// Section 12-16: boss side of Boss Connect.
const bossModel = require('../models/bossModel');
const profileService = require('../services/profileService');
const { generateConnectionCode } = require('../utils/connectionCode');

function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

async function createAssetWithTerms(userId, { assetType, details, requiredAmount, frequency, gracePeriodDays }) {
  if (!assetType) throw httpError(400, 'Asset type is required.');
  const bossProfile = await profileService.requireOwnedProfile(userId, 'boss');

  const code = generateConnectionCode();
  const asset = await bossModel.createAsset(bossProfile.id, assetType, details, code);

  let terms = null;
  if (requiredAmount) {
    terms = await bossModel.setPaymentTerms(asset.id, { requiredAmount, frequency, gracePeriodDays });
  }

  return { asset, terms };
}

async function listMyAssets(userId) {
  const bossProfile = await profileService.requireOwnedProfile(userId, 'boss');
  const assets = await bossModel.listAssetsForBoss(bossProfile.id);

  const withDetail = await Promise.all(assets.map(async (asset) => {
    const [terms, connections] = await Promise.all([
      bossModel.getLatestTerms(asset.id),
      bossModel.listConnectionsForAsset(asset.id),
    ]);
    return { ...asset, terms, connections };
  }));

  return withDetail;
}

async function updateTerms(userId, assetId, body) {
  const bossProfile = await profileService.requireOwnedProfile(userId, 'boss');
  const asset = await bossModel.findAssetById(assetId);
  if (!asset || asset.boss_profile_id !== bossProfile.id) throw httpError(404, 'Asset not found.');
  return bossModel.setPaymentTerms(assetId, body);
}

async function reviewConnectionRequest(userId, connectionId, decision) {
  if (!['active', 'rejected'].includes(decision)) throw httpError(400, 'Decision must be active or rejected.');

  const bossProfile = await profileService.requireOwnedProfile(userId, 'boss');
  const connection = await bossModel.findConnection(connectionId);
  if (!connection) throw httpError(404, 'Connection request not found.');

  const asset = await bossModel.findAssetById(connection.asset_id);
  if (!asset || asset.boss_profile_id !== bossProfile.id) throw httpError(403, 'Not your asset.');

  return bossModel.updateConnectionStatus(connectionId, decision);
}

async function confirmPayment(userId, paymentRequestId) {
  return resolvePayment(userId, paymentRequestId, 'confirmed');
}

async function rejectPayment(userId, paymentRequestId) {
  return resolvePayment(userId, paymentRequestId, 'rejected');
}

async function resolvePayment(userId, paymentRequestId, status) {
  const bossProfile = await profileService.requireOwnedProfile(userId, 'boss');
  const request = await bossModel.findPaymentRequest(paymentRequestId);
  if (!request) throw httpError(404, 'Payment request not found.');
  if (request.status !== 'pending') throw httpError(400, 'This payment request was already resolved.');

  const connection = await bossModel.findConnection(request.connection_id);
  const asset = await bossModel.findAssetById(connection.asset_id);
  if (!asset || asset.boss_profile_id !== bossProfile.id) throw httpError(403, 'Not your asset.');

  // Section 15: driver/tenant reporting "paid" never auto-confirms —
  // only the boss's explicit action here flips status.
  return bossModel.resolvePaymentRequest(paymentRequestId, status);
}

module.exports = {
  createAssetWithTerms, listMyAssets, updateTerms,
  reviewConnectionRequest, confirmPayment, rejectPayment,
};

