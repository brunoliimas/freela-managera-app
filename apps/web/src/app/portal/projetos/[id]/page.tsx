'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
    ArrowLeft,
    CheckCircle2,
    Circle,
    FileIcon,
    Download,
    Calendar,
    DollarSign,
    CheckCircle,
} from 'lucide-react';
import { RichTextDisplay } from '@/components/ui/rich-text-display';
import apiPortal from '@/lib/api-portal';
import { formatCurrency, formatDate } from '@/lib/format';

interface Milestone {
    id: string;
    title: string;
    description: string | null;
    completed: boolean;
    completedAt: string | null;
    order: number;
}

interface Arquivo {
    id: string;
    name: string;
    size: number;
    type: string;
    createdAt: string;
}

interface Pagamento {
    id: string;
    description: string;
    value: number;
    dueDate: string;
    paidAt: string | null;
    status: string;
    method: string | null;
}

interface ProjetoDetalhe {
    id: string;
    number: string;
    title: string;
    description: string | null;
    value: number;
    status: string;
    progress: number;
    startDate: string | null;
    endDate: string | null;
    completedAt: string | null;
    notes: string | null;
    milestones: Milestone[];
    arquivos: Arquivo[];
    pagamentos: Pagamento[];
}

const statusColors: Record<string, string> = {
    EM_ANDAMENTO: 'bg-blue-100 text-blue-800',
    CONCLUIDO: 'bg-green-100 text-green-800',
    PAUSADO: 'bg-yellow-100 text-yellow-800',
    CANCELADO: 'bg-red-100 text-red-800',
    PENDENTE: 'bg-yellow-100 text-yellow-800',
    PAGO: 'bg-green-100 text-green-800',
    ATRASADO: 'bg-red-100 text-red-800',
};

const statusLabels: Record<string, string> = {
    EM_ANDAMENTO: 'Em Andamento',
    CONCLUIDO: 'Concluído',
    PAUSADO: 'Pausado',
    CANCELADO: 'Cancelado',
    PENDENTE: 'Pendente',
    PAGO: 'Pago',
    ATRASADO: 'Atrasado',
};

function formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export default function PortalProjetoDetalhePage() {
    const params = useParams();
    const [projeto, setProjeto] = useState<ProjetoDetalhe | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProjeto = async () => {
            try {
                const res = await apiPortal.get(`/projetos/${params.id}`);
                setProjeto(res.data);
            } catch {
                // Erros tratados pelo interceptor
            } finally {
                setLoading(false);
            }
        };
        fetchProjeto();
    }, [params.id]);

    if (loading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-48" />
                <Skeleton className="h-64" />
            </div>
        );
    }

    if (!projeto) {
        return (
            <div className="space-y-6">
                <Link href="/portal/projetos">
                    <Button variant="ghost" size="sm">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
                    </Button>
                </Link>
                <Card>
                    <CardContent className="py-12 text-center">
                        <p className="text-slate-500">Projeto não encontrado</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const progressoEfetivo = projeto.status === 'CONCLUIDO' ? 100 : projeto.progress;
    const now = new Date();
    const pagamentosComStatus = projeto.pagamentos.map(p => ({
        ...p,
        status: p.status === 'PENDENTE' && new Date(p.dueDate) < now ? 'ATRASADO' : p.status,
    }));

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/portal/projetos">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div className="flex-1">
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-bold text-slate-900">
                            {projeto.number}
                        </h1>
                        <Badge className={statusColors[projeto.status] || 'bg-slate-100 text-slate-800'}>
                            {statusLabels[projeto.status] || projeto.status}
                        </Badge>
                    </div>
                    <p className="text-slate-600 mt-1">{projeto.title}</p>
                </div>
            </div>

            {/* Progress Card */}
            <Card>
                <CardHeader>
                    <CardTitle>Progresso do Projeto</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Conclusão</span>
                            <span className="text-sm font-bold">{progressoEfetivo}%</span>
                        </div>
                        <Progress value={progressoEfetivo} className="h-3" />
                        <p className="text-xs text-slate-500">
                            {projeto.milestones?.filter(m => m.completed).length || 0} de{' '}
                            {projeto.milestones?.length || 0} etapas concluídas
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Two-column layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main content (2/3) */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Descrição do Projeto</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {projeto.description ? (
                            <RichTextDisplay content={projeto.description} />
                        ) : (
                            <p className="text-slate-500">Nenhuma descrição disponível</p>
                        )}
                        {projeto.notes && (
                            <>
                                <Separator className="my-4" />
                                <div>
                                    <p className="text-sm font-semibold text-slate-700 mb-2">Observações</p>
                                    <RichTextDisplay content={projeto.notes} />
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>

                {/* Sidebar (1/3) */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Valores e Datas</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-3">
                                <DollarSign className="h-5 w-5 text-slate-400" />
                                <div>
                                    <p className="text-sm text-slate-600">Valor do Projeto</p>
                                    <p className="text-2xl font-bold text-green-600">
                                        {formatCurrency(projeto.value)}
                                    </p>
                                </div>
                            </div>

                            {projeto.startDate && (
                                <div className="flex items-center gap-3">
                                    <Calendar className="h-5 w-5 text-slate-400" />
                                    <div>
                                        <p className="text-sm text-slate-600">Data de Início</p>
                                        <p className="font-medium">{formatDate(projeto.startDate)}</p>
                                    </div>
                                </div>
                            )}

                            {projeto.endDate && (
                                <div className="flex items-center gap-3">
                                    <Calendar className="h-5 w-5 text-slate-400" />
                                    <div>
                                        <p className="text-sm text-slate-600">Data de Entrega</p>
                                        <p className="font-medium">{formatDate(projeto.endDate)}</p>
                                    </div>
                                </div>
                            )}

                            {projeto.completedAt && (
                                <div className="flex items-center gap-3">
                                    <CheckCircle className="h-5 w-5 text-green-500" />
                                    <div>
                                        <p className="text-sm text-slate-600">Concluído em</p>
                                        <p className="font-medium text-green-600">{formatDate(projeto.completedAt)}</p>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Milestones */}
            {projeto.milestones.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Etapas do Projeto</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {projeto.milestones.map((m, index) => (
                                <div key={m.id} className="flex items-start gap-3">
                                    <div className="mt-0.5">
                                        {m.completed ? (
                                            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                                        ) : (
                                            <Circle className="h-5 w-5 text-slate-300" />
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <p className={`font-medium ${m.completed ? 'text-emerald-700 line-through' : ''}`}>
                                                {index + 1}. {m.title}
                                            </p>
                                            {m.completedAt && (
                                                <span className="text-xs text-slate-400">
                                                    {formatDate(m.completedAt)}
                                                </span>
                                            )}
                                        </div>
                                        {m.description && (
                                            <div className="mt-1">
                                                <RichTextDisplay content={m.description} className="text-sm text-slate-500" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Pagamentos */}
            {pagamentosComStatus.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Pagamentos</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {pagamentosComStatus.map((pg) => {
                                const isPago = pg.status === 'PAGO';
                                const isAtrasado = pg.status === 'ATRASADO';

                                return (
                                    <div
                                        key={pg.id}
                                        className={`flex items-center justify-between p-4 border rounded-lg ${
                                            isPago ? 'bg-green-50 border-green-200' :
                                            isAtrasado ? 'bg-red-50 border-red-200' :
                                            'bg-white'
                                        }`}
                                    >
                                        <div className="flex-1">
                                            <p className="font-medium">{pg.description}</p>
                                            <div className="flex items-center gap-4 mt-1 text-sm text-slate-600">
                                                <span>Valor: {formatCurrency(pg.value)}</span>
                                                <span>Vencimento: {formatDate(pg.dueDate)}</span>
                                                {pg.paidAt && (
                                                    <span className="text-green-600">
                                                        Pago em {formatDate(pg.paidAt)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <Badge className={statusColors[pg.status] || 'bg-slate-100 text-slate-800'}>
                                            {statusLabels[pg.status] || pg.status}
                                        </Badge>
                                    </div>
                                );
                            })}

                            <div className="flex justify-between items-center pt-4 border-t">
                                <div>
                                    <p className="text-sm text-slate-600">Total Pendente</p>
                                    <p className="text-xl font-bold text-yellow-600">
                                        {formatCurrency(
                                            pagamentosComStatus
                                                .filter((p) => p.status !== 'PAGO')
                                                .reduce((sum, p) => sum + Number(p.value), 0)
                                        )}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-slate-600">Total Pago</p>
                                    <p className="text-xl font-bold text-green-600">
                                        {formatCurrency(
                                            pagamentosComStatus
                                                .filter((p) => p.status === 'PAGO')
                                                .reduce((sum, p) => sum + Number(p.value), 0)
                                        )}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Arquivos */}
            {projeto.arquivos.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Arquivos</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {projeto.arquivos.map((arq) => (
                                <div key={arq.id} className="flex items-center justify-between p-3 rounded-lg border">
                                    <div className="flex items-center gap-3">
                                        <FileIcon className="h-5 w-5 text-slate-400" />
                                        <div>
                                            <p className="font-medium text-sm">{arq.name}</p>
                                            <p className="text-xs text-slate-500">
                                                {formatFileSize(arq.size)} · {formatDate(arq.createdAt)}
                                            </p>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="sm">
                                        <Download className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
