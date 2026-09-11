const bossService = require('../services/bossService');

const wrap = (fn) => async (req, res, next) => {
  try { res.json(await fn(req)); } catch (err) { next(err); }
};

module.exports = {
  createAsset: wrap((req) => bossService.createAssetWithTerms(req.user.id, req.body)),
  listAssets: wrap((req) => bossService.listMyAssets(req.user.id)),
  updateTerms: wrap((req) => bossService.updateTerms(req.user.id, req.params.assetId, req.body)),
  reviewConnection: wrap((req) => bossService.reviewConnectionRequest(req.user.id, req.params.connectionId, req.body.decision)),
  confirmPayment: wrap((req) => bossService.confirmPayment(req.user.id, req.params.id)),
  rejectPayment: wrap((req) => bossService.rejectPayment(req.user.id, req.params.id)),
};
