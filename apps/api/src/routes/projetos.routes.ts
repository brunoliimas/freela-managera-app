import { Router } from 'express';
import {
    getProjetos,
    getProjeto,
    createProjeto,
    createProjetoFromOrcamento,
    updateProjeto,
    deleteProjeto,
} from '../controllers/projetos.controller';
import {
    getMilestones,
    createMilestone,
    updateMilestone,
    deleteMilestone,
} from '../controllers/milestones.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/', getProjetos);
router.get('/:id', getProjeto);
router.post('/', createProjeto);
router.post('/from-orcamento', createProjetoFromOrcamento);
router.put('/:id', updateProjeto);
router.delete('/:id', deleteProjeto);

router.get('/:projetoId/milestones', getMilestones);
router.post('/:projetoId/milestones', createMilestone);
router.put('/:projetoId/milestones/:id', updateMilestone);
router.delete('/:projetoId/milestones/:id', deleteMilestone);

export default router;