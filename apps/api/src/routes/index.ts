import { Router } from 'express';
import authRoutes from './auth.routes';
import clientesRoutes from './clientes.routes';
import dashboardRoutes from './dashboard.routes';
import solicitacoesRoutes from './solicitacoes.routes';
import orcamentosRoutes from './orcamentos.routes';
import projetosRoutes from './projetos.routes';
import pagamentosRoutes from './pagamentos.routes';


const router = Router();

router.use('/auth', authRoutes);
router.use('/clientes', clientesRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/solicitacoes', solicitacoesRoutes);
router.use('/orcamentos', orcamentosRoutes);
router.use('/projetos', projetosRoutes);
router.use('/pagamentos', pagamentosRoutes);



// Health check
router.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'API is running!',
        timestamp: new Date().toISOString()
    });
});

export default router;