import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requirePlan } from '../middlewares/plan.middleware';
import { validate } from '../middlewares/validate.middleware';
import { createTemplateSchema, updateTemplateSchema } from '../validations/templates.validations';
import {
    getTemplates,
    getTemplate,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    duplicateTemplate,
} from '../controllers/templates.controller';

const router = Router();

router.use(authMiddleware);
router.use(requirePlan('PRO'));

router.get('/', getTemplates);
router.get('/:id', getTemplate);
router.post('/', validate(createTemplateSchema), createTemplate);
router.put('/:id', validate(updateTemplateSchema), updateTemplate);
router.delete('/:id', deleteTemplate);
router.post('/:id/duplicate', duplicateTemplate);

export default router;
