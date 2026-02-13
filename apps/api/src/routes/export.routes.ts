import { Router } from 'express';
import {
    exportPagamentos,
    exportProjetos,
    exportClientes,
    exportRelatorioFinanceiro,
    exportNotasFiscais,
    exportTimeEntries,
    exportDespesas,
} from '../controllers/export.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requirePlan } from '../middlewares/plan.middleware';

const router = Router();

router.use(authMiddleware);

// Exportações FREE
router.get('/pagamentos', exportPagamentos);
router.get('/projetos', exportProjetos);
router.get('/clientes', exportClientes);
router.get('/time-entries', exportTimeEntries);
router.get('/despesas', exportDespesas);

// Exportações PRO+
router.get('/relatorio-financeiro', requirePlan('PRO'), exportRelatorioFinanceiro);
router.get('/notas-fiscais', requirePlan('PRO'), exportNotasFiscais);

export default router;
