import Stripe from 'stripe';
import { env } from '../config/env';
import type { PaymentGateway, CreatePaymentCheckoutParams } from '../interfaces/payment-gateway.interface';

let _stripe: Stripe | null = null;

function getStripe(): Stripe {
    if (!_stripe) {
        _stripe = new Stripe(env.STRIPE_SECRET_KEY!, {
            apiVersion: '2026-01-28.clover',
        });
    }
    return _stripe;
}

export class StripeGateway implements PaymentGateway {
    // ─── Customers ───

    async createCustomer(email: string, name: string): Promise<string> {
        const customer = await getStripe().customers.create({ email, name });
        return customer.id;
    }

    // ─── Subscriptions ───

    async createSubscriptionCheckout(
        customerId: string,
        priceId: string,
        successUrl: string,
        cancelUrl: string
    ): Promise<{ url: string }> {
        const session = await getStripe().checkout.sessions.create({
            customer: customerId,
            mode: 'subscription',
            payment_method_types: ['card'],
            line_items: [{ price: priceId, quantity: 1 }],
            success_url: successUrl,
            cancel_url: cancelUrl,
        });

        return { url: session.url! };
    }

    async createBillingPortalSession(
        customerId: string,
        returnUrl: string
    ): Promise<{ url: string }> {
        const session = await getStripe().billingPortal.sessions.create({
            customer: customerId,
            return_url: returnUrl,
        });

        return { url: session.url };
    }

    // ─── Connect (marketplace) ───

    async createConnectedAccount(email: string): Promise<{ accountId: string }> {
        const account = await getStripe().accounts.create({
            type: 'express',
            country: 'BR',
            email,
            capabilities: {
                card_payments: { requested: true },
                transfers: { requested: true },
            },
        });

        return { accountId: account.id };
    }

    async createAccountLink(
        accountId: string,
        refreshUrl: string,
        returnUrl: string
    ): Promise<{ url: string }> {
        const link = await getStripe().accountLinks.create({
            account: accountId,
            refresh_url: refreshUrl,
            return_url: returnUrl,
            type: 'account_onboarding',
        });

        return { url: link.url };
    }

    async getAccountStatus(
        accountId: string
    ): Promise<{ chargesEnabled: boolean; payoutsEnabled: boolean; detailsSubmitted: boolean }> {
        const account = await getStripe().accounts.retrieve(accountId);

        return {
            chargesEnabled: account.charges_enabled ?? false,
            payoutsEnabled: account.payouts_enabled ?? false,
            detailsSubmitted: account.details_submitted ?? false,
        };
    }

    // ─── Client payments ───

    async createPaymentCheckout(
        params: CreatePaymentCheckoutParams
    ): Promise<{ url: string; sessionId: string }> {
        const session = await getStripe().checkout.sessions.create({
            mode: 'payment',
            payment_method_types: params.paymentMethods as Stripe.Checkout.SessionCreateParams.PaymentMethodType[],
            line_items: [
                {
                    price_data: {
                        currency: params.currency,
                        product_data: { name: params.description },
                        unit_amount: params.amount,
                    },
                    quantity: 1,
                },
            ],
            customer_email: params.customerEmail,
            payment_intent_data: {
                application_fee_amount: params.applicationFeeAmount,
                transfer_data: { destination: params.connectedAccountId },
            },
            success_url: params.successUrl,
            cancel_url: params.cancelUrl,
            metadata: params.metadata,
        });

        return { url: session.url!, sessionId: session.id };
    }

    // ─── Webhooks ───

    constructWebhookEvent(payload: Buffer, signature: string): Stripe.Event {
        return getStripe().webhooks.constructEvent(
            payload,
            signature,
            env.STRIPE_WEBHOOK_SECRET || ''
        );
    }
}

export const gateway = new StripeGateway();
