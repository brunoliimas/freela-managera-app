'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { FolderKanban, CreditCard, FileText, ArrowRight } from 'lucide-react';
import { useClientAuth } from '@/hooks/useClientAuth';
import apiPortal from '@/lib/api-portal';
import { formatCurrency, formatDate } from '@/lib/format';

interface ProjetoResumo {
    id: string;
    number: string;
    title: string;
    status: string;
    progress: number;
}

interface PagamentoResumo {
    id: string;
    description: string;
    value: number;
    dueDate: string;
    status: string;
    projeto: { number: string; title: string };
}

interface OrcamentoResumo {
    id: string;
    number: string;
    title: string;
    status: string;
    validUntil: string | null;
}

const statusColors: Record<string, string> = {
    EM_ANDAMENTO: 'bg-blue-100 text-blue-800',
    CONCLUIDO: 'bg-green-100 text-green-800',
    PAUSADO: 'bg-yellow-100 text-yellow-800',
    CANCELADO: 'bg-red-100 text-red-800',
    PENDENTE: 'bg-yellow-100 text-yellow-800',
    PAGO: 'bg-green-100 text-green-800',
    ATRASADO: 'bg-red-100 text-red-800',
    ENVIADO: 'bg-blue-100 text-blue-800',
    APROVADO: 'bg-green-100 text-green-800',
    REJEITADO: 'bg-red-100 text-red-800',
    RASCUNHO: 'bg-slate-100 text-slate-800',
};

const statusLabels: Record<string, string> = {
    EM_ANDAMENTO: 'Em Andamento',
    CONCLUIDO: 'Concluído',
    PAUSADO: 'Pausado',
    CANCELADO: 'Cancelado',
    PENDENTE: 'Pendente',
    PAGO: 'Pago',
    ATRASADO: 'Atrasado',
    ENVIADO: 'Enviado',
    APROVADO: 'Aprovado',
    REJEITADO: 'Rejeitado',
    RASCUNHO: 'Rascunho',
};

export default function PortalDashboardPage() {
    const { slug } = useParams<{ slug: string }>();
    const { cliente } = useClientAuth();
    const [projetos, setProjetos] = useState<ProjetoResumo[]>([]);
    const [pagamentos, setPagamentos] = useState<PagamentoResumo[]>([]);
    const [orcamentos, setOrcamentos] = useState<OrcamentoResumo[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [projRes, pagRes, orcRes] = await Promise.all([
                    apiPortal.get('/projetos'),
                    apiPortal.get('/pagamentos'),
                    apiPortal.get('/orcamentos'),
                ]);
                setProjetos(projRes.data);
                setPagamentos(pagRes.data);
                setOrcamentos(orcRes.data);
            } catch {
                // Erros tratados pelo interceptor
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const projetosAtivos = projetos.filter(p => p.status === 'EM_ANDAMENTO');
    const pagamentosPendentes = pagamentos.filter(p => p.status === 'PENDENTE' || p.status === 'ATRASADO');
    const orcamentosAbertos = orcamentos.filter(o => o.status === 'ENVIADO');

    if (loading) {
        return (
            <div className="space-y-8">
                <Skeleton className="h-10 w-64" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Skeleton className="h-32" />
                    <Skeleton className="h-32" />
                    <Skeleton className="h-32" />
                </div>
                <Skeleton className="h-64" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-slate-900">Olá, {cliente?.name?.split(' ')[0]}!</h1>
                <p className="text-slate-600 mt-1">Acompanhe o andamento dos seus projetos</p>
            </div>

            {/* Cards resumo */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Projetos Ativos</CardTitle>
                        <FolderKanban className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{projetosAtivos.length}</div>
                        <p className="text-xs text-slate-500 mt-1">
                            {projetos.length} total
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pagamentos Pendentes</CardTitle>
                        <CreditCard className="h-4 w-4 text-yellow-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {formatCurrency(pagamentosPendentes.reduce((sum, p) => sum + Number(p.value), 0))}
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                            {pagamentosPendentes.length} parcela{pagamentosPendentes.length !== 1 ? 's' : ''}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Orçamentos Abertos</CardTitle>
                        <FileText className="h-4 w-4 text-purple-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{orcamentosAbertos.length}</div>
                        <p className="text-xs text-slate-500 mt-1">
                            aguardando aprovação
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Projetos em andamento */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Projetos em Andamento</CardTitle>
                    <Link href={`/portal/${slug}/projetos`} className="text-sm text-emerald-600 hover:underline flex items-center gap-1">
                        Ver todos <ArrowRight size={14} />
                    </Link>
                </CardHeader>
                <CardContent>
                    {projetosAtivos.length === 0 ? (
                        <p className="text-slate-500 text-center py-4">Nenhum projeto em andamento</p>
                    ) : (
                        <div className="space-y-4">
                            {projetosAtivos.slice(0, 5).map((p) => (
                                <Link key={p.id} href={`/portal/${slug}/projetos/${p.id}`} className="block">
                                    <div className="flex items-center justify-between p-4 rounded-lg border hover:bg-slate-50 transition-colors">
                                        <div>
                                            <p className="font-medium">{p.number} - {p.title}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <div className="w-32 h-2 bg-slate-200 rounded-full">
                                                    <div
                                                        className="h-2 bg-emerald-500 rounded-full"
                                                        style={{ width: `${p.progress}%` }}
                                                    />
                                                </div>
                                                <span className="text-sm text-slate-500">{p.progress}%</span>
                                            </div>
                                        </div>
                                        <ArrowRight size={16} className="text-slate-400" />
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Próximos pagamentos */}
            {pagamentosPendentes.length > 0 && (
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Próximos Pagamentos</CardTitle>
                        <Link href={`/portal/${slug}/pagamentos`} className="text-sm text-emerald-600 hover:underline flex items-center gap-1">
                            Ver todos <ArrowRight size={14} />
                        </Link>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {pagamentosPendentes.slice(0, 5).map((pg) => (
                                <div key={pg.id} className="flex items-center justify-between p-4 rounded-lg border">
                                    <div>
                                        <p className="font-medium">{pg.projeto.number} - {pg.description}</p>
                                        <p className="text-sm text-slate-500 mt-1">Vencimento: {formatDate(pg.dueDate)}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-semibold">{formatCurrency(pg.value)}</p>
                                        <Badge className={statusColors[pg.status] || 'bg-slate-100 text-slate-800'}>
                                            {statusLabels[pg.status] || pg.status}
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
