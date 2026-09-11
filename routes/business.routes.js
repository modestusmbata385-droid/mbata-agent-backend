const express = require('express');
const router = express.Router();
const c = require('../controllers/business.controller');
const { authenticate } = require('../middleware/authMiddleware');

router.use(authenticate);
router.post('/products', c.addProduct);
router.get('/products', c.listProducts);
router.get('/inventory', c.inventoryStatus);
router.post('/sales', c.recordSale);
router.get('/sales', c.listSales);
router.post('/expenses', c.addExpense);
router.get('/profit', c.profit);
router.post('/customers', c.addCustomer);
router.get('/customers', c.listCustomers);

module.exports = router;
