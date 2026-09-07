const express = require('express');
const router = express.Router();
const c = require('../controllers/notifications.controller');
const { authenticate } = require('../middleware/authMiddleware');

router.use(authenticate);
router.get('/', c.list);
router.post('/:id/read', c.markRead);

module.exports = router;

