import { Router } from 'express';
import { clientAuthMiddleware } from '../middlewares/clientAuth.middleware';
import {
    requestLogin,
    verifyToken,
    logout,
    getProfile,
    getMeusProjetos,
    getMeuProjeto,
    getMeusOrcamentos,
    responderOrcamento,
    getMeusPagamentos,
    criarSolicitacao,
    checkoutPagamento,
} from '../controllers/portal.controller';

const router = Router();

// Rotas públicas (sem auth)
router.post('/request-login', requestLogin);
router.post('/verify-token', verifyToken);

// Rotas protegidas (client auth)
router.post('/logout', clientAuthMiddleware, logout);
router.get('/me', clientAuthMiddleware, getProfile);
router.get('/projetos', clientAuthMiddleware, getMeusProjetos);
router.get('/projetos/:id', clientAuthMiddleware, getMeuProjeto);
router.get('/orcamentos', clientAuthMiddleware, getMeusOrcamentos);
router.patch('/orcamentos/:id/responder', clientAuthMiddleware, responderOrcamento);
router.get('/pagamentos', clientAuthMiddleware, getMeusPagamentos);
router.get('/pagamentos/:id/checkout', clientAuthMiddleware, checkoutPagamento);
router.post('/solicitacoes', clientAuthMiddleware, criarSolicitacao);

export default router;
