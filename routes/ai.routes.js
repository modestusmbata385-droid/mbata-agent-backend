const express = require('express');
const router = express.Router();
const c = require('../controllers/ai.controller');
const { authenticate } = require('../middleware/authMiddleware');

router.use(authenticate);
router.post('/advisor', c.advisor);
router.get('/insights', c.insights);

module.exports = router;

