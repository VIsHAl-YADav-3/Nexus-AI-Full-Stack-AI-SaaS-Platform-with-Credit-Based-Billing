const logger = require('../utils/logger');

let resendClient = null;

const getResendClient = () => {
  if (!resendClient) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is not configured in environment variables');
    }
    // Lazy-required so the project doesn't hard-fail at boot if the
    // dependency isn't installed yet in a partial deployment.
    const { Resend } = require('resend');
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
};

const otpEmailTemplate = ({ name, otp }) => `
  <div style="font-family: -apple-system, Segoe UI, Roboto, sans-serif; max-width: 480px; margin: 0 auto; background: #0f0f12; color: #f4f4f5; border-radius: 16px; overflow: hidden; border: 1px solid #27272a;">
    <div style="padding: 32px 32px 0 32px;">
      <div style="width: 40px; height: 40px; border-radius: 12px; background: linear-gradient(135deg, #4f46e5, #7c3aed); display: flex; align-items: center; justify-content: center; margin-bottom: 24px;"></div>
      <h1 style="font-size: 20px; margin: 0 0 8px 0; color: #ffffff;">Reset your password</h1>
      <p style="font-size: 14px; color: #a1a1aa; line-height: 1.6; margin: 0 0 24px 0;">
        Hi ${name || 'there'}, use the verification code below to reset your Nexus AI password. This code expires in 10 minutes.
      </p>
      <div style="background: #18181b; border: 1px solid #3f3f46; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px;">
        <span style="font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #ffffff;">${otp}</span>
      </div>
      <p style="font-size: 13px; color: #71717a; line-height: 1.6; margin: 0 0 32px 0;">
        If you didn't request this, you can safely ignore this email — your password will remain unchanged.
      </p>
    </div>
    <div style="padding: 16px 32px; border-top: 1px solid #27272a;">
      <p style="font-size: 12px; color: #52525b; margin: 0;">Nexus AI — Your AI Workspace</p>
    </div>
  </div>
`;

/**
 * Sends a password-reset OTP to the given email address.
 * Throws on failure so the caller can decide how to respond to the client
 * (the auth controller intentionally still returns a generic success
 * message to the client either way, to avoid leaking account existence).
 */
const sendPasswordResetOtp = async ({ to, name, otp }) => {
  const fromAddress = process.env.EMAIL_FROM || 'Nexus AI <onboarding@resend.dev>';

  try {
    const client = getResendClient();
    const result = await client.emails.send({
      from: fromAddress,
      to,
      subject: 'Your Nexus AI password reset code',
      html: otpEmailTemplate({ name, otp }),
    });

    if (result.error) {
      throw new Error(result.error.message || 'Resend API returned an error');
    }

    logger.info(`Password reset email sent to ${to}`);
    return result;
  } catch (error) {
    logger.error(`Failed to send password reset email to ${to}: ${error.message}`);
    throw error;
  }
};

module.exports = { sendPasswordResetOtp };
