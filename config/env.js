// Centralized access to environment variables.
// Import this instead of reading process.env directly across the codebase.
require('dotenv').config();

module.exports = {
  port: process.env.PORT || 4000,
  nodeEnv: process.env.NODE_ENV || 'development',

  db: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    name: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  },

  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
  },

  session: {
    inactivityTimeoutMinutes: Number(process.env.SESSION_INACTIVITY_TIMEOUT_MINUTES) || 30,
  },

  otp: {
    length: Number(process.env.OTP_LENGTH) || 6,
    expiryMinutes: Number(process.env.OTP_EXPIRY_MINUTES) || 5,
    maxAttempts: Number(process.env.OTP_MAX_ATTEMPTS) || 5,
    resendCooldownSeconds: Number(process.env.OTP_RESEND_COOLDOWN_SECONDS) || 60,
  },

  email: {
    smtpHost: process.env.SMTP_HOST,
    smtpPort: process.env.SMTP_PORT,
    smtpUser: process.env.SMTP_USER,
    smtpPassword: process.env.SMTP_PASSWORD,
    from: process.env.EMAIL_FROM,
  },

  ai: {
    apiKey: process.env.AI_PROVIDER_API_KEY,
  },

  uploads: {
    dir: process.env.UPLOAD_DIR || './uploads',
    maxUploadMb: Number(process.env.MAX_UPLOAD_MB) || 10,
  },
};
