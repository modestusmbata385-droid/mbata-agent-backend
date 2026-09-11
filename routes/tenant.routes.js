const express = require('express');
const router = express.Router();
const c = require('../controllers/tenant.controller');
const { authenticate } = require('../middleware/authMiddleware');

router.use(authenticate);
router.post('/join', c.join);
router.get('/connections', c.listConnections);
router.get('/connections/:connectionId', c.getConnection);
router.post('/connections/:connectionId/payments', c.submitPayment);

module.exports = router;
