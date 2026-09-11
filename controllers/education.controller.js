const educationService = require('../services/educationService');

const wrap = (fn) => async (req, res, next) => {
  try { res.json(await fn(req)); } catch (err) { next(err); }
};

module.exports = {
  connectStudent: wrap((req) => educationService.connectToStudent(req.user.id, req.body.studentProfileId)),
  listChildren: wrap((req) => educationService.listMyChildren(req.user.id)),
  getProgress: wrap((req) => educationService.getProgress(req.user.id, req.params.id)),
  addResult: wrap((req) => educationService.addResult(req.user.id, req.body)),
  recordAttendance: wrap((req) => educationService.recordAttendance(req.user.id, req.body)),
  addGoal: wrap((req) => educationService.addGoal(req.user.id, req.body)),
};
