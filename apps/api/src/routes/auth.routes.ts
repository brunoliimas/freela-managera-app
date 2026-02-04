import { Router } from 'express';
import { register, login, logout, forgotPassword, resetPassword, getProfile, updateProfile } from '../controllers/auth.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { authRateLimit } from '../middlewares/rate-limit.middleware';

const router = Router();

// Rotas públicas (com rate limiting)
router.post('/register', authRateLimit, register);
router.post('/login', authRateLimit, login);
router.post('/logout', logout);
router.post('/forgot-password', authRateLimit, forgotPassword);
router.post('/reset-password', authRateLimit, resetPassword);

// Rotas protegidas
router.get('/profile', authMiddleware, getProfile);
router.put('/profile', authMiddleware, updateProfile);

export default router;