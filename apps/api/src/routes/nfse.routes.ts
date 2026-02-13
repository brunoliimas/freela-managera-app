import { Router } from 'express';
import {
    getFiscalConfig,
    saveFiscalConfig,
    registerCompany,
    getNotasFiscais,
    getNotaFiscal,
    emitirNFSe,
    cancelarNFSe,
    downloadNFSePDF,
    downloadNFSeXML,
} from '../controllers/nfse.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requirePlan } from '../middlewares/plan.middleware';
import { validate } from '../middlewares/validate.middleware';
import {
    saveFiscalConfigSchema,
    registerCompanySchema,
    emitirNFSeSchema,
    cancelarNFSeSchema,
} from '../validations/nfse.validations';

const router = Router();

router.use(authMiddleware);
router.use(requirePlan('PRO'));

// Config fiscal
router.get('/config', getFiscalConfig);
router.put('/config', validate(saveFiscalConfigSchema), saveFiscalConfig);
router.post('/config/registrar-empresa', validate(registerCompanySchema), registerCompany);

// Notas fiscais
router.get('/', getNotasFiscais);
router.get('/:id', getNotaFiscal);
router.post('/', validate(emitirNFSeSchema), emitirNFSe);
router.post('/:id/cancelar', validate(cancelarNFSeSchema), cancelarNFSe);
router.get('/:id/pdf', downloadNFSePDF);
router.get('/:id/xml', downloadNFSeXML);

export default router;
