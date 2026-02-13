import prisma from '../config/database';
import { env } from '../config/env';
import { gateway } from '../gateways/stripe.gateway';
import { NotificacaoService } from './notificacao.service';
import logger from '../config/logger';

export class CheckoutService {
    /**
     * Gera um link de pagamento Stripe para o cliente pagar uma parcela.
     * O dinheiro vai para a conta Connect do freelancer, menos a taxa da plataforma.
     */
    static async criarLinkPagamento(pagamentoId: string): Promise<{ paymentUrl: string }> {
        const pagamento = await prisma.pagamento.findUnique({
            where: { id: pagamentoId },
            include: {
                user: {
                    select: {
                        stripeAccountId: true,
                        stripeAccountStatus: true,
                        slug: true,
                    },
                },
                projeto: {
                    include: { cliente: true },
                },
            },
        });

        if (!pagamento) throw new Error('Pagamento não encontrado');
        if (pagamento.status === 'PAGO') throw new Error('Este pagamento já foi pago');
        if (!pagamento.user.stripeAccountId || pagamento.user.stripeAccountStatus !== 'active') {
            throw new Error('Conta Stripe Connect não está ativa. Configure em Configurações > Assinatura.');
        }

        const amountCents = Math.round(pagamento.value.toNumber() * 100);
        const feeCents = Math.round(amountCents * (env.PLATFORM_FEE_PERCENT / 100));

        const portalBase = pagamento.user.slug
            ? `${env.FRONTEND_URL}/portal/${pagamento.user.slug}`
            : env.FRONTEND_URL;

        const { url, sessionId } = await gateway.createPaymentCheckout({
            amount: amountCents,
            currency: 'brl',
            description: `${pagamento.description} - ${pagamento.projeto.title}`,
            customerEmail: pagamento.projeto.cliente.email,
            connectedAccountId: pagamento.user.stripeAccountId,
            applicationFeeAmount: feeCents,
            successUrl: `${portalBase}/pagamentos?status=success&id=${pagamentoId}`,
            cancelUrl: `${portalBase}/pagamentos?status=cancel`,
            paymentMethods: ['card', 'pix', 'boleto'],
            metadata: {
                pagamentoId,
                projetoId: pagamento.projetoId,
                userId: pagamento.userId,
            },
        });

        await prisma.pagamento.update({
            where: { id: pagamentoId },
            data: {
                stripeCheckoutSessionId: sessionId,
                paymentUrl: url,
            },
        });

        return { paymentUrl: url };
    }

    /**
     * Chamado pelo webhook quando o pagamento é confirmado.
     */
    static async handlePaymentSuccess(
        sessionId: string,
        paymentIntentId: string
    ): Promise<void> {
        const pagamento = await prisma.pagamento.findFirst({
            where: { stripeCheckoutSessionId: sessionId },
        });

        if (!pagamento) {
            logger.warn({ sessionId }, 'Pagamento não encontrado para checkout session');
            return;
        }

        if (pagamento.status === 'PAGO') return; // já processado

        await prisma.pagamento.update({
            where: { id: pagamento.id },
            data: {
                status: 'PAGO',
                paidAt: new Date(),
                method: 'Stripe',
                stripePaymentIntentId: paymentIntentId,
            },
        });

        // Notificar freelancer e cliente
        NotificacaoService.notificarPagamentoConfirmado(pagamento.id).catch(() => {});

        logger.info({ pagamentoId: pagamento.id, sessionId }, 'Pagamento confirmado via Stripe');
    }
}
