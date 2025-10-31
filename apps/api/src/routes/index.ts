import { Router } from 'express';
import authRoutes from './auth.routes';
import clientesRoutes from './clientes.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/clientes', clientesRoutes);

// Health check
router.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'API is running!',
        timestamp: new Date().toISOString()
    });
});

export default router;