const { pool } = require('../config/db');

async function addTransaction(profileId, { type, category, amount, status, note, occurredAt }) {
  const { rows } = await pool.query(
    `INSERT INTO transactions (profile_id, type, category, amount, status, note, occurred_at)
     VALUES ($1, $2, $3, $4, COALESCE($5, 'confirmed'), $6, COALESCE($7, now()))
     RETURNING *`,
    [profileId, type, category, amount, status, note, occurredAt]
  );
  return rows[0];
}

async function listTransactions(profileId, limit = 50) {
  const { rows } = await pool.query(
    'SELECT * FROM transactions WHERE profile_id = $1 ORDER BY occurred_at DESC LIMIT $2',
    [profileId, limit]
  );
  return rows;
}

// Section 10: Balance = Opening Balance + Confirmed Income - Confirmed Expenses.
// Opening balance is treated as 0 in this skeleton; add an opening_balance
// column to profiles.profile_data if a nonzero starting point is needed.
async function getBalanceSummary(profileId) {
  const { rows } = await pool.query(
    `SELECT
       COALESCE(SUM(amount) FILTER (WHERE type = 'income' AND status = 'confirmed'), 0) AS confirmed_income,
       COALESCE(SUM(amount) FILTER (WHERE type = 'expense' AND status = 'confirmed'), 0) AS confirmed_expenses,
       COALESCE(SUM(amount) FILTER (WHERE type = 'income' AND status = 'pending'), 0) AS pending_income,
       COALESCE(SUM(amount) FILTER (WHERE type = 'expense' AND status = 'pending'), 0) AS pending_expenses
     FROM transactions WHERE profile_id = $1`,
    [profileId]
  );
  const r = rows[0];
  const balance = Number(r.confirmed_income) - Number(r.confirmed_expenses);
  return {
    balance,
    confirmedIncome: Number(r.confirmed_income),
    confirmedExpenses: Number(r.confirmed_expenses),
    pendingIncome: Number(r.pending_income),
    pendingExpenses: Number(r.pending_expenses),
  };
}

async function createBudget(profileId, { category, limitAmount, periodStart, periodEnd }) {
  const { rows } = await pool.query(
    `INSERT INTO budgets (profile_id, category, limit_amount, period_start, period_end)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [profileId, category, limitAmount, periodStart, periodEnd]
  );
  return rows[0];
}

async function getBudgetStatus(profileId, budgetId) {
  const { rows } = await pool.query('SELECT * FROM budgets WHERE id = $1 AND profile_id = $2', [budgetId, profileId]);
  const budget = rows[0];
  if (!budget) return null;

  const spentQuery = await pool.query(
    `SELECT COALESCE(SUM(amount), 0) AS spent FROM transactions
     WHERE profile_id = $1 AND type = 'expense' AND status = 'confirmed'
       AND category = $2 AND occurred_at BETWEEN $3 AND $4`,
    [profileId, budget.category, budget.period_start, budget.period_end]
  );
  const spent = Number(spentQuery.rows[0].spent);
  return { ...budget, spent, remaining: Number(budget.limit_amount) - spent };
}

async function createGoal(profileId, { title, targetAmount, targetDate }) {
  const { rows } = await pool.query(
    `INSERT INTO financial_goals (profile_id, title, target_amount, target_date)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [profileId, title, targetAmount, targetDate]
  );
  return rows[0];
}

async function contributeToGoal(profileId, goalId, amount) {
  const { rows } = await pool.query(
    `UPDATE financial_goals SET saved_amount = saved_amount + $1
     WHERE id = $2 AND profile_id = $3 RETURNING *`,
    [amount, goalId, profileId]
  );
  return rows[0] || null;
}

async function listGoals(profileId) {
  const { rows } = await pool.query('SELECT * FROM financial_goals WHERE profile_id = $1', [profileId]);
  return rows;
}

module.exports = {
  addTransaction, listTransactions, getBalanceSummary,
  createBudget, getBudgetStatus, createGoal, contributeToGoal, listGoals,
};

