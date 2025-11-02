'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Eye, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
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
import { Solicitacao } from '@/types/solicitacao';
import { formatDate, formatCurrency } from '@/lib/format';
import api from '@/lib/api';
import { toast } from 'sonner';

const statusColors: Record<string, string> = {
    NOVA: 'bg-orange-500',
    ANALISANDO: 'bg-blue-500',
    ORCAMENTO_ENVIADO: 'bg-green-500',
    ARQUIVADA: 'bg-slate-500',
};

const statusLabels: Record<string, string> = {
    NOVA: 'Nova',
    ANALISANDO: 'Analisando',
    ORCAMENTO_ENVIADO: 'Orçamento Enviado',
    ARQUIVADA: 'Arquivada',
};

export default function SolicitacoesPage() {
    const router = useRouter();
    const [solicitacoes, setSolicitacoes] = useState<Solicitacao[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<string>('all');

    useEffect(() => {
        fetchSolicitacoes();
    }, [statusFilter]);

    interface QueryParams {
        status?: string;
    }

    const fetchSolicitacoes = async () => {
        try {
            setLoading(true);
            const params: QueryParams = {};
            if (statusFilter !== 'all') {
                params.status = statusFilter;
            }

            const response = await api.get('/solicitacoes', { params });
            setSolicitacoes(response.data);
        } catch (error) {
            toast.error('Erro ao carregar solicitações');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Solicitações</h1>
                    <p className="text-slate-600 mt-1">
                        Gerencie as solicitações de orçamento dos seus clientes
                    </p>
                </div>
            </div>

            {/* Filtros */}
            <div className="flex gap-4">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[200px]">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos os Status</SelectItem>
                        <SelectItem value="NOVA">Novas</SelectItem>
                        <SelectItem value="ANALISANDO">Analisando</SelectItem>
                        <SelectItem value="ORCAMENTO_ENVIADO">Orçamento Enviado</SelectItem>
                        <SelectItem value="ARQUIVADA">Arquivadas</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Tabela */}
            <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Título</TableHead>
                            <TableHead>Cliente</TableHead>
                            <TableHead>Orçamento Est.</TableHead>
                            <TableHead>Prazo</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Data</TableHead>
                            <TableHead className="w-[70px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                    <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                    <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                                </TableRow>
                            ))
                        ) : solicitacoes.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-12 text-slate-500">
                                    Nenhuma solicitação encontrada.
                                </TableCell>
                            </TableRow>
                        ) : (
                            solicitacoes.map((solicitacao) => (
                                <TableRow key={solicitacao.id}>
                                    <TableCell className="font-medium">{solicitacao.title}</TableCell>
                                    <TableCell>
                                        <div>
                                            <p className="font-medium">{solicitacao.cliente?.name}</p>
                                            <p className="text-xs text-slate-500">{solicitacao.cliente?.company}</p>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {solicitacao.budget ? formatCurrency(solicitacao.budget) : '-'}
                                    </TableCell>
                                    <TableCell>
                                        {solicitacao.deadline ? formatDate(solicitacao.deadline) : '-'}
                                    </TableCell>
                                    <TableCell>
                                        <Badge className={statusColors[solicitacao.status]}>
                                            {statusLabels[solicitacao.status]}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{formatDate(solicitacao.createdAt)}</TableCell>
                                    <TableCell>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => router.push(`/solicitacoes/${solicitacao.id}`)}
                                        >
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}