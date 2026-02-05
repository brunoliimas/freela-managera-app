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
import { validate } from '../middlewares/validate.middleware';
import { createPagamentoSchema, createParcelasSchema } from '../validations/pagamentos.validations';

const router = Router();

router.use(authMiddleware);

router.get('/', getPagamentos);
router.get('/resumo', getResumoFinanceiro);
router.get('/:id', getPagamento);
router.post('/', validate(createPagamentoSchema), createPagamento);
router.post('/parcelas', validate(createParcelasSchema), createParcelas);
router.put('/:id', updatePagamento);
router.post('/:id/marcar-pago', marcarComoPago);
router.delete('/:id', deletePagamento);

export default router;