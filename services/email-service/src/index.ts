import express from 'express';
import nodemailer from 'nodemailer';
import { z } from 'zod';
import 'dotenv/config';
import { AddressInfo } from 'net';

const app = express();

const servicePort = Number(process.env.EMAIL_SERVICE_PORT || 7100);
const apiKey = process.env.EMAIL_SERVICE_API_KEY || '';
const appBaseUrl = (process.env.AUTH_APP_BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
const fromEmail = process.env.SMTP_FROM_EMAIL || 'no-reply@illustry.local';

const localeSchema = z.enum(['en', 'ro']).default('en');

const verificationSchema = z.object({
  to: z.string().email().max(254),
  verificationCode: z.string().regex(/^\d{6}$/),
  verificationUrl: z.string().url().optional(),
  locale: localeSchema.optional()
});

const passwordResetSchema = z.object({
  to: z.string().email().max(254),
  resetUrl: z.string().url(),
  locale: localeSchema.optional()
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

const getVerificationEmailContent = (
  locale: 'en' | 'ro',
  verificationCode: string,
  verificationUrl: string
) => {
  if (locale === 'ro') {
    return {
      subject: 'Codul tau de verificare Illustry',
      text: [
        'Bine ai venit in Illustry.',
        `Codul tau de verificare este: ${verificationCode}`,
        `Poti verifica si folosind acest link: ${verificationUrl}`,
        'Acest cod expira curand si poate fi folosit o singura data.'
      ].join('\n\n'),
      html: [
        '<p>Bine ai venit in Illustry.</p>',
        `<p>Codul tau de verificare este: <strong style="font-size:20px;letter-spacing:2px;">${verificationCode}</strong></p>`,
        `<p>Poti verifica si folosind acest link: <a href="${verificationUrl}">Verifica emailul</a></p>`,
        '<p>Acest cod expira curand si poate fi folosit o singura data.</p>'
      ].join('')
    };
  }

  return {
    subject: 'Your Illustry verification code',
    text: [
      'Welcome to Illustry.',
      `Your verification code is: ${verificationCode}`,
      `You can also verify using this link: ${verificationUrl}`,
      'This code expires soon and can be used only once.'
    ].join('\n\n'),
    html: [
      '<p>Welcome to Illustry.</p>',
      `<p>Your verification code is: <strong style="font-size:20px;letter-spacing:2px;">${verificationCode}</strong></p>`,
      `<p>You can also verify using this link: <a href="${verificationUrl}">Verify email</a></p>`,
      '<p>This code expires soon and can be used only once.</p>'
    ].join('')
  };
};

const getPasswordResetEmailContent = (locale: 'en' | 'ro', resetUrl: string) => {
  if (locale === 'ro') {
    return {
      subject: 'Reseteaza parola contului tau Illustry',
      text: [
        'A fost solicitata resetarea parolei pentru contul tau Illustry.',
        `Reseteaza parola accesand acest link: ${resetUrl}`,
        'Daca nu tu ai facut aceasta solicitare, poti ignora acest email.'
      ].join('\n\n'),
      html: [
        '<p>A fost solicitata resetarea parolei pentru contul tau Illustry.</p>',
        `<p><a href="${resetUrl}">Reseteaza parola</a></p>`,
        '<p>Daca nu tu ai facut aceasta solicitare, poti ignora acest email.</p>'
      ].join('')
    };
  }

  return {
    subject: 'Reset your Illustry password',
    text: [
      'A password reset was requested for your Illustry account.',
      `Reset your password by opening this link: ${resetUrl}`,
      'If you did not request this, you can ignore this email.'
    ].join('\n\n'),
    html: [
      '<p>A password reset was requested for your Illustry account.</p>',
      `<p><a href="${resetUrl}">Reset password</a></p>`,
      '<p>If you did not request this, you can ignore this email.</p>'
    ].join('')
  };
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
    const content = getVerificationEmailContent(payload.locale || 'en', payload.verificationCode, verificationUrl);

    await transporter.sendMail({
      from: fromEmail,
      to: payload.to,
      subject: content.subject,
      text: content.text,
      html: content.html
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
    const content = getPasswordResetEmailContent(payload.locale || 'en', payload.resetUrl);

    await transporter.sendMail({
      from: fromEmail,
      to: payload.to,
      subject: content.subject,
      text: content.text,
      html: content.html
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

const startEmailService = () => app.listen(servicePort, '0.0.0.0', () => {
  // eslint-disable-next-line no-console
  console.log(`[EmailService] listening on ${servicePort}`);
});

const bootEmailService = (shouldStart = require.main === module) => (shouldStart ? startEmailService() : null);

bootEmailService();

const getServiceUrl = (server: { address: () => string | AddressInfo | null }) => {
  const address = server.address();
  if (!address || typeof address === 'string') {
    throw new Error('Email service server address is unavailable');
  }

  return `http://127.0.0.1:${address.port}`;
};

export {
  app,
  transporter,
  requireApiKey,
  startEmailService,
  bootEmailService,
  getServiceUrl,
  getVerificationEmailContent,
  getPasswordResetEmailContent
};
