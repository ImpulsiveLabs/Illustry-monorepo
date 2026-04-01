import validator from 'validator';
import { z } from 'zod';

const emailSchema = z.string().email().max(254);

const passwordSchema = z
  .string()
  .min(12)
  .max(128)
  .regex(/[A-Z]/, 'Password must include at least one uppercase character')
  .regex(/[a-z]/, 'Password must include at least one lowercase character')
  .regex(/[0-9]/, 'Password must include at least one number');

const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema
});

const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(128)
});

const verifyEmailSchema = z.object({
  token: z.string().min(32).max(512)
});

const verifyEmailCodeSchema = z.object({
  email: emailSchema,
  code: z.string().regex(/^\d{6}$/)
});

const resendVerificationSchema = z.object({
  email: emailSchema.optional()
});

const forgotPasswordSchema = z.object({
  email: emailSchema
});

const resetPasswordSchema = z.object({
  token: z.string().min(32).max(512),
  password: passwordSchema
});

const parseDto = <T>(schema: z.ZodSchema<T>, value: unknown): T => schema.parse(value);

const normalizeEmail = (email: string): string => {
  const normalized = validator.normalizeEmail(email, {
    all_lowercase: true,
    gmail_remove_dots: false,
    outlookdotcom_remove_subaddress: false,
    yahoo_remove_subaddress: false,
    gmail_remove_subaddress: false,
    icloud_remove_subaddress: false
  });

  const fallback = email.trim().toLowerCase();
  return (normalized || fallback).trim();
};

export {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  verifyEmailCodeSchema,
  resendVerificationSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  parseDto,
  normalizeEmail
};
