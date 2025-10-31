import { Router } from 'express';
import {
    getClientes,
    getCliente,
    createCliente,
    updateCliente,
    deleteCliente,
} from '../controllers/clientes.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// Todas as rotas requerem autenticação
router.use(authMiddleware);

router.get('/', getClientes);
router.get('/:id', getCliente);
router.post('/', createCliente);
router.put('/:id', updateCliente);
router.delete('/:id', deleteCliente);

export default router;