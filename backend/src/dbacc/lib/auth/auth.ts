import { Types } from 'mongoose';
import ModelInstance from '../../models/modelInstance';
import {
  AuthSession,
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

  createUser(data: Partial<AuthUser>): Promise<AuthUser> {
    return this.modelInstance.UserModel.create(data);
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
