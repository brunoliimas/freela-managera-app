'use client';

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FileText, FolderKanban, CreditCard, ArrowRight, CheckCircle2, Send, Briefcase } from "lucide-react";
import { useLandingTheme } from "@/hooks/useTheme";

export default function Home() {
    useLandingTheme();
    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
            {/* Header */}
            <header className="container mx-auto px-4 py-6">
                <nav className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Briefcase className="h-8 w-8 text-blue-600" />
                        <span className="text-xl font-bold">Freela Manager</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <Link href="/login">
                            <Button variant="ghost">Entrar</Button>
                        </Link>
                        <Link href="/register">
                            <Button>Criar Conta</Button>
                        </Link>
                    </div>
                </nav>
            </header>

            {/* Hero Section */}
            <section className="container mx-auto px-4 py-20 text-center">
                <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
                    Gerencie seus projetos freelance
                    <span className="block text-blue-600">de forma simples</span>
                </h1>
                <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
                    Controle clientes, orçamentos, projetos e pagamentos em um único lugar.
                    Organize sua vida de freelancer e foque no que realmente importa: seu trabalho.
                </p>
                <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                    <Link href="/register">
                        <Button size="lg" className="gap-2">
                            Começar Grátis
                            <ArrowRight className="h-4 w-4" />
                        </Button>
                    </Link>
                    <Link href="/solicitar-orcamento">
                        <Button size="lg" variant="outline" className="gap-2">
                            <Send className="h-4 w-4" />
                            Solicitar Orçamento
                        </Button>
                    </Link>
                </div>
            </section>

            {/* Features Section */}
            <section className="container mx-auto px-4 py-20">
                <div className="text-center">
                    <h2 className="text-3xl font-bold">Tudo que você precisa</h2>
                    <p className="mt-4 text-muted-foreground">
                        Ferramentas completas para gerenciar seu negócio freelance
                    </p>
                </div>
                <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader>
                            <Users className="h-10 w-10 text-blue-600" />
                            <CardTitle className="mt-4">Clientes</CardTitle>
                            <CardDescription>
                                Cadastre e organize todos os seus clientes em um único lugar
                            </CardDescription>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader>
                            <FileText className="h-10 w-10 text-green-600" />
                            <CardTitle className="mt-4">Orçamentos</CardTitle>
                            <CardDescription>
                                Crie orçamentos profissionais e envie por email em PDF
                            </CardDescription>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader>
                            <FolderKanban className="h-10 w-10 text-purple-600" />
                            <CardTitle className="mt-4">Projetos</CardTitle>
                            <CardDescription>
                                Acompanhe o progresso com milestones e arquivos anexados
                            </CardDescription>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CreditCard className="h-10 w-10 text-orange-600" />
                            <CardTitle className="mt-4">Pagamentos</CardTitle>
                            <CardDescription>
                                Controle parcelas, vencimentos e recebimentos
                            </CardDescription>
                        </CardHeader>
                    </Card>
                </div>
            </section>

            {/* How it Works Section */}
            <section className="bg-slate-50 dark:bg-slate-900/50 py-20">
                <div className="container mx-auto px-4">
                    <div className="text-center">
                        <h2 className="text-3xl font-bold">Como funciona</h2>
                        <p className="mt-4 text-muted-foreground">
                            Três passos simples para organizar seu trabalho
                        </p>
                    </div>
                    <div className="mt-12 grid gap-8 md:grid-cols-3">
                        <div className="flex flex-col items-center text-center">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-xl font-bold text-white">
                                1
                            </div>
                            <h3 className="mt-4 text-xl font-semibold">Cadastre seus clientes</h3>
                            <p className="mt-2 text-muted-foreground">
                                Adicione informações de contato e histórico de cada cliente
                            </p>
                        </div>
                        <div className="flex flex-col items-center text-center">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-xl font-bold text-white">
                                2
                            </div>
                            <h3 className="mt-4 text-xl font-semibold">Crie orçamentos</h3>
                            <p className="mt-2 text-muted-foreground">
                                Gere propostas profissionais e converta em projetos quando aprovadas
                            </p>
                        </div>
                        <div className="flex flex-col items-center text-center">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-xl font-bold text-white">
                                3
                            </div>
                            <h3 className="mt-4 text-xl font-semibold">Acompanhe tudo</h3>
                            <p className="mt-2 text-muted-foreground">
                                Monitore progresso, prazos e pagamentos no dashboard
                            </p>
                        </div>
                    </div>
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
