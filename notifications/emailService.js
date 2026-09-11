// Stub email channel adapter. Real SMTP wiring (nodemailer + env.email.*)
// is a Phase-later task — for now this logs so the OTP flow is testable
// end-to-end without a real mail server.
function sendOtpEmail(toEmail, otp, purpose = 'verify your account') {
  // eslint-disable-next-line no-console
  console.log(`[emailService] Would send OTP ${otp} to ${toEmail} to ${purpose}.`);
  return Promise.resolve({ delivered: false, simulated: true });
}

module.exports = { sendOtpEmail };
