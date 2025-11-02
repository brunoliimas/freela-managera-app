'use client';

import { useState } from 'react';
import { Plus, Search, MoreVertical, Pencil, Trash2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ClienteDialog } from '@/components/clientes/ClienteDialog';
import { useClientes } from '@/hooks/useClientes';
import { Cliente } from '@/types/cliente';
import { formatDate } from '@/lib/format';
import api from '@/lib/api';
import axios from 'axios';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export default function ClientesPage() {
    const router = useRouter();
    const { clientes, loading, search, setSearch, activeFilter, setActiveFilter, refetch } = useClientes();

    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedCliente, setSelectedCliente] = useState<Cliente | undefined>();
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [clienteToDelete, setClienteToDelete] = useState<Cliente | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleEdit = (cliente: Cliente) => {
        setSelectedCliente(cliente);
        setDialogOpen(true);
    };

    const handleNew = () => {
        setSelectedCliente(undefined);
        setDialogOpen(true);
    };

    const handleDelete = async () => {
        if (!clienteToDelete) return;

        setIsDeleting(true);
        try {
            await api.delete(`/clientes/${clienteToDelete.id}`);
            toast.success('Cliente excluído com sucesso!');
            refetch();
        } catch (error) {
            if (axios.isAxiosError(error)) {
                toast.error(error.response?.data?.error || 'Erro ao excluir cliente');
            } else {
                toast.error('Erro ao excluir cliente');
            }
        } finally {
            setIsDeleting(false);
            setDeleteDialogOpen(false);
            setClienteToDelete(null);
        }
    };

    const handleView = (id: string) => {
        router.push(`/clientes/${id}`);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Clientes</h1>
                    <p className="text-slate-600 mt-1">
                        Gerencie seus clientes e contatos
                    </p>
                </div>
                <Button onClick={handleNew}>
                    <Plus className="mr-2 h-4 w-4" />
                    Novo Cliente
                </Button>
            </div>

            {/* Filtros */}
            <div className="flex gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Buscar por nome, email ou empresa..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <Select value={activeFilter} onValueChange={(value: string) => setActiveFilter(value as 'all' | 'active' | 'inactive')}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="active">Apenas Ativos</SelectItem>
                        <SelectItem value="inactive">Apenas Inativos</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Tabela */}
            <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Empresa</TableHead>
                            <TableHead>Nome</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Telefone</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Projetos</TableHead>
                            <TableHead>Criado em</TableHead>
                            <TableHead className="w-[70px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            // Loading skeleton
                            Array.from({ length: 5 }).map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                    <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                    <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                                </TableRow>
                            ))
                        ) : clientes.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center py-12 text-slate-500">
                                    Nenhum cliente encontrado.
                                    {search && ' Tente buscar com outros termos.'}
                                </TableCell>
                            </TableRow>
                        ) : (
                            clientes.map((cliente) => (
                                <TableRow key={cliente.id}>
                                    <TableCell className="font-medium">{cliente.company || '-'}</TableCell>
                                    <TableCell className="text-slate-600">{cliente.name}</TableCell>
                                    <TableCell className="text-slate-600">{cliente.email}</TableCell>
                                    <TableCell className="text-slate-600">{cliente.phone || '-'}</TableCell>
                                    <TableCell>
                                        <Badge variant={cliente.active ? 'default' : 'secondary'}>
                                            {cliente.active ? 'Ativo' : 'Inativo'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-slate-600">
                                        {cliente._count?.projetos || 0}
                                    </TableCell>
                                    <TableCell className="text-slate-600">
                                        {formatDate(cliente.createdAt)}
                                    </TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => handleView(cliente.id)}>
                                                    <Eye className="mr-2 h-4 w-4" />
                                                    Visualizar
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleEdit(cliente)}>
                                                    <Pencil className="mr-2 h-4 w-4" />
                                                    Editar
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => {
                                                        setClienteToDelete(cliente);
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

            {/* Dialog de Criar/Editar */}
            <ClienteDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                cliente={selectedCliente}
                onSuccess={refetch}
            />

            {/* Dialog de Confirmação de Exclusão */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir Cliente</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tem certeza que deseja excluir <strong>{clienteToDelete?.name}</strong>?
                            {clienteToDelete?._count && clienteToDelete._count.projetos > 0 && (
                                <span className="block mt-2 text-red-600">
                                    Este cliente possui {clienteToDelete._count.projetos} projeto(s) associado(s).
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