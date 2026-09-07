// Manual input validation (Section 35: never trust frontend validation alone).
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateRegister(body) {
  const errors = [];
  if (!body.fullName || body.fullName.trim().length < 2) errors.push('Full name is required.');
  if (!body.email || !EMAIL_RE.test(body.email)) errors.push('A valid email is required.');
  if (!body.password || body.password.length < 8) errors.push('Password must be at least 8 characters.');
  if (body.password !== body.confirmPassword) errors.push('Passwords do not match.');
  return errors;
}

function validateLogin(body) {
  const errors = [];
  if (!body.email || !EMAIL_RE.test(body.email)) errors.push('A valid email is required.');
  if (!body.password) errors.push('Password is required.');
  return errors;
}

function validateOtp(body) {
  const errors = [];
  if (!body.email || !EMAIL_RE.test(body.email)) errors.push('A valid email is required.');
  if (!body.otp || !/^\d{4,8}$/.test(body.otp)) errors.push('A valid OTP is required.');
  return errors;
}

function validateNewPassword(body) {
  const errors = [];
  if (!body.newPassword || body.newPassword.length < 8) errors.push('Password must be at least 8 characters.');
  if (body.newPassword !== body.confirmPassword) errors.push('Passwords do not match.');
  return errors;
}

function validateEmail(body) {
  const errors = [];
  if (!body.email || !EMAIL_RE.test(body.email)) errors.push('A valid email is required.');
  return errors;
}

module.exports = { validateRegister, validateLogin, validateOtp, validateNewPassword, validateEmail };

