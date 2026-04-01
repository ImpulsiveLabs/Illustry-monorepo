import argon2 from 'argon2';
import Factory from '../factory';
import { AuthSession, AuthUser } from './types';
import {
  argonOptions,
  emailVerificationTtlMinutes,
  passwordResetTtlMinutes,
  sessionTtlMinutes
} from './constants';
import { createNumericCode, createOpaqueToken, hashOpaqueToken } from './crypto';
import { normalizeEmail } from './validation';
import EmailService from './email';
import { AuthHttpError, INVALID_AUTH_MESSAGE } from './errors';
import logger from '../config/logger';

type ClientMetadata = {
  ipAddress?: string;
  userAgent?: string;
};

type SessionIssueResult = {
  session: AuthSession;
  sessionToken: string;
  csrfToken: string;
  expiresAt: Date;
};

type SessionPrincipal = {
  user: AuthUser;
  session: AuthSession;
};

class AuthService {
  private readonly modelInstance = Factory.getInstance().getModelInstance();

  private readonly emailService = new EmailService();

  private readonly users = this.modelInstance.UserModel;

  private readonly sessions = this.modelInstance.SessionModel;

  private readonly emailVerificationTokens = this.modelInstance.EmailVerificationTokenModel;

  private readonly passwordResetTokens = this.modelInstance.PasswordResetTokenModel;

  async register(email: string, password: string, metadata: ClientMetadata): Promise<SessionIssueResult> {
    const emailNormalized = normalizeEmail(email);

    const existing = await this.users.findOne({ emailNormalized }).exec();

    if (existing) {
      if (existing.isEmailVerified === false) {
        await this.sendEmailVerification(existing);
      }
      throw new AuthHttpError(400, 'Unable to register with provided credentials');
    }

    const passwordHash = await argon2.hash(password, {
      ...argonOptions,
      type: argon2.argon2id
    });

    const user = await this.users.create({
      email,
      emailNormalized,
      passwordHash,
      isEmailVerified: false,
      roles: ['user'],
      authVersion: 0
    });

    await this.sendEmailVerification(user);

    logger.info(`User registered: ${user.emailNormalized}`);

    return this.createSession(user, metadata);
  }

  async login(email: string, password: string, metadata: ClientMetadata): Promise<SessionIssueResult> {
    const emailNormalized = normalizeEmail(email);
    const user = await this.users.findOne({ emailNormalized }).exec();

    if (user === null) {
      throw new AuthHttpError(401, INVALID_AUTH_MESSAGE);
    }

    const valid = await argon2.verify(user.passwordHash, password);

    if (valid === false) {
      throw new AuthHttpError(401, INVALID_AUTH_MESSAGE);
    }

    logger.info(`User login success: ${user.emailNormalized}`);

    return this.createSession(user, metadata);
  }

  async loginWithGoogle(email: string, emailVerified: boolean, metadata: ClientMetadata): Promise<SessionIssueResult> {
    const emailNormalized = normalizeEmail(email);
    let user = await this.users.findOne({ emailNormalized }).exec();

    if (user === null) {
      const generatedPassword = createOpaqueToken();
      const passwordHash = await argon2.hash(generatedPassword, {
        ...argonOptions,
        type: argon2.argon2id
      });

      user = await this.users.create({
        email,
        emailNormalized,
        passwordHash,
        isEmailVerified: emailVerified,
        roles: ['user'],
        authVersion: 0
      });
      logger.info(`User registered via Google OAuth: ${user.emailNormalized}`);
    } else if (emailVerified === true && user.isEmailVerified === false) {
      user = await this.users.findOneAndUpdate(
        { _id: user._id },
        { $set: { isEmailVerified: true } },
        { new: true }
      ).exec() || user;
    }

    logger.info(`User login success via Google OAuth: ${emailNormalized}`);

    return this.createSession(user, metadata);
  }

