require('dotenv').config();

const SibApiV3Sdk = require('@getbrevo/brevo');

const testBrevoAPI = async () => {
  try {
    const client = SibApiV3Sdk.ApiClient.instance;

    console.log('BREVO_API_KEY:', process.env.BREVO_API_KEY);

    if (!process.env.BREVO_API_KEY) {
      throw new Error("BREVO_API_KEY is missing in environment variables.");
    }

    client.authentications['api-key'].apiKey = process.env.BREVO_API_KEY;

    const emailApi = new SibApiV3Sdk.TransactionalEmailsApi();
    const testEmail = {
      sender: { email: process.env.SENDER_EMAIL, name: 'PathMentor AI' },
      to: [{ email: 'test@example.com' }],
      subject: 'Test Email from PathMentor',
      htmlContent: '<h1>This is a test email</h1>',
    };

    const response = await emailApi.sendTransacEmail(testEmail);
    console.log('Email sent successfully:', response);
  } catch (error) {
    console.error('Error testing Brevo API:', error.message);
  }
};

testBrevoAPI();