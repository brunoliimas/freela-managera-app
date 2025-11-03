'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Eye, Pencil, Trash2, MoreVertical } from 'lucide-react';
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
import { OrcamentoDialog } from '@/components/orcamentos/OrcamentoDialog';
import { Orcamento } from '@/types/orcamento';
import { formatDate, formatCurrency } from '@/lib/format';
import api from '@/lib/api';
import { toast } from 'sonner';
import axios from 'axios';

const statusColors: Record<string, string> = {
    AGUARDANDO: 'bg-slate-500',
    ENVIADO: 'bg-blue-500',
    APROVADO: 'bg-green-500',
    RECUSADO: 'bg-red-500',
    EXPIRADO: 'bg-orange-500',
};

const statusLabels: Record<string, string> = {
    AGUARDANDO: 'Aguardando',
    ENVIADO: 'Enviado',
    APROVADO: 'Aprovado',
    RECUSADO: 'Recusado',
    EXPIRADO: 'Expirado',
};

export default function OrcamentosPage() {
    const router = useRouter();
    const [orcamentos, setOrcamentos] = useState<Orcamento[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedOrcamento, setSelectedOrcamento] = useState<Orcamento | undefined>();
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [orcamentoToDelete, setOrcamentoToDelete] = useState<Orcamento | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchOrcamentos = useCallback(async () => {
        try {
            setLoading(true);
            const params: Record<string, string> = {};
            if (statusFilter !== 'all') {
                params.status = statusFilter;
            }

            const response = await api.get('/orcamentos', { params });
            setOrcamentos(response.data);
        } catch (error) {
            toast.error('Erro ao carregar orçamentos');
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, [statusFilter]);

    useEffect(() => {
        fetchOrcamentos();
    }, [fetchOrcamentos]);

    const handleEdit = (orcamento: Orcamento) => {
        setSelectedOrcamento(orcamento);
        setDialogOpen(true);
    };

    const handleNew = () => {
        setSelectedOrcamento(undefined);
        setDialogOpen(true);
    };

    const handleDelete = async () => {
        if (!orcamentoToDelete) return;

        setIsDeleting(true);
        try {
            await api.delete(`/orcamentos/${orcamentoToDelete.id}`);
            toast.success('Orçamento excluído com sucesso!');
            fetchOrcamentos();
        } catch (error) {
            if (axios.isAxiosError(error)) {
                toast.error(error.response?.data?.error || 'Erro ao excluir orçamento');
            } else {
                toast.error('Erro ao excluir orçamento');
            }
        } finally {
            setIsDeleting(false);
            setDeleteDialogOpen(false);
            setOrcamentoToDelete(null);
        }
    };

    const handleView = (id: string) => {
        router.push(`/orcamentos/${id}`);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Orçamentos</h1>
                    <p className="text-slate-600 mt-1">
                        Gerencie seus orçamentos e propostas comerciais
                    </p>
                </div>
                <Button onClick={handleNew}>
                    <Plus className="mr-2 h-4 w-4" />
                    Novo Orçamento
                </Button>
            </div>

            <div className="flex gap-4">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[200px]">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos os Status</SelectItem>
                        <SelectItem value="AGUARDANDO">Aguardando</SelectItem>
                        <SelectItem value="ENVIADO">Enviado</SelectItem>
                        <SelectItem value="APROVADO">Aprovado</SelectItem>
                        <SelectItem value="RECUSADO">Recusado</SelectItem>
                        <SelectItem value="EXPIRADO">Expirado</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Número</TableHead>
                            <TableHead>Título</TableHead>
                            <TableHead>Cliente</TableHead>
                            <TableHead>Valor</TableHead>
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
                                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                                    <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                    <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                                </TableRow>
                            ))
                        ) : orcamentos.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center py-12 text-slate-500">
                                    Nenhum orçamento encontrado.
                                </TableCell>
                            </TableRow>
                        ) : (
                            orcamentos.map((orcamento) => (
                                <TableRow key={orcamento.id}>
                                    <TableCell className="font-medium">{orcamento.number}</TableCell>
                                    <TableCell>{orcamento.title}</TableCell>
                                    <TableCell>
                                        <div>
                                            <p className="font-medium">{orcamento.cliente?.name}</p>
                                            <p className="text-xs text-slate-500">{orcamento.cliente?.company}</p>
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-semibold">
                                        {formatCurrency(orcamento.value)}
                                    </TableCell>
                                    <TableCell>
                                        {orcamento.estimatedDays ? `${orcamento.estimatedDays} dias` : '-'}
                                    </TableCell>
                                    <TableCell>
                                        <Badge className={statusColors[orcamento.status]}>
                                            {statusLabels[orcamento.status]}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{formatDate(orcamento.createdAt)}</TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => handleView(orcamento.id)}>
                                                    <Eye className="mr-2 h-4 w-4" />
                                                    Visualizar
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleEdit(orcamento)}>
                                                    <Pencil className="mr-2 h-4 w-4" />
                                                    Editar
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => {
                                                        setOrcamentoToDelete(orcamento);
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

            <OrcamentoDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                orcamento={selectedOrcamento}
                onSuccess={fetchOrcamentos}
            />

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir Orçamento</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tem certeza que deseja excluir o orçamento{' '}
                            <strong>{orcamentoToDelete?.number}</strong>?
                            {orcamentoToDelete?.projeto && (
                                <span className="block mt-2 text-red-600">
                                    Este orçamento possui um projeto associado.
                                </span>
                            )}
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