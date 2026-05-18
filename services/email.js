const { Resend } = require('resend');

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM_EMAIL = process.env.RESET_FROM_EMAIL || 'onboarding@resend.dev';

async function sendResetOtp(toEmail, otp) {
  if (!resend) {
    console.warn('[email] RESEND_API_KEY not set, OTP not sent:', otp);
    return;
  }

  await resend.emails.send({
    from: FROM_EMAIL,
    to: toEmail,
    subject: 'SiSMoChat - Password Reset Code',
    text: `Your password reset code is: ${otp}\n\nThis code expires in 30 minutes.\n\nIf you did not request this, ignore this email.\n\nNote: this email is sent from ${FROM_EMAIL}. Check your spam folder if you don't see it in your inbox.`
  });
}

module.exports = { sendResetOtp };
