const express = require('express');
const router = express.Router();
const c = require('../controllers/finance.controller');
const { authenticate } = require('../middleware/authMiddleware');

router.use(authenticate);
router.get('/dashboard', c.dashboard);
router.post('/income', c.addIncome);
router.post('/expenses', c.addExpense);
router.get('/transactions', c.listTransactions);
router.post('/budgets', c.createBudget);
router.get('/budgets/:budgetId', c.getBudget);
router.post('/goals', c.createGoal);
router.post('/goals/:goalId/contribute', c.contributeGoal);

module.exports = router;

