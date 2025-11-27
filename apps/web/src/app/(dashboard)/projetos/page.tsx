'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Eye, Pencil, Trash2, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
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
import { ProjetoDialog } from '@/components/projetos/ProjetoDialog';
import { Projeto } from '@/types/projeto';
import { formatDate, formatCurrency } from '@/lib/format';
import api from '@/lib/api';
import { toast } from 'sonner';
import axios from 'axios';

const statusColors: Record<string, string> = {
    EM_ANDAMENTO: 'bg-blue-500',
    PAUSADO: 'bg-yellow-500',
    CONCLUIDO: 'bg-green-500',
    CANCELADO: 'bg-red-500',
};

const statusLabels: Record<string, string> = {
    EM_ANDAMENTO: 'Em Andamento',
    PAUSADO: 'Pausado',
    CONCLUIDO: 'Concluído',
    CANCELADO: 'Cancelado',
};

export default function ProjetosPage() {
    const router = useRouter();
    const [projetos, setProjetos] = useState<Projeto[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedProjeto, setSelectedProjeto] = useState<Projeto | undefined>();
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [projetoToDelete, setProjetoToDelete] = useState<Projeto | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchProjetos = useCallback(async () => {
        try {
            setLoading(true);
            const params: Record<string, string> = {};
            if (statusFilter !== 'all') {
                params.status = statusFilter;
            }

            const response = await api.get('/projetos', { params });
            setProjetos(response.data);
        } catch (error) {
            toast.error('Erro ao carregar projetos');
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, [statusFilter]);

    useEffect(() => {
        fetchProjetos();
    }, [fetchProjetos]);

    const handleEdit = (projeto: Projeto) => {
        setSelectedProjeto(projeto);
        setDialogOpen(true);
    };

    const handleNew = () => {
        setSelectedProjeto(undefined);
        setDialogOpen(true);
    };

    const handleDelete = async () => {
        if (!projetoToDelete) return;

        setIsDeleting(true);
        try {
            await api.delete(`/projetos/${projetoToDelete.id}`);
            toast.success('Projeto excluído com sucesso!');
            fetchProjetos();
        } catch (error) {
            if (axios.isAxiosError(error)) {
                toast.error(error.response?.data?.error || 'Erro ao excluir projeto');
            } else {
                toast.error('Erro ao excluir projeto');
            }
        } finally {
            setIsDeleting(false);
            setDeleteDialogOpen(false);
            setProjetoToDelete(null);
        }
    };

    const handleView = (id: string) => {
        router.push(`/projetos/${id}`);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Projetos</h1>
                    <p className="text-slate-600 mt-1">
                        Gerencie seus projetos em andamento
                    </p>
                </div>
                <Button onClick={handleNew}>
                    <Plus className="mr-2 h-4 w-4" />
                    Novo Projeto
                </Button>
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
                            <TableHead>Cliente</TableHead>
                            <TableHead>Valor</TableHead>
                            <TableHead>Progresso</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Entrega</TableHead>
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
                                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                    <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                    <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                                </TableRow>
                            ))
                        ) : projetos.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center py-12 text-slate-500">
                                    Nenhum projeto encontrado.
                                </TableCell>
                            </TableRow>
                        ) : (
                            projetos.map((projeto) => {
                                const progressoEfetivo = projeto.status === 'CONCLUIDO' ? 100 : projeto.progress;
                                return (
                                    <TableRow key={projeto.id}>
                                        <TableCell className="font-medium">{projeto.number}</TableCell>
                                        <TableCell>{projeto.title}</TableCell>
                                        <TableCell>
                                            <div>
                                                <p className="font-medium">{projeto.cliente?.name}</p>
                                                <p className="text-xs text-slate-500">{projeto.cliente?.company}</p>
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-semibold">
                                            {formatCurrency(projeto.value)}
                                        </TableCell>
                                        <TableCell>
                                            <div className="space-y-1">
                                                <Progress value={progressoEfetivo} className="h-2" />
                                                <p className="text-xs text-slate-500">{progressoEfetivo}%</p>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={statusColors[projeto.status]}>
                                                {statusLabels[projeto.status]}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {projeto.endDate ? formatDate(projeto.endDate) : '-'}
                                        </TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => handleView(projeto.id)}>
                                                        <Eye className="mr-2 h-4 w-4" />
                                                        Visualizar
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleEdit(projeto)}>
                                                        <Pencil className="mr-2 h-4 w-4" />
                                                        Editar
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => {
                                                            setProjetoToDelete(projeto);
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
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>

            <ProjetoDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                projeto={selectedProjeto}
                onSuccess={fetchProjetos}
            />

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir Projeto</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tem certeza que deseja excluir o projeto{' '}
                            <strong>{projetoToDelete?.number}</strong>?
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