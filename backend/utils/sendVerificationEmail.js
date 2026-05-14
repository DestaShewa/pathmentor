const SibApiV3Sdk = require('@getbrevo/brevo');

const sendVerificationEmail = async (toEmail, token) => {
  const client = SibApiV3Sdk.ApiClient.instance;
  client.authentications['api-key'].apiKey = process.env.BREVO_API_KEY;

  const emailApi = new SibApiV3Sdk.TransactionalEmailsApi();
  const verifyUrl = `${process.env.BASE_URL}/api/auth/verify-email?token=${token}`;

  await emailApi.sendTransacEmail({
    sender: { email: process.env.SENDER_EMAIL, name: 'PathMentor AI' },
    to: [{ email: toEmail }],
    subject: 'Verify your PathMentor AI account',
    htmlContent: `
      <div style="font-family:sans-serif;max-width:500px;margin:auto;padding:32px;background:#0f172a;color:#fff;border-radius:16px;">
        <h2 style="color:#6C63FF;">Welcome to PathMentor AI!</h2>
        <p style="color:#94a3b8;">Click the button below to verify your email. This link expires in <strong style="color:#fff;">24 hours</strong>.</p>
        <a href="${verifyUrl}" style="display:inline-block;padding:14px 32px;background:#6C63FF;color:#fff;font-weight:bold;border-radius:10px;text-decoration:none;">
          Verify My Email
        </a>
        <p style="color:#475569;font-size:12px;margin-top:32px;">If you did not create an account, ignore this email.</p>
      </div>
    `
  });
};

module.exports = sendVerificationEmail;