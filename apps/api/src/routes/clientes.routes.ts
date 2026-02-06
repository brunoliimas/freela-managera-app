import { Router } from 'express';
import {
    getClientes,
    getCliente,
    createCliente,
    updateCliente,
    deleteCliente,
    uploadClienteAvatar,
} from '../controllers/clientes.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { createClienteSchema } from '../validations/clientes.validations';
import { upload } from '../config/upload';

const router = Router();

// Todas as rotas requerem autenticação
router.use(authMiddleware);

router.get('/', getClientes);
router.get('/:id', getCliente);
router.post('/', validate(createClienteSchema), createCliente);
router.put('/:id', updateCliente);
router.delete('/:id', deleteCliente);
router.post('/:id/avatar', upload.single('avatar'), uploadClienteAvatar);

export default router;