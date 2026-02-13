/**
 * Payment Gateway Interface
 *
 * Camada de abstração para permitir trocar de provider (Stripe, AbacatePay, etc.)
 * sem modificar os services e controllers.
 */

export interface CreatePaymentCheckoutParams {
    amount: number; // centavos
    currency: string;
    description: string;
    customerEmail: string;
    connectedAccountId: string;
    applicationFeeAmount: number; // taxa plataforma em centavos
    successUrl: string;
    cancelUrl: string;
    paymentMethods: string[]; // ['card', 'pix', 'boleto']
    metadata: Record<string, string>;
}

export interface PaymentGateway {
    // ─── Customers (SaaS billing) ───
    createCustomer(email: string, name: string): Promise<string>; // retorna customerId

    // ─── Subscriptions ───
    createSubscriptionCheckout(
        customerId: string,
        priceId: string,
        successUrl: string,
        cancelUrl: string
    ): Promise<{ url: string }>;

    createBillingPortalSession(
        customerId: string,
        returnUrl: string
    ): Promise<{ url: string }>;

    // ─── Connect (marketplace) ───
    createConnectedAccount(email: string): Promise<{ accountId: string }>;

    createAccountLink(
        accountId: string,
        refreshUrl: string,
        returnUrl: string
    ): Promise<{ url: string }>;

    getAccountStatus(
        accountId: string
    ): Promise<{ chargesEnabled: boolean; payoutsEnabled: boolean; detailsSubmitted: boolean }>;

    // ─── Client payments ───
    createPaymentCheckout(
        params: CreatePaymentCheckoutParams
    ): Promise<{ url: string; sessionId: string }>;

    // ─── Webhooks ───
    constructWebhookEvent(payload: Buffer, signature: string): unknown;
}
