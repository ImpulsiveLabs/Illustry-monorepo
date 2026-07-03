import { Types } from 'mongoose';
import ModelInstance from '../../models/modelInstance';
import {
  AuthSession,
  PendingRegistration,
  AuthUser,
  AuthUserAvatar,
  VerificationToken
} from '../../../auth/types';

class Auth {
  private modelInstance: ModelInstance;

  constructor(modelInstance: ModelInstance) {
    this.modelInstance = modelInstance;
  }

  findUserByEmailNormalized(emailNormalized: string): Promise<AuthUser | null> {
    return this.modelInstance.UserModel.findOne({ emailNormalized }).exec();
  }

  findUserById(userId: string | Types.ObjectId): Promise<AuthUser | null> {
    return this.modelInstance.UserModel.findById(userId).exec();
  }

  findUsersByIds(userIds: Array<string | Types.ObjectId>): Promise<AuthUser[]> {
    if (userIds.length === 0) {
      return Promise.resolve([]);
    }

    return this.modelInstance.UserModel.find({ _id: { $in: userIds } }).lean().exec() as unknown as Promise<AuthUser[]>;
  }

  createUser(data: Partial<AuthUser>): Promise<AuthUser> {
    return this.modelInstance.UserModel.create(data);
  }

  deleteUserById(userId: string | Types.ObjectId): Promise<void> {
    return this.modelInstance.UserModel.deleteOne({ _id: userId }).exec().then(() => undefined);
  }

  updateUserById(
    userId: string | Types.ObjectId,
    data: Record<string, unknown>
  ): Promise<AuthUser | null> {
    return this.modelInstance.UserModel.findOneAndUpdate(
      { _id: userId },
      data,
      { new: true }
    ).exec();
  }

  updateUserThemeConfigById(
    userId: string | Types.ObjectId,
    themeConfig: Record<string, unknown> | undefined
  ): Promise<AuthUser | null> {
    if (typeof userId === 'string' && Types.ObjectId.isValid(userId) === false) {
      return Promise.resolve(null);
    }

    const update = themeConfig
      ? { $set: { themeConfig } }
      : { $unset: { themeConfig: '' } };

    return this.modelInstance.UserModel.findOneAndUpdate(
      { _id: userId },
      update,
      { new: true }
    ).exec();
  }

  createSession(data: Partial<AuthSession>): Promise<AuthSession> {
    return this.modelInstance.SessionModel.create(data);
  }

  findActiveSessionByHash(sessionTokenHash: string, now: Date): Promise<AuthSession | null> {
    return this.modelInstance.SessionModel.findOne({
      sessionTokenHash,
      revokedAt: { $exists: false },
      expiresAt: { $gt: now }
    }).exec();
  }

  updateSessionById(sessionId: string | Types.ObjectId, data: Record<string, unknown>): Promise<void> {
    return this.modelInstance.SessionModel.updateOne({ _id: sessionId }, data).exec().then(() => undefined);
  }

  revokeSessionByHash(sessionTokenHash: string): Promise<void> {
    return this.modelInstance.SessionModel.updateOne(
      { sessionTokenHash, revokedAt: { $exists: false } },
      { $set: { revokedAt: new Date() } }
    ).exec().then(() => undefined);
  }

  revokeActiveSessionsForUser(userId: string | Types.ObjectId): Promise<void> {
    return this.modelInstance.SessionModel.updateMany(
      { userId, revokedAt: { $exists: false } },
      { $set: { revokedAt: new Date() } }
    ).exec().then(() => undefined);
  }

  async revokeOldestActiveSessionsForUser(
    userId: string | Types.ObjectId,
    keepCount: number
  ): Promise<void> {
    const normalizedKeepCount = Math.max(1, Math.floor(keepCount));
    const sessionsToRevoke = await this.modelInstance.SessionModel.find({
      userId,
      revokedAt: { $exists: false },
      expiresAt: { $gt: new Date() }
    })
      .sort({ createdAt: -1, _id: -1 })
      .skip(normalizedKeepCount)
      .select('_id')
      .lean()
      .exec() as Array<{ _id: Types.ObjectId }>;

    const sessionIds = sessionsToRevoke.map((session) => session._id);

    if (sessionIds.length === 0) {
      return;
    }

    await this.modelInstance.SessionModel.updateMany(
      {
        _id: { $in: sessionIds },
        userId,
        revokedAt: { $exists: false }
      },
      { $set: { revokedAt: new Date() } }
    ).exec();
  }

