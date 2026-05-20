const validateWithSchemaMock = jest.fn();
const projectCreateMock = jest.fn();
const projectUpdateMock = jest.fn();
const projectFindOneMock = jest.fn();
const projectDeleteMock = jest.fn();
const projectBrowseMock = jest.fn();
const visualizationCreateOrUpdateMock = jest.fn();
const visualizationCreateOrUpdateFromFilesMock = jest.fn();
const visualizationFindOneMock = jest.fn();
const visualizationFindSharedThroughDashboardMock = jest.fn();
const visualizationDeleteMock = jest.fn();
const visualizationBrowseMock = jest.fn();
const dashboardCreateMock = jest.fn();
const dashboardUpdateMock = jest.fn();
const dashboardFindOneMock = jest.fn();
const dashboardDeleteMock = jest.fn();
const dashboardBrowseMock = jest.fn();
const authRegisterMock = jest.fn();
const authLoginMock = jest.fn();
const authLogoutMock = jest.fn();
const authGetSessionPrincipalFromTokenMock = jest.fn();
const authToPublicUserMock = jest.fn();
const authGetUserAvatarMock = jest.fn();
const authRotateCsrfTokenMock = jest.fn();
const authUpdateProfileMock = jest.fn();
const authChangePasswordMock = jest.fn();
const authRotateSessionMock = jest.fn();
const authVerifyEmailMock = jest.fn();
const authVerifyEmailCodeMock = jest.fn();
const authResendVerificationMock = jest.fn();
const authForgotPasswordMock = jest.fn();
const authResetPasswordMock = jest.fn();

jest.mock('@illustry/types', () => ({
  ValidatorSchemas: {
    dashboardUpdateSchema: {},
    dashboardFilterSchema: {},
    projectCreateSchema: {},
    projectUpdateSchema: {},
    projectFilterSchema: {},
    visualizationDataSchema: {},
    visualizationFilterSchema: {},
    visualizationTypeSchema: {},
    validateWithSchema: (...args: unknown[]) => validateWithSchemaMock(...args)
  }
}));

jest.mock('../../src/factory', () => ({
  __esModule: true,
  default: {
    getInstance: () => ({
      getBZL: () => ({
        ProjectBZL: {
          create: projectCreateMock,
          update: projectUpdateMock,
          findOne: projectFindOneMock,
          delete: projectDeleteMock,
          browse: projectBrowseMock
        },
        VisualizationBZL: {
          createOrUpdate: visualizationCreateOrUpdateMock,
          createOrUpdateFromFiles: visualizationCreateOrUpdateFromFilesMock,
          findOne: visualizationFindOneMock,
          findSharedThroughDashboard: visualizationFindSharedThroughDashboardMock,
          delete: visualizationDeleteMock,
          browse: visualizationBrowseMock
        },
        DashboardBZL: {
          create: dashboardCreateMock,
          update: dashboardUpdateMock,
          findOne: dashboardFindOneMock,
          delete: dashboardDeleteMock,
          browse: dashboardBrowseMock
        },
        AuthBZL: {
          register: authRegisterMock,
          login: authLoginMock,
          logout: authLogoutMock,
          getSessionPrincipalFromToken: authGetSessionPrincipalFromTokenMock,
          toPublicUser: authToPublicUserMock,
          getUserAvatar: authGetUserAvatarMock,
          rotateCsrfToken: authRotateCsrfTokenMock,
          updateProfile: authUpdateProfileMock,
          changePassword: authChangePasswordMock,
          rotateSession: authRotateSessionMock,
          verifyEmail: authVerifyEmailMock,
          verifyEmailCode: authVerifyEmailCodeMock,
          resendVerification: authResendVerificationMock,
          forgotPassword: authForgotPasswordMock,
          resetPassword: authResetPasswordMock
        }
      })
    })
  }
}));

import * as authApi from '../../src/api/auth/auth';
import * as dashboardApi from '../../src/api/dashboard/dashboard';
import * as projectApi from '../../src/api/project/project';
import * as visualizationApi from '../../src/api/visualization/visualization';

