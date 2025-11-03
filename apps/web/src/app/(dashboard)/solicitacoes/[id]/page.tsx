'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Mail, Building2, Calendar, DollarSign, FileText, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { OrcamentoDialog } from '@/components/orcamentos/OrcamentoDialog';
import { Solicitacao } from '@/types/solicitacao';
import { formatDate, formatCurrency } from '@/lib/format';
import api from '@/lib/api';
import { toast } from 'sonner';
import axios from 'axios';

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

export default function SolicitacaoDetailsPage({
    params
}: {
    params: Promise<{ id: string }>
}) {
    const router = useRouter();
    const { id } = use(params);
    const [solicitacao, setSolicitacao] = useState<Solicitacao | null>(null);
    const [loading, setLoading] = useState(true);
    const [orcamentoDialogOpen, setOrcamentoDialogOpen] = useState(false);

    const fetchSolicitacao = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/solicitacoes/${id}`);
            setSolicitacao(response.data);
        } catch (error) {
            if (axios.isAxiosError(error)) {
                toast.error(error.response?.data?.error || 'Erro ao carregar solicitação');
            } else {
                toast.error('Erro ao carregar solicitação');
            }
            router.push('/solicitacoes');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSolicitacao();
    }, [id]);

    const handleStatusChange = async (newStatus: string) => {
        try {
            await api.patch(`/solicitacoes/${id}/status`, {
                status: newStatus,
            });
            toast.success('Status atualizado!');
            fetchSolicitacao();
        } catch (error) {
            if (axios.isAxiosError(error)) {
                toast.error(error.response?.data?.error || 'Erro ao atualizar status');
            } else {
                toast.error('Erro ao atualizar status');
            }
        }
    };

    const handleOrcamentoCriado = () => {
        fetchSolicitacao();
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-10 w-64" />
                <Skeleton className="h-64 w-full" />
            </div>
        );
    }

    if (!solicitacao) return null;

    const orcamento = (solicitacao as any).orcamento;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.push('/solicitacoes')}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-bold text-slate-900">{solicitacao.title}</h1>
                            <Badge className={statusColors[solicitacao.status]}>
                                {statusLabels[solicitacao.status]}
                            </Badge>
                        </div>
                        <p className="text-slate-600 mt-1">
                            Solicitado em {formatDate(solicitacao.createdAt)}
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    {!orcamento && (
                        <Button onClick={() => setOrcamentoDialogOpen(true)}>
                            <Plus className="mr-2 h-4 w-4" />
                            Criar Orçamento
                        </Button>
                    )}
                </div>
            </div>

            {orcamento && (
                <Card className="border-green-200 bg-green-50">
                    <CardHeader>
                        <CardTitle className="text-green-900">Orçamento Criado</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium">{orcamento.number} - {orcamento.title}</p>
                                <p className="text-sm text-green-700 mt-1">
                                    Valor: {formatCurrency(orcamento.value)}
                                </p>
                            </div>
                            <Button
                                variant="outline"
                                onClick={() => router.push(`/orcamentos/${orcamento.id}`)}
                            >
                                <FileText className="mr-2 h-4 w-4" />
                                Ver Orçamento
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Detalhes da Solicitação</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div>
                            <p className="text-sm text-slate-600 mb-2">Descrição</p>
                            <p className="text-slate-800 whitespace-pre-wrap">{solicitacao.description}</p>
                        </div>

                        <Separator />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {solicitacao.budget && (
                                <div className="flex items-center gap-3">
                                    <DollarSign className="h-5 w-5 text-slate-400" />
                                    <div>
                                        <p className="text-sm text-slate-600">Orçamento Estimado pelo Cliente</p>
                                        <p className="font-medium">{formatCurrency(solicitacao.budget)}</p>
                                    </div>
                                </div>
                            )}

                            {solicitacao.deadline && (
                                <div className="flex items-center gap-3">
                                    <Calendar className="h-5 w-5 text-slate-400" />
                                    <div>
                                        <p className="text-sm text-slate-600">Prazo Desejado pelo Cliente</p>
                                        <p className="font-medium">{formatDate(solicitacao.deadline)}</p>
                                    </div>
                                </div>
                            )}
                        </div>
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
                                    <p className="font-medium">{solicitacao.cliente?.name}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <Mail className="h-5 w-5 text-slate-400" />
                                <div>
                                    <p className="text-sm text-slate-600">Email</p>
                                    <p className="font-medium">{solicitacao.cliente?.email}</p>
                                </div>
                            </div>

                            {solicitacao.cliente?.company && (
                                <div className="flex items-center gap-3">
                                    <Building2 className="h-5 w-5 text-slate-400" />
                                    <div>
                                        <p className="text-sm text-slate-600">Empresa</p>
                                        <p className="font-medium">{solicitacao.cliente.company}</p>
                                    </div>
                                </div>
                            )}

                            <Separator />

                            <Button
                                variant="outline"
                                className="w-full"
                                onClick={() => router.push(`/clientes/${solicitacao.clienteId}`)}
                            >
                                Ver Perfil Completo
                            </Button>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Alterar Status</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Select
                                value={solicitacao.status}
                                onValueChange={handleStatusChange}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="NOVA">Nova</SelectItem>
                                    <SelectItem value="ANALISANDO">Analisando</SelectItem>
                                    <SelectItem value="ORCAMENTO_ENVIADO">Orçamento Enviado</SelectItem>
                                    <SelectItem value="ARQUIVADA">Arquivada</SelectItem>
                                </SelectContent>
                            </Select>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <OrcamentoDialog
                open={orcamentoDialogOpen}
                onOpenChange={setOrcamentoDialogOpen}
                solicitacao={solicitacao}
                onSuccess={handleOrcamentoCriado}
            />
        </div>
    );
}