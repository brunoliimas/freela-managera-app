'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Users,
    FileText,
    DollarSign,
    FolderOpen,
    AlertCircle,
    TrendingUp,
    CheckCircle2,
    Clock
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { StatCard } from '@/components/dashboard/StatCard';
import { DashboardData } from '@/types/dashboard';
import { formatCurrency, formatDate } from '@/lib/format';
import api from '@/lib/api';
import { toast } from 'sonner';

const statusColors: Record<string, string> = {
    // Solicitações
    NOVA: 'bg-orange-500',
    ANALISANDO: 'bg-blue-500',
    ORCAMENTO_ENVIADO: 'bg-green-500',
    ARQUIVADA: 'bg-gray-500',
    // Orçamentos
    AGUARDANDO: 'bg-slate-500',
    ENVIADO: 'bg-blue-500',
    APROVADO: 'bg-green-500',
    RECUSADO: 'bg-red-500',
    EXPIRADO: 'bg-orange-500',
    // Projetos
    EM_ANDAMENTO: 'bg-blue-500',
    PAUSADO: 'bg-yellow-500',
    CONCLUIDO: 'bg-green-500',
    CANCELADO: 'bg-red-500',
};

const statusLabels: Record<string, string> = {
    // Solicitações
    NOVA: 'Nova',
    ANALISANDO: 'Analisando',
    ORCAMENTO_ENVIADO: 'Orçamento Enviado',
    ARQUIVADA: 'Arquivada',
    // Orçamentos
    AGUARDANDO: 'Aguardando',
    ENVIADO: 'Enviado',
    APROVADO: 'Aprovado',
    RECUSADO: 'Recusado',
    EXPIRADO: 'Expirado',
    // Projetos
    EM_ANDAMENTO: 'Em Andamento',
    PAUSADO: 'Pausado',
    CONCLUIDO: 'Concluído',
    CANCELADO: 'Cancelado',
};

