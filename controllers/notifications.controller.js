const notificationService = require('../services/notificationService');

const wrap = (fn) => async (req, res, next) => {
  try { res.json(await fn(req)); } catch (err) { next(err); }
};

module.exports = {
  list: wrap((req) => notificationService.listForUser(req.user.id)),
  markRead: wrap((req) => notificationService.markRead(req.user.id, req.params.id)),
};
