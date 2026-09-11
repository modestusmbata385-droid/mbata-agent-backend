const express = require('express');
const router = express.Router();
const c = require('../controllers/media.controller');
const { authenticate } = require('../middleware/authMiddleware');
const { upload } = require('../middleware/uploadMiddleware');

router.use(authenticate);
router.post('/upload', upload.single('file'), c.uploadFile);

module.exports = router;
