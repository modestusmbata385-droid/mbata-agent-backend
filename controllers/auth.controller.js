const authService = require('../services/authService');
const {
  validateRegister,
  validateLogin,
  validateOtp,
  validateNewPassword,
  validateEmail,
} = require('../validators/authValidators');

function badRequest(res, errors) {
  return res.status(400).json({ errors });
}

async function register(req, res, next) {
  try {
    const errors = validateRegister(req.body);
    if (errors.length) return badRequest(res, errors);

    const { fullName, email, phoneNumber, password } = req.body;
    const result = await authService.register({ fullName, email, phoneNumber, password });
    res.status(201).json({ message: 'Account created. Please check your email for an OTP.', ...result });
  } catch (err) {
    next(err);
  }
}

async function verifyOtp(req, res, next) {
  try {
    const errors = validateOtp(req.body);
    if (errors.length) return badRequest(res, errors);

    const result = await authService.verifyRegistrationOtp(req.body);
    res.json({ message: 'Account verified.', ...result });
  } catch (err) {
    next(err);
  }
}

async function resendOtp(req, res, next) {
  try {
    const errors = validateEmail(req.body);
    if (errors.length) return badRequest(res, errors);

    const result = await authService.resendRegistrationOtp(req.body);
    res.json({ message: 'A new OTP has been sent.', ...result });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const errors = validateLogin(req.body);
    if (errors.length) return badRequest(res, errors);

    const result = await authService.login(req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function logout(req, res, next) {
  try {
    const result = await authService.logout({ sessionId: req.body.sessionId, refreshToken: req.body.refreshToken });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function forgotPassword(req, res, next) {
  try {
    const errors = validateEmail(req.body);
    if (errors.length) return badRequest(res, errors);

    const result = await authService.forgotPassword(req.body);
    res.json({ message: 'If an account exists for this email, an OTP has been sent.', ...result });
  } catch (err) {
    next(err);
  }
}

async function resetPassword(req, res, next) {
  try {
    const otpErrors = validateOtp(req.body);
    const passwordErrors = validateNewPassword(req.body);
    const errors = [...otpErrors, ...passwordErrors];
    if (errors.length) return badRequest(res, errors);

    const result = await authService.resetPassword(req.body);
    res.json({ message: 'Password has been reset. Please log in again.', ...result });
  } catch (err) {
    next(err);
  }
}

async function initiateChangeEmail(req, res, next) {
  try {
    const errors = validateEmail({ email: req.body.newEmail });
    if (errors.length) return badRequest(res, errors);

    const result = await authService.initiateChangeEmail({ userId: req.user.id, newEmail: req.body.newEmail });
    res.json({ message: 'OTP sent to your new email.', ...result });
  } catch (err) {
    next(err);
  }
}

async function confirmChangeEmail(req, res, next) {
  try {
    if (!req.body.otp) return badRequest(res, ['OTP is required.']);

    const result = await authService.confirmChangeEmail({ userId: req.user.id, otp: req.body.otp });
    res.json({ message: 'Email updated.', ...result });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  register,
  verifyOtp,
  resendOtp,
  login,
  logout,
  forgotPassword,
  resetPassword,
  initiateChangeEmail,
  confirmChangeEmail,
};

