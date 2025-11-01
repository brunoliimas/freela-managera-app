'use client';

import { useEffect, useState } from 'react';
import {
    Users,
    FileText,
    FolderKanban,
    DollarSign,
    TrendingUp,
    Clock
} from 'lucide-react';
import api from '@/lib/api';
import { StatCard } from '@/components/dashboard/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency, formatDate } from '@/lib/format';
import { toast } from 'sonner';

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
    financeiro: {
        faturamentoTotal: number;
        recebido: number;
        pendente: number;
        pagamentosPendentes: number;
        pagamentosPagos: number;
    };
    recentes: {
        projetos: Array<{
            id: string;
            title: string;
            value: number;
            status: string;
            createdAt: string;
            cliente: {
                name: string;
            };
        }>;
        orcamentos: Array<{
            id: string;
            title: string;
            value: number;
            status: string;
            createdAt: string;
            cliente: {
                name: string;
            };
        }>;
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
};

export default function DashboardPage() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
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

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                    title="Orçamentos Pendentes"
                    value={stats.orcamentos.aguardando + stats.orcamentos.enviados}
                    description={`${stats.orcamentos.taxaConversao} taxa de conversão`}
                    icon={FileText}
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
                                                {formatCurrency(projeto.value)}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Orçamentos Recentes */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText size={20} />
                            Orçamentos Recentes
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {stats.recentes.orcamentos.length === 0 ? (
                            <p className="text-sm text-slate-500 text-center py-8">
                                Nenhum orçamento cadastrado ainda
                            </p>
                        ) : (
                            <div className="space-y-4">
                                {stats.recentes.orcamentos.map((orcamento) => (
                                    <div
                                        key={orcamento.id}
                                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50 transition-colors"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium truncate">{orcamento.title}</p>
                                            <p className="text-sm text-slate-600 truncate">
                                                {orcamento.cliente.name}
                                            </p>
                                            <p className="text-xs text-slate-500 mt-1">
                                                {formatDate(orcamento.createdAt)}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-3 ml-4">
                                            <Badge className={statusColors[orcamento.status]}>
                                                {statusLabels[orcamento.status]}
                                            </Badge>
                                            <p className="font-semibold text-sm whitespace-nowrap">
                                                {formatCurrency(orcamento.value)}
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