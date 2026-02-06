import { Router } from 'express';
import {
    createSolicitacao,
    getFreelancerBySlug,
    findClienteByCnpj,
    createClientePublic,
    getSolicitacoes,
    getSolicitacao,
    updateSolicitacaoStatus,
} from '../controllers/solicitacoes.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { createSolicitacaoSchema, createClientePublicSchema } from '../validations/solicitacoes.validations';

const router = Router();

// Rotas PÚBLICAS (sem autenticação)
router.get('/freelancer/:slug', getFreelancerBySlug);
router.post('/solicitar', validate(createSolicitacaoSchema), createSolicitacao);
router.get('/cliente/buscar-cnpj/:cnpj', findClienteByCnpj);
router.post('/cliente/cadastrar', validate(createClientePublicSchema), createClientePublic);

// Rotas PRIVADAS (com autenticação)
router.get('/', authMiddleware, getSolicitacoes);
router.get('/:id', authMiddleware, getSolicitacao);
router.patch('/:id/status', authMiddleware, updateSolicitacaoStatus);

export default router;