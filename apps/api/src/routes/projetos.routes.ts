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
import { validate } from '../middlewares/validate.middleware';
import { createProjetoSchema, createProjetoFromOrcamentoSchema, createMilestoneSchema } from '../validations/projetos.validations';

const router = Router();

router.use(authMiddleware);

router.get('/', getProjetos);
router.get('/:id', getProjeto);
router.post('/', validate(createProjetoSchema), createProjeto);
router.post('/from-orcamento', validate(createProjetoFromOrcamentoSchema), createProjetoFromOrcamento);
router.put('/:id', updateProjeto);
router.delete('/:id', deleteProjeto);

router.get('/:projetoId/milestones', getMilestones);
router.post('/:projetoId/milestones', validate(createMilestoneSchema), createMilestone);
router.put('/:projetoId/milestones/:id', updateMilestone);
router.delete('/:projetoId/milestones/:id', deleteMilestone);

export default router;