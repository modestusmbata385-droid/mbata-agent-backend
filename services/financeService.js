const financeModel = require('../models/financeModel');
const profileService = require('../services/profileService');

function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

async function getDashboard(userId) {
  const profile = await profileService.requireOwnedProfile(userId, 'finance');
  const summary = await financeModel.getBalanceSummary(profile.id);
  const recentTransactions = await financeModel.listTransactions(profile.id, 10);
  const goals = await financeModel.listGoals(profile.id);
  return { ...summary, recentTransactions, goals };
}

async function recordIncome(userId, { amount, category, note, status }) {
  if (!(amount > 0)) throw httpError(400, 'Amount must be greater than zero.');
  const profile = await profileService.requireOwnedProfile(userId, 'finance');
  return financeModel.addTransaction(profile.id, { type: 'income', amount, category, note, status });
}

async function recordExpense(userId, { amount, category, note, status }) {
  if (!(amount > 0)) throw httpError(400, 'Amount must be greater than zero.');
  const profile = await profileService.requireOwnedProfile(userId, 'finance');
  return financeModel.addTransaction(profile.id, { type: 'expense', amount, category, note, status });
}

async function listTransactions(userId) {
  const profile = await profileService.requireOwnedProfile(userId, 'finance');
  return financeModel.listTransactions(profile.id);
}

async function createBudget(userId, body) {
  if (!(body.limitAmount > 0)) throw httpError(400, 'Budget limit must be greater than zero.');
  const profile = await profileService.requireOwnedProfile(userId, 'finance');
  return financeModel.createBudget(profile.id, body);
}

async function getBudgetStatus(userId, budgetId) {
  const profile = await profileService.requireOwnedProfile(userId, 'finance');
  const status = await financeModel.getBudgetStatus(profile.id, budgetId);
  if (!status) throw httpError(404, 'Budget not found.');
  return status;
}

async function createGoal(userId, body) {
  if (!(body.targetAmount > 0)) throw httpError(400, 'Goal target must be greater than zero.');
  const profile = await profileService.requireOwnedProfile(userId, 'finance');
  return financeModel.createGoal(profile.id, body);
}

async function contributeToGoal(userId, goalId, amount) {
  if (!(amount > 0)) throw httpError(400, 'Contribution must be greater than zero.');
  const profile = await profileService.requireOwnedProfile(userId, 'finance');
  const goal = await financeModel.contributeToGoal(profile.id, goalId, amount);
  if (!goal) throw httpError(404, 'Goal not found.');
  return goal;
}

module.exports = {
  getDashboard, recordIncome, recordExpense, listTransactions,
  createBudget, getBudgetStatus, createGoal, contributeToGoal,
};

