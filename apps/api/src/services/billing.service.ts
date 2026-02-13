import prisma from '../config/database';
import { env } from '../config/env';
import { gateway } from '../gateways/stripe.gateway';
import logger from '../config/logger';
import type { Plan } from '@prisma/client';

const PRICE_MAP: Record<string, string | undefined> = {
    PRO: env.STRIPE_PRO_PRICE_ID,
    ENTERPRISE: env.STRIPE_ENTERPRISE_PRICE_ID,
};

export class BillingService {
    /**
     * Busca ou cria um Stripe Customer para o usuário.
     */
    static async ensureCustomer(userId: string): Promise<string> {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { stripeCustomerId: true, email: true, name: true },
        });

        if (!user) throw new Error('Usuário não encontrado');

        if (user.stripeCustomerId) {
            return user.stripeCustomerId;
        }

        const customerId = await gateway.createCustomer(user.email, user.name);

        await prisma.user.update({
            where: { id: userId },
            data: { stripeCustomerId: customerId },
        });

        return customerId;
    }

    /**
     * Cria uma sessão de checkout para assinatura PRO ou ENTERPRISE.
     */
    static async createCheckoutSession(userId: string, plan: 'PRO' | 'ENTERPRISE'): Promise<string> {
        const priceId = PRICE_MAP[plan];
        if (!priceId) {
            throw new Error(`Price ID não configurado para o plano ${plan}`);
        }

        const customerId = await this.ensureCustomer(userId);

        const { url } = await gateway.createSubscriptionCheckout(
            customerId,
            priceId,
            `${env.FRONTEND_URL}/configuracoes?tab=assinatura&status=success`,
            `${env.FRONTEND_URL}/configuracoes?tab=assinatura&status=cancel`
        );

        return url;
    }

    /**
     * Cria uma sessão do Billing Portal para gerenciar assinatura.
     */
    static async createBillingPortal(userId: string): Promise<string> {
        const customerId = await this.ensureCustomer(userId);

        const { url } = await gateway.createBillingPortalSession(
            customerId,
            `${env.FRONTEND_URL}/configuracoes?tab=assinatura`
        );

        return url;
    }

    /**
     * Atualiza o plano do usuário baseado no evento de subscription do Stripe.
     */
    static async handleSubscriptionUpdate(
        stripeCustomerId: string,
        subscriptionId: string,
        status: string,
        currentPeriodEnd: Date,
        priceId: string
    ): Promise<void> {
        let plan: Plan = 'FREE';
        if (priceId === env.STRIPE_PRO_PRICE_ID) plan = 'PRO';
        else if (priceId === env.STRIPE_ENTERPRISE_PRICE_ID) plan = 'ENTERPRISE';

        const data: Record<string, unknown> = {
            stripeSubscriptionId: subscriptionId,
            subscriptionStatus: status,
            currentPeriodEnd,
        };

        // Só atualiza o plan se a subscription estiver ativa
        if (status === 'active' || status === 'trialing') {
            data.plan = plan;
        }

        await prisma.user.update({
            where: { stripeCustomerId },
            data,
        });

        logger.info({ stripeCustomerId, plan, status }, 'Subscription atualizada');
    }

    /**
     * Reverte o usuário para FREE quando subscription é cancelada.
     */
    static async handleSubscriptionDeleted(stripeCustomerId: string): Promise<void> {
        await prisma.user.update({
            where: { stripeCustomerId },
            data: {
                plan: 'FREE',
                subscriptionStatus: 'canceled',
                stripeSubscriptionId: null,
            },
        });

        logger.info({ stripeCustomerId }, 'Subscription cancelada, revertido para FREE');
    }

    /**
     * Inicia o onboarding de Stripe Connect (Express) para o freelancer receber pagamentos.
     */
    static async connectAccount(userId: string): Promise<string> {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { stripeAccountId: true, email: true },
        });

        if (!user) throw new Error('Usuário não encontrado');

        let accountId = user.stripeAccountId;

        if (!accountId) {
            const result = await gateway.createConnectedAccount(user.email);
            accountId = result.accountId;

            await prisma.user.update({
                where: { id: userId },
                data: {
                    stripeAccountId: accountId,
                    stripeAccountStatus: 'pending',
                },
            });
        }

        const { url } = await gateway.createAccountLink(
            accountId,
            `${env.FRONTEND_URL}/configuracoes?tab=assinatura&connect=refresh`,
            `${env.FRONTEND_URL}/configuracoes?tab=assinatura&connect=success`
        );

        return url;
    }

    /**
     * Verifica o status da conta Connect do freelancer.
     */
    static async getConnectStatus(userId: string) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { stripeAccountId: true, stripeAccountStatus: true },
        });

        if (!user?.stripeAccountId) {
            return { connected: false, chargesEnabled: false, payoutsEnabled: false, detailsSubmitted: false };
        }

        const status = await gateway.getAccountStatus(user.stripeAccountId);

        // Atualizar status no banco se mudou
        const newStatus = status.chargesEnabled ? 'active' : 'pending';
        if (newStatus !== user.stripeAccountStatus) {
            await prisma.user.update({
                where: { id: userId },
                data: { stripeAccountStatus: newStatus },
            });
        }

        return { connected: true, ...status };
    }
}
