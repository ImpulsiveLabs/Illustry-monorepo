const registerMock = jest.fn();
const getSessionPrincipalFromTokenMock = jest.fn();
const toPublicUserMock = jest.fn();
const connectMock = jest.fn();
const cleanupMock = jest.fn();
const loggerErrorMock = jest.fn();
const loggerInfoMock = jest.fn();

const waitForServer = async (server: any) => {
  if (server.listening) {
    return;
  }
  await new Promise<void>((resolve) => server.once('listening', resolve));
};

jest.mock('../../src/config/logger', () => ({
  __esModule: true,
  default: {
    error: (...args: unknown[]) => loggerErrorMock(...args),
    info: (...args: unknown[]) => loggerInfoMock(...args)
  }
}));

jest.mock('../../src/realtime/broker', () => ({
  attachRealtimeServer: jest.fn(),
  closeRealtimeServer: jest.fn(),
  publish: jest.fn()
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
    await waitForServer(server);
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

  it('rejects protected cookie-authenticated mutations without csrf before route handlers run', async () => {
    getSessionPrincipalFromTokenMock.mockResolvedValue({
      user: {
        _id: { toString: () => 'user-id' },
        email: 'user@example.com',
        name: 'User',
        isEmailVerified: true,
        roles: ['user']
      },
      session: {
        csrfTokenHash: 'stored-csrf-hash'
      }
    });

    const { default: Illustry } = await import('../../src/app');
    const app = new Illustry() as any;
    const server = app.httpServer;
    await waitForServer(server);
    const address = server.address();
    const port = typeof address === 'object' && address ? address.port : 0;

    const response = await fetch(`http://127.0.0.1:${port}/api/project`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: 'illustry_session=session-token'
      },
      body: JSON.stringify({
        projectName: 'Project',
        projectDescription: 'Description'
      })
    });

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({ error: 'Missing CSRF token' });

    await new Promise<void>((resolve, reject) => server.close((error: Error | undefined) => (
      error ? reject(error) : resolve()
    )));
  });

  it('rejects protected mutations without a session as unauthenticated', async () => {
    const { default: Illustry } = await import('../../src/app');
    const app = new Illustry() as any;
    const server = app.httpServer;
    await waitForServer(server);
    const address = server.address();
    const port = typeof address === 'object' && address ? address.port : 0;

    const response = await fetch(`http://127.0.0.1:${port}/api/project`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        projectName: 'Project',
        projectDescription: 'Description'
      })
    });

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: 'Authentication required' });

    await new Promise<void>((resolve, reject) => server.close((error: Error | undefined) => (
      error ? reject(error) : resolve()
    )));
  });

  it('rejects public unsafe auth requests without csrf when a session cookie is already present', async () => {
    getSessionPrincipalFromTokenMock.mockResolvedValue({
      user: {
        _id: { toString: () => 'user-id' },
        email: 'user@example.com',
        name: 'User',
        isEmailVerified: true,
        roles: ['user']
      },
      session: {
        csrfTokenHash: 'stored-csrf-hash'
      }
    });

    const { default: Illustry } = await import('../../src/app');
    const app = new Illustry() as any;
    const server = app.httpServer;
    await waitForServer(server);
    const address = server.address();
    const port = typeof address === 'object' && address ? address.port : 0;

    const response = await fetch(`http://127.0.0.1:${port}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: 'illustry_session=session-token'
      },
      body: JSON.stringify({
        email: 'user@example.com',
        password: 'Secret123!Secret'
      })
    });

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({ error: 'Missing CSRF token' });

    await new Promise<void>((resolve, reject) => server.close((error: Error | undefined) => (
      error ? reject(error) : resolve()
    )));
  });
});
