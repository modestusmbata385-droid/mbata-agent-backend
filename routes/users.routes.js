const express = require('express');
const router = express.Router();
const c = require('../controllers/users.controller');
const { authenticate } = require('../middleware/authMiddleware');

router.use(authenticate);
router.get('/me', c.me);

module.exports = router;
