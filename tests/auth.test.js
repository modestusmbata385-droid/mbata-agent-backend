// Section 41 Phase 10: auth tests. Models are mocked so these run without
// a real Postgres connection — they verify authService's rules, not SQL.
jest.mock('../models/userModel');
jest.mock('../models/otpModel');
jest.mock('../models/securityModel');
jest.mock('../models/sessionModel');
jest.mock('../notifications/emailService');

const userModel = require('../models/userModel');
const otpModel = require('../models/otpModel');
const securityModel = require('../models/securityModel');
const sessionModel = require('../models/sessionModel');
const emailService = require('../notifications/emailService');
const authService = require('../services/authService');

beforeEach(() => {
  jest.clearAllMocks();
  emailService.sendOtpEmail.mockResolvedValue({ delivered: false, simulated: true });
});

describe('register', () => {
  test('rejects duplicate email', async () => {
    userModel.findByEmail.mockResolvedValue({ id: 'u1', email: 'a@a.com' });
    await expect(authService.register({ fullName: 'A', email: 'a@a.com', password: 'password1' }))
      .rejects.toMatchObject({ status: 409 });
  });

  test('creates user and issues an OTP', async () => {
    userModel.findByEmail.mockResolvedValue(null);
    userModel.createUser.mockResolvedValue({ id: 'u1', email: 'a@a.com' });
    otpModel.TABLES = { emailVerification: 'email_verifications', passwordReset: 'password_resets' };
    otpModel.invalidateOutstanding.mockResolvedValue();
    otpModel.createOtp.mockResolvedValue({ id: 'otp1' });

    const result = await authService.register({ fullName: 'A', email: 'a@a.com', password: 'password1' });

    expect(result).toEqual({ userId: 'u1', email: 'a@a.com' });
    expect(otpModel.createOtp).toHaveBeenCalled();
    expect(emailService.sendOtpEmail).toHaveBeenCalled();
  });
});

describe('login (Section 4)', () => {
  const baseUser = {
    id: 'u1', email: 'a@a.com', email_verified_at: new Date(),
    password_hash: '$2b$12$hash',
  };

  test('unknown email gives a generic error, not "not found"', async () => {
    userModel.findByEmail.mockResolvedValue(null);
    await expect(authService.login({ email: 'ghost@a.com', password: 'x' }))
      .rejects.toMatchObject({ status: 401, message: 'Incorrect email or password.' });
  });

  test('locked account is rejected before password check', async () => {
    userModel.findByEmail.mockResolvedValue(baseUser);
    securityModel.isLocked.mockResolvedValue(true);
    await expect(authService.login({ email: baseUser.email, password: 'x' }))
      .rejects.toMatchObject({ status: 423 });
  });

  test('unverified account is rejected', async () => {
    userModel.findByEmail.mockResolvedValue({ ...baseUser, email_verified_at: null });
    securityModel.isLocked.mockResolvedValue(false);
    await expect(authService.login({ email: baseUser.email, password: 'x' }))
      .rejects.toMatchObject({ status: 403 });
  });

  test('registers a failed attempt on wrong password without revealing which field', async () => {
    userModel.findByEmail.mockResolvedValue(baseUser);
    securityModel.isLocked.mockResolvedValue(false);
    securityModel.registerFailedAttempt.mockResolvedValue({ locked: false, attempts: 1 });

    await expect(authService.login({ email: baseUser.email, password: 'wrong-password' }))
      .rejects.toMatchObject({ status: 401, message: 'Incorrect email or password.' });

    expect(securityModel.registerFailedAttempt).toHaveBeenCalledWith(baseUser.id, 5, 15);
  });
});

describe('resetPassword (Section 5)', () => {
  test('invalidates all sessions after a successful reset', async () => {
    userModel.findByEmail.mockResolvedValue({ id: 'u1', email: 'a@a.com' });
    otpModel.TABLES = { emailVerification: 'email_verifications', passwordReset: 'password_resets' };
    otpModel.findLatestActive.mockResolvedValue({
      id: 'r1', otp_hash: await require('bcrypt').hash('123456', 10),
      attempts: 0, expires_at: new Date(Date.now() + 60000),
    });
    otpModel.consume.mockResolvedValue();
    userModel.updatePasswordHash.mockResolvedValue();
    securityModel.resetAttempts.mockResolvedValue();
    sessionModel.deleteAllSessionsForUser.mockResolvedValue();

    await authService.resetPassword({ email: 'a@a.com', otp: '123456', newPassword: 'newpassword1' });

    expect(sessionModel.deleteAllSessionsForUser).toHaveBeenCalledWith('u1');
  });
});
