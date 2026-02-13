import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import {
    getDespesas,
    getDespesa,
    createDespesa,
    updateDespesa,
    deleteDespesa,
    getResumoDespesas,
} from '../controllers/despesas.controller';

const router = Router();

router.use(authMiddleware);

router.get('/', getDespesas);
router.get('/resumo', getResumoDespesas);
router.get('/:id', getDespesa);
router.post('/', createDespesa);
router.put('/:id', updateDespesa);
router.delete('/:id', deleteDespesa);

export default router;
