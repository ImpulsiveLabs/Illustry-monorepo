import type { Server } from 'http';

const createTransportMock = jest.fn();
const sendMailMock = jest.fn();

jest.mock('nodemailer', () => ({
  __esModule: true,
  default: {
    createTransport: (...args: unknown[]) => createTransportMock(...args)
  }
}));

describe('email service', () => {
  const originalEnv = { ...process.env };

  const loadModule = async () => {
    jest.resetModules();
    sendMailMock.mockReset();
    createTransportMock.mockReset();
    createTransportMock.mockReturnValue({ sendMail: sendMailMock });
    return import('../src/index');
  };

  const waitForListening = async (server: Server) => new Promise<void>((resolve, reject) => {
    server.once('listening', () => resolve());
    server.once('error', reject);
  });

  const startServer = async (): Promise<{
    baseUrl: string;
    close: () => Promise<void>;
  }> => {
    const module = await loadModule();
    const server = module.app.listen(0, '127.0.0.1') as unknown as Server;
    await waitForListening(server);
    const baseUrl = module.getServiceUrl(server);

    return {
      baseUrl,
      close: () => new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }
          resolve();
        });
      })
    };
  };

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      EMAIL_SERVICE_API_KEY: 'service-key',
      EMAIL_SERVICE_PORT: '7100',
      AUTH_APP_BASE_URL: 'http://localhost:3000/',
      SMTP_FROM_EMAIL: 'no-reply@test.local',
      SMTP_PORT: '2525',
      SMTP_SECURE: 'true',
      SMTP_HOST: 'smtp.test.local',
      SMTP_USER: 'mailer',
      SMTP_PASS: 'secret'
    };
    jest.clearAllMocks();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('configures the transporter from environment and exposes a health endpoint', async () => {
    process.env.EMAIL_SERVICE_PORT = '0';
    const module = await loadModule();
    expect(createTransportMock).toHaveBeenCalledWith({
      host: 'smtp.test.local',
      port: 2525,
      secure: true,
      auth: {
        user: 'mailer',
        pass: 'secret'
      }
    });

    const server = module.startEmailService() as unknown as Server;
    await waitForListening(server);
    const baseUrl = module.getServiceUrl(server);
    const response = await fetch(`${baseUrl}/health`);
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  it('rejects missing or invalid api keys and validates verification payloads', async () => {
    const { baseUrl, close } = await startServer();

    const unauthorized = await fetch(`${baseUrl}/api/email/send-verification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: 'user@example.com', verificationCode: '123456' })
    });
    expect(unauthorized.status).toBe(401);

    const invalidPayload = await fetch(`${baseUrl}/api/email/send-verification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-email-service-key': 'service-key'
      },
      body: JSON.stringify({ to: 'user@example.com', verificationCode: 'abc' })
    });
    expect(invalidPayload.status).toBe(400);
    await expect(invalidPayload.json()).resolves.toEqual({
      error: 'Invalid verification email payload'
    });

    await close();
  });


  it('renders romanian verification and reset templates when locale is ro', async () => {
    const module = await loadModule();

    expect(module.getVerificationEmailContent('ro', '123456', 'https://custom.test/verify')).toEqual(expect.objectContaining({
      subject: 'Codul tau de verificare Illustry'
    }));
    expect(module.getPasswordResetEmailContent('ro', 'https://custom.test/reset')).toEqual(expect.objectContaining({
      subject: 'Reseteaza parola contului tau Illustry'
    }));

    const { baseUrl, close } = await startServer();
    sendMailMock
      .mockResolvedValueOnce({ accepted: ['ro-verify@example.com'] })
      .mockResolvedValueOnce({ accepted: ['ro-reset@example.com'] });

    const verificationResponse = await fetch(`${baseUrl}/api/email/send-verification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-email-service-key': 'service-key'
      },
      body: JSON.stringify({
        to: 'ro-verify@example.com',
        verificationCode: '123456',
        locale: 'ro'
      })
    });

    expect(verificationResponse.status).toBe(200);
    expect(sendMailMock).toHaveBeenNthCalledWith(1, expect.objectContaining({
      subject: 'Codul tau de verificare Illustry'
    }));
    expect(sendMailMock.mock.calls[0][0].text).toContain('Codul tau de verificare este: 123456');

    const resetResponse = await fetch(`${baseUrl}/api/email/send-password-reset`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-email-service-key': 'service-key'
      },
      body: JSON.stringify({
        to: 'ro-reset@example.com',
        resetUrl: 'https://custom.test/reset',
        locale: 'ro'
      })
    });

    expect(resetResponse.status).toBe(200);
    expect(sendMailMock).toHaveBeenNthCalledWith(2, expect.objectContaining({
      subject: 'Reseteaza parola contului tau Illustry'
    }));
    expect(sendMailMock.mock.calls[1][0].html).toContain('Reseteaza parola');

    await close();
  });

  it('sends verification and password reset emails and handles failures', async () => {
    const { baseUrl, close } = await startServer();

    sendMailMock
      .mockResolvedValueOnce({ accepted: ['user@example.com'] })
      .mockRejectedValueOnce(new Error('smtp failed'))
      .mockResolvedValueOnce({ accepted: ['user@example.com'] })
      .mockRejectedValueOnce(new Error('smtp failed'));

    const okVerification = await fetch(`${baseUrl}/api/email/send-verification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-email-service-key': 'service-key'
      },
      body: JSON.stringify({
        to: 'user@example.com',
        verificationCode: '123456'
      })
    });
    expect(okVerification.status).toBe(200);
    expect(sendMailMock).toHaveBeenNthCalledWith(1, expect.objectContaining({
      from: 'no-reply@test.local',
      to: 'user@example.com',
      subject: 'Your Illustry verification code'
    }));
    expect(sendMailMock.mock.calls[0][0].text).toContain(
      'http://localhost:3000/verify-email-required?email=user%40example.com'
    );

    const failedVerification = await fetch(`${baseUrl}/api/email/send-verification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-email-service-key': 'service-key'
      },
      body: JSON.stringify({
        to: 'user@example.com',
        verificationCode: '123456',
        verificationUrl: 'https://custom.test/verify'
      })
    });
    expect(failedVerification.status).toBe(500);

    const okReset = await fetch(`${baseUrl}/api/email/send-password-reset`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-email-service-key': 'service-key'
      },
      body: JSON.stringify({
        to: 'user@example.com',
        resetUrl: 'https://custom.test/reset'
      })
    });
    expect(okReset.status).toBe(200);
    expect(sendMailMock).toHaveBeenNthCalledWith(3, expect.objectContaining({
      subject: 'Reset your Illustry password'
    }));

    const failedReset = await fetch(`${baseUrl}/api/email/send-password-reset`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-email-service-key': 'service-key'
      },
      body: JSON.stringify({
        to: 'user@example.com',
        resetUrl: 'https://custom.test/reset'
      })
    });
    expect(failedReset.status).toBe(500);

    const invalidReset = await fetch(`${baseUrl}/api/email/send-password-reset`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-email-service-key': 'service-key'
      },
      body: JSON.stringify({
        to: 'bad-email',
        resetUrl: 'not-a-url'
      })
    });
    expect(invalidReset.status).toBe(400);

    await close();
  });

  it('uses fallback environment defaults and can boot explicitly', async () => {
    delete process.env.EMAIL_SERVICE_PORT;
    delete process.env.AUTH_APP_BASE_URL;
    delete process.env.SMTP_FROM_EMAIL;
    delete process.env.SMTP_PORT;
    delete process.env.SMTP_SECURE;
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASS;

    const module = await loadModule();
    expect(createTransportMock).toHaveBeenCalledWith({
      host: 'smtp.test.local',
      port: 587,
      secure: false,
      auth: undefined
    });

    const fakeServer = { close: jest.fn() } as unknown as Server;
    const listenSpy = jest.spyOn(module.app, 'listen').mockImplementation((...args: any[]) => {
      const callback = args[args.length - 1];
      if (typeof callback === 'function') {
        callback();
      }
      return fakeServer as any;
    });

    expect(module.bootEmailService(true)).toBe(fakeServer);
    expect(listenSpy).toHaveBeenCalledWith(7100, '0.0.0.0', expect.any(Function));

    listenSpy.mockRestore();

    const server = module.app.listen(0, '127.0.0.1') as unknown as Server;
    await waitForListening(server);
    const baseUrl = module.getServiceUrl(server);

    sendMailMock.mockResolvedValueOnce({ accepted: ['fallback@example.com'] });

    const response = await fetch(`${baseUrl}/api/email/send-verification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-email-service-key': 'service-key'
      },
      body: JSON.stringify({
        to: 'fallback@example.com',
        verificationCode: '123456'
      })
    });

    expect(response.status).toBe(200);
    expect(sendMailMock).toHaveBeenCalledWith(expect.objectContaining({
      from: 'no-reply@illustry.local'
    }));
    expect(sendMailMock.mock.calls[0][0].text).toContain(
      'http://localhost:3000/verify-email-required?email=fallback%40example.com'
    );

    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  it('boots conditionally and rejects unavailable server addresses', async () => {
    const module = await loadModule();
    expect(module.bootEmailService(false)).toBeNull();
    expect(() => module.getServiceUrl({ address: () => null })).toThrow('Email service server address is unavailable');
    expect(() => module.getServiceUrl({ address: () => 'named-pipe' } as any)).toThrow('Email service server address is unavailable');
  });

  it('returns a server error when the api key is not configured and handles missing smtp auth', async () => {
    delete process.env.EMAIL_SERVICE_API_KEY;
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASS;

    const module = await loadModule();
    expect(createTransportMock).toHaveBeenCalledWith(expect.objectContaining({
      auth: undefined
    }));

    const server = module.app.listen(0, '127.0.0.1') as unknown as Server;
    await waitForListening(server);
    const baseUrl = module.getServiceUrl(server);
    const response = await fetch(`${baseUrl}/api/email/send-verification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: 'user@example.com', verificationCode: '123456' })
    });
    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: 'EMAIL_SERVICE_API_KEY is not configured'
    });
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });
});
