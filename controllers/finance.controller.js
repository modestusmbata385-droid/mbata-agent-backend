const financeService = require('../services/financeService');

const wrap = (fn) => async (req, res, next) => {
  try { res.json(await fn(req)); } catch (err) { next(err); }
};

module.exports = {
  dashboard: wrap((req) => financeService.getDashboard(req.user.id)),
  addIncome: wrap((req) => financeService.recordIncome(req.user.id, req.body)),
  addExpense: wrap((req) => financeService.recordExpense(req.user.id, req.body)),
  listTransactions: wrap((req) => financeService.listTransactions(req.user.id)),
  createBudget: wrap((req) => financeService.createBudget(req.user.id, req.body)),
  getBudget: wrap((req) => financeService.getBudgetStatus(req.user.id, req.params.budgetId)),
  createGoal: wrap((req) => financeService.createGoal(req.user.id, req.body)),
  contributeGoal: wrap((req) => financeService.contributeToGoal(req.user.id, req.params.goalId, req.body.amount)),
};

