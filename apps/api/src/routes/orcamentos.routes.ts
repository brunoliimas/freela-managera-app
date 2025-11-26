import { Router } from 'express';
import {
    getOrcamentos,
    getOrcamento,
    createOrcamento,
    updateOrcamento,
    gerarPDFOrcamento,
    deleteOrcamento,
    enviarOrcamentoPorEmail
} from '../controllers/orcamentos.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/', getOrcamentos);
router.get('/:id/pdf', gerarPDFOrcamento);
router.get('/:id', getOrcamento);
router.post('/', createOrcamento);
router.put('/:id', updateOrcamento);
router.delete('/:id', deleteOrcamento);
router.post('/:id/enviar-email', enviarOrcamentoPorEmail);

export default router;