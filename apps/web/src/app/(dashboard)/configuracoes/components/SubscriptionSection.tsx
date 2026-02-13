'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Crown, CreditCard, ExternalLink, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';

interface SubscriptionSectionProps {
    profile: {
        plan: string;
        subscriptionStatus?: string | null;
        currentPeriodEnd?: string | null;
        stripeAccountStatus?: string | null;
    };
}

const PLAN_LABELS: Record<string, { label: string; color: string }> = {
    FREE: { label: 'Free', color: 'bg-slate-100 text-slate-700' },
    PRO: { label: 'Pro', color: 'bg-blue-100 text-blue-700' },
    ENTERPRISE: { label: 'Enterprise', color: 'bg-amber-100 text-amber-700' },
};

export function SubscriptionSection({ profile }: SubscriptionSectionProps) {
    const [loadingCheckout, setLoadingCheckout] = useState<string | null>(null);
    const [loadingPortal, setLoadingPortal] = useState(false);
    const [loadingConnect, setLoadingConnect] = useState(false);
    const [connectStatus, setConnectStatus] = useState<{
        connected: boolean;
        chargesEnabled: boolean;
        payoutsEnabled: boolean;
        detailsSubmitted: boolean;
    } | null>(null);

    const plan = PLAN_LABELS[profile.plan] || PLAN_LABELS.FREE;
    const isPaid = profile.plan !== 'FREE';

    useEffect(() => {
        if (isPaid) {
            fetchConnectStatus();
        }
    }, [isPaid]);

    const fetchConnectStatus = async () => {
        try {
            const { data } = await api.get('/billing/connect/status');
            setConnectStatus(data);
        } catch {
            // Silently fail - user may not have connect setup
        }
    };

    const handleUpgrade = async (targetPlan: 'PRO' | 'ENTERPRISE') => {
        setLoadingCheckout(targetPlan);
        try {
            const { data } = await api.post('/billing/checkout', { plan: targetPlan });
            window.location.assign(data.url);
        } catch {
            toast.error('Erro ao criar sessão de checkout');
        } finally {
            setLoadingCheckout(null);
        }
    };

    const handlePortal = async () => {
        setLoadingPortal(true);
        try {
            const { data } = await api.post('/billing/portal');
            window.location.assign(data.url);
        } catch {
            toast.error('Erro ao abrir portal de billing');
        } finally {
            setLoadingPortal(false);
        }
    };

    const handleConnect = async () => {
        setLoadingConnect(true);
        try {
            const { data } = await api.post('/billing/connect');
            window.location.assign(data.url);
        } catch {
            toast.error('Erro ao iniciar configuração do Stripe Connect');
        } finally {
            setLoadingConnect(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Plano Atual */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Crown className="h-5 w-5" />
                        Plano Atual
                    </CardTitle>
                    <CardDescription>
                        Gerencie sua assinatura e plano
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-lg border">
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-lg font-semibold">{plan.label}</span>
                                <Badge className={plan.color}>{profile.plan}</Badge>
                            </div>
                            {profile.subscriptionStatus && (
                                <p className="text-sm text-muted-foreground mt-1">
                                    Status: {profile.subscriptionStatus === 'active' ? 'Ativa' : profile.subscriptionStatus}
                                    {profile.currentPeriodEnd && (
                                        <> — Renova em {new Date(profile.currentPeriodEnd).toLocaleDateString('pt-BR')}</>
                                    )}
                                </p>
                            )}
                        </div>
                        {isPaid && (
                            <Button variant="outline" size="sm" onClick={handlePortal} disabled={loadingPortal}>
                                {loadingPortal ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <>
                                        Gerenciar Assinatura
                                        <ExternalLink className="h-3 w-3 ml-1" />
                                    </>
                                )}
                            </Button>
                        )}
                    </div>

                    {/* Upgrade Options */}
                    {profile.plan === 'FREE' && (
                        <div className="grid gap-4 sm:grid-cols-2">
                            <Card className="border-blue-200">
                                <CardContent className="pt-4">
                                    <h3 className="font-semibold text-blue-700">Pro — R$49/mês</h3>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Clientes e projetos ilimitados, pagamento online, relatórios
                                    </p>
                                    <Button
                                        className="w-full mt-4"
                                        onClick={() => handleUpgrade('PRO')}
                                        disabled={loadingCheckout !== null}
                                    >
                                        {loadingCheckout === 'PRO' ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            'Assinar Pro'
                                        )}
                                    </Button>
                                </CardContent>
                            </Card>
                            <Card className="border-amber-200">
                                <CardContent className="pt-4">
                                    <h3 className="font-semibold text-amber-700">Enterprise — R$99/mês</h3>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Tudo do Pro + suporte prioritário e funcionalidades antecipadas
                                    </p>
                                    <Button
                                        className="w-full mt-4"
                                        variant="outline"
                                        onClick={() => handleUpgrade('ENTERPRISE')}
                                        disabled={loadingCheckout !== null}
                                    >
                                        {loadingCheckout === 'ENTERPRISE' ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            'Assinar Enterprise'
                                        )}
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {profile.plan === 'PRO' && (
                        <Card className="border-amber-200">
                            <CardContent className="pt-4 flex items-center justify-between">
                                <div>
                                    <h3 className="font-semibold text-amber-700">Enterprise — R$99/mês</h3>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Suporte prioritário e funcionalidades antecipadas
                                    </p>
                                </div>
                                <Button
                                    variant="outline"
                                    onClick={() => handleUpgrade('ENTERPRISE')}
                                    disabled={loadingCheckout !== null}
                                >
                                    {loadingCheckout === 'ENTERPRISE' ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        'Fazer Upgrade'
                                    )}
                                </Button>
                            </CardContent>
                        </Card>
                    )}
                </CardContent>
            </Card>

            {/* Stripe Connect (só para PRO+) */}
            {isPaid && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CreditCard className="h-5 w-5" />
                            Receber Pagamentos
                        </CardTitle>
                        <CardDescription>
                            Configure o Stripe Connect para receber pagamentos dos seus clientes via PIX, cartão e boleto
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {connectStatus?.chargesEnabled ? (
                            <div className="flex items-center justify-between p-4 rounded-lg border border-green-200 bg-green-50">
                                <div className="flex items-center gap-3">
                                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                                    <div>
                                        <p className="font-medium text-green-800">Stripe Connect ativo</p>
                                        <p className="text-sm text-green-600">
                                            Pronto para receber pagamentos dos clientes
                                        </p>
                                    </div>
                                </div>
                                <Button variant="outline" size="sm" onClick={handleConnect} disabled={loadingConnect}>
                                    Gerenciar
                                </Button>
                            </div>
                        ) : connectStatus?.connected && !connectStatus?.detailsSubmitted ? (
                            <div className="flex items-center justify-between p-4 rounded-lg border border-amber-200 bg-amber-50">
                                <div className="flex items-center gap-3">
                                    <AlertCircle className="h-5 w-5 text-amber-600" />
                                    <div>
                                        <p className="font-medium text-amber-800">Onboarding incompleto</p>
                                        <p className="text-sm text-amber-600">
                                            Complete a configuração para começar a receber
                                        </p>
                                    </div>
                                </div>
                                <Button onClick={handleConnect} disabled={loadingConnect}>
                                    {loadingConnect ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        'Completar Configuração'
                                    )}
                                </Button>
                            </div>
                        ) : (
                            <div className="flex items-center justify-between p-4 rounded-lg border">
                                <div>
                                    <p className="font-medium">Conecte sua conta Stripe</p>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Seus clientes poderão pagar via PIX, cartão de crédito e boleto.
                                        A taxa da plataforma é de 3% por transação.
                                    </p>
                                </div>
                                <Button onClick={handleConnect} disabled={loadingConnect}>
                                    {loadingConnect ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        'Conectar Stripe'
                                    )}
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {!isPaid && (
                <Card className="border-dashed">
                    <CardContent className="pt-6 text-center">
                        <CreditCard className="h-10 w-10 text-muted-foreground mx-auto" />
                        <h3 className="font-semibold mt-3">Receber pagamentos online</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                            Faça upgrade para o plano Pro para receber pagamentos via PIX, cartão e boleto
                        </p>
                        <Button className="mt-4" onClick={() => handleUpgrade('PRO')} disabled={loadingCheckout !== null}>
                            {loadingCheckout ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Fazer Upgrade'}
                        </Button>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
