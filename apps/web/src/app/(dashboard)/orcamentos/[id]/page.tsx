'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft,
    Mail,
    Building2,
    Calendar,
    DollarSign,
    Clock,
    Pencil,
    FileText,
    CheckCircle,
    FileDown
} from 'lucide-react';
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

export default function OrcamentoDetailsPage({
    params
}: {
    params: Promise<{ id: string }>
}) {
    const router = useRouter();
    const { id } = use(params);
    const [orcamento, setOrcamento] = useState<Orcamento | null>(null);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [updatingStatus, setUpdatingStatus] = useState(false);

    const fetchOrcamento = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/orcamentos/${id}`);
            setOrcamento(response.data);
        } catch (error) {
            if (axios.isAxiosError(error)) {
                toast.error(error.response?.data?.error || 'Erro ao carregar orçamento');
            } else {
                toast.error('Erro ao carregar orçamento');
            }
            router.push('/orcamentos');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrcamento();
    }, [id]);

    const handleGerarPDF = async () => {
        try {
            const response = await api.get(`/orcamentos/${id}/pdf`, {
                responseType: 'blob',
            });

            // Criar URL do blob
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `orcamento-${orcamento?.number}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            toast.success('PDF gerado com sucesso!');
        } catch (error) {
            toast.error('Erro ao gerar PDF');
            console.error(error);
        }
    };

    const handleStatusChange = async (newStatus: string) => {
        if (!orcamento) return;

        setUpdatingStatus(true);
        try {
            await api.put(`/orcamentos/${id}`, {
                status: newStatus,
            });
            toast.success('Status atualizado com sucesso!');
            fetchOrcamento();
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

    const handleEnviarEmail = async () => {
        if (!orcamento) return;

        try {
            await api.post(`/orcamentos/${id}/enviar-email`);
            toast.success('Orçamento enviado por email com sucesso!');
            fetchOrcamento();
        } catch (error) {
            if (axios.isAxiosError(error)) {
                toast.error(error.response?.data?.error || 'Erro ao enviar email');
            } else {
                toast.error('Erro ao enviar email');
            }
        }
    };

    const handleCreateProject = async () => {
        if (!orcamento) return;

        try {
            const response = await api.post('/projetos/from-orcamento', {
                orcamentoId: orcamento.id,
            });

            toast.success('Projeto criado com sucesso!');
            router.push(`/projetos/${response.data.projeto.id}`);
        } catch (error) {
            if (axios.isAxiosError(error)) {
                toast.error(error.response?.data?.error || 'Erro ao criar projeto');
            } else {
                toast.error('Erro ao criar projeto');
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

    if (!orcamento) return null;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.push('/orcamentos')}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-bold text-slate-900">
                                {orcamento.number}
                            </h1>
                            <Badge className={statusColors[orcamento.status]}>
                                {statusLabels[orcamento.status]}
                            </Badge>
                        </div>
                        <p className="text-slate-600 mt-1">{orcamento.title}</p>
                    </div>
                </div>

                <div className="flex gap-2">
                    <Button onClick={handleEnviarEmail} variant="outline" className='cursor-pointer'>
                        <Mail className="mr-2 h-4 w-4" />
                        Enviar por Email
                    </Button>
                    <Button onClick={handleGerarPDF} variant="outline" className='cursor-pointer'>
                        <FileDown className="mr-2 h-4 w-4" />
                        Gerar PDF
                    </Button>
                    <Button onClick={() => setDialogOpen(true)} variant="outline" className='cursor-pointer'>
                        <Pencil className="mr-2 h-4 w-4" />
                        Editar
                    </Button>
                    {orcamento.status === 'APROVADO' && !orcamento.projeto && (
                        <Button onClick={handleCreateProject}>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Criar Projeto
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Detalhes do Orçamento</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div>
                            <p className="text-sm text-slate-600 mb-2">Descrição</p>
                            <p className="text-slate-800 whitespace-pre-wrap">{orcamento.description}</p>
                        </div>

                        {orcamento.notes && (
                            <>
                                <Separator />
                                <div>
                                    <p className="text-sm text-slate-600 mb-2">Observações Internas</p>
                                    <p className="text-slate-800 whitespace-pre-wrap">{orcamento.notes}</p>
                                </div>
                            </>
                        )}

                        {orcamento.solicitacao && (
                            <>
                                <Separator />
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <p className="text-sm font-semibold text-slate-700">Solicitação Original</p>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => router.push(`/solicitacoes/${orcamento.solicitacao?.id}`)}
                                        >
                                            <FileText className="mr-2 h-4 w-4" />
                                            Ver Solicitação
                                        </Button>
                                    </div>
                                    <div className="bg-slate-50 p-4 rounded-lg space-y-2">
                                        <p className="font-medium">{orcamento.solicitacao.title}</p>
                                        <p className="text-sm text-slate-600">{orcamento.solicitacao.description}</p>
                                        {orcamento.solicitacao.budget && (
                                            <p className="text-sm text-slate-500">
                                                Orçamento estimado pelo cliente: {formatCurrency(orcamento.solicitacao.budget)}
                                            </p>
                                        )}
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
                                    <p className="font-medium">{orcamento.cliente?.name}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <Mail className="h-5 w-5 text-slate-400" />
                                <div>
                                    <p className="text-sm text-slate-600">Email</p>
                                    <p className="font-medium">{orcamento.cliente?.email}</p>
                                </div>
                            </div>

                            {orcamento.cliente?.company && (
                                <div className="flex items-center gap-3">
                                    <Building2 className="h-5 w-5 text-slate-400" />
                                    <div>
                                        <p className="text-sm text-slate-600">Empresa</p>
                                        <p className="font-medium">{orcamento.cliente.company}</p>
                                    </div>
                                </div>
                            )}

                            <Separator />

                            <Button
                                variant="outline"
                                className="w-full"
                                onClick={() => router.push(`/clientes/${orcamento.clienteId}`)}
                            >
                                Ver Perfil Completo
                            </Button>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Valores e Prazos</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-3">
                                <DollarSign className="h-5 w-5 text-slate-400" />
                                <div>
                                    <p className="text-sm text-slate-600">Valor do Orçamento</p>
                                    <p className="text-2xl font-bold text-green-600">
                                        {formatCurrency(orcamento.value)}
                                    </p>
                                </div>
                            </div>

                            {orcamento.estimatedDays && (
                                <div className="flex items-center gap-3">
                                    <Clock className="h-5 w-5 text-slate-400" />
                                    <div>
                                        <p className="text-sm text-slate-600">Prazo Estimado</p>
                                        <p className="font-medium">{orcamento.estimatedDays} dias</p>
                                    </div>
                                </div>
                            )}

                            {orcamento.validUntil && (
                                <div className="flex items-center gap-3">
                                    <Calendar className="h-5 w-5 text-slate-400" />
                                    <div>
                                        <p className="text-sm text-slate-600">Válido até</p>
                                        <p className="font-medium">{formatDate(orcamento.validUntil)}</p>
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
                                value={orcamento.status}
                                onValueChange={handleStatusChange}
                                disabled={updatingStatus}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="AGUARDANDO">Aguardando</SelectItem>
                                    <SelectItem value="ENVIADO">Enviado</SelectItem>
                                    <SelectItem value="APROVADO">Aprovado</SelectItem>
                                    <SelectItem value="RECUSADO">Recusado</SelectItem>
                                    <SelectItem value="EXPIRADO">Expirado</SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-slate-500 mt-2">
                                Criado em {formatDate(orcamento.createdAt)}
                            </p>
                            {orcamento.sentAt && (
                                <p className="text-xs text-slate-500">
                                    Enviado em {formatDate(orcamento.sentAt)}
                                </p>
                            )}
                            {orcamento.approvedAt && (
                                <p className="text-xs text-slate-500">
                                    Aprovado em {formatDate(orcamento.approvedAt)}
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    {orcamento.projeto && (
                        <Card className="border-green-200 bg-green-50">
                            <CardHeader>
                                <CardTitle className="text-green-900">Projeto Criado</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-green-700 mb-3">
                                    Este orçamento foi convertido em projeto
                                </p>
                                <Button
                                    variant="outline"
                                    className="w-full"
                                    onClick={() => router.push(`/projetos/${orcamento.projeto?.id}`)}
                                >
                                    <FileText className="mr-2 h-4 w-4" />
                                    Ver Projeto {orcamento.projeto.number}
                                </Button>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>

            <OrcamentoDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                orcamento={orcamento}
                onSuccess={fetchOrcamento}
            />
        </div>
    );
}