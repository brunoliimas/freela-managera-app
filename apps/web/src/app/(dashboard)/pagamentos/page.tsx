'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Eye, Pencil, Trash2, MoreVertical, DollarSign, CheckCircle, Link2, Copy, Download, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { PagamentoDialog } from '@/components/pagamentos/PagamentoDialog';
import { MarcarPagoDialog } from '@/components/pagamentos/MarcarPagoDialog';
import { Pagamento } from '@/types/projeto';
import { formatDate, formatCurrency } from '@/lib/format';
import api from '@/lib/api';
import { toast } from 'sonner';
import axios from 'axios';
import { downloadFile } from '@/lib/download';
import { useAuth } from '@/hooks/useAuth';

const statusColors: Record<string, string> = {
    PENDENTE: 'bg-yellow-500',
    PAGO: 'bg-green-500',
    ATRASADO: 'bg-red-500',
    CANCELADO: 'bg-slate-500',
};

const statusLabels: Record<string, string> = {
    PENDENTE: 'Pendente',
    PAGO: 'Pago',
    ATRASADO: 'Atrasado',
    CANCELADO: 'Cancelado',
};

export default function PagamentosPage() {
    const router = useRouter();
    const { user } = useAuth();
    const isPro = user?.plan === 'PRO' || user?.plan === 'ENTERPRISE';
    const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedPagamento, setSelectedPagamento] = useState<Pagamento | undefined>();
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [pagamentoToDelete, setPagamentoToDelete] = useState<Pagamento | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [marcarPagoDialogOpen, setMarcarPagoDialogOpen] = useState(false);
    const [pagamentoToMarcar, setPagamentoToMarcar] = useState<Pagamento | null>(null);

    const fetchPagamentos = useCallback(async () => {
        try {
            setLoading(true);
            const params: Record<string, string> = {};
            if (statusFilter !== 'all') {
                params.status = statusFilter;
            }

            const response = await api.get('/pagamentos', { params });
            setPagamentos(response.data);
        } catch (error) {
            toast.error('Erro ao carregar pagamentos');
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, [statusFilter]);

    useEffect(() => {
        fetchPagamentos();
    }, [fetchPagamentos]);

    const handleEdit = (pagamento: Pagamento) => {
        setSelectedPagamento(pagamento);
        setDialogOpen(true);
    };

    const handleNew = () => {
        setSelectedPagamento(undefined);
        setDialogOpen(true);
    };

    const handleMarcarPago = (pagamento: Pagamento) => {
        setPagamentoToMarcar(pagamento);
        setMarcarPagoDialogOpen(true);
    };

    const handleDelete = async () => {
        if (!pagamentoToDelete) return;

        setIsDeleting(true);
        try {
            await api.delete(`/pagamentos/${pagamentoToDelete.id}`);
            toast.success('Pagamento excluído com sucesso!');
            fetchPagamentos();
        } catch (error) {
            if (axios.isAxiosError(error)) {
                toast.error(error.response?.data?.error || 'Erro ao excluir pagamento');
            } else {
                toast.error('Erro ao excluir pagamento');
            }
        } finally {
            setIsDeleting(false);
            setDeleteDialogOpen(false);
            setPagamentoToDelete(null);
        }
    };

    const totalPendente = pagamentos
        .filter((p) => p.status === 'PENDENTE' || p.status === 'ATRASADO')
        .reduce((sum, p) => sum + Number(p.value), 0);

    const totalRecebido = pagamentos
        .filter((p) => p.status === 'PAGO')
        .reduce((sum, p) => sum + Number(p.value), 0);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Pagamentos</h1>
                    <p className="text-slate-600 mt-1">
                        Gerencie os recebimentos dos seus projetos
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={() => downloadFile('/export/pagamentos', 'pagamentos.csv').catch(() => toast.error('Erro ao exportar'))}
                    >
                        <Download className="mr-2 h-4 w-4" />
                        Exportar CSV
                    </Button>
                    <Button onClick={handleNew}>
                        <Plus className="mr-2 h-4 w-4" />
                        Novo Pagamento
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white border rounded-lg p-6">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-yellow-100 rounded-full">
                            <DollarSign className="h-6 w-6 text-yellow-600" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-600">A Receber</p>
                            <p className="text-2xl font-bold text-slate-900">
                                {formatCurrency(totalPendente)}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white border rounded-lg p-6">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-green-100 rounded-full">
                            <CheckCircle className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-600">Recebido</p>
                            <p className="text-2xl font-bold text-green-600">
                                {formatCurrency(totalRecebido)}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white border rounded-lg p-6">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-blue-100 rounded-full">
                            <DollarSign className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-600">Total</p>
                            <p className="text-2xl font-bold text-slate-900">
                                {formatCurrency(totalPendente + totalRecebido)}
                            </p>
                        </div>
                    </div>
                </div>
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
                        <SelectItem value="CANCELADO">Cancelado</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Descrição</TableHead>
                            <TableHead>Projeto</TableHead>
                            <TableHead>Cliente</TableHead>
                            <TableHead>Valor</TableHead>
                            <TableHead>Vencimento</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="w-[70px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                    <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                                    <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                                </TableRow>
                            ))
                        ) : pagamentos.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-12 text-slate-500">
                                    Nenhum pagamento encontrado.
                                </TableCell>
                            </TableRow>
                        ) : (
                            pagamentos.map((pagamento) => (
                                <TableRow key={pagamento.id}>
                                    <TableCell className="font-medium">{pagamento.description}</TableCell>
                                    <TableCell>
                                        <p className="text-sm">{pagamento.projeto?.number}</p>
                                    </TableCell>
                                    <TableCell>
                                        <div>
                                            <p className="font-medium text-sm">
                                                {pagamento.projeto?.cliente.name}
                                            </p>
                                            <p className="text-xs text-slate-500">
                                                {pagamento.projeto?.cliente.company}
                                            </p>
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-semibold">
                                        {formatCurrency(pagamento.value)}
                                    </TableCell>
                                    <TableCell>
                                        <div>
                                            <p className="text-sm">{formatDate(pagamento.dueDate)}</p>
                                            {pagamento.paidAt && (
                                                <p className="text-xs text-green-600">
                                                    Pago em {formatDate(pagamento.paidAt)}
                                                </p>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge className={statusColors[pagamento.status]}>
                                            {statusLabels[pagamento.status]}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                {pagamento.status !== 'PAGO' && (
                                                    <DropdownMenuItem onClick={() => handleMarcarPago(pagamento)}>
                                                        <CheckCircle className="mr-2 h-4 w-4" />
                                                        Marcar como Pago
                                                    </DropdownMenuItem>
                                                )}
                                                {pagamento.status !== 'PAGO' && (
                                                    <DropdownMenuItem
                                                        onClick={async () => {
                                                            try {
                                                                const { data } = await api.post(`/pagamentos/${pagamento.id}/gerar-link`);
                                                                await navigator.clipboard.writeText(data.paymentUrl);
                                                                toast.success('Link copiado!', {
                                                                    description: 'Link de pagamento copiado para a área de transferência',
                                                                });
                                                                fetchPagamentos();
                                                            } catch (error) {
                                                                const axiosErr = error as { response?: { data?: { error?: string } } };
                                                                const msg = axiosErr.response?.data?.error || 'Erro ao gerar link';
                                                                toast.error(msg);
                                                            }
                                                        }}
                                                    >
                                                        <Link2 className="mr-2 h-4 w-4" />
                                                        Gerar Link de Pagamento
                                                    </DropdownMenuItem>
                                                )}
                                                {pagamento.status === 'PAGO' && isPro && (
                                                    <DropdownMenuItem
                                                        onClick={() => router.push('/notas-fiscais')}
                                                    >
                                                        <Receipt className="mr-2 h-4 w-4" />
                                                        Emitir NFS-e
                                                    </DropdownMenuItem>
                                                )}
                                                <DropdownMenuItem onClick={() => handleEdit(pagamento)}>
                                                    <Pencil className="mr-2 h-4 w-4" />
                                                    Editar
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => {
                                                        setPagamentoToDelete(pagamento);
                                                        setDeleteDialogOpen(true);
                                                    }}
                                                    className="text-red-600"
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    Excluir
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <PagamentoDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                pagamento={selectedPagamento}
                onSuccess={fetchPagamentos}
            />

            {pagamentoToMarcar && (
                <MarcarPagoDialog
                    open={marcarPagoDialogOpen}
                    onOpenChange={setMarcarPagoDialogOpen}
                    pagamento={pagamentoToMarcar}
                    onSuccess={fetchPagamentos}
                />
            )}

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir Pagamento</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tem certeza que deseja excluir o pagamento{' '}
                            <strong>{pagamentoToDelete?.description}</strong>?
                            Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {isDeleting ? 'Excluindo...' : 'Excluir'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}