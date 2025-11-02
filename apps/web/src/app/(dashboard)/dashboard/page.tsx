'use client';

import { useEffect, useState } from 'react';
import {
    Users,
    FileText,
    FolderKanban,
    DollarSign,
    TrendingUp,
    Clock,
    Bell
} from 'lucide-react';
import api from '@/lib/api';
import { StatCard } from '@/components/dashboard/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDate } from '@/lib/format';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface DashboardStats {
    clientes: {
        total: number;
        ativos: number;
    };
    projetos: {
        total: number;
        emAndamento: number;
        concluidos: number;
    };
    orcamentos: {
        total: number;
        aguardando: number;
        enviados: number;
        aprovados: number;
        taxaConversao: string;
    };
    solicitacoes: {
        total: number;
        novas: number;
    };
    financeiro: {
        faturamentoTotal: number;
        recebido: number;
        pendente: number;
        pagamentosPendentes: number;
        pagamentosPagos: number;
    };
    recentes: {
        projetos: {
            id: string | number;
            title: string;
            cliente: { name: string };
            createdAt: string | Date;
            status: string;
            value?: number;
        }[];
        orcamentos: {
            id: string | number;
            title: string;
            cliente: { name: string };
            createdAt: string | Date;
            status: string;
            value?: number;
        }[];
        solicitacoes: {
            id: string | number;
            title: string;
            cliente: { name: string };
            createdAt: string | Date;
            status: string;
        }[];
    };
}

const statusColors: Record<string, string> = {
    EM_ANDAMENTO: 'bg-blue-500',
    CONCLUIDO: 'bg-green-500',
    PAUSADO: 'bg-yellow-500',
    CANCELADO: 'bg-red-500',
    AGUARDANDO: 'bg-slate-500',
    ENVIADO: 'bg-blue-500',
    APROVADO: 'bg-green-500',
    RECUSADO: 'bg-red-500',
    NOVA: 'bg-orange-500',
    ANALISANDO: 'bg-blue-500',
    ORCAMENTO_ENVIADO: 'bg-green-500',
};

const statusLabels: Record<string, string> = {
    EM_ANDAMENTO: 'Em Andamento',
    CONCLUIDO: 'Concluído',
    PAUSADO: 'Pausado',
    CANCELADO: 'Cancelado',
    AGUARDANDO: 'Aguardando',
    ENVIADO: 'Enviado',
    APROVADO: 'Aprovado',
    RECUSADO: 'Recusado',
    NOVA: 'Nova',
    ANALISANDO: 'Analisando',
    ORCAMENTO_ENVIADO: 'Orçamento Enviado',
};

export default function DashboardPage() {
    const router = useRouter();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            setLoading(true);
            const response = await api.get('/dashboard/stats');
            setStats(response.data);
        } catch (error) {
            toast.error('Erro ao carregar estatísticas');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="space-y-8">
                <div>
                    <Skeleton className="h-8 w-64 mb-2" />
                    <Skeleton className="h-4 w-96" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map((i) => (
                        <Skeleton key={i} className="h-32" />
                    ))}
                </div>
            </div>
        );
    }

    if (!stats) return null;

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
                <p className="text-slate-600 mt-1">
                    Visão geral dos seus projetos e finanças
                </p>
            </div>

            {/* Alerta de Novas Solicitações */}
            {stats.solicitacoes.novas > 0 && (
                <Card className="border-orange-200 bg-orange-50">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Bell className="h-5 w-5 text-orange-600" />
                                <div>
                                    <p className="font-semibold text-orange-900">
                                        {stats.solicitacoes.novas} {stats.solicitacoes.novas === 1 ? 'nova solicitação' : 'novas solicitações'}
                                    </p>
                                    <p className="text-sm text-orange-700">
                                        Clientes aguardando orçamento
                                    </p>
                                </div>
                            </div>
                            <Button onClick={() => router.push('/solicitacoes')}>
                                Ver Solicitações
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Novas Solicitações"
                    value={stats.solicitacoes.novas}
                    description={`${stats.solicitacoes.total} total`}
                    icon={Bell}
                />

                <StatCard
                    title="Clientes Ativos"
                    value={stats.clientes.ativos}
                    description={`${stats.clientes.total} total`}
                    icon={Users}
                />

                <StatCard
                    title="Projetos em Andamento"
                    value={stats.projetos.emAndamento}
                    description={`${stats.projetos.concluidos} concluídos`}
                    icon={FolderKanban}
                />

                <StatCard
                    title="Faturamento Recebido"
                    value={formatCurrency(stats.financeiro.recebido)}
                    description={`${formatCurrency(stats.financeiro.pendente)} pendente`}
                    icon={DollarSign}
                />
            </div>

            {/* Resumo Financeiro */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp size={20} />
                        Resumo Financeiro
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <p className="text-sm text-slate-600 mb-1">Faturamento Total</p>
                            <p className="text-2xl font-bold">
                                {formatCurrency(stats.financeiro.faturamentoTotal)}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-slate-600 mb-1">Valor Recebido</p>
                            <p className="text-2xl font-bold text-green-600">
                                {formatCurrency(stats.financeiro.recebido)}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-slate-600 mb-1">Valor Pendente</p>
                            <p className="text-2xl font-bold text-orange-600">
                                {formatCurrency(stats.financeiro.pendente)}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Solicitações Recentes */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Bell size={20} />
                            Solicitações Recentes
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {stats.recentes.solicitacoes.length === 0 ? (
                            <p className="text-sm text-slate-500 text-center py-8">
                                Nenhuma solicitação ainda
                            </p>
                        ) : (
                            <div className="space-y-4">
                                {stats.recentes.solicitacoes.map((solicitacao) => (
                                    <div
                                        key={solicitacao.id}
                                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                                        onClick={() => router.push(`/solicitacoes/${solicitacao.id}`)}
                                    >
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium truncate">{solicitacao.title}</p>
                                            <p className="text-sm text-slate-600 truncate">
                                                {solicitacao.cliente.name}
                                            </p>
                                            <p className="text-xs text-slate-500 mt-1">
                                                {formatDate(solicitacao.createdAt)}
                                            </p>
                                        </div>
                                        <Badge className={statusColors[solicitacao.status]}>
                                            {statusLabels[solicitacao.status]}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Projetos Recentes */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Clock size={20} />
                            Projetos Recentes
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {stats.recentes.projetos.length === 0 ? (
                            <p className="text-sm text-slate-500 text-center py-8">
                                Nenhum projeto cadastrado ainda
                            </p>
                        ) : (
                            <div className="space-y-4">
                                {stats.recentes.projetos.map((projeto) => (
                                    <div
                                        key={projeto.id}
                                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50 transition-colors"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium truncate">{projeto.title}</p>
                                            <p className="text-sm text-slate-600 truncate">
                                                {projeto.cliente.name}
                                            </p>
                                            <p className="text-xs text-slate-500 mt-1">
                                                {formatDate(projeto.createdAt)}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-3 ml-4">
                                            <Badge className={statusColors[projeto.status]}>
                                                {statusLabels[projeto.status]}
                                            </Badge>
                                            <p className="font-semibold text-sm whitespace-nowrap">
                                                {formatCurrency(projeto.value ?? 0)}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}