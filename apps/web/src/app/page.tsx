'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PricingCard } from '@/components/pricing/PricingCard';
import {
    Users,
    FileText,
    FolderKanban,
    CreditCard,
    ArrowRight,
    CheckCircle2,
    Briefcase,
    Globe,
    BarChart3,
} from 'lucide-react';
import { useLandingTheme } from '@/hooks/useTheme';

export default function Home() {
    useLandingTheme();
    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
            {/* Header */}
            <header className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur-sm dark:bg-slate-950/80">
                <div className="container mx-auto px-4 py-4">
                    <nav className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Briefcase className="h-7 w-7 text-blue-600" />
                            <span className="text-xl font-bold">Freela Manager</span>
                        </div>
                        <div className="hidden sm:flex items-center gap-6 text-sm text-muted-foreground">
                            <a href="#funcionalidades" className="hover:text-foreground transition-colors">
                                Funcionalidades
                            </a>
                            <a href="#precos" className="hover:text-foreground transition-colors">
                                Preços
                            </a>
                        </div>
                        <div className="flex items-center gap-3">
                            <Link href="/login">
                                <Button variant="ghost" size="sm">Entrar</Button>
                            </Link>
                            <Link href="/register">
                                <Button size="sm">Criar Conta</Button>
                            </Link>
                        </div>
                    </nav>
                </div>
            </header>

            {/* Hero Section */}
            <section className="container mx-auto px-4 py-24 text-center">
                <div className="inline-flex items-center gap-2 rounded-full border bg-white px-4 py-1.5 text-sm text-muted-foreground dark:bg-slate-900 mb-6">
                    <span className="h-2 w-2 rounded-full bg-green-500" />
                    Plano gratuito disponível
                </div>
                <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
                    Gerencie seus projetos freelance
                    <span className="block text-blue-600">de forma simples e profissional</span>
                </h1>
                <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
                    Controle clientes, orçamentos, projetos e pagamentos em um único lugar.
                    Receba pagamentos online via PIX, cartão e boleto direto na plataforma.
                </p>
                <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                    <Link href="/register">
                        <Button size="lg" className="gap-2">
                            Começar Grátis
                            <ArrowRight className="h-4 w-4" />
                        </Button>
                    </Link>
                    <a href="#precos">
                        <Button size="lg" variant="outline">
                            Ver Planos
                        </Button>
                    </a>
                </div>
            </section>

            {/* Features Section */}
            <section id="funcionalidades" className="container mx-auto px-4 py-20">
                <div className="text-center">
                    <h2 className="text-3xl font-bold">Tudo que você precisa</h2>
                    <p className="mt-4 text-muted-foreground">
                        Ferramentas completas para gerenciar seu negócio freelance
                    </p>
                </div>
                <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    <Card>
                        <CardHeader>
                            <Users className="h-10 w-10 text-blue-600" />
                            <CardTitle className="mt-4">Clientes</CardTitle>
                            <CardDescription>
                                Cadastre e organize todos os seus clientes com dados de contato e histórico
                            </CardDescription>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader>
                            <FileText className="h-10 w-10 text-green-600" />
                            <CardTitle className="mt-4">Orçamentos</CardTitle>
                            <CardDescription>
                                Crie propostas profissionais, envie por email em PDF e converta em projetos
                            </CardDescription>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader>
                            <FolderKanban className="h-10 w-10 text-purple-600" />
                            <CardTitle className="mt-4">Projetos</CardTitle>
                            <CardDescription>
                                Acompanhe o progresso com milestones, arquivos e prazos em um só lugar
                            </CardDescription>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CreditCard className="h-10 w-10 text-orange-600" />
                            <CardTitle className="mt-4">Pagamentos Online</CardTitle>
                            <CardDescription>
                                Receba via PIX, cartão de crédito e boleto. Seus clientes pagam direto pela plataforma
                            </CardDescription>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader>
                            <Globe className="h-10 w-10 text-emerald-600" />
                            <CardTitle className="mt-4">Portal do Cliente</CardTitle>
                            <CardDescription>
                                Seus clientes acessam projetos, orçamentos e pagamentos em um portal exclusivo
                            </CardDescription>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader>
                            <BarChart3 className="h-10 w-10 text-rose-600" />
                            <CardTitle className="mt-4">Relatórios</CardTitle>
                            <CardDescription>
                                Visualize receitas, projetos e desempenho com gráficos e métricas detalhadas
                            </CardDescription>
                        </CardHeader>
                    </Card>
                </div>
            </section>

            {/* Pricing Section */}
            <section id="precos" className="bg-slate-50 dark:bg-slate-900/50 py-20">
                <div className="container mx-auto px-4">
                    <div className="text-center">
                        <h2 className="text-3xl font-bold">Planos e preços</h2>
                        <p className="mt-4 text-muted-foreground">
                            Comece grátis e faça upgrade quando precisar
                        </p>
                    </div>
                    <div className="mt-12 grid gap-8 md:grid-cols-3 max-w-5xl mx-auto items-start">
                        <PricingCard
                            name="Free"
                            price="Grátis"
                            period=""
                            description="Para quem está começando"
                            features={[
                                'Até 3 clientes',
                                'Até 5 projetos',
                                'Orçamentos em PDF',
                                'Portal do cliente',
                                'Notificações por email',
                                'Calendário de prazos',
                            ]}
                            href="/register"
                            cta="Começar Grátis"
                        />
                        <PricingCard
                            name="Pro"
                            price="R$49"
                            description="Para freelancers profissionais"
                            features={[
                                'Clientes ilimitados',
                                'Projetos ilimitados',
                                'Pagamento online (PIX, cartão, boleto)',
                                'Relatórios avançados',
                                'Notificações in-app',
                                'Suporte por email',
                            ]}
                            href="/register?plan=pro"
                            cta="Assinar Pro"
                            highlighted
                        />
                        <PricingCard
                            name="Enterprise"
                            price="R$99"
                            description="Para agências e equipes"
                            features={[
                                'Tudo do Pro',
                                'Suporte prioritário',
                                'Onboarding personalizado',
                                'SLA de resposta',
                                'Exportação de dados',
                                'Funcionalidades antecipadas',
                            ]}
                            href="/register?plan=enterprise"
                            cta="Assinar Enterprise"
                        />
                    </div>
                    <p className="text-center text-sm text-muted-foreground mt-8">
                        Pagamentos online têm uma taxa de 3% por transação + taxas do Stripe.
                    </p>
                </div>
            </section>

            {/* CTA Section */}
            <section className="container mx-auto px-4 py-20 text-center">
                <Card className="mx-auto max-w-2xl border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/30">
                    <CardContent className="pt-6">
                        <h2 className="text-2xl font-bold">Pronto para começar?</h2>
                        <p className="mt-4 text-muted-foreground">
                            Crie sua conta gratuita e comece a organizar seus projetos hoje mesmo
                        </p>
                        <div className="mt-6 flex flex-col items-center justify-center gap-4 sm:flex-row">
                            <Link href="/register">
                                <Button size="lg" className="gap-2">
                                    <CheckCircle2 className="h-4 w-4" />
                                    Criar Conta Grátis
                                </Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </section>

            {/* Footer */}
            <footer className="border-t py-8">
                <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
                    <p>&copy; {new Date().getFullYear()} Freela Manager. Todos os direitos reservados.</p>
                </div>
            </footer>
        </div>
    );
}
