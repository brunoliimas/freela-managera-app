import { Router } from 'express';
import {
    createSolicitacao,
    findClienteByCnpj,
    createClientePublic,
    getSolicitacoes,
    getSolicitacao,
    updateSolicitacaoStatus,
} from '../controllers/solicitacoes.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// Rotas PÚBLICAS (sem autenticação)
router.post('/solicitar', createSolicitacao);
router.get('/cliente/buscar-cnpj/:cnpj', findClienteByCnpj);
router.post('/cliente/cadastrar', createClientePublic);

// Rotas PRIVADAS (com autenticação)
router.get('/', authMiddleware, getSolicitacoes);
router.get('/:id', authMiddleware, getSolicitacao);
router.patch('/:id/status', authMiddleware, updateSolicitacaoStatus);

export default router;