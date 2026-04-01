import { Request } from 'express';
import { Types } from 'mongoose';

interface AuthUser {
  _id: Types.ObjectId;
  email: string;
  emailNormalized: string;
  passwordHash: string;
  isEmailVerified: boolean;
  roles: string[];
  authVersion: number;
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

interface AuthContext {
  userId: string;
  email: string;
  isEmailVerified: boolean;
  roles: string[];
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
  AuthContext,
  AuthenticatedRequest
};
