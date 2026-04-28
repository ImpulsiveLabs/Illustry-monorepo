import logger from '../config/logger';
import {
  appBaseUrl,
  emailServiceApiKey,
  emailServiceUrl
} from './constants';
import { AuthLocale } from './locale';
import { AuthHttpError } from './errors';

class EmailService {
  async sendVerificationEmail(
    email: string,
    token: string,
    verificationCode: string,
    locale: AuthLocale
  ): Promise<void> {
    const verifyUrl = `${appBaseUrl.replace(/\/$/, '')}/verify-email?token=${encodeURIComponent(token)}`;

    await this.sendThroughEmailService('/api/email/send-verification', {
      to: email,
      verificationCode,
      verificationUrl: verifyUrl,
      locale
    });
  }

  async sendPasswordResetEmail(email: string, token: string, locale: AuthLocale): Promise<void> {
    const resetUrl = `${appBaseUrl.replace(/\/$/, '')}/reset-password?token=${encodeURIComponent(token)}`;

    await this.sendThroughEmailService('/api/email/send-password-reset', {
      to: email,
      resetUrl,
      locale
    });
  }

  private async sendThroughEmailService(path: string, payload: Record<string, unknown>): Promise<void> {
    if (emailServiceUrl.length === 0) {
      throw new Error('EMAIL_SERVICE_URL is not configured');
    }

    if (emailServiceApiKey.length === 0) {
      throw new Error('EMAIL_SERVICE_API_KEY is not configured');
    }

    const response = await fetch(`${emailServiceUrl.replace(/\/$/, '')}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Email-Service-Key': emailServiceApiKey
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10_000)
    });

    if (!response.ok) {
      const errorBody = await response.text();
      try {
        const parsed = JSON.parse(errorBody) as { error?: string };
        if (parsed.error) {
          throw new AuthHttpError(response.status, parsed.error);
        }
      } catch (error) {
        if (error instanceof AuthHttpError) {
          throw error;
        }
      }

      throw new Error(`Email service request failed (${response.status}): ${errorBody}`);
    }

    if (typeof payload.to === 'string') {
      logger.info(`Auth email queued via external service for ${payload.to}`);
    }
  }
}

export default EmailService;
