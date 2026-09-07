// Section 29 examples: POST /api/boss/profile (handled by generic /api/profiles),
// assets, connections, payment-requests/:id/confirm|reject.
const express = require('express');
const router = express.Router();
const c = require('../controllers/boss.controller');
const { authenticate } = require('../middleware/authMiddleware');

router.use(authenticate);
router.post('/assets', c.createAsset);
router.get('/assets', c.listAssets);
router.post('/assets/:assetId/terms', c.updateTerms);
router.post('/connections/:connectionId/review', c.reviewConnection);
router.post('/payment-requests/:id/confirm', c.confirmPayment);
router.post('/payment-requests/:id/reject', c.rejectPayment);

module.exports = router;

