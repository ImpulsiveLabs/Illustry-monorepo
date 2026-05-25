import { Request } from 'express';
import { Types } from 'mongoose';

interface AuthUser {
  _id: Types.ObjectId;
  email: string;
  emailNormalized: string;
  name: string;
  passwordHash: string;
  avatarFileName?: string;
  avatarContentType?: string;
  avatarUpdatedAt?: Date;
  isEmailVerified: boolean;
  roles: string[];
  authVersion: number;
  themeConfig?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

interface AuthSession {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  sessionTokenHash: string;
  csrfTokenHash: string;
  expiresAt: Date;
  revokedAt?: Date;
  replacedBySessionTokenHash?: string;
  userAgent?: string;
  ipAddress?: string;
  authVersion: number;
  createdAt: Date;
  updatedAt: Date;
}

interface VerificationToken {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  tokenHash: string;
  codeHash?: string;
  expiresAt: Date;
  usedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface AuthUserAvatar {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  fileName: string;
  contentType: string;
  size: number;
  data: Buffer;
  createdAt: Date;
  updatedAt: Date;
}

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

type AuthAvatarUpload = {
  fileName: string;
  contentType: string;
  size: number;
  data: Buffer;
};

type AuthPublicUser = {
  id: string;
  email: string;
  name: string;
  isEmailVerified: boolean;
  roles: string[];
  hasAvatar: boolean;
  avatarUpdatedAt?: string;
  themeConfig?: Record<string, unknown>;
};

interface AuthContext {
  userId: string;
  email: string;
  name: string;
  isEmailVerified: boolean;
  roles: string[];
  hasAvatar: boolean;
  avatarUpdatedAt?: string;
  authVersion: number;
  session: AuthSession;
}

type AuthenticatedRequest = Request & {
  auth: AuthContext;
};

export {
  AuthUser,
  AuthSession,
  VerificationToken,
  AuthUserAvatar,
  ClientMetadata,
  SessionIssueResult,
  SessionPrincipal,
  AuthAvatarUpload,
  AuthPublicUser,
  AuthContext,
  AuthenticatedRequest
};
