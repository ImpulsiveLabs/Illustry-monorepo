const infoMock = jest.fn();

jest.mock('../../src/config/logger', () => ({
  __esModule: true,
  default: {
    info: (...args: unknown[]) => infoMock(...args)
  }
}));

describe('auth email service client', () => {
  const originalEnv = { ...process.env };
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    process.env = {
      ...originalEnv,
      AUTH_APP_BASE_URL: 'http://localhost:3000/',
      EMAIL_SERVICE_URL: 'http://email-service:7100/',
      EMAIL_SERVICE_API_KEY: 'service-key'
    };
  });

  afterAll(() => {
    process.env = originalEnv;
    global.fetch = originalFetch;
  });

  it('sends localized verification and reset payloads to the external email service', async () => {
    const fetchMock = jest.fn(async () => ({ ok: true, text: async () => '' })) as any;
    global.fetch = fetchMock;

    const { default: EmailService } = await import('../../src/auth/email');
    const service = new EmailService();

    await service.sendVerificationEmail('user@example.com', 'verify-token', '123456', 'ro');
    await service.sendPasswordResetEmail('user@example.com', 'reset-token', 'en');

    expect(fetchMock).toHaveBeenNthCalledWith(1,
      'http://email-service:7100/api/email/send-verification',
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Email-Service-Key': 'service-key'
        },
        body: JSON.stringify({
          to: 'user@example.com',
          verificationCode: '123456',
          verificationUrl: 'http://localhost:3000/verify-email?token=verify-token',
          locale: 'ro'
        })
      })
    );

    expect(fetchMock).toHaveBeenNthCalledWith(2,
      'http://email-service:7100/api/email/send-password-reset',
      expect.objectContaining({
        body: JSON.stringify({
          to: 'user@example.com',
          resetUrl: 'http://localhost:3000/reset-password?token=reset-token',
          locale: 'en'
        })
      })
    );
    expect(infoMock).toHaveBeenCalledWith('Auth email queued via external service for user@example.com');
  });

  it('throws when the email service is misconfigured or responds with an error', async () => {
    process.env.EMAIL_SERVICE_URL = '';
    let emailModule = await import('../../src/auth/email');
    let service = new emailModule.default();
    await expect(service.sendVerificationEmail('user@example.com', 'verify-token', '123456', 'ro')).rejects.toThrow(
      'EMAIL_SERVICE_URL is not configured'
    );

    jest.resetModules();
    process.env.EMAIL_SERVICE_URL = 'http://email-service:7100/';
    process.env.EMAIL_SERVICE_API_KEY = '';
    emailModule = await import('../../src/auth/email');
    service = new emailModule.default();
    await expect(service.sendPasswordResetEmail('user@example.com', 'reset-token', 'ro')).rejects.toThrow(
      'EMAIL_SERVICE_API_KEY is not configured'
    );

    jest.resetModules();
    process.env.EMAIL_SERVICE_API_KEY = 'service-key';
    global.fetch = jest.fn(async () => ({
      ok: false,
      status: 503,
      text: async () => 'temporary failure'
    })) as any;
    emailModule = await import('../../src/auth/email');
    service = new emailModule.default();

    await expect(service.sendVerificationEmail('user@example.com', 'verify-token', '123456', 'en')).rejects.toThrow(
      'Email service request failed (503): temporary failure'
    );

    jest.resetModules();
    process.env.EMAIL_SERVICE_API_KEY = 'service-key';
    global.fetch = jest.fn(async () => ({
      ok: false,
      status: 500,
      text: async () => JSON.stringify({
        error: 'SMTP authentication failed. Set SMTP_USER to your Gmail address and SMTP_PASS to a Gmail App Password.'
      })
    })) as any;
    emailModule = await import('../../src/auth/email');
    service = new emailModule.default();

    await expect(service.sendVerificationEmail('user@example.com', 'verify-token', '123456', 'en')).rejects.toThrow(
      'SMTP authentication failed. Set SMTP_USER to your Gmail address and SMTP_PASS to a Gmail App Password.'
    );
  });
});
