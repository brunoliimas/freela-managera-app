import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import { getEventos } from '../controllers/calendario.controller';

const router = Router();

router.get('/eventos', authMiddleware, getEventos);

export default router;
