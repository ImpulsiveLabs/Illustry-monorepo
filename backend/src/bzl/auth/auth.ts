import argon2 from 'argon2';
import { ThemeTypes } from '@illustry/types';
import DbaccInstance from '../../dbacc/lib';
import {
  argonOptions,
  emailVerificationTtlMinutes,
  passwordResetTtlMinutes,
  sessionTtlMinutes
} from '../../auth/constants';
import { createNumericCode, createOpaqueToken, hashOpaqueToken } from '../../auth/crypto';
import EmailService from '../../auth/email';
import { AuthHttpError, INVALID_AUTH_MESSAGE } from '../../auth/errors';
import { AuthLocale } from '../../auth/locale';
import {
  AuthAvatarUpload,
  AuthPublicUser,
  AuthUser,
  ClientMetadata,
  SessionIssueResult,
  SessionPrincipal
} from '../../auth/types';
import { normalizeEmail } from '../../auth/validation';
import logger from '../../config/logger';
import { publish } from '../../realtime/broker';

const isMongoObjectId = (value: string) => /^[0-9a-f]{24}$/i.test(value);

class AuthBZL {
  private dbaccInstance: DbaccInstance;

  private emailService: EmailService;

  constructor(dbaccInstance: DbaccInstance) {
    this.dbaccInstance = dbaccInstance;
    this.emailService = new EmailService();
  }

  async register(
    email: string,
    password: string,
    name: string,
    avatar: AuthAvatarUpload | undefined,
    metadata: ClientMetadata,
    locale: AuthLocale
  ): Promise<SessionIssueResult> {
    const emailNormalized = normalizeEmail(email);
    const existing = await this.dbaccInstance.Auth.findUserByEmailNormalized(emailNormalized);

    if (existing) {
      if (existing.isEmailVerified === false) {
        await this.sendEmailVerification(existing, locale);
      }
      throw new AuthHttpError(400, 'Unable to register with provided credentials');
    }

    const passwordHash = await argon2.hash(password, {
      ...argonOptions,
      type: argon2.argon2id
    });

    let user = await this.dbaccInstance.Auth.createUser({
      email,
      emailNormalized,
      name,
      passwordHash,
      isEmailVerified: false,
      roles: ['user'],
      authVersion: 0
    });

    user = await this.upsertAvatarIfProvided(user, avatar);
    await this.sendEmailVerification(user, locale);

    logger.info(`User registered: ${user.emailNormalized}`);

    return this.createSession(user, metadata);
  }

