import { Router } from 'express';
import {
    getRelatorioFinanceiro,
    getComparacaoAnual,
} from '../controllers/relatorios.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/financeiro', getRelatorioFinanceiro);
router.get('/comparacao-anual', getComparacaoAnual);

export default router;