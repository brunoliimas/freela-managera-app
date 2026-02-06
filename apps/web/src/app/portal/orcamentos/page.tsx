'use client';

import { useEffect, useState, useCallback } from 'react';
import { FileText, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { RichTextDisplay } from '@/components/ui/rich-text-display';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
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
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import apiPortal from '@/lib/api-portal';
import { formatCurrency, formatDate } from '@/lib/format';
import { toast } from 'sonner';
import axios from 'axios';

interface Orcamento {
    id: string;
    number: string;
    title: string;
    description: string | null;
    value: number;
    status: string;
    validUntil: string | null;
    estimatedDays: number | null;
    createdAt: string;
    sentAt: string | null;
    approvedAt: string | null;
}

const statusColors: Record<string, string> = {
    RASCUNHO: 'bg-slate-100 text-slate-800',
    AGUARDANDO: 'bg-slate-100 text-slate-800',
    ENVIADO: 'bg-blue-100 text-blue-800',
    APROVADO: 'bg-green-100 text-green-800',
    RECUSADO: 'bg-red-100 text-red-800',
    REJEITADO: 'bg-red-100 text-red-800',
    EXPIRADO: 'bg-orange-100 text-orange-800',
};

const statusLabels: Record<string, string> = {
    RASCUNHO: 'Rascunho',
    AGUARDANDO: 'Aguardando',
    ENVIADO: 'Enviado',
    APROVADO: 'Aprovado',
    RECUSADO: 'Recusado',
    REJEITADO: 'Rejeitado',
    EXPIRADO: 'Expirado',
};

export default function PortalOrcamentosPage() {
    const [orcamentos, setOrcamentos] = useState<Orcamento[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; orcamento: Orcamento | null; acao: string }>({
        open: false,
        orcamento: null,
        acao: '',
    });
    const [isResponding, setIsResponding] = useState(false);
    const [detailDialog, setDetailDialog] = useState<{ open: boolean; orcamento: Orcamento | null }>({
        open: false,
        orcamento: null,
    });

    const fetchOrcamentos = useCallback(async () => {
        try {
            setLoading(true);
            const res = await apiPortal.get('/orcamentos');
            setOrcamentos(res.data);
        } catch {
            // Erros tratados pelo interceptor
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchOrcamentos();
    }, [fetchOrcamentos]);

    const filteredOrcamentos = statusFilter === 'all'
        ? orcamentos
        : orcamentos.filter((o) => o.status === statusFilter);

    const handleResponder = async () => {
        if (!confirmDialog.orcamento) return;

        setIsResponding(true);
        try {
            await apiPortal.patch(`/orcamentos/${confirmDialog.orcamento.id}/responder`, {
                acao: confirmDialog.acao,
            });
            toast.success(confirmDialog.acao === 'APROVADO' ? 'Orçamento aprovado!' : 'Orçamento recusado');
            fetchOrcamentos();
        } catch (error) {
            if (axios.isAxiosError(error)) {
                toast.error(error.response?.data?.error || 'Erro ao responder orçamento');
            } else {
                toast.error('Erro ao responder orçamento');
            }
        } finally {
            setIsResponding(false);
            setConfirmDialog({ open: false, orcamento: null, acao: '' });
        }
    };

    const isExpired = (orc: Orcamento) => {
        return orc.validUntil && new Date(orc.validUntil) < new Date() && orc.status === 'ENVIADO';
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-slate-900">Meus Orçamentos</h1>
                <p className="text-slate-600 mt-1">Visualize e responda aos orçamentos recebidos</p>
            </div>

            <div className="flex gap-4">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[200px]">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos os Status</SelectItem>
                        <SelectItem value="ENVIADO">Enviado</SelectItem>
                        <SelectItem value="APROVADO">Aprovado</SelectItem>
                        <SelectItem value="RECUSADO">Recusado</SelectItem>
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
                            <TableHead>Prazo</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Validade</TableHead>
                            <TableHead>Data</TableHead>
                            <TableHead className="w-[140px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                                    <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                    <TableCell><Skeleton className="h-8 w-28" /></TableCell>
                                </TableRow>
                            ))
                        ) : filteredOrcamentos.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center py-12 text-slate-500">
                                    Nenhum orçamento encontrado.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredOrcamentos.map((orc) => (
                                <TableRow key={orc.id}>
                                    <TableCell className="font-medium">{orc.number}</TableCell>
                                    <TableCell className="max-w-[200px] truncate">{orc.title}</TableCell>
                                    <TableCell className="font-semibold">{formatCurrency(orc.value)}</TableCell>
                                    <TableCell>
                                        {orc.estimatedDays ? `${orc.estimatedDays} dias` : '-'}
                                    </TableCell>
                                    <TableCell>
                                        <Badge className={statusColors[orc.status] || 'bg-slate-100 text-slate-800'}>
                                            {isExpired(orc) ? 'Expirado' : (statusLabels[orc.status] || orc.status)}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {orc.validUntil ? (
                                            <span className={isExpired(orc) ? 'text-red-600 font-medium' : ''}>
                                                {formatDate(orc.validUntil)}
                                            </span>
                                        ) : '-'}
                                    </TableCell>
                                    <TableCell>{formatDate(orc.createdAt)}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => setDetailDialog({ open: true, orcamento: orc })}
                                                title="Ver detalhes"
                                            >
                                                <FileText className="h-4 w-4" />
                                            </Button>
                                            {orc.status === 'ENVIADO' && !isExpired(orc) && (
                                                <>
                                                    <Button
                                                        size="sm"
                                                        className="bg-green-600 hover:bg-green-700 h-8"
                                                        onClick={() => setConfirmDialog({ open: true, orcamento: orc, acao: 'APROVADO' })}
                                                    >
                                                        <Check className="h-3 w-3 mr-1" />
                                                        Aprovar
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="text-red-600 border-red-200 hover:bg-red-50 h-8"
                                                        onClick={() => setConfirmDialog({ open: true, orcamento: orc, acao: 'RECUSADO' })}
                                                    >
                                                        <X className="h-3 w-3 mr-1" />
                                                        Recusar
                                                    </Button>
                                                </>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Summary Cards */}
            {!loading && orcamentos.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                        <CardContent className="pt-6">
                            <p className="text-sm text-slate-500">Aguardando Resposta</p>
                            <p className="text-2xl font-bold text-blue-600">
                                {orcamentos.filter((o) => o.status === 'ENVIADO').length}
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <p className="text-sm text-slate-500">Aprovados</p>
                            <p className="text-2xl font-bold text-green-600">
                                {orcamentos.filter((o) => o.status === 'APROVADO').length}
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <p className="text-sm text-slate-500">Valor Total Aprovado</p>
                            <p className="text-2xl font-bold text-emerald-600">
                                {formatCurrency(
                                    orcamentos
                                        .filter((o) => o.status === 'APROVADO')
                                        .reduce((sum, o) => sum + Number(o.value), 0)
                                )}
                            </p>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Detail Dialog */}
            <Dialog open={detailDialog.open} onOpenChange={(open) => setDetailDialog({ open, orcamento: open ? detailDialog.orcamento : null })}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>
                            {detailDialog.orcamento?.number} - {detailDialog.orcamento?.title}
                        </DialogTitle>
                    </DialogHeader>
                    {detailDialog.orcamento && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <Badge className={statusColors[detailDialog.orcamento.status] || 'bg-slate-100'}>
                                    {statusLabels[detailDialog.orcamento.status] || detailDialog.orcamento.status}
                                </Badge>
                            </div>

                            {detailDialog.orcamento.description && (
                                <div>
                                    <p className="text-sm font-medium text-slate-700 mb-1">Descrição</p>
                                    <RichTextDisplay content={detailDialog.orcamento.description} className="text-sm text-slate-600" />
                                </div>
                            )}

                            <Separator />

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-slate-500">Valor</p>
                                    <p className="text-xl font-bold text-green-600">
                                        {formatCurrency(detailDialog.orcamento.value)}
                                    </p>
                                </div>
                                {detailDialog.orcamento.estimatedDays && (
                                    <div>
                                        <p className="text-sm text-slate-500">Prazo Estimado</p>
                                        <p className="font-medium">{detailDialog.orcamento.estimatedDays} dias</p>
                                    </div>
                                )}
                                {detailDialog.orcamento.validUntil && (
                                    <div>
                                        <p className="text-sm text-slate-500">Válido até</p>
                                        <p className="font-medium">{formatDate(detailDialog.orcamento.validUntil)}</p>
                                    </div>
                                )}
                                <div>
                                    <p className="text-sm text-slate-500">Criado em</p>
                                    <p className="font-medium">{formatDate(detailDialog.orcamento.createdAt)}</p>
                                </div>
                                {detailDialog.orcamento.sentAt && (
                                    <div>
                                        <p className="text-sm text-slate-500">Enviado em</p>
                                        <p className="font-medium">{formatDate(detailDialog.orcamento.sentAt)}</p>
                                    </div>
                                )}
                                {detailDialog.orcamento.approvedAt && (
                                    <div>
                                        <p className="text-sm text-slate-500">Aprovado em</p>
                                        <p className="font-medium">{formatDate(detailDialog.orcamento.approvedAt)}</p>
                                    </div>
                                )}
                            </div>

                            {detailDialog.orcamento.status === 'ENVIADO' && !isExpired(detailDialog.orcamento) && (
                                <>
                                    <Separator />
                                    <div className="flex gap-3 justify-end">
                                        <Button
                                            variant="outline"
                                            className="text-red-600 border-red-200 hover:bg-red-50"
                                            onClick={() => {
                                                setDetailDialog({ open: false, orcamento: null });
                                                setConfirmDialog({ open: true, orcamento: detailDialog.orcamento, acao: 'RECUSADO' });
                                            }}
                                        >
                                            <X className="h-4 w-4 mr-2" />
                                            Recusar
                                        </Button>
                                        <Button
                                            className="bg-green-600 hover:bg-green-700"
                                            onClick={() => {
                                                setDetailDialog({ open: false, orcamento: null });
                                                setConfirmDialog({ open: true, orcamento: detailDialog.orcamento, acao: 'APROVADO' });
                                            }}
                                        >
                                            <Check className="h-4 w-4 mr-2" />
                                            Aprovar Orçamento
                                        </Button>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Confirm Dialog */}
            <AlertDialog open={confirmDialog.open} onOpenChange={(open) => !open && setConfirmDialog({ open: false, orcamento: null, acao: '' })}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {confirmDialog.acao === 'APROVADO' ? 'Aprovar Orçamento' : 'Recusar Orçamento'}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {confirmDialog.acao === 'APROVADO'
                                ? `Tem certeza que deseja aprovar o orçamento ${confirmDialog.orcamento?.number} no valor de ${confirmDialog.orcamento ? formatCurrency(confirmDialog.orcamento.value) : ''}?`
                                : `Tem certeza que deseja recusar o orçamento ${confirmDialog.orcamento?.number}?`
                            }
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleResponder}
                            disabled={isResponding}
                            className={confirmDialog.acao === 'APROVADO' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
                        >
                            {isResponding
                                ? 'Processando...'
                                : confirmDialog.acao === 'APROVADO'
                                    ? 'Confirmar Aprovação'
                                    : 'Confirmar Recusa'
                            }
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
