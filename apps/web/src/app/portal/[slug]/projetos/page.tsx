'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import apiPortal from '@/lib/api-portal';
import { formatCurrency, formatDate } from '@/lib/format';

interface Projeto {
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
    milestones: { id: string; title: string; completed: boolean; order: number }[];
}

const statusColors: Record<string, string> = {
    EM_ANDAMENTO: 'bg-blue-100 text-blue-800',
    CONCLUIDO: 'bg-green-100 text-green-800',
    PAUSADO: 'bg-yellow-100 text-yellow-800',
    CANCELADO: 'bg-red-100 text-red-800',
};

const statusLabels: Record<string, string> = {
    EM_ANDAMENTO: 'Em Andamento',
    CONCLUIDO: 'Concluído',
    PAUSADO: 'Pausado',
    CANCELADO: 'Cancelado',
};

export default function PortalProjetosPage() {
    const router = useRouter();
    const { slug } = useParams<{ slug: string }>();
    const [projetos, setProjetos] = useState<Projeto[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<string>('all');

    const fetchProjetos = useCallback(async () => {
        try {
            setLoading(true);
            const res = await apiPortal.get('/projetos');
            setProjetos(res.data);
        } catch {
            // Erros tratados pelo interceptor
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProjetos();
    }, [fetchProjetos]);

    const filteredProjetos = statusFilter === 'all'
        ? projetos
        : projetos.filter((p) => p.status === statusFilter);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-slate-900">Meus Projetos</h1>
                <p className="text-slate-600 mt-1">Acompanhe o andamento dos seus projetos</p>
            </div>

            <div className="flex gap-4">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[200px]">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos os Status</SelectItem>
                        <SelectItem value="EM_ANDAMENTO">Em Andamento</SelectItem>
                        <SelectItem value="PAUSADO">Pausado</SelectItem>
                        <SelectItem value="CONCLUIDO">Concluído</SelectItem>
                        <SelectItem value="CANCELADO">Cancelado</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Número</TableHead>
                            <TableHead>Título</TableHead>
                            <TableHead>Valor</TableHead>
                            <TableHead>Progresso</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Início</TableHead>
                            <TableHead>Prazo</TableHead>
                            <TableHead className="w-[70px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                    <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                    <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                                </TableRow>
                            ))
                        ) : filteredProjetos.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center py-12 text-slate-500">
                                    Nenhum projeto encontrado.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredProjetos.map((projeto) => {
                                const progressoEfetivo = projeto.status === 'CONCLUIDO' ? 100 : projeto.progress;
                                return (
                                    <TableRow key={projeto.id}>
                                        <TableCell className="font-medium">{projeto.number}</TableCell>
                                        <TableCell className="max-w-[200px] truncate">{projeto.title}</TableCell>
                                        <TableCell className="font-semibold">{formatCurrency(projeto.value)}</TableCell>
                                        <TableCell>
                                            <div className="space-y-1">
                                                <Progress value={progressoEfetivo} className="h-2" />
                                                <p className="text-xs text-slate-500">{progressoEfetivo}%</p>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={statusColors[projeto.status] || 'bg-slate-100 text-slate-800'}>
                                                {statusLabels[projeto.status] || projeto.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {projeto.startDate ? formatDate(projeto.startDate) : '-'}
                                        </TableCell>
                                        <TableCell>
                                            {projeto.endDate ? formatDate(projeto.endDate) : '-'}
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => router.push(`/portal/${slug}/projetos/${projeto.id}`)}
                                                title="Ver detalhes"
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Summary Cards */}
            {!loading && projetos.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                        <CardContent className="pt-6">
                            <p className="text-sm text-slate-500">Em Andamento</p>
                            <p className="text-2xl font-bold text-blue-600">
                                {projetos.filter((p) => p.status === 'EM_ANDAMENTO').length}
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <p className="text-sm text-slate-500">Concluídos</p>
                            <p className="text-2xl font-bold text-green-600">
                                {projetos.filter((p) => p.status === 'CONCLUIDO').length}
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <p className="text-sm text-slate-500">Valor Total</p>
                            <p className="text-2xl font-bold text-emerald-600">
                                {formatCurrency(
                                    projetos.reduce((sum, p) => sum + Number(p.value), 0)
                                )}
                            </p>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
