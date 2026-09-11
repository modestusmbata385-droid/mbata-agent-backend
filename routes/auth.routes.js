// Section 29 endpoint list, implemented per Phase 2.
const express = require('express');
const router = express.Router();

const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/authMiddleware');
const { loginLimiter, otpRequestLimiter } = require('../middleware/rateLimiter');

router.post('/register', authController.register);
router.post('/verify-otp', authController.verifyOtp);
router.post('/resend-otp', otpRequestLimiter, authController.resendOtp);

router.post('/login', loginLimiter, authController.login);
router.post('/logout', authController.logout);

router.post('/forgot-password', otpRequestLimiter, authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

router.post('/change-email/initiate', authenticate, otpRequestLimiter, authController.initiateChangeEmail);
router.post('/change-email/confirm', authenticate, authController.confirmChangeEmail);

module.exports = router;
