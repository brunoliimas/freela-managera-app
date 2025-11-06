import { Router } from 'express';
import {
    uploadArquivo,
    getArquivos,
    getArquivo,
    downloadArquivo,
    deleteArquivo,
} from '../controllers/arquivos.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { upload } from '../config/upload';

const router = Router();

router.use(authMiddleware);

router.get('/', getArquivos);
router.get('/:id', getArquivo);
router.get('/:id/download', downloadArquivo);
router.post('/', upload.single('file'), uploadArquivo);
router.delete('/:id', deleteArquivo);

export default router;