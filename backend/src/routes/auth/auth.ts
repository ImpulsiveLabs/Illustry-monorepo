import { Router } from 'express';
import multer from 'multer';
import * as authAPI from '../../api/auth/auth';
import {
  avatarAllowedMimeTypes,
  avatarMaxBytes
} from '../../auth/constants';
import {
  attachAuthenticatedUserIfPresent,
  requireAuthenticatedUser,
  requireCsrf
} from '../../auth/middleware';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: avatarMaxBytes },
  fileFilter: (_request, file, callback) => {
    if (avatarAllowedMimeTypes.includes(file.mimetype)) {
      callback(null, true);
      return;
    }

    callback(new Error('Unsupported avatar image type'));
  }
});

router.post('/api/auth/register', upload.fields([{ name: 'avatar', maxCount: 1 }]) as any, authAPI.register);
router.post('/api/auth/login', authAPI.login);
router.post('/api/auth/logout', requireAuthenticatedUser, requireCsrf, authAPI.logout);
router.get('/api/auth/me', requireAuthenticatedUser, authAPI.me);
router.get('/api/auth/me/avatar', requireAuthenticatedUser, authAPI.meAvatar);
router.get('/api/auth/csrf', requireAuthenticatedUser, authAPI.csrf);
router.post('/api/auth/refresh', requireAuthenticatedUser, requireCsrf, authAPI.refresh);
router.post('/api/auth/verify-email', authAPI.verifyEmail);
router.post('/api/auth/verify-email-code', authAPI.verifyEmailCode);
router.post('/api/auth/resend-verification', attachAuthenticatedUserIfPresent, authAPI.resendVerification);
router.post('/api/auth/forgot-password', authAPI.forgotPassword);
router.post('/api/auth/reset-password', authAPI.resetPassword);
router.get('/api/auth/google/start', authAPI.googleStart);
router.get('/api/auth/google/callback', authAPI.googleCallback);

export default router;