export default function DashboardPage() {
    const router = useRouter();
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboard();
    }, []);

    const fetchDashboard = async () => {
        try {
            setLoading(true);
            const response = await api.get('/dashboard');
            setData(response.data);
        } catch (error) {
            toast.error('Erro ao carregar dashboard');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-10 w-64" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <Skeleton key={i} className="h-32" />
                    ))}
                </div>
            </div>
        );
    }

    if (!data) return null;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
                <p className="text-slate-600 mt-1">
                    Visão geral do seu negócio
                </p>
            </div>

            {data.stats.solicitacoes.novas > 0 && (
                <Alert className="border-orange-200 bg-orange-50">
                    <AlertCircle className="h-4 w-4 text-orange-600" />
                    <AlertDescription className="text-orange-800 flex justify-between items-center">
                        <div>
                            Você tem <strong>{data.stats.solicitacoes.novas}</strong> {data.stats.solicitacoes.novas === 1 ? 'nova solicitação' : 'novas solicitações'} aguardando análise.{' '}
                        </div>
                        <button
                            onClick={() => router.push('/solicitacoes')}
                            className="underline font-semibold cursor-pointer hover:text-orange-900"
                        >
                            Ver solicitações
                        </button>
                    </AlertDescription>
                </Alert>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Clientes Ativos"
                    value={data.stats.clientes.ativos}
                    subtitle={`${data.stats.clientes.total} total`}
                    icon={Users}
                    iconColor="text-blue-500"
                />

                <StatCard
                    title="Solicitações"
                    value={data.stats.solicitacoes.total}
                    subtitle={data.stats.solicitacoes.novas > 0 ? `${data.stats.solicitacoes.novas} novas` : undefined}
                    icon={FileText}
                    iconColor="text-orange-500"
                />

                <StatCard
                    title="Orçamentos"
                    value={data.stats.orcamentos.total}
                    subtitle={`${data.stats.orcamentos.aprovados} aprovados`}
                    icon={DollarSign}
                    iconColor="text-green-500"
                />

                <StatCard
                    title="Projetos Ativos"
                    value={data.stats.projetos.emAndamento}
                    subtitle={`${data.stats.projetos.total} total`}
                    icon={FolderOpen}
                    iconColor="text-purple-500"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base font-medium flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-green-500" />
                            Valor em Orçamentos
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold text-slate-900">
                            {formatCurrency(data.stats.orcamentos.valorTotal)}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                            {data.stats.orcamentos.total} orçamentos enviados
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base font-medium flex items-center gap-2">
                            <Clock className="h-4 w-4 text-blue-500" />
                            Projetos em Andamento
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold text-slate-900">
                            {formatCurrency(data.stats.projetos.valorAndamento)}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                            {data.stats.projetos.emAndamento} projetos ativos
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base font-medium flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                            Projetos Concluídos
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold text-slate-900">
                            {formatCurrency(data.stats.projetos.valorConcluidos)}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                            {data.stats.projetos.concluidos} projetos finalizados
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Solicitações Recentes</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {data.recentes.solicitacoes.length === 0 ? (
                            <p className="text-sm text-slate-500 text-center py-4">
                                Nenhuma solicitação ainda
                            </p>
                        ) : (
                            <div className="space-y-3">
                                {data.recentes.solicitacoes.map((solicitacao) => (
                                    <div
                                        key={solicitacao.id}
                                        className="flex items-start justify-between p-3 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
                                        onClick={() => router.push(`/solicitacoes/${solicitacao.id}`)}
                                    >
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-sm truncate">{solicitacao.title}</p>
                                            <p className="text-xs text-slate-500 truncate">
                                                {solicitacao.cliente.name}
                                            </p>
                                            <p className="text-xs text-slate-400 mt-1">
                                                {formatDate(solicitacao.createdAt)}
                                            </p>
                                        </div>
                                        <Badge className={`${statusColors[solicitacao.status]} ml-2 shrink-0`}>
                                            {statusLabels[solicitacao.status]}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Orçamentos Recentes</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {data.recentes.orcamentos.length === 0 ? (
                            <p className="text-sm text-slate-500 text-center py-4">
                                Nenhum orçamento ainda
                            </p>
                        ) : (
                            <div className="space-y-3">
                                {data.recentes.orcamentos.map((orcamento) => (
                                    <div
                                        key={orcamento.id}
                                        className="flex items-start justify-between p-3 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
                                        onClick={() => router.push(`/orcamentos/${orcamento.id}`)}
                                    >
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-sm">{orcamento.number}</p>
                                            <p className="text-xs text-slate-500 truncate">
                                                {orcamento.cliente.name}
                                            </p>
                                            <p className="text-xs font-semibold text-green-600 mt-1">
                                                {formatCurrency(orcamento.value)}
                                            </p>
                                        </div>
                                        <Badge className={`${statusColors[orcamento.status]} ml-2 shrink-0`}>
                                            {statusLabels[orcamento.status]}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Projetos Recentes</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {data.recentes.projetos.length === 0 ? (
                            <p className="text-sm text-slate-500 text-center py-4">
                                Nenhum projeto ainda
                            </p>
                        ) : (
                            <div className="space-y-3">
                                {data.recentes.projetos.map((projeto) => (
                                    <div
                                        key={projeto.id}
                                        className="flex items-start justify-between p-3 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
                                        onClick={() => router.push(`/projetos/${projeto.id}`)}
                                    >
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-sm">{projeto.number}</p>
                                            <p className="text-xs text-slate-500 truncate">
                                                {projeto.cliente.name}
                                            </p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <div className="flex-1 bg-slate-200 rounded-full h-1.5">
                                                    <div
                                                        className="bg-blue-500 h-1.5 rounded-full transition-all"
                                                        style={{ width: `${projeto.progress}%` }}
                                                    />
                                                </div>
                                                <span className="text-xs text-slate-500">{projeto.progress}%</span>
                                            </div>
                                        </div>
                                        <Badge className={`${statusColors[projeto.status]} ml-2 shrink-0`}>
                                            {statusLabels[projeto.status]}
                                        </Badge>
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