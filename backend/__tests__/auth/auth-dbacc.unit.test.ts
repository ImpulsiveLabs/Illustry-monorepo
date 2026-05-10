import Auth from '../../src/dbacc/lib/auth/auth';

describe('dbacc auth lib', () => {
  const buildExec = <T>(value: T) => ({ exec: jest.fn(async () => value) });

  const buildModelInstance = () => {
    const userFindOneExec = buildExec({ id: 'user-by-email' });
    const userFindByIdExec = buildExec({ id: 'user-by-id' });
    const userFindExec = { lean: () => buildExec([{ id: 'user-by-id' }]) };
    const userFindOneAndUpdateExec = buildExec({ id: 'updated-user' });
    const sessionFindOneExec = buildExec({ id: 'active-session' });
    const sessionUpdateOneExec = buildExec({});
    const sessionUpdateManyExec = buildExec({});
    const emailUpdateManyExec = buildExec({});
    const emailDeleteManyExec = buildExec({});
    const emailFindOneExec = buildExec({ id: 'email-token' });
    const emailFindByCodeExec = buildExec({ id: 'email-code-token' });
    const passwordUpdateManyExec = buildExec({});
    const passwordFindOneExec = buildExec({ id: 'password-token' });
    const passwordUpdateOneExec = buildExec({});
    const avatarFindOneAndUpdateExec = buildExec({ id: 'avatar' });
    const avatarFindOneExec = buildExec({ id: 'avatar-by-user' });
    const avatarDeleteOneExec = buildExec({});

    return {
      UserModel: {
        findOne: jest.fn(() => userFindOneExec),
        findById: jest.fn(() => userFindByIdExec),
        find: jest.fn(() => userFindExec),
        create: jest.fn(async (data) => ({ created: true, ...data })),
        findOneAndUpdate: jest.fn(() => userFindOneAndUpdateExec)
      },
      SessionModel: {
        create: jest.fn(async (data) => ({ created: true, ...data })),
        findOne: jest.fn(() => sessionFindOneExec),
        updateOne: jest.fn(() => sessionUpdateOneExec),
        updateMany: jest.fn(() => sessionUpdateManyExec)
      },
      EmailVerificationTokenModel: {
        updateMany: jest.fn(() => emailUpdateManyExec),
        deleteMany: jest.fn(() => emailDeleteManyExec),
        create: jest.fn(async (data) => ({ created: true, ...data })),
        findOne: jest.fn()
          .mockImplementationOnce(() => emailFindOneExec)
          .mockImplementationOnce(() => emailFindByCodeExec)
      },
      PasswordResetTokenModel: {
        updateMany: jest.fn(() => passwordUpdateManyExec),
        create: jest.fn(async (data) => ({ created: true, ...data })),
        findOne: jest.fn(() => passwordFindOneExec),
        updateOne: jest.fn(() => passwordUpdateOneExec)
      },
      UserAvatarModel: {
        findOneAndUpdate: jest.fn(() => avatarFindOneAndUpdateExec),
        findOne: jest.fn(() => avatarFindOneExec),
        deleteOne: jest.fn(() => avatarDeleteOneExec)
      }
    } as any;
  };

  it('proxies user lookups and writes to the underlying models', async () => {
    const modelInstance = buildModelInstance();
    const auth = new Auth(modelInstance);

    await expect(auth.findUserByEmailNormalized('user@example.com')).resolves.toEqual({ id: 'user-by-email' });
    expect(modelInstance.UserModel.findOne).toHaveBeenCalledWith({ emailNormalized: 'user@example.com' });

    await expect(auth.findUserById('user-id')).resolves.toEqual({ id: 'user-by-id' });
    expect(modelInstance.UserModel.findById).toHaveBeenCalledWith('user-id');

    await expect(auth.findUsersByIds(['user-id'])).resolves.toEqual([{ id: 'user-by-id' }]);
    expect(modelInstance.UserModel.find).toHaveBeenCalledWith({ _id: { $in: ['user-id'] } });

    await expect(auth.createUser({ email: 'user@example.com' } as any)).resolves.toEqual({ created: true, email: 'user@example.com' });
    expect(modelInstance.UserModel.create).toHaveBeenCalledWith({ email: 'user@example.com' });

    await expect(auth.updateUserById('user-id', { $set: { name: 'Updated' } })).resolves.toEqual({ id: 'updated-user' });
    expect(modelInstance.UserModel.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: 'user-id' },
      { $set: { name: 'Updated' } },
      { new: true }
    );
  });

  it('proxies session lifecycle methods', async () => {
    const modelInstance = buildModelInstance();
    const auth = new Auth(modelInstance);
    const now = new Date('2025-01-01T00:00:00.000Z');

    await expect(auth.createSession({ userId: 'user-id' } as any)).resolves.toEqual({ created: true, userId: 'user-id' });
    await expect(auth.findActiveSessionByHash('hash-1', now)).resolves.toEqual({ id: 'active-session' });
    expect(modelInstance.SessionModel.findOne).toHaveBeenCalledWith({
      sessionTokenHash: 'hash-1',
      revokedAt: { $exists: false },
      expiresAt: { $gt: now }
    });

    await expect(auth.updateSessionById('session-id', { $set: { revokedAt: now } })).resolves.toBeUndefined();
    expect(modelInstance.SessionModel.updateOne).toHaveBeenCalledWith({ _id: 'session-id' }, { $set: { revokedAt: now } });

    await expect(auth.revokeSessionByHash('hash-2')).resolves.toBeUndefined();
    expect(modelInstance.SessionModel.updateOne).toHaveBeenCalledWith(
      { sessionTokenHash: 'hash-2', revokedAt: { $exists: false } },
      { $set: { revokedAt: expect.any(Date) } }
    );

    await expect(auth.revokeActiveSessionsForUser('user-id')).resolves.toBeUndefined();
    expect(modelInstance.SessionModel.updateMany).toHaveBeenCalledWith(
      { userId: 'user-id', revokedAt: { $exists: false } },
      { $set: { revokedAt: expect.any(Date) } }
    );
  });

  it('proxies verification and password reset token persistence', async () => {
    const modelInstance = buildModelInstance();
    const auth = new Auth(modelInstance);
    const now = new Date('2025-01-01T00:00:00.000Z');

    await expect(auth.invalidateEmailVerificationTokensForUser('user-id')).resolves.toBeUndefined();
    expect(modelInstance.EmailVerificationTokenModel.updateMany).toHaveBeenCalledWith(
      { userId: 'user-id', usedAt: { $exists: false } },
      { $set: { usedAt: expect.any(Date) } }
    );

    await expect(auth.createEmailVerificationToken({ userId: 'user-id' } as any)).resolves.toEqual({ created: true, userId: 'user-id' });
    await expect(auth.findActiveEmailVerificationTokenByTokenHash('token-hash', now)).resolves.toEqual({ id: 'email-token' });
    expect(modelInstance.EmailVerificationTokenModel.findOne).toHaveBeenNthCalledWith(1, {
      tokenHash: 'token-hash',
      usedAt: { $exists: false },
      expiresAt: { $gt: now }
    });

    await expect(auth.findActiveEmailVerificationTokenByCodeHash('user-id', 'code-hash', now)).resolves.toEqual({ id: 'email-code-token' });
    expect(modelInstance.EmailVerificationTokenModel.findOne).toHaveBeenNthCalledWith(2, {
      userId: 'user-id',
      codeHash: 'code-hash',
      usedAt: { $exists: false },
      expiresAt: { $gt: now }
    });

    await expect(auth.deleteEmailVerificationTokensForUser('user-id')).resolves.toBeUndefined();
    expect(modelInstance.EmailVerificationTokenModel.deleteMany).toHaveBeenCalledWith({ userId: 'user-id' });

    await expect(auth.invalidatePasswordResetTokensForUser('user-id')).resolves.toBeUndefined();
    expect(modelInstance.PasswordResetTokenModel.updateMany).toHaveBeenCalledWith(
      { userId: 'user-id', usedAt: { $exists: false } },
      { $set: { usedAt: expect.any(Date) } }
    );

    await expect(auth.createPasswordResetToken({ userId: 'user-id' } as any)).resolves.toEqual({ created: true, userId: 'user-id' });
    await expect(auth.findActivePasswordResetTokenByTokenHash('password-hash', now)).resolves.toEqual({ id: 'password-token' });
    expect(modelInstance.PasswordResetTokenModel.findOne).toHaveBeenCalledWith({
      tokenHash: 'password-hash',
      usedAt: { $exists: false },
      expiresAt: { $gt: now }
    });

    await expect(auth.markPasswordResetTokenUsed('token-id')).resolves.toBeUndefined();
    expect(modelInstance.PasswordResetTokenModel.updateOne).toHaveBeenCalledWith(
      { _id: 'token-id' },
      { $set: { usedAt: expect.any(Date) } }
    );
  });

  it('proxies avatar upsert, lookup, and deletion', async () => {
    const modelInstance = buildModelInstance();
    const auth = new Auth(modelInstance);

    await expect(auth.saveUserAvatar({ userId: 'user-id', fileName: 'avatar.png' } as any)).resolves.toEqual({ id: 'avatar' });
    expect(modelInstance.UserAvatarModel.findOneAndUpdate).toHaveBeenCalledWith(
      { userId: 'user-id' },
      { userId: 'user-id', fileName: 'avatar.png' },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    await expect(auth.findUserAvatarByUserId('user-id')).resolves.toEqual({ id: 'avatar-by-user' });
    expect(modelInstance.UserAvatarModel.findOne).toHaveBeenCalledWith({ userId: 'user-id' });

    await expect(auth.deleteUserAvatarByUserId('user-id')).resolves.toBeUndefined();
    expect(modelInstance.UserAvatarModel.deleteOne).toHaveBeenCalledWith({ userId: 'user-id' });
  });
});
