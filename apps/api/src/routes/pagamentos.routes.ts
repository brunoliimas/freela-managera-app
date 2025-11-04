import { Router } from 'express';
import {
    getPagamentos,
    getPagamento,
    createPagamento,
    createParcelas,
    updatePagamento,
    marcarComoPago,
    deletePagamento,
    getResumoFinanceiro,
} from '../controllers/pagamentos.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/', getPagamentos);
router.get('/resumo', getResumoFinanceiro);
router.get('/:id', getPagamento);
router.post('/', createPagamento);
router.post('/parcelas', createParcelas);
router.put('/:id', updatePagamento);
router.post('/:id/marcar-pago', marcarComoPago);
router.delete('/:id', deletePagamento);

export default router;