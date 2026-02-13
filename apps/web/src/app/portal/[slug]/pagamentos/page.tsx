'use client';

import { useEffect, useState, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
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
import { CreditCard, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Pagamento {
    id: string;
    description: string;
    value: number;
    dueDate: string;
    paidAt: string | null;
    status: string;
    method: string | null;
    paymentUrl: string | null;
    projeto: {
        number: string;
        title: string;
    };
}

const statusColors: Record<string, string> = {
    PENDENTE: 'bg-yellow-100 text-yellow-800',
    PAGO: 'bg-green-100 text-green-800',
    ATRASADO: 'bg-red-100 text-red-800',
    CANCELADO: 'bg-slate-100 text-slate-800',
};

const statusLabels: Record<string, string> = {
    PENDENTE: 'Pendente',
    PAGO: 'Pago',
    ATRASADO: 'Atrasado',
    CANCELADO: 'Cancelado',
};

export default function PortalPagamentosPage() {
    const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [payingId, setPayingId] = useState<string | null>(null);

    const fetchPagamentos = useCallback(async () => {
        try {
            setLoading(true);
            const res = await apiPortal.get('/pagamentos');
            setPagamentos(res.data);
        } catch {
            // Erros tratados pelo interceptor
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPagamentos();
    }, [fetchPagamentos]);

    const now = new Date();
    const pagamentosComStatus = pagamentos.map(p => ({
        ...p,
        status: p.status === 'PENDENTE' && new Date(p.dueDate) < now ? 'ATRASADO' : p.status,
    }));

    const filteredPagamentos = statusFilter === 'all'
        ? pagamentosComStatus
        : pagamentosComStatus.filter((p) => p.status === statusFilter);

    const totalPendente = pagamentosComStatus
        .filter(p => p.status === 'PENDENTE' || p.status === 'ATRASADO')
        .reduce((sum, p) => sum + Number(p.value), 0);

    const totalPago = pagamentosComStatus
        .filter(p => p.status === 'PAGO')
        .reduce((sum, p) => sum + Number(p.value), 0);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-slate-900">Meus Pagamentos</h1>
                <p className="text-slate-600 mt-1">Acompanhe seus pagamentos</p>
            </div>

            <div className="flex gap-4">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[200px]">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos os Status</SelectItem>
                        <SelectItem value="PENDENTE">Pendente</SelectItem>
                        <SelectItem value="PAGO">Pago</SelectItem>
                        <SelectItem value="ATRASADO">Atrasado</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Projeto</TableHead>
                            <TableHead>Descrição</TableHead>
                            <TableHead>Valor</TableHead>
                            <TableHead>Vencimento</TableHead>
                            <TableHead>Pagamento</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                    <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                                </TableRow>
                            ))
                        ) : filteredPagamentos.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-12 text-slate-500">
                                    Nenhum pagamento encontrado.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredPagamentos.map((pg) => (
                                <TableRow key={pg.id}>
                                    <TableCell>
                                        <div>
                                            <p className="font-medium">{pg.projeto.number}</p>
                                            <p className="text-xs text-slate-500">{pg.projeto.title}</p>
                                        </div>
                                    </TableCell>
                                    <TableCell>{pg.description}</TableCell>
                                    <TableCell className="font-semibold">{formatCurrency(pg.value)}</TableCell>
                                    <TableCell>{formatDate(pg.dueDate)}</TableCell>
                                    <TableCell>
                                        {pg.paidAt ? formatDate(pg.paidAt) : '-'}
                                    </TableCell>
                                    <TableCell>
                                        <Badge className={statusColors[pg.status] || 'bg-slate-100 text-slate-800'}>
                                            {statusLabels[pg.status] || pg.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {(pg.status === 'PENDENTE' || pg.status === 'ATRASADO') && pg.paymentUrl && (
                                            <Button
                                                size="sm"
                                                className="gap-1"
                                                disabled={payingId === pg.id}
                                                onClick={async () => {
                                                    setPayingId(pg.id);
                                                    try {
                                                        const { data } = await apiPortal.get(`/pagamentos/${pg.id}/checkout`);
                                                        window.location.assign(data.url);
                                                    } catch {
                                                        toast.error('Erro ao abrir página de pagamento');
                                                        setPayingId(null);
                                                    }
                                                }}
                                            >
                                                {payingId === pg.id ? (
                                                    <Loader2 className="h-3 w-3 animate-spin" />
                                                ) : (
                                                    <>
                                                        <CreditCard className="h-3 w-3" />
                                                        Pagar
                                                    </>
                                                )}
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Summary Cards */}
            {!loading && pagamentos.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                        <CardContent className="pt-6">
                            <p className="text-sm text-slate-500">Total Pendente</p>
                            <p className="text-2xl font-bold text-yellow-600">{formatCurrency(totalPendente)}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <p className="text-sm text-slate-500">Total Pago</p>
                            <p className="text-2xl font-bold text-green-600">{formatCurrency(totalPago)}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <p className="text-sm text-slate-500">Total Geral</p>
                            <p className="text-2xl font-bold text-emerald-600">
                                {formatCurrency(
                                    pagamentos.reduce((sum, p) => sum + Number(p.value), 0)
                                )}
                            </p>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
