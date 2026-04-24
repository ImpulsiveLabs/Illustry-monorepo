import express from 'express';
import nodemailer from 'nodemailer';
import { z } from 'zod';
import 'dotenv/config';
import { AddressInfo } from 'net';

const app = express();

const servicePort = Number(process.env.EMAIL_SERVICE_PORT || 7100);
const apiKey = process.env.EMAIL_SERVICE_API_KEY || '';
const appBaseUrl = (process.env.AUTH_APP_BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
const fromEmail = process.env.SMTP_FROM_EMAIL || 'Illustry <onboarding@resend.dev>';
const resendApiKey = (process.env.RESEND_API_KEY || '').trim();
const resendTestEmail = (process.env.RESEND_TEST_EMAIL || '').trim();
const smtpHost = (process.env.SMTP_HOST || '').trim();
const emailTransportConfigError = resendApiKey.length > 0 || smtpHost.length > 0
  ? null
  : 'No email transport is configured. Set RESEND_API_KEY or SMTP_HOST.';

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

const getEmailProviderErrorMessage = (error: unknown, action: 'verification' | 'password reset') => {
  if (typeof error === 'object' && error && 'code' in error) {
    const smtpError = error as { code?: string };
    if (smtpError.code === 'EAUTH') {
      return 'SMTP authentication failed. Set SMTP_USER to your Gmail address and SMTP_PASS to a Gmail App Password.';
    }
  }

  if (typeof error === 'object' && error && 'name' in error) {
    const providerError = error as { name?: string; message?: string };
    if (providerError.name === 'ResendApiError' && providerError.message) {
      return providerError.message;
    }
  }

  return action === 'verification'
    ? 'Failed to send verification email'
    : 'Failed to send password reset email';
};

const transporter = smtpHost.length === 0
  ? null
  : nodemailer.createTransport({
    host: smtpHost,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: process.env.SMTP_USER && process.env.SMTP_PASS
      ? {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
      : undefined
  });

const sendWithResend = async (options: {
  to: string;
  subject: string;
  text: string;
  html: string;
}) => {
  const recipient = fromEmail.includes('@resend.dev') && resendTestEmail.length > 0
    ? resendTestEmail
    : options.to;

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [recipient],
      subject: options.subject,
      text: options.text,
      html: options.html
    })
  });

  if (response.ok) {
    return;
  }

  let message = 'Failed to send email via Resend';
  try {
    const payload = await response.json() as { message?: string; error?: { message?: string } };
    message = payload.message || payload.error?.message || message;
  } catch {
    const text = await response.text();
    if (text) {
      message = text;
    }
  }

  const error = new Error(message) as Error & { name: string; statusCode?: number };
  error.name = 'ResendApiError';
  error.statusCode = response.status;
  throw error;
};

const sendEmail = async (options: {
  to: string;
  subject: string;
  text: string;
  html: string;
}) => {
  if (resendApiKey.length > 0) {
    await sendWithResend(options);
    return;
  }

  if (!transporter) {
    throw new Error(emailTransportConfigError || 'Email transporter is unavailable');
  }

  await transporter.sendMail({
    from: fromEmail,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html
  });
};

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

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const getVerificationEmailContent = (
  locale: 'en' | 'ro',
  verificationCode: string,
  verificationUrl: string
) => {
  const safeVerificationCode = escapeHtml(verificationCode);
  const safeVerificationUrl = escapeHtml(verificationUrl);

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
        `<p>Codul tau de verificare este: <strong style="font-size:20px;letter-spacing:2px;">${safeVerificationCode}</strong></p>`,
        `<p>Poti verifica si folosind acest link: <a href="${safeVerificationUrl}">Verifica emailul</a></p>`,
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
      `<p>Your verification code is: <strong style="font-size:20px;letter-spacing:2px;">${safeVerificationCode}</strong></p>`,
      `<p>You can also verify using this link: <a href="${safeVerificationUrl}">Verify email</a></p>`,
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
  if (emailTransportConfigError) {
    response.status(503).send({
      ok: false,
      error: emailTransportConfigError
    });
    return;
  }

  response.status(200).send({ ok: true });
});

app.post('/api/email/send-verification', requireApiKey, async (request, response) => {
  try {
    if (emailTransportConfigError) {
      response.status(500).send({ error: emailTransportConfigError });
      return;
    }

    const payload = verificationSchema.parse(request.body);
    const verificationUrl = payload.verificationUrl
      || `${appBaseUrl}/verify-email-required?email=${encodeURIComponent(payload.to)}`;
    const content = getVerificationEmailContent(payload.locale || 'en', payload.verificationCode, verificationUrl);

    await sendEmail({
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

    const message = getEmailProviderErrorMessage(error, 'verification');
    // eslint-disable-next-line no-console
    console.error('[EmailService] Failed to send verification email', error);
    response.status(500).send({ error: message });
  }
});

app.post('/api/email/send-password-reset', requireApiKey, async (request, response) => {
  try {
    if (emailTransportConfigError) {
      response.status(500).send({ error: emailTransportConfigError });
      return;
    }

    const payload = passwordResetSchema.parse(request.body);
    const content = getPasswordResetEmailContent(payload.locale || 'en', payload.resetUrl);

    await sendEmail({
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

    const message = getEmailProviderErrorMessage(error, 'password reset');
    // eslint-disable-next-line no-console
    console.error('[EmailService] Failed to send password reset email', error);
    response.status(500).send({ error: message });
  }
});

const startEmailService = () => {
  if (emailTransportConfigError) {
    throw new Error(emailTransportConfigError);
  }

  return app.listen(servicePort, '0.0.0.0', () => {
  // eslint-disable-next-line no-console
    console.log(`[EmailService] listening on ${servicePort}`);
  });
};

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
  emailTransportConfigError,
  requireApiKey,
  startEmailService,
  bootEmailService,
  getServiceUrl,
  getVerificationEmailContent,
  getPasswordResetEmailContent
};
