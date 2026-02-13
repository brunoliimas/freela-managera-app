import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { BillingService } from '../services/billing.service';
import logger from '../config/logger';

export const createCheckout = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId!;
        const { plan } = req.body;

        if (!plan || !['PRO', 'ENTERPRISE'].includes(plan)) {
            return res.status(400).json({ error: 'Plano inválido. Escolha PRO ou ENTERPRISE.' });
        }

        const url = await BillingService.createCheckoutSession(userId, plan);
        return res.json({ url });
    } catch (error) {
        logger.error({ err: error }, 'Billing checkout error');
        return res.status(500).json({ error: 'Erro ao criar sessão de checkout' });
    }
};

export const createPortal = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId!;
        const url = await BillingService.createBillingPortal(userId);
        return res.json({ url });
    } catch (error) {
        logger.error({ err: error }, 'Billing portal error');
        return res.status(500).json({ error: 'Erro ao abrir portal de billing' });
    }
};

export const connectAccount = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId!;
        const url = await BillingService.connectAccount(userId);
        return res.json({ url });
    } catch (error) {
        logger.error({ err: error }, 'Connect account error');
        return res.status(500).json({ error: 'Erro ao iniciar onboarding Stripe Connect' });
    }
};

export const getConnectStatus = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId!;
        const status = await BillingService.getConnectStatus(userId);
        return res.json(status);
    } catch (error) {
        logger.error({ err: error }, 'Connect status error');
        return res.status(500).json({ error: 'Erro ao verificar status do Stripe Connect' });
    }
};