  async getSessionPrincipalFromToken(rawSessionToken: string): Promise<SessionPrincipal | null> {
    const sessionTokenHash = hashOpaqueToken(rawSessionToken);
    const now = new Date();

    const session = await this.sessions.findOne({
      sessionTokenHash,
      revokedAt: { $exists: false },
      expiresAt: { $gt: now }
    }).exec();

    if (session === null) {
      return null;
    }

    const user = await this.users.findById(session.userId).exec();

    if (user === null) {
      await this.revokeSessionByHash(session.sessionTokenHash);
      return null;
    }

    if (session.authVersion !== user.authVersion) {
      await this.revokeSessionByHash(session.sessionTokenHash);
      return null;
    }

    return {
      user,
      session
    };
  }

  async rotateSession(rawSessionToken: string, metadata: ClientMetadata): Promise<SessionIssueResult> {
    const principal = await this.getSessionPrincipalFromToken(rawSessionToken);

    if (principal === null) {
      throw new AuthHttpError(401, 'Session is invalid or expired');
    }

    const rotated = await this.createSession(principal.user, metadata);

    await this.sessions.updateOne(
      { _id: principal.session._id },
      {
        $set: {
          revokedAt: new Date(),
          replacedBySessionTokenHash: rotated.session.sessionTokenHash
        }
      }
    ).exec();

    return rotated;
  }

  async logout(rawSessionToken: string): Promise<void> {
    const sessionTokenHash = hashOpaqueToken(rawSessionToken);
    await this.revokeSessionByHash(sessionTokenHash);
  }

  async verifyEmail(token: string): Promise<void> {
    const tokenHash = hashOpaqueToken(token);
    const now = new Date();

    const storedToken = await this.emailVerificationTokens.findOne({
      tokenHash,
      usedAt: { $exists: false },
      expiresAt: { $gt: now }
    }).exec();

    if (storedToken === null) {
      throw new AuthHttpError(400, 'Verification token is invalid or expired');
    }

    await this.users.updateOne(
      { _id: storedToken.userId },
      { $set: { isEmailVerified: true } }
    ).exec();

    await this.emailVerificationTokens.updateOne(
      { _id: storedToken._id },
      { $set: { usedAt: new Date() } }
    ).exec();

    logger.info(`Email verified for userId=${storedToken.userId.toString()}`);
  }

  async verifyEmailCode(email: string, code: string): Promise<void> {
    const emailNormalized = normalizeEmail(email);
    const user = await this.users.findOne({ emailNormalized }).exec();

    if (user === null) {
      throw new AuthHttpError(400, 'Verification code is invalid or expired');
    }

    const codeHash = hashOpaqueToken(code);
    const now = new Date();

    const storedToken = await this.emailVerificationTokens.findOne({
      userId: user._id,
      codeHash,
      usedAt: { $exists: false },
      expiresAt: { $gt: now }
    }).exec();

    if (storedToken === null) {
      throw new AuthHttpError(400, 'Verification code is invalid or expired');
    }

    await this.users.updateOne(
      { _id: storedToken.userId },
      { $set: { isEmailVerified: true } }
    ).exec();

    await this.emailVerificationTokens.updateOne(
      { _id: storedToken._id },
      { $set: { usedAt: new Date() } }
    ).exec();

    logger.info(`Email verified by code for userId=${storedToken.userId.toString()}`);
  }

  async resendVerification(email?: string, userId?: string): Promise<void> {
    let user: AuthUser | null = null;

    if (userId !== undefined) {
      user = await this.users.findById(userId).exec();
    } else if (email !== undefined) {
      user = await this.users.findOne({ emailNormalized: normalizeEmail(email) }).exec();
    }

    if (user && user.isEmailVerified === false) {
      await this.sendEmailVerification(user);
    }
  }

  async forgotPassword(email: string): Promise<void> {
    const emailNormalized = normalizeEmail(email);
    const user = await this.users.findOne({ emailNormalized }).exec();

    if (user) {
      await this.sendPasswordReset(user);
    }
  }

