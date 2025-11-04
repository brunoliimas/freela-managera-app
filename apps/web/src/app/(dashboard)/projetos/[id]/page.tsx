'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft,
    Mail,
    Building2,
    Calendar,
    DollarSign,
    Pencil,
    FileText,
    Plus,
    CheckCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { ProjetoDialog } from '@/components/projetos/ProjetoDialog';
import { MilestoneItem } from '@/components/projetos/MilestoneItem';
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

export default function ProjetoDetailsPage({
    params
}: {
    params: Promise<{ id: string }>
}) {
    const router = useRouter();
    const { id } = use(params);
    const [projeto, setProjeto] = useState<Projeto | null>(null);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [updatingStatus, setUpdatingStatus] = useState(false);
    const [addingMilestone, setAddingMilestone] = useState(false);
    const [newMilestoneTitle, setNewMilestoneTitle] = useState('');
    const [newMilestoneDescription, setNewMilestoneDescription] = useState('');

    const fetchProjeto = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/projetos/${id}`);
            setProjeto(response.data);
        } catch (error) {
            if (axios.isAxiosError(error)) {
                toast.error(error.response?.data?.error || 'Erro ao carregar projeto');
            } else {
                toast.error('Erro ao carregar projeto');
            }
            router.push('/projetos');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProjeto();
    }, [id]);

    const handleStatusChange = async (newStatus: string) => {
        if (!projeto) return;

        setUpdatingStatus(true);
        try {
            await api.put(`/projetos/${id}`, {
                status: newStatus,
            });
            toast.success('Status atualizado com sucesso!');
            fetchProjeto();
        } catch (error) {
            if (axios.isAxiosError(error)) {
                toast.error(error.response?.data?.error || 'Erro ao atualizar status');
            } else {
                toast.error('Erro ao atualizar status');
            }
        } finally {
            setUpdatingStatus(false);
        }
    };

    const handleAddMilestone = async () => {
        if (!newMilestoneTitle.trim()) {
            toast.error('Título é obrigatório');
            return;
        }

        try {
            await api.post(`/projetos/${id}/milestones`, {
                title: newMilestoneTitle,
                description: newMilestoneDescription,
            });
            toast.success('Milestone adicionado!');
            setNewMilestoneTitle('');
            setNewMilestoneDescription('');
            setAddingMilestone(false);
            fetchProjeto();
        } catch (error) {
            if (axios.isAxiosError(error)) {
                toast.error(error.response?.data?.error || 'Erro ao adicionar milestone');
            } else {
                toast.error('Erro ao adicionar milestone');
            }
        }
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-10 w-64" />
                <Skeleton className="h-64 w-full" />
            </div>
        );
    }

    if (!projeto) return null;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.push('/projetos')}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-bold text-slate-900">
                                {projeto.number}
                            </h1>
                            <Badge className={statusColors[projeto.status]}>
                                {statusLabels[projeto.status]}
                            </Badge>
                        </div>
                        <p className="text-slate-600 mt-1">{projeto.title}</p>
                    </div>
                </div>
                <Button onClick={() => setDialogOpen(true)} variant="outline">
                    <Pencil className="mr-2 h-4 w-4" />
                    Editar
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Progresso do Projeto</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Conclusão</span>
                            <span className="text-sm font-bold">{projeto.progress}%</span>
                        </div>
                        <Progress value={projeto.progress} className="h-3" />
                        <p className="text-xs text-slate-500">
                            {projeto.milestones?.filter(m => m.completed).length || 0} de{' '}
                            {projeto.milestones?.length || 0} milestones concluídos
                        </p>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Descrição do Projeto</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-slate-800 whitespace-pre-wrap">{projeto.description}</p>

                        {projeto.notes && (
                            <>
                                <Separator className="my-4" />
                                <div>
                                    <p className="text-sm font-semibold text-slate-700 mb-2">Observações</p>
                                    <p className="text-slate-600 whitespace-pre-wrap">{projeto.notes}</p>
                                </div>
                            </>
                        )}

                        {projeto.orcamento && (
                            <>
                                <Separator className="my-4" />
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <p className="text-sm font-semibold text-slate-700">Orçamento Original</p>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => router.push(`/orcamentos/${projeto.orcamento?.id}`)}
                                        >
                                            <FileText className="mr-2 h-4 w-4" />
                                            Ver Orçamento
                                        </Button>
                                    </div>
                                    <div className="bg-slate-50 p-4 rounded-lg">
                                        <p className="font-medium">{projeto.orcamento.number} - {projeto.orcamento.title}</p>
                                        <p className="text-sm text-slate-600 mt-1">
                                            Valor: {formatCurrency(projeto.orcamento.value)}
                                        </p>
                                    </div>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Informações do Cliente</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-3">
                                <Building2 className="h-5 w-5 text-slate-400" />
                                <div>
                                    <p className="text-sm text-slate-600">Nome</p>
                                    <p className="font-medium">{projeto.cliente?.name}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <Mail className="h-5 w-5 text-slate-400" />
                                <div>
                                    <p className="text-sm text-slate-600">Email</p>
                                    <p className="font-medium">{projeto.cliente?.email}</p>
                                </div>
                            </div>

                            {projeto.cliente?.company && (
                                <div className="flex items-center gap-3">
                                    <Building2 className="h-5 w-5 text-slate-400" />
                                    <div>
                                        <p className="text-sm text-slate-600">Empresa</p>
                                        <p className="font-medium">{projeto.cliente.company}</p>
                                    </div>
                                </div>
                            )}

                            <Separator />

                            <Button
                                variant="outline"
                                className="w-full"
                                onClick={() => router.push(`/clientes/${projeto.clienteId}`)}
                            >
                                Ver Perfil Completo
                            </Button>
                        </CardContent>
                    </Card>

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

                            <div className="flex items-center gap-3">
                                <Calendar className="h-5 w-5 text-slate-400" />
                                <div>
                                    <p className="text-sm text-slate-600">Data de Início</p>
                                    <p className="font-medium">{formatDate(projeto.startDate)}</p>
                                </div>
                            </div>

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

                    <Card>
                        <CardHeader>
                            <CardTitle>Alterar Status</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Select
                                value={projeto.status}
                                onValueChange={handleStatusChange}
                                disabled={updatingStatus}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="EM_ANDAMENTO">Em Andamento</SelectItem>
                                    <SelectItem value="PAUSADO">Pausado</SelectItem>
                                    <SelectItem value="CONCLUIDO">Concluído</SelectItem>
                                    <SelectItem value="CANCELADO">Cancelado</SelectItem>
                                </SelectContent>
                            </Select>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>Milestones</CardTitle>
                        <Button onClick={() => setAddingMilestone(true)} size="sm">
                            <Plus className="mr-2 h-4 w-4" />
                            Adicionar Milestone
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-3">
                    {addingMilestone && (
                        <div className="p-4 border rounded-lg bg-blue-50 border-blue-200 space-y-3">
                            <Input
                                placeholder="Título do milestone"
                                value={newMilestoneTitle}
                                onChange={(e) => setNewMilestoneTitle(e.target.value)}
                            />
                            <Textarea
                                placeholder="Descrição (opcional)"
                                value={newMilestoneDescription}
                                onChange={(e) => setNewMilestoneDescription(e.target.value)}
                                rows={2}
                            />
                            <div className="flex gap-2">
                                <Button onClick={handleAddMilestone} size="sm">
                                    Adicionar
                                </Button>
                                <Button
                                    onClick={() => {
                                        setAddingMilestone(false);
                                        setNewMilestoneTitle('');
                                        setNewMilestoneDescription('');
                                    }}
                                    size="sm"
                                    variant="outline"
                                >
                                    Cancelar
                                </Button>
                            </div>
                        </div>
                    )}

                    {!projeto.milestones || projeto.milestones.length === 0 ? (
                        <p className="text-center text-slate-500 py-8">
                            Nenhum milestone cadastrado ainda.
                            <br />
                            Adicione milestones para acompanhar o progresso do projeto.
                        </p>
                    ) : (
                        projeto.milestones.map((milestone) => (
                            <MilestoneItem
                                key={milestone.id}
                                milestone={milestone}
                                projetoId={id}
                                onUpdate={fetchProjeto}
                            />
                        ))
                    )}
                </CardContent>
            </Card>

            <ProjetoDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                projeto={projeto}
                onSuccess={fetchProjeto}
            />
        </div>
    );
}