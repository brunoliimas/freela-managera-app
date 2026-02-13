import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requirePlan } from '../middlewares/plan.middleware';
import {
    createCheckout,
    createPortal,
    connectAccount,
    getConnectStatus,
} from '../controllers/billing.controller';

const router = Router();

router.use(authMiddleware);

// Assinatura
router.post('/checkout', createCheckout);
router.post('/portal', createPortal);

// Stripe Connect (precisa PRO+)
router.post('/connect', requirePlan('PRO'), connectAccount);
router.get('/connect/status', requirePlan('PRO'), getConnectStatus);

export default router;