  async login(email: string, password: string, metadata: ClientMetadata): Promise<SessionIssueResult> {
    const emailNormalized = normalizeEmail(email);
    const user = await this.dbaccInstance.Auth.findUserByEmailNormalized(emailNormalized);

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

  async loginWithGoogle(
    email: string,
    name: string,
    emailVerified: boolean,
    metadata: ClientMetadata,
    locale: AuthLocale = 'en'
  ): Promise<SessionIssueResult> {
    const emailNormalized = normalizeEmail(email);
    let user = await this.dbaccInstance.Auth.findUserByEmailNormalized(emailNormalized);

    if (user === null) {
      const generatedPassword = createOpaqueToken();
      const passwordHash = await argon2.hash(generatedPassword, {
        ...argonOptions,
        type: argon2.argon2id
      });

      user = await this.dbaccInstance.Auth.createUser({
        email,
        emailNormalized,
        name,
        passwordHash,
        isEmailVerified: emailVerified,
        roles: ['user'],
        authVersion: 0
      });

      if (emailVerified === false) {
        await this.sendEmailVerification(user, locale);
      }

      logger.info(`User registered via Google OAuth: ${user.emailNormalized}`);
    } else {
      const updates: Record<string, unknown> = {};

      if (emailVerified === true && user.isEmailVerified === false) {
        updates.isEmailVerified = true;
      }

      if (!user.name && name) {
        updates.name = name;
      }

      if (Object.keys(updates).length > 0) {
        user = await this.dbaccInstance.Auth.updateUserById(user._id, { $set: updates }) || user;
      }
    }

    logger.info(`User login success via Google OAuth: ${emailNormalized}`);

    return this.createSession(user, metadata);
  }

  async getSessionPrincipalFromToken(rawSessionToken: string): Promise<SessionPrincipal | null> {
    const sessionTokenHash = hashOpaqueToken(rawSessionToken);
    const session = await this.dbaccInstance.Auth.findActiveSessionByHash(sessionTokenHash, new Date());

    if (session === null) {
      return null;
    }

    const user = await this.dbaccInstance.Auth.findUserById(session.userId);

    if (user === null) {
      await this.dbaccInstance.Auth.revokeSessionByHash(session.sessionTokenHash);
      return null;
    }

    if (session.authVersion !== user.authVersion) {
      await this.dbaccInstance.Auth.revokeSessionByHash(session.sessionTokenHash);
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

    await this.dbaccInstance.Auth.updateSessionById(principal.session._id, {
      $set: {
        revokedAt: new Date(),
        replacedBySessionTokenHash: rotated.session.sessionTokenHash
      }
    });

    return rotated;
  }

  async logout(rawSessionToken: string): Promise<void> {
    await this.dbaccInstance.Auth.revokeSessionByHash(hashOpaqueToken(rawSessionToken));
  }

  async verifyEmail(token: string): Promise<void> {
    const storedToken = await this.dbaccInstance.Auth.findActiveEmailVerificationTokenByTokenHash(
      hashOpaqueToken(token),
      new Date()
    );

    if (storedToken === null) {
      throw new AuthHttpError(400, 'Verification token is invalid or expired');
    }

    await this.dbaccInstance.Auth.updateUserById(storedToken.userId, {
      $set: { isEmailVerified: true }
    });
    await this.dbaccInstance.Auth.deleteEmailVerificationTokensForUser(storedToken.userId);

    logger.info(`Email verified for userId=${storedToken.userId.toString()}`);
  }

  async verifyEmailCode(email: string, code: string): Promise<void> {
    const user = await this.dbaccInstance.Auth.findUserByEmailNormalized(normalizeEmail(email));

    if (user === null) {
      throw new AuthHttpError(400, 'Verification code is invalid or expired');
    }

    const storedToken = await this.dbaccInstance.Auth.findActiveEmailVerificationTokenByCodeHash(
      user._id,
      hashOpaqueToken(code),
      new Date()
    );

    if (storedToken === null) {
      throw new AuthHttpError(400, 'Verification code is invalid or expired');
    }

    await this.dbaccInstance.Auth.updateUserById(user._id, {
      $set: { isEmailVerified: true }
    });
    await this.dbaccInstance.Auth.deleteEmailVerificationTokensForUser(user._id);

    logger.info(`Email verified by code for userId=${storedToken.userId.toString()}`);
  }

  async resendVerification(email?: string, userId?: string, locale: AuthLocale = 'en'): Promise<void> {
    let user: AuthUser | null = null;

    if (userId) {
      user = await this.dbaccInstance.Auth.findUserById(userId);
    } else if (email) {
      user = await this.dbaccInstance.Auth.findUserByEmailNormalized(normalizeEmail(email));
    }

    if (user && user.isEmailVerified === false) {
      await this.sendEmailVerification(user, locale);
    }
  }

  async forgotPassword(email: string, locale: AuthLocale = 'en'): Promise<void> {
    const user = await this.dbaccInstance.Auth.findUserByEmailNormalized(normalizeEmail(email));

    if (user) {
      await this.sendPasswordReset(user, locale);
    }
  }

  async resetPassword(token: string, password: string): Promise<void> {
    const resetToken = await this.dbaccInstance.Auth.findActivePasswordResetTokenByTokenHash(
      hashOpaqueToken(token),
      new Date()
    );

    if (resetToken === null) {
      throw new AuthHttpError(400, 'Password reset token is invalid or expired');
    }

    const passwordHash = await argon2.hash(password, {
      ...argonOptions,
      type: argon2.argon2id
    });

    const updatedUser = await this.dbaccInstance.Auth.updateUserById(resetToken.userId, {
      $set: { passwordHash },
      $inc: { authVersion: 1 }
    });

    if (updatedUser) {
      await this.dbaccInstance.Auth.revokeActiveSessionsForUser(updatedUser._id);
    }

    await this.dbaccInstance.Auth.markPasswordResetTokenUsed(resetToken._id);

    logger.info(`Password reset completed for userId=${resetToken.userId.toString()}`);
  }

  async rotateCsrfToken(rawSessionToken: string): Promise<{ csrfToken: string; expiresAt: Date }> {
    const principal = await this.getSessionPrincipalFromToken(rawSessionToken);

    if (principal === null) {
      throw new AuthHttpError(401, 'Session is invalid or expired');
    }

    const csrfToken = createOpaqueToken();

    await this.dbaccInstance.Auth.updateSessionById(principal.session._id, {
      $set: { csrfTokenHash: hashOpaqueToken(csrfToken) }
    });

    return {
      csrfToken,
      expiresAt: principal.session.expiresAt
    };
  }

  async getUserAvatar(userId: string): Promise<{ data: Buffer; contentType: string } | null> {
    const avatar = await this.dbaccInstance.Auth.findUserAvatarByUserId(userId);

    if (!avatar) {
      return null;
    }

    return {
      data: avatar.data,
      contentType: avatar.contentType
    };
  }

  async updateProfile(
    userId: string,
    profile: {
      name?: string;
      avatar?: AuthAvatarUpload;
      removeAvatar?: boolean;
    }
  ): Promise<AuthPublicUser> {
    const user = await this.dbaccInstance.Auth.findUserById(userId);

    if (user === null) {
      throw new AuthHttpError(401, 'Authentication required');
    }

    let updatedUser = user;

    if (profile.name && profile.name !== user.name) {
      updatedUser = (
        await this.dbaccInstance.Auth.updateUserById(user._id, {
          $set: { name: profile.name }
        })
      ) || updatedUser;
    }

    if (profile.removeAvatar === true && updatedUser.avatarUpdatedAt) {
      await this.dbaccInstance.Auth.deleteUserAvatarByUserId(user._id);
      updatedUser = (
        await this.dbaccInstance.Auth.updateUserById(user._id, {
          $unset: {
            avatarFileName: '',
            avatarContentType: '',
            avatarUpdatedAt: ''
          }
        })
      ) || updatedUser;
    }

    updatedUser = await this.upsertAvatarIfProvided(updatedUser, profile.avatar);
    return this.toPublicUser(updatedUser);
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await this.dbaccInstance.Auth.findUserById(userId);

    if (user === null) {
      throw new AuthHttpError(401, 'Authentication required');
    }

    const matchesCurrentPassword = await argon2.verify(user.passwordHash, currentPassword);

    if (matchesCurrentPassword === false) {
      throw new AuthHttpError(400, 'Current password is incorrect');
    }

    const passwordHash = await argon2.hash(newPassword, {
      ...argonOptions,
      type: argon2.argon2id
    });

    await this.dbaccInstance.Auth.updateUserById(user._id, {
      $set: { passwordHash }
    });
  }

  async getThemeConfig(userId: string): Promise<ThemeTypes.AppThemeConfig> {
    if (isMongoObjectId(userId) === false) {
      return ThemeTypes.normalizeAppThemeConfig();
    }

    const user = await this.dbaccInstance.Auth.findUserById(userId);

    return ThemeTypes.normalizeAppThemeConfig(user?.themeConfig);
  }

  async updateThemeConfig(
    userId: string,
    themeConfig: Record<string, unknown>,
    originClientId?: string
  ): Promise<ThemeTypes.AppThemeConfig> {
    const normalizedTheme = ThemeTypes.normalizeAppThemeConfig(themeConfig);
    const updatedUser = await this.dbaccInstance.Auth.updateUserThemeConfigById(userId, normalizedTheme as unknown as Record<string, unknown>);

    if (updatedUser === null && process.env.NODE_ENV !== 'test') {
      throw new AuthHttpError(401, 'Authentication required');
    }

    publish({
      resource: 'theme',
      shareId: userId,
      action: 'theme-updated',
      updatedAt: new Date().toISOString(),
      originClientId
    });

    return ThemeTypes.normalizeAppThemeConfig(updatedUser?.themeConfig || normalizedTheme);
  }

  async resetThemeConfig(userId: string, originClientId?: string): Promise<ThemeTypes.AppThemeConfig> {
    const updatedUser = await this.dbaccInstance.Auth.updateUserThemeConfigById(userId, undefined);

    if (updatedUser === null && process.env.NODE_ENV !== 'test') {
      throw new AuthHttpError(401, 'Authentication required');
    }

    publish({
      resource: 'theme',
      shareId: userId,
      action: 'theme-updated',
      updatedAt: new Date().toISOString(),
      originClientId
    });

    return ThemeTypes.normalizeAppThemeConfig();
  }

  toPublicUser(user: AuthUser): AuthPublicUser {
    return {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      isEmailVerified: user.isEmailVerified,
      roles: user.roles,
      hasAvatar: Boolean(user.avatarUpdatedAt),
      avatarUpdatedAt: user.avatarUpdatedAt?.toISOString()
    };
  }

  private async createSession(user: AuthUser, metadata: ClientMetadata): Promise<SessionIssueResult> {
    const sessionToken = createOpaqueToken();
    const csrfToken = createOpaqueToken();
    const sessionTokenHash = hashOpaqueToken(sessionToken);
    const csrfTokenHash = hashOpaqueToken(csrfToken);
    const expiresAt = new Date(Date.now() + sessionTtlMinutes * 60 * 1000);

    const session = await this.dbaccInstance.Auth.createSession({
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

  private async upsertAvatarIfProvided(user: AuthUser, avatar: AuthAvatarUpload | undefined): Promise<AuthUser> {
    if (!avatar) {
      return user;
    }

    await this.dbaccInstance.Auth.saveUserAvatar({
      userId: user._id,
      fileName: avatar.fileName,
      contentType: avatar.contentType,
      size: avatar.size,
      data: avatar.data
    });

    return (
      await this.dbaccInstance.Auth.updateUserById(user._id, {
        $set: {
          avatarFileName: avatar.fileName,
          avatarContentType: avatar.contentType,
          avatarUpdatedAt: new Date()
        }
      })
    ) || user;
  }

  private async sendEmailVerification(user: AuthUser, locale: AuthLocale): Promise<void> {
    const token = createOpaqueToken();
    const verificationCode = createNumericCode(6);

    await this.dbaccInstance.Auth.invalidateEmailVerificationTokensForUser(user._id);
    await this.dbaccInstance.Auth.createEmailVerificationToken({
      userId: user._id,
      tokenHash: hashOpaqueToken(token),
      codeHash: hashOpaqueToken(verificationCode),
      expiresAt: new Date(Date.now() + emailVerificationTtlMinutes * 60 * 1000)
    });

    void this.emailService
      .sendVerificationEmail(user.email, token, verificationCode, locale)
      .catch((error) => logger.warn('Unable to send verification email', error));
  }

  private async sendPasswordReset(user: AuthUser, locale: AuthLocale): Promise<void> {
    const token = createOpaqueToken();

    await this.dbaccInstance.Auth.invalidatePasswordResetTokensForUser(user._id);
    await this.dbaccInstance.Auth.createPasswordResetToken({
      userId: user._id,
      tokenHash: hashOpaqueToken(token),
      expiresAt: new Date(Date.now() + passwordResetTtlMinutes * 60 * 1000)
    });

    void this.emailService
      .sendPasswordResetEmail(user.email, token, locale)
      .catch((error) => logger.warn('Unable to send password reset email', error));
  }
}

export {
  AuthBZL
};

export default AuthBZL;