const createResponse = () => ({
  req: {},
  setHeader: jest.fn(),
  contentType: jest.fn().mockReturnThis(),
  cookie: jest.fn().mockReturnThis(),
  clearCookie: jest.fn().mockReturnThis(),
  redirect: jest.fn(),
  status: jest.fn().mockReturnThis(),
  send: jest.fn()
});

const callHandler = async (
  handler: (request: any, response: any, next: any) => Promise<void>,
  request: Record<string, unknown>
) => {
  const response = createResponse();
  const next = jest.fn();
  await handler({
    header: jest.fn(() => undefined),
    cookies: {},
    query: {},
    body: {},
    headers: {},
    socket: { remoteAddress: '127.0.0.1' },
    ...request
  }, response, next);
  return { response, next };
};

describe('api controllers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    validateWithSchemaMock.mockReturnValue(undefined);
    projectCreateMock.mockResolvedValue({ ok: true });
    projectUpdateMock.mockResolvedValue({ updated: true });
    projectFindOneMock.mockResolvedValue({ found: true });
    projectDeleteMock.mockResolvedValue({ deleted: true });
    projectBrowseMock.mockResolvedValue([{ name: 'Project' }]);
    visualizationCreateOrUpdateMock.mockResolvedValue({ visualization: true });
    visualizationCreateOrUpdateFromFilesMock.mockResolvedValue({ uploaded: true });
    visualizationFindOneMock.mockResolvedValue({ found: true });
    visualizationFindSharedThroughDashboardMock.mockResolvedValue({ found: true });
    visualizationDeleteMock.mockResolvedValue({ deleted: true });
    visualizationBrowseMock.mockResolvedValue([{ name: 'Chart' }]);
    dashboardCreateMock.mockResolvedValue({ ok: true });
    dashboardUpdateMock.mockResolvedValue({ updated: true });
    dashboardFindOneMock.mockResolvedValue({ found: true });
    dashboardDeleteMock.mockResolvedValue({ deleted: true });
    dashboardBrowseMock.mockResolvedValue([{ name: 'Dashboard' }]);
    const session = {
      sessionToken: 'session-token',
      csrfToken: 'csrf-token',
      expiresAt: new Date('2030-01-01T00:00:00.000Z')
    };
    authRegisterMock.mockResolvedValue(session);
    authLoginMock.mockResolvedValue(session);
    authGetSessionPrincipalFromTokenMock.mockResolvedValue({ user: { id: 'user-1' } });
    authToPublicUserMock.mockReturnValue({ id: 'user-1', email: 'user@example.com' });
    authGetUserAvatarMock.mockResolvedValue({ contentType: 'image/png', data: Buffer.from('avatar') });
    authRotateCsrfTokenMock.mockResolvedValue({ csrfToken: 'new-csrf-token', expiresAt: session.expiresAt });
    authUpdateProfileMock.mockResolvedValue({ id: 'user-1', name: 'New User' });
    authChangePasswordMock.mockResolvedValue(undefined);
    authRotateSessionMock.mockResolvedValue(session);
    authVerifyEmailMock.mockResolvedValue(undefined);
    authVerifyEmailCodeMock.mockResolvedValue(undefined);
    authResendVerificationMock.mockResolvedValue(undefined);
    authForgotPasswordMock.mockResolvedValue(undefined);
    authResetPasswordMock.mockResolvedValue(undefined);
  });

  it('runs auth controller success paths', async () => {
    const avatar = {
      originalname: 'avatar.png',
      mimetype: 'image/png',
      size: 6,
      buffer: Buffer.from('avatar')
    };

    const registerResult = await callHandler(authApi.register, {
      body: { email: 'user@example.com', password: 'Secret123!Secret', name: 'User' },
      files: { avatar: [avatar] },
      headers: {},
      ip: '127.0.0.1'
    });
    expect(registerResult.response.status).toHaveBeenCalledWith(201);
    expect(authRegisterMock).toHaveBeenCalledWith(
      'user@example.com',
      'Secret123!Secret',
      'User',
      expect.objectContaining({ fileName: 'avatar.png' }),
      expect.any(Object),
      'en'
    );

    const loginResult = await callHandler(authApi.login, {
      body: { email: 'user@example.com', password: 'Secret123!Secret' },
      headers: {},
      ip: '127.0.0.1'
    });
    expect(loginResult.response.status).toHaveBeenCalledWith(200);
    expect(authLoginMock).toHaveBeenCalledWith('user@example.com', 'Secret123!Secret', expect.any(Object));

    const logoutResult = await callHandler(authApi.logout, { cookies: { illustry_sid: 'session-token' } });
    expect(logoutResult.response.status).toHaveBeenCalledWith(200);
    expect(authLogoutMock).toHaveBeenCalledWith('session-token');

    const meResult = await callHandler(authApi.me as any, {
      auth: {
        userId: 'user-1',
        email: 'user@example.com',
        name: 'User',
        isEmailVerified: true,
        roles: ['user'],
        hasAvatar: true,
        avatarUpdatedAt: 'now'
      }
    });
    expect(meResult.response.send).toHaveBeenCalledWith(expect.objectContaining({ id: 'user-1', hasAvatar: true }));

    const avatarResult = await callHandler(authApi.meAvatar, { auth: { userId: 'user-1' } });
    expect(avatarResult.response.contentType).toHaveBeenCalledWith('image/png');
    expect(avatarResult.response.send).toHaveBeenCalledWith(Buffer.from('avatar'));

    const csrfResult = await callHandler(authApi.csrf, { cookies: { illustry_sid: 'session-token' } });
    expect(csrfResult.response.send).toHaveBeenCalledWith({ csrfToken: 'new-csrf-token' });

    const updateProfileResult = await callHandler(authApi.updateProfile, {
      auth: { userId: 'user-1' },
      body: { name: 'New User', removeAvatar: 'true' },
      files: { avatar: [avatar] }
    });
    expect(updateProfileResult.response.send).toHaveBeenCalledWith({ user: { id: 'user-1', name: 'New User' } });

    const changePasswordResult = await callHandler(authApi.changePassword, {
      auth: { userId: 'user-1' },
      body: { currentPassword: 'Secret123!Secret', newPassword: 'NewSecret123!Secret' }
    });
    expect(changePasswordResult.response.send).toHaveBeenCalledWith({ ok: true });

    const refreshResult = await callHandler(authApi.refresh, {
      cookies: { illustry_sid: 'session-token' },
      headers: {},
      ip: '127.0.0.1'
    });
    expect(refreshResult.response.send).toHaveBeenCalledWith({ ok: true });

    const verificationToken = 'v'.repeat(32);
    await callHandler(authApi.verifyEmail, { body: { token: verificationToken } });
    expect(authVerifyEmailMock).toHaveBeenCalledWith(verificationToken);

    await callHandler(authApi.verifyEmailCode, { body: { email: 'user@example.com', code: '123456' } });
    expect(authVerifyEmailCodeMock).toHaveBeenCalledWith('user@example.com', '123456');

    const resendResult = await callHandler(authApi.resendVerification, {
      body: { email: 'user@example.com' },
      auth: { userId: 'user-1' }
    });
    expect(resendResult.response.status).toHaveBeenCalledWith(200);
    expect(authResendVerificationMock).toHaveBeenCalledWith('user@example.com', 'user-1', 'en');

    const forgotResult = await callHandler(authApi.forgotPassword, { body: { email: 'user@example.com' } });
    expect(forgotResult.response.status).toHaveBeenCalledWith(200);
    expect(authForgotPasswordMock).toHaveBeenCalledWith('user@example.com', 'en');

    const resetResult = await callHandler(authApi.resetPassword, {
      body: { token: 'r'.repeat(32), password: 'NewSecret123!Secret' }
    });
    expect(resetResult.response.send).toHaveBeenCalledWith({ ok: true });
    expect(authResetPasswordMock).toHaveBeenCalledWith('r'.repeat(32), 'NewSecret123!Secret');
  });

  it('runs auth controller error and unauthenticated paths', async () => {
    const invalidRegister = await callHandler(authApi.register, { body: { email: 'bad' } });
    expect(invalidRegister.response.status).toHaveBeenCalledWith(400);
    expect(invalidRegister.response.send).toHaveBeenCalledWith({ error: 'Invalid request payload' });

    const logoutWithoutCookie = await callHandler(authApi.logout, { cookies: {} });
    expect(logoutWithoutCookie.response.status).toHaveBeenCalledWith(200);
    expect(authLogoutMock).not.toHaveBeenCalled();

    const avatarUnauthenticated = await callHandler(authApi.meAvatar, {});
    expect(avatarUnauthenticated.response.status).toHaveBeenCalledWith(401);

    authGetUserAvatarMock.mockResolvedValueOnce(null);
    const avatarMissing = await callHandler(authApi.meAvatar, { auth: { userId: 'user-1' } });
    expect(avatarMissing.response.status).toHaveBeenCalledWith(404);

    const csrfUnauthenticated = await callHandler(authApi.csrf, { cookies: {} });
    expect(csrfUnauthenticated.response.status).toHaveBeenCalledWith(401);

    const updateUnauthenticated = await callHandler(authApi.updateProfile, { body: {} });
    expect(updateUnauthenticated.response.status).toHaveBeenCalledWith(401);

    const changeUnauthenticated = await callHandler(authApi.changePassword, { body: {} });
    expect(changeUnauthenticated.response.status).toHaveBeenCalledWith(401);

    const refreshUnauthenticated = await callHandler(authApi.refresh, { cookies: {} });
    expect(refreshUnauthenticated.response.status).toHaveBeenCalledWith(401);

    const googleStartUnavailable = await callHandler(authApi.googleStart as any, { query: { next: 'https://bad.test' } });
    expect(googleStartUnavailable.response.status).toHaveBeenCalledWith(503);

    const googleCallbackUnavailable = await callHandler(authApi.googleCallback as any, {
      query: {},
      cookies: {}
    });
    expect(googleCallbackUnavailable.response.status).toHaveBeenCalledWith(503);
  });

  it('runs project controller success paths', async () => {
    const auth = { userId: 'user-1' };

    await callHandler(projectApi.create, {
      auth,
      body: {
        projectName: 'Project',
        projectDescription: 'Description',
        isActive: true,
        name: 'Chart',
        type: 'bar-chart',
        description: 'Chart description',
        tags: ['tag']
      }
    });
    expect(projectCreateMock).toHaveBeenCalledWith(expect.objectContaining({ userId: 'user-1', name: 'Project' }));
    expect(visualizationCreateOrUpdateMock).toHaveBeenCalledWith(expect.objectContaining({ projectName: 'Project' }));

    await callHandler(projectApi.update, { auth, body: { name: 'Project', description: 'New', isActive: false } });
    expect(projectUpdateMock).toHaveBeenCalledWith({ userId: 'user-1', name: 'Project' }, { description: 'New', isActive: false });

    await callHandler(projectApi.findOne, { auth, params: { name: 'Project' }, body: {} });
    expect(projectFindOneMock).toHaveBeenCalledWith({ userId: 'user-1', name: 'Project' });

    await callHandler(projectApi.browse, { auth, body: { text: 'pro', page: 2, sort: 'name', per_page: 10 } });
    expect(projectBrowseMock).toHaveBeenCalledWith(expect.objectContaining({ per_page: 10 }));

    await callHandler(projectApi._delete, { auth, body: { name: 'Project' } });
    expect(projectDeleteMock).toHaveBeenCalledWith({ userId: 'user-1', name: 'Project' });
  });

  it('runs dashboard controller success paths', async () => {
    const auth = { userId: 'user-1' };

    await callHandler(dashboardApi.create, {
      auth,
      body: { name: 'Dashboard', description: 'Description', visualizations: [] }
    });
    expect(dashboardCreateMock).toHaveBeenCalledWith(expect.objectContaining({ userId: 'user-1', name: 'Dashboard' }));

    await callHandler(dashboardApi.update, {
      auth,
      body: { name: 'Dashboard', description: 'New', visualizations: [], layouts: { lg: [] } }
    });
    expect(dashboardUpdateMock).toHaveBeenCalledWith(
      { userId: 'user-1', name: 'Dashboard' },
      expect.objectContaining({ layouts: { lg: [] } }),
      undefined
    );

    await callHandler(dashboardApi.findOne, {
      auth,
      params: { name: 'Dashboard' },
      body: { fullVisualizations: true }
    });
    expect(dashboardFindOneMock).toHaveBeenCalledWith({ userId: 'user-1', name: 'Dashboard' }, true);

    await callHandler(dashboardApi.browse, { auth, body: { text: 'dash', page: 1, sort: 'name', per_page: 25 } });
    expect(dashboardBrowseMock).toHaveBeenCalledWith(expect.objectContaining({ per_page: 25 }));

    await callHandler(dashboardApi._delete, { auth, body: { name: 'Dashboard' } });
    expect(dashboardDeleteMock).toHaveBeenCalledWith({ userId: 'user-1', name: 'Dashboard' }, undefined);
  });

  it('runs visualization controller success paths', async () => {
    const auth = { userId: 'user-1' };

    await callHandler(visualizationApi.createOrUpdate, {
      auth,
      files: {
        file: [{ path: '/tmp/chart.csv', mimetype: 'text/csv' }]
      },
      body: {
        fileDetails: JSON.stringify({ separator: ',' }),
        visualizationDetails: JSON.stringify({ name: 'Chart' }),
        fullDetails: 'true'
      }
    });
    expect(visualizationCreateOrUpdateFromFilesMock).toHaveBeenCalledWith(
      [{ filePath: '/tmp/chart.csv', type: 'text/csv' }],
      true,
      { name: 'Chart' },
      { separator: ',' },
      'user-1'
    );

    await callHandler(visualizationApi.createOrUpdateExternal, {
      auth,
      body: {
        data: [
          { name: 'Chart A', data: [], projectName: 'Project', type: 'bar-chart' },
          { name: 'Chart B', data: [], projectName: 'Project', type: 'line-chart' }
        ]
      }
    });
    expect(visualizationCreateOrUpdateMock).toHaveBeenCalledTimes(2);

    await callHandler(visualizationApi.findOne, {
      auth,
      params: { name: 'Chart' },
      body: { type: 'bar-chart' }
    });
    expect(visualizationFindOneMock).toHaveBeenCalledWith({ userId: 'user-1', name: 'Chart', type: 'bar-chart' });

    await callHandler(visualizationApi.findSharedThroughDashboard, {
      auth,
      params: { dashboardShareId: 'dash_shared' },
      query: { name: 'Chart', type: 'bar-chart' }
    });
    expect(visualizationFindSharedThroughDashboardMock).toHaveBeenCalledWith(
      'dash_shared',
      'Chart',
      'bar-chart',
      'user-1'
    );

    await callHandler(visualizationApi.browse, { auth, body: { text: 'chart', page: 1, sort: 'name', per_page: 50 } });
    expect(visualizationBrowseMock).toHaveBeenCalledWith(expect.objectContaining({ per_page: 50 }));

    await callHandler(visualizationApi._delete, {
      auth,
      body: { name: 'Chart', type: 'bar-chart', projectName: 'Project' }
    });
    expect(visualizationDeleteMock).toHaveBeenCalledWith(
      expect.objectContaining({ projectName: 'Project' }),
      undefined
    );
  });

  it('returns controller errors through response helpers', async () => {
    const projectResult = await callHandler(projectApi.findOne, { params: { name: 'Project' }, body: {} });
    expect(projectResult.response.status).toHaveBeenCalledWith(400);
    expect(projectResult.response.send).toHaveBeenCalledWith({ error: 'Authentication required' });
    expect(projectResult.next).not.toHaveBeenCalled();

    validateWithSchemaMock.mockImplementationOnce(() => {
      throw new Error('Invalid payload');
    });
    const dashboardResult = await callHandler(dashboardApi.create, {
      auth: { userId: 'user-1' },
      body: { name: 'Dashboard' }
    });
    expect(dashboardResult.response.status).toHaveBeenCalledWith(500);
    expect(dashboardResult.response.send).toHaveBeenCalledWith({ error: 'Invalid payload' });

    const visualizationResult = await callHandler(visualizationApi.createOrUpdate, {
      auth: { userId: 'user-1' },
      files: { file: null },
      body: {}
    });
    expect(visualizationResult.response.status).toHaveBeenCalledWith(400);
    expect(visualizationResult.response.send).toHaveBeenCalledWith({ error: 'No files uploaded' });
  });
});
