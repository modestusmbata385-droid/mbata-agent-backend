const express = require('express');
const router = express.Router();
const controller = require('../controllers/profiles.controller');
const { authenticate } = require('../middleware/authMiddleware');

router.use(authenticate);
router.get('/', controller.list);
router.post('/', controller.create);

module.exports = router;
