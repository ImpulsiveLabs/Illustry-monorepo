const registerMock = jest.fn();
const getSessionPrincipalFromTokenMock = jest.fn();
const toPublicUserMock = jest.fn();
const connectMock = jest.fn();
const cleanupMock = jest.fn();
const loggerErrorMock = jest.fn();
const loggerInfoMock = jest.fn();

jest.mock('../../src/config/logger', () => ({
  __esModule: true,
  default: {
    error: (...args: unknown[]) => loggerErrorMock(...args),
    info: (...args: unknown[]) => loggerInfoMock(...args)
  }
}));

jest.mock('../../src/factory', () => ({
  __esModule: true,
  default: {
    getInstance: () => ({
      connect: connectMock,
      cleanup: cleanupMock,
      getBZL: () => ({
        AuthBZL: {
          register: registerMock,
          getSessionPrincipalFromToken: getSessionPrincipalFromTokenMock,
          toPublicUser: toPublicUserMock
        }
      })
    })
  }
}));

describe('auth register route', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    process.env = {
      ...originalEnv,
      ILLUSTRY_PORT: '0',
      AUTH_COOKIE_SECURE: 'false',
      AUTH_SESSION_COOKIE_NAME: 'illustry_session',
      AUTH_CSRF_COOKIE_NAME: 'illustry_csrf'
    };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('allows initial registration without a pre-existing csrf token', async () => {
    const publicUser = {
      id: 'user-id',
      email: 'user@example.com',
      name: 'User',
      isEmailVerified: false,
      roles: ['user'],
      hasAvatar: false
    };

    registerMock.mockResolvedValue({
      sessionToken: 'session-token',
      csrfToken: 'csrf-token',
      expiresAt: new Date(Date.now() + 60_000)
    });
    getSessionPrincipalFromTokenMock.mockResolvedValue({
      user: { _id: { toString: () => 'user-id' } }
    });
    toPublicUserMock.mockReturnValue(publicUser);

    const { default: Illustry } = await import('../../src/app');
    const app = new Illustry() as any;
    const server = app.httpServer;
    await new Promise<void>((resolve) => server.once('listening', resolve));
    const address = server.address();
    const port = typeof address === 'object' && address ? address.port : 0;

    const formData = new FormData();
    formData.set('email', 'user@example.com');
    formData.set('password', 'Secret123!Secret');
    formData.set('name', 'User');

    const response = await fetch(`http://127.0.0.1:${port}/api/auth/register`, {
      method: 'POST',
      body: formData
    });

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({ user: publicUser });
    expect(registerMock).toHaveBeenCalledWith(
      'user@example.com',
      'Secret123!Secret',
      'User',
      undefined,
      expect.objectContaining({ userAgent: expect.any(String) }),
      'en'
    );
    expect(response.headers.get('set-cookie')).toContain('illustry_csrf=csrf-token');

    await new Promise<void>((resolve, reject) => server.close((error: Error | undefined) => (
      error ? reject(error) : resolve()
    )));
  });
});