  async resetPassword(token: string, password: string): Promise<void> {
    const tokenHash = hashOpaqueToken(token);
    const now = new Date();

    const resetToken = await this.passwordResetTokens.findOne({
      tokenHash,
      usedAt: { $exists: false },
      expiresAt: { $gt: now }
    }).exec();

    if (resetToken === null) {
      throw new AuthHttpError(400, 'Password reset token is invalid or expired');
    }

    const passwordHash = await argon2.hash(password, {
      ...argonOptions,
      type: argon2.argon2id
    });

    const updatedUser = await this.users.findOneAndUpdate(
      { _id: resetToken.userId },
      {
        $set: { passwordHash },
        $inc: { authVersion: 1 }
      },
      { new: true }
    ).exec();

    if (updatedUser) {
      await this.sessions.updateMany(
        { userId: updatedUser._id, revokedAt: { $exists: false } },
        { $set: { revokedAt: new Date() } }
      ).exec();
    }

    await this.passwordResetTokens.updateOne(
      { _id: resetToken._id },
      { $set: { usedAt: new Date() } }
    ).exec();

    logger.info(`Password reset completed for userId=${resetToken.userId.toString()}`);
  }

  async rotateCsrfToken(rawSessionToken: string): Promise<{ csrfToken: string; expiresAt: Date }> {
    const principal = await this.getSessionPrincipalFromToken(rawSessionToken);

    if (principal === null) {
      throw new AuthHttpError(401, 'Session is invalid or expired');
    }

    const csrfToken = createOpaqueToken();

    await this.sessions.updateOne(
      { _id: principal.session._id },
      { $set: { csrfTokenHash: hashOpaqueToken(csrfToken) } }
    ).exec();

    return {
      csrfToken,
      expiresAt: principal.session.expiresAt
    };
  }

  private async createSession(user: AuthUser, metadata: ClientMetadata): Promise<SessionIssueResult> {
    const sessionToken = createOpaqueToken();
    const csrfToken = createOpaqueToken();
    const sessionTokenHash = hashOpaqueToken(sessionToken);
    const csrfTokenHash = hashOpaqueToken(csrfToken);

    const expiresAt = new Date(Date.now() + sessionTtlMinutes * 60 * 1000);

    const session = await this.sessions.create({
      userId: user._id,
      sessionTokenHash,
      csrfTokenHash,
      expiresAt,
      authVersion: user.authVersion,
      userAgent: metadata.userAgent,
      ipAddress: metadata.ipAddress
    });

    return {
      session,
      sessionToken,
      csrfToken,
      expiresAt
    };
  }

  private async sendEmailVerification(user: AuthUser): Promise<void> {
    const token = createOpaqueToken();
    const tokenHash = hashOpaqueToken(token);
    const verificationCode = createNumericCode(6);
    const verificationCodeHash = hashOpaqueToken(verificationCode);
    const expiresAt = new Date(Date.now() + emailVerificationTtlMinutes * 60 * 1000);

    await this.emailVerificationTokens.updateMany(
      { userId: user._id, usedAt: { $exists: false } },
      { $set: { usedAt: new Date() } }
    ).exec();

    await this.emailVerificationTokens.create({
      userId: user._id,
      tokenHash,
      codeHash: verificationCodeHash,
      expiresAt
    });

    await this.emailService.sendVerificationEmail(user.email, token, verificationCode);
  }

  private async sendPasswordReset(user: AuthUser): Promise<void> {
    const token = createOpaqueToken();
    const tokenHash = hashOpaqueToken(token);
    const expiresAt = new Date(Date.now() + passwordResetTtlMinutes * 60 * 1000);

    await this.passwordResetTokens.updateMany(
      { userId: user._id, usedAt: { $exists: false } },
      { $set: { usedAt: new Date() } }
    ).exec();

    await this.passwordResetTokens.create({
      userId: user._id,
      tokenHash,
      expiresAt
    });

    await this.emailService.sendPasswordResetEmail(user.email, token);
  }

  private async revokeSessionByHash(sessionTokenHash: string): Promise<void> {
    await this.sessions.updateOne(
      { sessionTokenHash, revokedAt: { $exists: false } },
      { $set: { revokedAt: new Date() } }
    ).exec();
  }
}

export default AuthService;
