const connectionService = require('../services/connectionService');
const PROFILE_TYPE = 'tenant';

const wrap = (fn) => async (req, res, next) => {
  try { res.json(await fn(req)); } catch (err) { next(err); }
};

module.exports = {
  join: wrap((req) => connectionService.joinWithCode(req.user.id, PROFILE_TYPE, req.body.code)),
  listConnections: wrap((req) => connectionService.listMyConnections(req.user.id, PROFILE_TYPE)),
  getConnection: wrap((req) => connectionService.getConnectionDetail(req.user.id, PROFILE_TYPE, req.params.connectionId)),
  submitPayment: wrap((req) => connectionService.submitPayment(req.user.id, PROFILE_TYPE, req.params.connectionId, req.body)),
};
