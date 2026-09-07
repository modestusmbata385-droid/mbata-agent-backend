const express = require('express');
const router = express.Router();
const c = require('../controllers/education.controller');
const { authenticate } = require('../middleware/authMiddleware');

router.use(authenticate);
router.post('/connections', c.connectStudent);
router.get('/children', c.listChildren);
router.get('/student/:id/progress', c.getProgress);
router.post('/results', c.addResult);
router.post('/attendance', c.recordAttendance);
router.post('/goals', c.addGoal);

module.exports = router;

