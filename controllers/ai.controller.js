const aiService = require('../services/aiService');

const wrap = (fn) => async (req, res, next) => {
  try { res.json(await fn(req)); } catch (err) { next(err); }
};

module.exports = {
  advisor: wrap((req) => aiService.getAdvice(req.user.id, req.body.module, req.body.question)),
  insights: wrap((req) => aiService.buildContext(req.user.id, req.query.module || 'general')),
};

