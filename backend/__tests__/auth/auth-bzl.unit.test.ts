jest.mock('argon2', () => ({
  __esModule: true,
  default: {
    hash: jest.fn(async () => 'hashed-password'),
    verify: jest.fn(async (_hash: string, password: string) => password === 'ValidPass1!'),
    argon2id: 2
  }
}));

const sendVerificationEmail = jest.fn(async () => undefined);
const sendPasswordResetEmail = jest.fn(async () => undefined);

jest.mock('../../src/auth/email', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    sendVerificationEmail,
    sendPasswordResetEmail
  }))
}));

describe('AuthBZL', () => {
  const buildUser = (overrides?: Record<string, unknown>) => ({
    _id: '507f191e810c19729de860ea',
    email: 'user@example.com',
    emailNormalized: 'user@example.com',
    name: 'Test User',
    passwordHash: 'stored-hash',
    isEmailVerified: false,
    roles: ['user'],
    authVersion: 0,
    createdAt: new Date('2025-01-01T00:00:00.000Z'),
    updatedAt: new Date('2025-01-01T00:00:00.000Z'),
    ...overrides
  } as any);

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it('registers a user, stores the avatar, sends a 15 minute verification token, and creates a session', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2025-01-01T00:00:00.000Z'));

    const createdUser = buildUser();
    const avatarUpdatedUser = buildUser({
      avatarFileName: 'avatar.png',
      avatarContentType: 'image/png',
      avatarUpdatedAt: new Date('2025-01-02T00:00:00.000Z')
    });
    const createdSession = {
      _id: '507f191e810c19729de860eb',
      userId: createdUser._id,
      sessionTokenHash: 'session-hash',
      csrfTokenHash: 'csrf-hash',
      expiresAt: new Date(Date.now() + 60_000),
      authVersion: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const dbaccInstance = {
      Auth: {
        findUserByEmailNormalized: jest.fn(async () => null),
        createUser: jest.fn(async () => createdUser),
        saveUserAvatar: jest.fn(async () => ({ userId: createdUser._id })),
        updateUserById: jest.fn(async () => avatarUpdatedUser),
        invalidateEmailVerificationTokensForUser: jest.fn(async () => undefined),
        createEmailVerificationToken: jest.fn(async () => ({ _id: 'token-id' })),
        createSession: jest.fn(async () => createdSession)
      }
    } as any;

    const { default: AuthBZL } = await import('../../src/bzl/auth/auth');
    const authBZL = new AuthBZL(dbaccInstance);

    const result = await authBZL.register(
      'user@example.com',
      'ValidPass1!',
      'Test User',
      {
        fileName: 'avatar.png',
        contentType: 'image/png',
        size: 128,
        data: Buffer.from('avatar')
      },
      { ipAddress: '127.0.0.1', userAgent: 'jest' },
      'ro'
    );

    expect(dbaccInstance.Auth.createUser).toHaveBeenCalledWith(expect.objectContaining({
      email: 'user@example.com',
      name: 'Test User'
    }));
    expect(dbaccInstance.Auth.saveUserAvatar).toHaveBeenCalledWith(expect.objectContaining({
      fileName: 'avatar.png',
      contentType: 'image/png'
    }));
    expect(dbaccInstance.Auth.createEmailVerificationToken).toHaveBeenCalledWith(expect.objectContaining({
      userId: createdUser._id,
      expiresAt: new Date('2025-01-01T00:15:00.000Z')
    }));
    expect(dbaccInstance.Auth.createSession).toHaveBeenCalledWith(expect.objectContaining({
      userId: createdUser._id,
      authVersion: 0
    }));
    expect(sendVerificationEmail).toHaveBeenCalledWith('user@example.com', expect.any(String), expect.any(String), 'ro');
    expect(result.session).toBe(createdSession);
    expect(typeof result.sessionToken).toBe('string');
    expect(typeof result.csrfToken).toBe('string');

    jest.useRealTimers();
  });

  it('rejects login when the password does not match', async () => {
    const dbaccInstance = {
      Auth: {
        findUserByEmailNormalized: jest.fn(async () => buildUser())
      }
    } as any;

    const { default: AuthBZL } = await import('../../src/bzl/auth/auth');
    const authBZL = new AuthBZL(dbaccInstance);

    await expect(
      authBZL.login('user@example.com', 'wrong-password', { ipAddress: '127.0.0.1' })
    ).rejects.toThrow('Invalid email or password');
  });

  it('resets the password only for the user tied to the valid reset token', async () => {
    const resetToken = {
      _id: '507f191e810c19729de860ec',
      userId: '507f191e810c19729de860ea',
      tokenHash: 'reset-hash',
      expiresAt: new Date(Date.now() + 60_000)
    };
    const updatedUser = buildUser({ authVersion: 1 });

    const dbaccInstance = {
      Auth: {
        findActivePasswordResetTokenByTokenHash: jest.fn(async () => resetToken),
        updateUserById: jest.fn(async () => updatedUser),
        revokeActiveSessionsForUser: jest.fn(async () => undefined),
        markPasswordResetTokenUsed: jest.fn(async () => undefined)
      }
    } as any;

    const { default: AuthBZL } = await import('../../src/bzl/auth/auth');
    const authBZL = new AuthBZL(dbaccInstance);

    await authBZL.resetPassword('valid-reset-token', 'ValidPass1!');

    expect(dbaccInstance.Auth.updateUserById).toHaveBeenCalledWith(resetToken.userId, expect.objectContaining({
      $set: { passwordHash: 'hashed-password' },
      $inc: { authVersion: 1 }
    }));
    expect(dbaccInstance.Auth.revokeActiveSessionsForUser).toHaveBeenCalledWith(updatedUser._id);
    expect(dbaccInstance.Auth.markPasswordResetTokenUsed).toHaveBeenCalledWith(resetToken._id);
    expect(sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it('returns the public user shape expected by the frontend menu', async () => {
    const dbaccInstance = { Auth: {} } as any;
    const { default: AuthBZL } = await import('../../src/bzl/auth/auth');
    const authBZL = new AuthBZL(dbaccInstance);

    expect(authBZL.toPublicUser(buildUser({
      isEmailVerified: true,
      avatarUpdatedAt: new Date('2025-01-03T10:00:00.000Z')
    }))).toEqual({
      id: '507f191e810c19729de860ea',
      email: 'user@example.com',
      name: 'Test User',
      isEmailVerified: true,
      roles: ['user'],
      hasAvatar: true,
      avatarUpdatedAt: '2025-01-03T10:00:00.000Z'
    });
  });

  it('normalizes, saves, reads, and resets the user theme config', async () => {
    const user = buildUser({
      themeConfig: {
        version: 1,
        presetId: 'stored',
        global: {
          primary: '#123456'
        }
      }
    });
    const dbaccInstance = {
      Auth: {
        findUserById: jest.fn(async () => user),
        updateUserThemeConfigById: jest.fn(async (_userId, themeConfig) => buildUser({ themeConfig }))
      }
    } as any;

    const { default: AuthBZL } = await import('../../src/bzl/auth/auth');
    const authBZL = new AuthBZL(dbaccInstance);

    const storedTheme = await authBZL.getThemeConfig(user._id);
    expect(storedTheme.presetId).toBe('stored');
    expect(storedTheme.global.primary).toBe('#123456');
    expect(storedTheme.global.background).toBe('#ffffff');

    const savedTheme = await authBZL.updateThemeConfig(user._id, {
      version: 1,
      presetId: 'custom',
      visualizations: {
        sankey: {
          light: { colors: ['#111111'] }
        }
      }
    });
    expect(savedTheme.presetId).toBe('custom');
    expect(savedTheme.visualizations.sankey.light.colors).toEqual(['#111111']);
    expect(dbaccInstance.Auth.updateUserThemeConfigById).toHaveBeenCalledWith(
      user._id,
      expect.objectContaining({
        version: 1,
        presetId: 'custom'
      })
    );

    const resetTheme = await authBZL.resetThemeConfig(user._id);
    expect(resetTheme.presetId).toBe('default');
    expect(dbaccInstance.Auth.updateUserThemeConfigById).toHaveBeenCalledWith(user._id, undefined);

    await expect(authBZL.getThemeConfig('not-object-id')).resolves.toMatchObject({
      version: 1,
      presetId: 'default'
    });
  });


  it('rejects login when the account does not exist and returns the original user when no avatar is provided', async () => {
    const { default: AuthBZL } = await import('../../src/bzl/auth/auth');

    const missingUserDbacc = {
      Auth: {
        findUserByEmailNormalized: jest.fn(async () => null)
      }
    } as any;
    const missingUserAuth = new AuthBZL(missingUserDbacc);
    await expect(
      missingUserAuth.login('missing@example.com', 'ValidPass1!', { ipAddress: '127.0.0.1' })
    ).rejects.toThrow('Invalid email or password');

    const createdUser = buildUser();
    const createdSession = {
      _id: 'session-no-avatar',
      userId: createdUser._id,
      sessionTokenHash: 'session-hash',
      csrfTokenHash: 'csrf-hash',
      expiresAt: new Date(Date.now() + 60_000),
      authVersion: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    const noAvatarDbacc = {
      Auth: {
        findUserByEmailNormalized: jest.fn(async () => null),
        createUser: jest.fn(async () => createdUser),
        invalidateEmailVerificationTokensForUser: jest.fn(async () => undefined),
        createEmailVerificationToken: jest.fn(async () => ({ _id: 'token-id' })),
        createSession: jest.fn(async () => createdSession),
        saveUserAvatar: jest.fn(async () => undefined),
        updateUserById: jest.fn(async () => createdUser)
      }
    } as any;
    const noAvatarAuth = new AuthBZL(noAvatarDbacc);
    await noAvatarAuth.register('plain@example.com', 'ValidPass1!', 'Plain User', undefined, { ipAddress: '127.0.0.1' }, 'en');
    expect(noAvatarDbacc.Auth.saveUserAvatar).not.toHaveBeenCalled();
    expect(noAvatarDbacc.Auth.updateUserById).not.toHaveBeenCalled();
  });

  it('rejects registration for an existing account and resends verification only for unverified users', async () => {
    const unverifiedUser = buildUser({ isEmailVerified: false });
    const verifiedUser = buildUser({ isEmailVerified: true });

    const { default: AuthBZL } = await import('../../src/bzl/auth/auth');

    const unverifiedDbacc = {
      Auth: {
        findUserByEmailNormalized: jest.fn(async () => unverifiedUser),
        invalidateEmailVerificationTokensForUser: jest.fn(async () => undefined),
        createEmailVerificationToken: jest.fn(async () => ({ _id: 'token-id' }))
      }
    } as any;
    const unverifiedAuth = new AuthBZL(unverifiedDbacc);

    await expect(
      unverifiedAuth.register('user@example.com', 'ValidPass1!', 'Test User', undefined, { ipAddress: '127.0.0.1' }, 'ro')
    ).rejects.toThrow('Unable to register with provided credentials');
    expect(sendVerificationEmail).toHaveBeenCalledWith('user@example.com', expect.any(String), expect.any(String), 'ro');

    sendVerificationEmail.mockClear();
    const verifiedDbacc = {
      Auth: {
        findUserByEmailNormalized: jest.fn(async () => verifiedUser)
      }
    } as any;
    const verifiedAuth = new AuthBZL(verifiedDbacc);

    await expect(
      verifiedAuth.register('user@example.com', 'ValidPass1!', 'Test User', undefined, { ipAddress: '127.0.0.1' }, 'en')
    ).rejects.toThrow('Unable to register with provided credentials');
    expect(sendVerificationEmail).not.toHaveBeenCalled();
  });

  it('creates sessions for valid login and google login variations', async () => {
    const baseUser = buildUser();
    const createdSession = {
      _id: 'session-id',
      userId: baseUser._id,
      sessionTokenHash: 'session-hash',
      csrfTokenHash: 'csrf-hash',
      expiresAt: new Date(Date.now() + 60_000),
      authVersion: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    const { default: AuthBZL } = await import('../../src/bzl/auth/auth');

    const loginDbacc = {
      Auth: {
        findUserByEmailNormalized: jest.fn(async () => baseUser),
        createSession: jest.fn(async () => createdSession)
      }
    } as any;
    const loginAuth = new AuthBZL(loginDbacc);
    await expect(loginAuth.login('user@example.com', 'ValidPass1!', { ipAddress: '127.0.0.1', userAgent: 'jest' })).resolves.toEqual(
      expect.objectContaining({ session: createdSession })
    );

    const googleNewDbacc = {
      Auth: {
        findUserByEmailNormalized: jest.fn(async () => null),
        createUser: jest.fn(async () => baseUser),
        invalidateEmailVerificationTokensForUser: jest.fn(async () => undefined),
        createEmailVerificationToken: jest.fn(async () => ({ _id: 'token-id' })),
        createSession: jest.fn(async () => createdSession)
      }
    } as any;
    const googleNewAuth = new AuthBZL(googleNewDbacc);
    await expect(
      googleNewAuth.loginWithGoogle('user@example.com', 'Google User', false, { ipAddress: '127.0.0.1' }, 'ro')
    ).resolves.toEqual(expect.objectContaining({ session: createdSession }));
    expect(googleNewDbacc.Auth.createUser).toHaveBeenCalledWith(expect.objectContaining({
      email: 'user@example.com',
      isEmailVerified: false,
      name: 'Google User'
    }));
    expect(sendVerificationEmail).toHaveBeenCalledWith('user@example.com', expect.any(String), expect.any(String), 'ro');

    sendVerificationEmail.mockClear();
    const updatedUser = buildUser({ name: '', isEmailVerified: false });
    const savedUpdatedUser = buildUser({ name: 'Google User', isEmailVerified: true });
    const googleExistingDbacc = {
      Auth: {
        findUserByEmailNormalized: jest.fn(async () => updatedUser),
        updateUserById: jest.fn(async () => savedUpdatedUser),
        createSession: jest.fn(async () => createdSession)
      }
    } as any;
    const googleExistingAuth = new AuthBZL(googleExistingDbacc);
    await googleExistingAuth.loginWithGoogle('user@example.com', 'Google User', true, { ipAddress: '127.0.0.1' });
    expect(googleExistingDbacc.Auth.updateUserById).toHaveBeenCalledWith(updatedUser._id, {
      $set: { isEmailVerified: true, name: 'Google User' }
    });
    expect(sendVerificationEmail).not.toHaveBeenCalled();
  });

  it('resolves session principals and revokes invalid sessions when needed', async () => {
    const user = buildUser();
    const session = {
      _id: 'session-id',
      userId: user._id,
      sessionTokenHash: 'hashed-session-token',
      csrfTokenHash: 'csrf-hash',
      expiresAt: new Date(Date.now() + 60_000),
      authVersion: 0
    };
    const { default: AuthBZL } = await import('../../src/bzl/auth/auth');

    const missingSessionDbacc = { Auth: { findActiveSessionByHash: jest.fn(async () => null) } } as any;
    const missingSessionAuth = new AuthBZL(missingSessionDbacc);
    await expect(missingSessionAuth.getSessionPrincipalFromToken('raw')).resolves.toBeNull();

    const missingUserDbacc = {
      Auth: {
        findActiveSessionByHash: jest.fn(async () => session),
        findUserById: jest.fn(async () => null),
        revokeSessionByHash: jest.fn(async () => undefined)
      }
    } as any;
    const missingUserAuth = new AuthBZL(missingUserDbacc);
    await expect(missingUserAuth.getSessionPrincipalFromToken('raw')).resolves.toBeNull();
    expect(missingUserDbacc.Auth.revokeSessionByHash).toHaveBeenCalledWith(session.sessionTokenHash);

    const mismatchedUserDbacc = {
      Auth: {
        findActiveSessionByHash: jest.fn(async () => session),
        findUserById: jest.fn(async () => buildUser({ authVersion: 2 })),
        revokeSessionByHash: jest.fn(async () => undefined)
      }
    } as any;
    const mismatchedUserAuth = new AuthBZL(mismatchedUserDbacc);
    await expect(mismatchedUserAuth.getSessionPrincipalFromToken('raw')).resolves.toBeNull();
    expect(mismatchedUserDbacc.Auth.revokeSessionByHash).toHaveBeenCalledWith(session.sessionTokenHash);

    const validDbacc = {
      Auth: {
        findActiveSessionByHash: jest.fn(async () => session),
        findUserById: jest.fn(async () => user)
      }
    } as any;
    const validAuth = new AuthBZL(validDbacc);
    await expect(validAuth.getSessionPrincipalFromToken('raw')).resolves.toEqual({ user, session });
  });

  it('rotates sessions and csrf tokens and rejects invalid sessions', async () => {
    const user = buildUser();
    const currentSession = {
      _id: 'session-id',
      userId: user._id,
      sessionTokenHash: 'current-hash',
      csrfTokenHash: 'csrf-hash',
      expiresAt: new Date(Date.now() + 60_000),
      authVersion: 0
    };
    const rotatedSession = {
      _id: 'rotated-session-id',
      userId: user._id,
      sessionTokenHash: 'rotated-hash',
      csrfTokenHash: 'rotated-csrf-hash',
      expiresAt: new Date(Date.now() + 60_000),
      authVersion: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    const { default: AuthBZL } = await import('../../src/bzl/auth/auth');

    const invalidRotateDbacc = { Auth: { findActiveSessionByHash: jest.fn(async () => null) } } as any;
    const invalidRotateAuth = new AuthBZL(invalidRotateDbacc);
    await expect(invalidRotateAuth.rotateSession('raw', { ipAddress: '127.0.0.1' })).rejects.toThrow('Session is invalid or expired');
    await expect(invalidRotateAuth.rotateCsrfToken('raw')).rejects.toThrow('Session is invalid or expired');

    const validRotateDbacc = {
      Auth: {
        findActiveSessionByHash: jest.fn(async () => currentSession),
        findUserById: jest.fn(async () => user),
        createSession: jest.fn(async () => rotatedSession),
        updateSessionById: jest.fn(async () => undefined)
      }
    } as any;
    const validRotateAuth = new AuthBZL(validRotateDbacc);
    const rotated = await validRotateAuth.rotateSession('raw', { ipAddress: '127.0.0.1', userAgent: 'jest' });
    expect(rotated.session).toBe(rotatedSession);
    expect(validRotateDbacc.Auth.updateSessionById).toHaveBeenCalledWith(currentSession._id, {
      $set: {
        revokedAt: expect.any(Date),
        replacedBySessionTokenHash: rotatedSession.sessionTokenHash
      }
    });

    const csrfResult = await validRotateAuth.rotateCsrfToken('raw');
    expect(typeof csrfResult.csrfToken).toBe('string');
    expect(csrfResult.expiresAt).toBe(currentSession.expiresAt);
    expect(validRotateDbacc.Auth.updateSessionById).toHaveBeenCalledWith(currentSession._id, {
      $set: { csrfTokenHash: expect.any(String) }
    });
  });

  it('logs out and verifies emails by token or code', async () => {
    const user = buildUser();
    const tokenRecord = {
      _id: 'token-id',
      userId: user._id,
      tokenHash: 'token-hash',
      codeHash: 'code-hash',
      expiresAt: new Date(Date.now() + 60_000)
    };
    const { default: AuthBZL } = await import('../../src/bzl/auth/auth');

    const logoutDbacc = { Auth: { revokeSessionByHash: jest.fn(async () => undefined) } } as any;
    const logoutAuth = new AuthBZL(logoutDbacc);
    await expect(logoutAuth.logout('raw-session')).resolves.toBeUndefined();
    expect(logoutDbacc.Auth.revokeSessionByHash).toHaveBeenCalledWith(expect.any(String));

    const invalidVerifyDbacc = { Auth: { findActiveEmailVerificationTokenByTokenHash: jest.fn(async () => null) } } as any;
    const invalidVerifyAuth = new AuthBZL(invalidVerifyDbacc);
    await expect(invalidVerifyAuth.verifyEmail('bad-token')).rejects.toThrow('Verification token is invalid or expired');

    const verifyDbacc = {
      Auth: {
        findActiveEmailVerificationTokenByTokenHash: jest.fn(async () => tokenRecord),
        updateUserById: jest.fn(async () => user),
        deleteEmailVerificationTokensForUser: jest.fn(async () => undefined)
      }
    } as any;
    const verifyAuth = new AuthBZL(verifyDbacc);
    await expect(verifyAuth.verifyEmail('good-token')).resolves.toBeUndefined();
    expect(verifyDbacc.Auth.updateUserById).toHaveBeenCalledWith(user._id, { $set: { isEmailVerified: true } });
    expect(verifyDbacc.Auth.deleteEmailVerificationTokensForUser).toHaveBeenCalledWith(user._id);

    const missingCodeUserDbacc = { Auth: { findUserByEmailNormalized: jest.fn(async () => null) } } as any;
    const missingCodeUserAuth = new AuthBZL(missingCodeUserDbacc);
    await expect(missingCodeUserAuth.verifyEmailCode('user@example.com', '123456')).rejects.toThrow('Verification code is invalid or expired');

    const missingCodeTokenDbacc = {
      Auth: {
        findUserByEmailNormalized: jest.fn(async () => user),
        findActiveEmailVerificationTokenByCodeHash: jest.fn(async () => null)
      }
    } as any;
    const missingCodeTokenAuth = new AuthBZL(missingCodeTokenDbacc);
    await expect(missingCodeTokenAuth.verifyEmailCode('user@example.com', '123456')).rejects.toThrow('Verification code is invalid or expired');

    const validCodeDbacc = {
      Auth: {
        findUserByEmailNormalized: jest.fn(async () => user),
        findActiveEmailVerificationTokenByCodeHash: jest.fn(async () => tokenRecord),
        updateUserById: jest.fn(async () => user),
        deleteEmailVerificationTokensForUser: jest.fn(async () => undefined)
      }
    } as any;
    const validCodeAuth = new AuthBZL(validCodeDbacc);
    await expect(validCodeAuth.verifyEmailCode('user@example.com', '123456')).resolves.toBeUndefined();
    expect(validCodeDbacc.Auth.deleteEmailVerificationTokensForUser).toHaveBeenCalledWith(user._id);
  });

  it('handles resend verification, forgot password, reset-password edge cases, and avatar retrieval', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2025-01-01T00:00:00.000Z'));

    const user = buildUser({ isEmailVerified: false });
    const verifiedUser = buildUser({ isEmailVerified: true });
    const tokenRecord = {
      _id: 'reset-token-id',
      userId: user._id,
      tokenHash: 'reset-token-hash',
      expiresAt: new Date(Date.now() + 60_000)
    };
    const avatar = { data: Buffer.from('avatar-bytes'), contentType: 'image/png' };
    const { default: AuthBZL } = await import('../../src/bzl/auth/auth');

    const resendDbacc = {
      Auth: {
        findUserById: jest.fn(async () => user),
        findUserByEmailNormalized: jest.fn(async () => verifiedUser),
        invalidateEmailVerificationTokensForUser: jest.fn(async () => undefined),
        createEmailVerificationToken: jest.fn(async () => ({ _id: 'token-id' }))
      }
    } as any;
    const resendAuth = new AuthBZL(resendDbacc);
    await resendAuth.resendVerification(undefined, user._id, 'ro');
    expect(sendVerificationEmail).toHaveBeenCalledWith('user@example.com', expect.any(String), expect.any(String), 'ro');
    expect(resendDbacc.Auth.invalidateEmailVerificationTokensForUser).toHaveBeenCalledWith(user._id);
    expect(resendDbacc.Auth.createEmailVerificationToken).toHaveBeenCalledWith(expect.objectContaining({
      userId: user._id,
      expiresAt: new Date('2025-01-01T00:15:00.000Z')
    }));

    sendVerificationEmail.mockClear();
    await resendAuth.resendVerification('user@example.com', undefined, 'en');
    expect(sendVerificationEmail).not.toHaveBeenCalled();

    const forgotDbacc = {
      Auth: {
        findUserByEmailNormalized: jest.fn()
          .mockResolvedValueOnce(user)
          .mockResolvedValueOnce(null),
        invalidatePasswordResetTokensForUser: jest.fn(async () => undefined),
        createPasswordResetToken: jest.fn(async () => ({ _id: 'reset-token-id' }))
      }
    } as any;
    const forgotAuth = new AuthBZL(forgotDbacc);
    await forgotAuth.forgotPassword('user@example.com', 'ro');
    expect(sendPasswordResetEmail).toHaveBeenCalledWith('user@example.com', expect.any(String), 'ro');
    sendPasswordResetEmail.mockClear();
    await forgotAuth.forgotPassword('missing@example.com', 'en');
    expect(sendPasswordResetEmail).not.toHaveBeenCalled();

    const invalidResetDbacc = { Auth: { findActivePasswordResetTokenByTokenHash: jest.fn(async () => null) } } as any;
    const invalidResetAuth = new AuthBZL(invalidResetDbacc);
    await expect(invalidResetAuth.resetPassword('bad-token', 'ValidPass1!')).rejects.toThrow('Password reset token is invalid or expired');

    const noSessionRevokeDbacc = {
      Auth: {
        findActivePasswordResetTokenByTokenHash: jest.fn(async () => tokenRecord),
        updateUserById: jest.fn(async () => null),
        revokeActiveSessionsForUser: jest.fn(async () => undefined),
        markPasswordResetTokenUsed: jest.fn(async () => undefined)
      }
    } as any;
    const noSessionRevokeAuth = new AuthBZL(noSessionRevokeDbacc);
    await noSessionRevokeAuth.resetPassword('good-token', 'ValidPass1!');
    expect(noSessionRevokeDbacc.Auth.revokeActiveSessionsForUser).not.toHaveBeenCalled();
    expect(noSessionRevokeDbacc.Auth.markPasswordResetTokenUsed).toHaveBeenCalledWith(tokenRecord._id);

    const avatarDbacc = {
      Auth: {
        findUserAvatarByUserId: jest.fn()
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce(avatar)
      }
    } as any;
    const avatarAuth = new AuthBZL(avatarDbacc);
    await expect(avatarAuth.getUserAvatar('user-id')).resolves.toBeNull();
    await expect(avatarAuth.getUserAvatar('user-id')).resolves.toEqual(avatar);

    jest.useRealTimers();
  });

  it('updates the profile avatar and validates the current password before changing it', async () => {
    const user = buildUser();
    const updatedAvatarUser = buildUser({
      name: 'Updated User',
      avatarFileName: 'fresh-avatar.png',
      avatarContentType: 'image/png',
      avatarUpdatedAt: new Date('2025-01-04T08:30:00.000Z')
    });
    const { default: AuthBZL } = await import('../../src/bzl/auth/auth');

    const updateProfileDbacc = {
      Auth: {
        findUserById: jest.fn(async () => user),
        saveUserAvatar: jest.fn(async () => ({ userId: user._id })),
        updateUserById: jest.fn(async () => updatedAvatarUser)
      }
    } as any;
    const updateProfileAuth = new AuthBZL(updateProfileDbacc);

    await expect(updateProfileAuth.updateProfile(user._id, {
      name: 'Updated User',
      avatar: {
      fileName: 'fresh-avatar.png',
      contentType: 'image/png',
      size: 256,
      data: Buffer.from('new-avatar')
      }
    })).resolves.toEqual({
      id: user._id,
      email: user.email,
      name: 'Updated User',
      isEmailVerified: user.isEmailVerified,
      roles: user.roles,
      hasAvatar: true,
      avatarUpdatedAt: '2025-01-04T08:30:00.000Z'
    });
    expect(updateProfileDbacc.Auth.updateUserById).toHaveBeenNthCalledWith(1, user._id, {
      $set: { name: 'Updated User' }
    });
    expect(updateProfileDbacc.Auth.saveUserAvatar).toHaveBeenCalledWith(expect.objectContaining({
      fileName: 'fresh-avatar.png',
      contentType: 'image/png'
    }));

    const removeAvatarDbacc = {
      Auth: {
        findUserById: jest.fn(async () => updatedAvatarUser),
        deleteUserAvatarByUserId: jest.fn(async () => undefined),
        updateUserById: jest.fn(async () => buildUser())
      }
    } as any;
    const removeAvatarAuth = new AuthBZL(removeAvatarDbacc);

    await expect(removeAvatarAuth.updateProfile(user._id, {
      name: updatedAvatarUser.name,
      removeAvatar: true
    })).resolves.toEqual({
      id: user._id,
      email: user.email,
      name: user.name,
      isEmailVerified: user.isEmailVerified,
      roles: user.roles,
      hasAvatar: false,
      avatarUpdatedAt: undefined
    });
    expect(removeAvatarDbacc.Auth.deleteUserAvatarByUserId).toHaveBeenCalledWith(user._id);

    const changePasswordDbacc = {
      Auth: {
        findUserById: jest.fn(async () => user),
        updateUserById: jest.fn(async () => buildUser({ passwordHash: 'hashed-password' }))
      }
    } as any;
    const changePasswordAuth = new AuthBZL(changePasswordDbacc);

    await expect(
      changePasswordAuth.changePassword(user._id, 'wrong-password', 'NewValidPass1!')
    ).rejects.toThrow('Current password is incorrect');

    await expect(
      changePasswordAuth.changePassword(user._id, 'ValidPass1!', 'NewValidPass1!')
    ).resolves.toBeUndefined();
    expect(changePasswordDbacc.Auth.updateUserById).toHaveBeenCalledWith(user._id, {
      $set: { passwordHash: 'hashed-password' }
    });
  });

});
