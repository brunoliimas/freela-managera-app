import { Router } from 'express';
import {
    getNotificacoes,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
} from '../controllers/notificacoes.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/', getNotificacoes);
router.get('/unread-count', getUnreadCount);
router.patch('/read-all', markAllAsRead);
router.patch('/:id/read', markAsRead);

export default router;
