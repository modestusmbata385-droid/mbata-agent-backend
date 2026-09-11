// Phase 2 business logic: register -> OTP -> login -> forgot/reset -> change email.
// Sections 3-6 of the blueprint.
const userModel = require('../models/userModel');
const otpModel = require('../models/otpModel');
const securityModel = require('../models/securityModel');
const sessionModel = require('../models/sessionModel');
const { generateOtp, hashOtp, compareOtp } = require('../utils/otp');
const { hashPassword, comparePassword } = require('../utils/password');
const { signAccessToken, generateRefreshToken, hashRefreshToken, refreshExpiryDate } = require('../utils/tokens');
const { sendOtpEmail } = require('../notifications/emailService');
const env = require('../config/env');

function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

// ---- Registration ----

async function register({ fullName, email, phoneNumber, password }) {
  const existing = await userModel.findByEmail(email);
  if (existing) {
    throw httpError(409, 'An account with this email already exists.');
  }

  const passwordHash = await hashPassword(password);
  const user = await userModel.createUser({ fullName, email, phoneNumber, passwordHash });

  await issueOtp(otpModel.TABLES.emailVerification, user.id, email, 'verify your account');

  return { userId: user.id, email: user.email };
}

async function issueOtp(table, userId, destinationEmail, purpose) {
  await otpModel.invalidateOutstanding(table, userId);
  const otp = generateOtp();
  const otpHash = await hashOtp(otp);
  await otpModel.createOtp(table, userId, otpHash);
  await sendOtpEmail(destinationEmail, otp, purpose);
}

async function checkOtpRecord(table, user, otp) {
  const record = await otpModel.findLatestActive(table, user.id);
  if (!record) throw httpError(400, 'No active OTP found. Please request a new one.');

  if (new Date(record.expires_at) < new Date()) {
    throw httpError(400, 'This OTP has expired. Please request a new one.');
  }
  if (record.attempts >= env.otp.maxAttempts) {
    throw httpError(429, 'Too many incorrect attempts. Please request a new OTP.');
  }

  const matches = await compareOtp(otp, record.otp_hash);
  if (!matches) {
    await otpModel.incrementAttempts(table, record.id);
    throw httpError(400, 'Incorrect OTP.');
  }

  await otpModel.consume(table, record.id);
  return record;
}

async function verifyRegistrationOtp({ email, otp }) {
  const user = await userModel.findByEmail(email);
  if (!user) throw httpError(404, 'Account not found.');
  if (user.email_verified_at) throw httpError(400, 'This account is already verified.');

  await checkOtpRecord(otpModel.TABLES.emailVerification, user, otp);
  await userModel.markEmailVerified(user.id);
  return { verified: true };
}

async function resendRegistrationOtp({ email }) {
  const user = await userModel.findByEmail(email);
  if (!user) throw httpError(404, 'Account not found.');
  if (user.email_verified_at) throw httpError(400, 'This account is already verified.');

  await issueOtp(otpModel.TABLES.emailVerification, user.id, user.email, 'verify your account');
  return { sent: true };
}

// ---- Login ----

async function login({ email, password }) {
  const user = await userModel.findByEmail(email);
  const genericError = httpError(401, 'Incorrect email or password.');

  if (!user) throw genericError; // Section 4: don't reveal which field was wrong.

  if (await securityModel.isLocked(user.id)) {
    throw httpError(423, 'This account is temporarily locked due to too many failed attempts. Please try again later.');
  }

  if (!user.email_verified_at) {
    throw httpError(403, 'Please verify your email before logging in.');
  }

  const validPassword = await comparePassword(password, user.password_hash);
  if (!validPassword) {
    await securityModel.registerFailedAttempt(user.id, 5, 15);
    throw genericError;
  }

  await securityModel.resetAttempts(user.id);

  const accessToken = signAccessToken(user);
  const refreshToken = generateRefreshToken();
  const refreshTokenHash = await hashRefreshToken(refreshToken);
  await sessionModel.createSession(user.id, refreshTokenHash, refreshExpiryDate());

  return {
    accessToken,
    refreshToken,
    user: { id: user.id, fullName: user.full_name, email: user.email },
  };
}

async function logout({ refreshToken, sessionId }) {
  if (sessionId) {
    await sessionModel.deleteSession(sessionId);
  }
  return { loggedOut: true };
}

// ---- Forgot / reset password ----

async function forgotPassword({ email }) {
  const user = await userModel.findByEmail(email);
  // Section 4/5: don't reveal whether the email exists.
  if (user) {
    await issueOtp(otpModel.TABLES.passwordReset, user.id, user.email, 'reset your password');
  }
  return { sent: true };
}

async function resetPassword({ email, otp, newPassword }) {
  const user = await userModel.findByEmail(email);
  if (!user) throw httpError(400, 'Invalid request.');

  await checkOtpRecord(otpModel.TABLES.passwordReset, user, otp);

  const passwordHash = await hashPassword(newPassword);
  await userModel.updatePasswordHash(user.id, passwordHash);
  await securityModel.resetAttempts(user.id);
  await sessionModel.deleteAllSessionsForUser(user.id); // Section 5: old sessions broken after reset.

  return { reset: true };
}

// ---- Change email ----

async function initiateChangeEmail({ userId, newEmail }) {
  const existing = await userModel.findByEmail(newEmail);
  if (existing) throw httpError(409, 'That email is already in use.');

  const user = await userModel.findById(userId);
  if (!user) throw httpError(404, 'Account not found.');

  await userModel.setPendingEmail(userId, newEmail);
  await issueOtp(otpModel.TABLES.emailVerification, userId, newEmail, 'confirm your new email');

  return { pendingEmail: newEmail };
}

async function confirmChangeEmail({ userId, otp }) {
  const user = await userModel.findById(userId);
  if (!user) throw httpError(404, 'Account not found.');
  if (!user.pending_email) throw httpError(400, 'No pending email change found.');

  await checkOtpRecord(otpModel.TABLES.emailVerification, user, otp);
  await userModel.commitPendingEmail(userId);

  return { email: user.pending_email };
}

module.exports = {
  register,
  verifyRegistrationOtp,
  resendRegistrationOtp,
  login,
  logout,
  forgotPassword,
  resetPassword,
  initiateChangeEmail,
  confirmChangeEmail,
};
