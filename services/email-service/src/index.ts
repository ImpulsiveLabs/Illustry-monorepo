import express from 'express';
import nodemailer from 'nodemailer';
import { z } from 'zod';
import 'dotenv/config';

const app = express();

const servicePort = Number(process.env.EMAIL_SERVICE_PORT || 7100);
const apiKey = process.env.EMAIL_SERVICE_API_KEY || '';
const appBaseUrl = (process.env.AUTH_APP_BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
const fromEmail = process.env.SMTP_FROM_EMAIL || 'no-reply@illustry.local';

const verificationSchema = z.object({
  to: z.string().email().max(254),
  verificationCode: z.string().regex(/^\d{6}$/),
  verificationUrl: z.string().url().optional()
});

const passwordResetSchema = z.object({
  to: z.string().email().max(254),
  resetUrl: z.string().url()
});

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: process.env.SMTP_SECURE === 'true',
  auth: process.env.SMTP_USER && process.env.SMTP_PASS
    ? {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
    : undefined
});

const requireApiKey: express.RequestHandler = (request, response, next) => {
  if (apiKey.length === 0) {
    response.status(500).send({ error: 'EMAIL_SERVICE_API_KEY is not configured' });
    return;
  }

  const providedKey = request.header('x-email-service-key');

  if (providedKey !== apiKey) {
    response.status(401).send({ error: 'Invalid email service API key' });
    return;
  }

  next();
};

app.use(express.json());

app.get('/health', (_request, response) => {
  response.status(200).send({ ok: true });
});

app.post('/api/email/send-verification', requireApiKey, async (request, response) => {
  try {
    const payload = verificationSchema.parse(request.body);
    const verificationUrl = payload.verificationUrl
      || `${appBaseUrl}/verify-email-required?email=${encodeURIComponent(payload.to)}`;

    await transporter.sendMail({
      from: fromEmail,
      to: payload.to,
      subject: 'Your Illustry verification code',
      text: [
        'Welcome to Illustry.',
        `Your verification code is: ${payload.verificationCode}`,
        `You can also verify using this link: ${verificationUrl}`,
        'This code expires soon and can be used only once.'
      ].join('\n\n'),
      html: [
        '<p>Welcome to Illustry.</p>',
        `<p>Your verification code is: <strong style="font-size:20px;letter-spacing:2px;">${payload.verificationCode}</strong></p>`,
        `<p>You can also verify using this link: <a href="${verificationUrl}">Verify email</a></p>`,
        '<p>This code expires soon and can be used only once.</p>'
      ].join('')
    });

    response.status(200).send({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      response.status(400).send({ error: 'Invalid verification email payload' });
      return;
    }

    response.status(500).send({ error: 'Failed to send verification email' });
  }
});

app.post('/api/email/send-password-reset', requireApiKey, async (request, response) => {
  try {
    const payload = passwordResetSchema.parse(request.body);

    await transporter.sendMail({
      from: fromEmail,
      to: payload.to,
      subject: 'Reset your Illustry password',
      text: [
        'A password reset was requested for your Illustry account.',
        `Reset your password by opening this link: ${payload.resetUrl}`,
        'If you did not request this, you can ignore this email.'
      ].join('\n\n'),
      html: [
        '<p>A password reset was requested for your Illustry account.</p>',
        `<p><a href="${payload.resetUrl}">Reset password</a></p>`,
        '<p>If you did not request this, you can ignore this email.</p>'
      ].join('')
    });

    response.status(200).send({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      response.status(400).send({ error: 'Invalid password reset email payload' });
      return;
    }

    response.status(500).send({ error: 'Failed to send password reset email' });
  }
});

app.listen(servicePort, '0.0.0.0', () => {
  // eslint-disable-next-line no-console
  console.log(`[EmailService] listening on ${servicePort}`);
});