  invalidateEmailVerificationTokensForUser(userId: string | Types.ObjectId): Promise<void> {
    return this.modelInstance.EmailVerificationTokenModel.updateMany(
      { userId, usedAt: { $exists: false } },
      { $set: { usedAt: new Date() } }
    ).exec().then(() => undefined);
  }

  deleteEmailVerificationTokensForUser(userId: string | Types.ObjectId): Promise<void> {
    return this.modelInstance.EmailVerificationTokenModel.deleteMany({ userId }).exec().then(() => undefined);
  }

  createEmailVerificationToken(data: Partial<VerificationToken>): Promise<VerificationToken> {
    return this.modelInstance.EmailVerificationTokenModel.create(data);
  }

  findPendingRegistrationByEmailNormalized(emailNormalized: string): Promise<PendingRegistration | null> {
    return this.modelInstance.PendingRegistrationModel.findOne({ emailNormalized }).exec();
  }

  createPendingRegistration(data: Partial<PendingRegistration>): Promise<PendingRegistration> {
    return this.modelInstance.PendingRegistrationModel.findOneAndUpdate(
      { emailNormalized: data.emailNormalized },
      data,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).exec() as Promise<PendingRegistration>;
  }

  findActivePendingRegistrationByTokenHash(tokenHash: string, now: Date): Promise<PendingRegistration | null> {
    return this.modelInstance.PendingRegistrationModel.findOne({
      tokenHash,
      expiresAt: { $gt: now }
    }).exec();
  }

  findActivePendingRegistrationByCodeHash(
    emailNormalized: string,
    codeHash: string,
    now: Date
  ): Promise<PendingRegistration | null> {
    return this.modelInstance.PendingRegistrationModel.findOne({
      emailNormalized,
      codeHash,
      expiresAt: { $gt: now }
    }).exec();
  }

  deletePendingRegistrationById(registrationId: string | Types.ObjectId): Promise<void> {
    return this.modelInstance.PendingRegistrationModel.deleteOne({ _id: registrationId }).exec().then(() => undefined);
  }

  deletePendingRegistrationByEmailNormalized(emailNormalized: string): Promise<void> {
    return this.modelInstance.PendingRegistrationModel.deleteOne({ emailNormalized }).exec().then(() => undefined);
  }

  findActiveEmailVerificationTokenByTokenHash(tokenHash: string, now: Date): Promise<VerificationToken | null> {
    return this.modelInstance.EmailVerificationTokenModel.findOne({
      tokenHash,
      usedAt: { $exists: false },
      expiresAt: { $gt: now }
    }).exec();
  }

  findActiveEmailVerificationTokenByCodeHash(
    userId: string | Types.ObjectId,
    codeHash: string,
    now: Date
  ): Promise<VerificationToken | null> {
    return this.modelInstance.EmailVerificationTokenModel.findOne({
      userId,
      codeHash,
      usedAt: { $exists: false },
      expiresAt: { $gt: now }
    }).exec();
  }

  invalidatePasswordResetTokensForUser(userId: string | Types.ObjectId): Promise<void> {
    return this.modelInstance.PasswordResetTokenModel.updateMany(
      { userId, usedAt: { $exists: false } },
      { $set: { usedAt: new Date() } }
    ).exec().then(() => undefined);
  }

  createPasswordResetToken(data: Partial<VerificationToken>): Promise<VerificationToken> {
    return this.modelInstance.PasswordResetTokenModel.create(data);
  }

  findActivePasswordResetTokenByTokenHash(tokenHash: string, now: Date): Promise<VerificationToken | null> {
    return this.modelInstance.PasswordResetTokenModel.findOne({
      tokenHash,
      usedAt: { $exists: false },
      expiresAt: { $gt: now }
    }).exec();
  }

  markPasswordResetTokenUsed(tokenId: string | Types.ObjectId): Promise<void> {
    return this.modelInstance.PasswordResetTokenModel.updateOne(
      { _id: tokenId },
      { $set: { usedAt: new Date() } }
    ).exec().then(() => undefined);
  }

  saveUserAvatar(data: Partial<AuthUserAvatar>): Promise<AuthUserAvatar> {
    return this.modelInstance.UserAvatarModel.findOneAndUpdate(
      { userId: data.userId },
      data,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).exec() as Promise<AuthUserAvatar>;
  }

  findUserAvatarByUserId(userId: string | Types.ObjectId): Promise<AuthUserAvatar | null> {
    return this.modelInstance.UserAvatarModel.findOne({ userId }).exec();
  }

  deleteUserAvatarByUserId(userId: string | Types.ObjectId): Promise<void> {
    return this.modelInstance.UserAvatarModel.deleteOne({ userId }).exec().then(() => undefined);
  }
}

export default Auth;
