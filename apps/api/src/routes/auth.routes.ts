import { Router } from 'express';
import { register, login, logout, forgotPassword, resetPassword, getProfile, updateProfile, changePassword, uploadAvatar } from '../controllers/auth.controller';
import { setup2FA, enable2FA, verify2FA, verifyRecoveryCode, disable2FA } from '../controllers/two-factor.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { authRateLimit } from '../middlewares/rate-limit.middleware';
import { validate } from '../middlewares/validate.middleware';
import { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema, changePasswordSchema, updateProfileSchema } from '../validations/auth.validations';
import { enable2FASchema, verify2FASchema, verifyRecoverySchema, disable2FASchema } from '../validations/two-factor.validations';
import { upload } from '../config/upload';

const router = Router();

// Rotas públicas (com rate limiting + validação)
router.post('/register', authRateLimit, validate(registerSchema), register);
router.post('/login', authRateLimit, validate(loginSchema), login);
router.post('/logout', logout);
router.post('/forgot-password', authRateLimit, validate(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', authRateLimit, validate(resetPasswordSchema), resetPassword);

// Rotas protegidas
router.get('/profile', authMiddleware, getProfile);
router.put('/profile', authMiddleware, validate(updateProfileSchema), updateProfile);
router.put('/change-password', authMiddleware, validate(changePasswordSchema), changePassword);
router.post('/avatar', authMiddleware, upload.single('avatar'), uploadAvatar);

// 2FA routes - públicas (usam tempToken)
router.post('/2fa/verify', authRateLimit, validate(verify2FASchema), verify2FA);
router.post('/2fa/verify-recovery', authRateLimit, validate(verifyRecoverySchema), verifyRecoveryCode);

// 2FA routes - protegidas
router.post('/2fa/setup', authMiddleware, setup2FA);
router.post('/2fa/enable', authMiddleware, validate(enable2FASchema), enable2FA);
router.post('/2fa/disable', authMiddleware, validate(disable2FASchema), disable2FA);

export default router;