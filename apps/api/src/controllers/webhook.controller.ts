import { Request, Response } from 'express';
import { gateway } from '../gateways/stripe.gateway';
import { nfseGateway } from '../gateways/enotas.gateway';
import { BillingService } from '../services/billing.service';
import { CheckoutService } from '../services/checkout.service';
import { NFSeService } from '../services/nfse.service';
import { NotificacaoService } from '../services/notificacao.service';
import prisma from '../config/database';
import logger from '../config/logger';

export const handleStripeWebhook = async (req: Request, res: Response) => {
    const signature = req.headers['stripe-signature'] as string;

    if (!signature) {
        return res.status(400).json({ error: 'Missing stripe-signature header' });
    }

    let event;
    try {
        event = gateway.constructWebhookEvent(req.body, signature) as any;
    } catch (err: any) {
        logger.error({ err }, 'Webhook signature verification failed');
        return res.status(400).json({ error: `Webhook Error: ${err.message}` });
    }

    try {
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object;

                if (session.mode === 'subscription') {
                    // Assinatura criada via checkout
                    const subscriptionId = session.subscription as string;
                    const customerId = session.customer as string;

                    // Buscar subscription para pegar priceId
                    const user = await prisma.user.findUnique({
                        where: { stripeCustomerId: customerId },
                    });
                    if (user) {
                        // subscription.updated vai pegar os detalhes
                        logger.info({ customerId, subscriptionId }, 'Subscription checkout completed');
                    }
                } else if (session.mode === 'payment') {
                    // Pagamento avulso (cliente pagando freelancer)
                    const paymentIntentId = session.payment_intent as string;
                    await CheckoutService.handlePaymentSuccess(session.id, paymentIntentId);
                }
                break;
            }

            case 'customer.subscription.created':
            case 'customer.subscription.updated': {
                const subscription = event.data.object as any;
                const customerId = typeof subscription.customer === 'string'
                    ? subscription.customer
                    : subscription.customer?.id;
                const status = subscription.status as string;
                const periodEnd = subscription.current_period_end;
                const currentPeriodEnd = periodEnd
                    ? new Date(typeof periodEnd === 'number' ? periodEnd * 1000 : periodEnd)
                    : new Date();
                const priceId = subscription.items?.data?.[0]?.price?.id
                    || subscription.items?.data?.[0]?.plan?.id
                    || '';

                logger.info({
                    customerId,
                    status,
                    priceId,
                    subscriptionId: subscription.id,
                }, 'Processing subscription webhook');

                await BillingService.handleSubscriptionUpdate(
                    customerId,
                    subscription.id,
                    status,
                    currentPeriodEnd,
                    priceId
                );
                break;
            }

            case 'customer.subscription.deleted': {
                const subscription = event.data.object;
                const customerId = subscription.customer as string;
                await BillingService.handleSubscriptionDeleted(customerId);
                break;
            }

            case 'account.updated': {
                const account = event.data.object;
                const newStatus = account.charges_enabled ? 'active' : 'pending';

                await prisma.user.updateMany({
                    where: { stripeAccountId: account.id },
                    data: { stripeAccountStatus: newStatus },
                });

                logger.info({ accountId: account.id, status: newStatus }, 'Connect account updated');
                break;
            }

            default:
                logger.info({ type: event.type }, 'Unhandled webhook event');
        }

        return res.json({ received: true });
    } catch (error) {
        logger.error({ err: error, type: event.type }, 'Webhook handler error');
        return res.status(500).json({ error: 'Webhook handler error' });
    }
};

export const handleENotasWebhook = async (req: Request, res: Response) => {
    try {
        const event = nfseGateway.verifyWebhookPayload(req.body);

        logger.info({ type: event.type, nfeId: event.nfeId }, 'eNotas webhook received');

        const result = await NFSeService.handleWebhookUpdate(event);

        // Disparar notificações
        if (result) {
            if (event.type === 'AUTORIZADA') {
                NotificacaoService.notificarNFSeAutorizada(result.notaFiscalId).catch(() => {});
            } else if (event.type === 'REJEITADA') {
                NotificacaoService.notificarNFSeRejeitada(result.notaFiscalId).catch(() => {});
            }
        }

        return res.json({ received: true });
    } catch (error) {
        logger.error({ err: error }, 'eNotas webhook error');
        return res.status(400).json({ error: error instanceof Error ? error.message : 'Webhook error' });
    }
};
