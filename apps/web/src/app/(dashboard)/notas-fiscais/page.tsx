'use client';

import { useEffect, useState, useCallback } from 'react';
import {
    Receipt, Plus, MoreVertical, FileDown, FileText, XCircle,
    CheckCircle, Clock, AlertCircle, Download,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Dialog, DialogContent, DialogDescription, DialogFooter,
    DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/hooks/useAuth';
import { formatDate, formatCurrency } from '@/lib/format';
import api from '@/lib/api';
import { toast } from 'sonner';
import axios from 'axios';
import { downloadFile } from '@/lib/download';

interface NotaFiscal {
    id: string;
    enotasNfeId: string | null;
    numero: string | null;
    codigoVerificacao: string | null;
    status: string;
    descricaoServico: string;
    valor: number;
    issAliquota: number;
    issValor: number;
    pdfUrl: string | null;
    xmlUrl: string | null;
    motivoRejeicao: string | null;
    motivoCancelamento: string | null;
    createdAt: string;
    emitidaEm: string | null;
    canceladaEm: string | null;
    pagamento: {
        description: string;
        value: number;
        projeto: {
            number: string;
            title: string;
            cliente: {
                name: string;
                company: string | null;
            };
        };
    };
}

interface PagamentoPago {
    id: string;
    description: string;
    value: number;
    projeto: {
        number: string;
        title: string;
        cliente: {
            name: string;
            company: string | null;
        };
    };
}

const statusConfig: Record<string, { label: string; color: string; icon: typeof CheckCircle }> = {
    PENDENTE: { label: 'Pendente', color: 'bg-slate-500', icon: Clock },
    PROCESSANDO: { label: 'Processando', color: 'bg-blue-500', icon: Clock },
    AUTORIZADA: { label: 'Autorizada', color: 'bg-green-500', icon: CheckCircle },
    REJEITADA: { label: 'Rejeitada', color: 'bg-red-500', icon: AlertCircle },
    CANCELADA: { label: 'Cancelada', color: 'bg-slate-500', icon: XCircle },
};

export default function NotasFiscaisPage() {
    const { user } = useAuth();
    const isPro = user?.plan === 'PRO' || user?.plan === 'ENTERPRISE';

    const [notasFiscais, setNotasFiscais] = useState<NotaFiscal[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<string>('all');

    // Emissão dialog
    const [emitirDialogOpen, setEmitirDialogOpen] = useState(false);
    const [pagamentosPagos, setPagamentosPagos] = useState<PagamentoPago[]>([]);
    const [selectedPagamentoId, setSelectedPagamentoId] = useState('');
    const [descricaoServico, setDescricaoServico] = useState('');
    const [isEmitting, setIsEmitting] = useState(false);

    // Cancelamento dialog
    const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
    const [notaToCancel, setNotaToCancel] = useState<NotaFiscal | null>(null);
    const [motivoCancelamento, setMotivoCancelamento] = useState('');
    const [isCanceling, setIsCanceling] = useState(false);

    const fetchNotasFiscais = useCallback(async () => {
        try {
            setLoading(true);
            const params: Record<string, string> = {};
            if (statusFilter !== 'all') params.status = statusFilter;
            const response = await api.get('/notas-fiscais', { params });
            setNotasFiscais(response.data);
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 403) {
                // PRO plan required — silently handle
            } else {
                toast.error('Erro ao carregar notas fiscais');
            }
        } finally {
            setLoading(false);
        }
    }, [statusFilter]);

    useEffect(() => {
        if (isPro) fetchNotasFiscais();
        else setLoading(false);
    }, [fetchNotasFiscais, isPro]);

    const handleOpenEmitir = async () => {
        try {
            const response = await api.get('/pagamentos', { params: { status: 'PAGO' } });
            // Filter out pagamentos that already have a NF
            const existingNfPagamentos = new Set(notasFiscais.map(nf => nf.pagamento?.description));
            setPagamentosPagos(response.data);
            setEmitirDialogOpen(true);
        } catch {
            toast.error('Erro ao carregar pagamentos');
        }
    };

    const handleEmitir = async () => {
        if (!selectedPagamentoId || !descricaoServico.trim()) {
            toast.error('Preencha todos os campos');
            return;
        }

        setIsEmitting(true);
        try {
            await api.post('/notas-fiscais', {
                pagamentoId: selectedPagamentoId,
                descricaoServico: descricaoServico.trim(),
            });
            toast.success('NFS-e enviada para processamento!');
            setEmitirDialogOpen(false);
            setSelectedPagamentoId('');
            setDescricaoServico('');
            fetchNotasFiscais();
        } catch (error) {
            if (axios.isAxiosError(error)) {
                toast.error(error.response?.data?.error || 'Erro ao emitir NFS-e');
            }
        } finally {
            setIsEmitting(false);
        }
    };

    const handleCancelar = async () => {
        if (!notaToCancel || !motivoCancelamento.trim()) return;

        setIsCanceling(true);
        try {
            await api.post(`/notas-fiscais/${notaToCancel.id}/cancelar`, {
                motivo: motivoCancelamento.trim(),
            });
            toast.success('NFS-e cancelada com sucesso');
            setCancelDialogOpen(false);
            setNotaToCancel(null);
            setMotivoCancelamento('');
            fetchNotasFiscais();
        } catch (error) {
            if (axios.isAxiosError(error)) {
                toast.error(error.response?.data?.error || 'Erro ao cancelar NFS-e');
            }
        } finally {
            setIsCanceling(false);
        }
    };

    const handleDownload = async (id: string, type: 'pdf' | 'xml') => {
        try {
            const response = await api.get(`/notas-fiscais/${id}/${type}`, {
                responseType: 'blob',
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.download = `nfse-${id}.${type}`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch {
            toast.error(`Erro ao baixar ${type.toUpperCase()}`);
        }
    };

    if (!isPro) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Notas Fiscais</h1>
                    <p className="text-slate-600 mt-1">Emita NFS-e oficiais para seus clientes</p>
                </div>
                <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                        A emissão de NFS-e está disponível a partir do plano PRO.{' '}
                        <a href="/configuracoes?tab=assinatura" className="font-medium underline">
                            Fazer upgrade
                        </a>
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    const totalEmitidas = notasFiscais.length;
    const totalAutorizadas = notasFiscais.filter(nf => nf.status === 'AUTORIZADA').length;
    const totalValor = notasFiscais
        .filter(nf => nf.status === 'AUTORIZADA')
        .reduce((sum, nf) => sum + Number(nf.valor), 0);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Notas Fiscais</h1>
                    <p className="text-slate-600 mt-1">
                        Emita e gerencie suas NFS-e via eNotas
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={() => downloadFile('/export/notas-fiscais', 'notas-fiscais.csv').catch(() => toast.error('Erro ao exportar'))}
                    >
                        <Download className="mr-2 h-4 w-4" />
                        Exportar CSV
                    </Button>
                    <Button onClick={handleOpenEmitir}>
                        <Plus className="mr-2 h-4 w-4" />
                        Emitir NFS-e
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white border rounded-lg p-6">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-blue-100 rounded-full">
                            <Receipt className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-600">Total Emitidas</p>
                            <p className="text-2xl font-bold text-slate-900">{totalEmitidas}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white border rounded-lg p-6">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-green-100 rounded-full">
                            <CheckCircle className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-600">Autorizadas</p>
                            <p className="text-2xl font-bold text-green-600">{totalAutorizadas}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white border rounded-lg p-6">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-emerald-100 rounded-full">
                            <FileText className="h-6 w-6 text-emerald-600" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-600">Valor Total Autorizado</p>
                            <p className="text-2xl font-bold text-emerald-600">
                                {formatCurrency(totalValor)}
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
                        <SelectItem value="PROCESSANDO">Processando</SelectItem>
                        <SelectItem value="AUTORIZADA">Autorizada</SelectItem>
                        <SelectItem value="REJEITADA">Rejeitada</SelectItem>
                        <SelectItem value="CANCELADA">Cancelada</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Numero</TableHead>
                            <TableHead>Descricao</TableHead>
                            <TableHead>Cliente</TableHead>
                            <TableHead>Valor</TableHead>
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
                                    <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                    <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                                </TableRow>
                            ))
                        ) : notasFiscais.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-12 text-slate-500">
                                    Nenhuma nota fiscal encontrada.
                                </TableCell>
                            </TableRow>
                        ) : (
                            notasFiscais.map((nf) => {
                                const config = statusConfig[nf.status] || statusConfig.PENDENTE;
                                return (
                                    <TableRow key={nf.id}>
                                        <TableCell className="font-mono text-sm">
                                            {nf.numero || '-'}
                                        </TableCell>
                                        <TableCell>
                                            <div>
                                                <p className="font-medium text-sm truncate max-w-[250px]">
                                                    {nf.descricaoServico}
                                                </p>
                                                <p className="text-xs text-slate-500">
                                                    {nf.pagamento.projeto.number} - {nf.pagamento.projeto.title}
                                                </p>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div>
                                                <p className="font-medium text-sm">
                                                    {nf.pagamento.projeto.cliente.name}
                                                </p>
                                                {nf.pagamento.projeto.cliente.company && (
                                                    <p className="text-xs text-slate-500">
                                                        {nf.pagamento.projeto.cliente.company}
                                                    </p>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-semibold">
                                            {formatCurrency(nf.valor)}
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={config.color}>
                                                {config.label}
                                            </Badge>
                                            {nf.motivoRejeicao && (
                                                <p className="text-xs text-red-500 mt-1 max-w-[150px] truncate">
                                                    {nf.motivoRejeicao}
                                                </p>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {nf.emitidaEm
                                                ? formatDate(nf.emitidaEm)
                                                : formatDate(nf.createdAt)}
                                        </TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    {nf.status === 'AUTORIZADA' && (
                                                        <>
                                                            <DropdownMenuItem onClick={() => handleDownload(nf.id, 'pdf')}>
                                                                <Download className="mr-2 h-4 w-4" />
                                                                Download PDF
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => handleDownload(nf.id, 'xml')}>
                                                                <FileDown className="mr-2 h-4 w-4" />
                                                                Download XML
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onClick={() => {
                                                                    setNotaToCancel(nf);
                                                                    setCancelDialogOpen(true);
                                                                }}
                                                                className="text-red-600"
                                                            >
                                                                <XCircle className="mr-2 h-4 w-4" />
                                                                Cancelar NFS-e
                                                            </DropdownMenuItem>
                                                        </>
                                                    )}
                                                    {(nf.status === 'PENDENTE' || nf.status === 'PROCESSANDO') && (
                                                        <DropdownMenuItem disabled>
                                                            <Clock className="mr-2 h-4 w-4" />
                                                            Aguardando processamento...
                                                        </DropdownMenuItem>
                                                    )}
                                                    {nf.status === 'REJEITADA' && (
                                                        <DropdownMenuItem disabled>
                                                            <AlertCircle className="mr-2 h-4 w-4" />
                                                            {nf.motivoRejeicao || 'Rejeitada pela prefeitura'}
                                                        </DropdownMenuItem>
                                                    )}
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

            {/* Dialog: Emitir NFS-e */}
            <Dialog open={emitirDialogOpen} onOpenChange={setEmitirDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Emitir NFS-e</DialogTitle>
                        <DialogDescription>
                            Selecione um pagamento confirmado e descreva o servico prestado.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Pagamento</Label>
                            <Select value={selectedPagamentoId} onValueChange={setSelectedPagamentoId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione um pagamento pago" />
                                </SelectTrigger>
                                <SelectContent>
                                    {pagamentosPagos.map((p) => (
                                        <SelectItem key={p.id} value={p.id}>
                                            {p.description} - {formatCurrency(p.value)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Descricao do Servico</Label>
                            <Textarea
                                value={descricaoServico}
                                onChange={(e) => setDescricaoServico(e.target.value)}
                                placeholder="Descreva o servico prestado para a nota fiscal..."
                                rows={3}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEmitirDialogOpen(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={handleEmitir} disabled={isEmitting}>
                            {isEmitting ? 'Emitindo...' : 'Emitir NFS-e'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Dialog: Cancelar NFS-e */}
            <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Cancelar NFS-e</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tem certeza que deseja cancelar a nota fiscal{' '}
                            <strong>{notaToCancel?.numero}</strong>?
                            Informe o motivo do cancelamento.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="py-4">
                        <Textarea
                            value={motivoCancelamento}
                            onChange={(e) => setMotivoCancelamento(e.target.value)}
                            placeholder="Motivo do cancelamento (obrigatorio)..."
                            rows={3}
                        />
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Voltar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleCancelar}
                            disabled={isCanceling || !motivoCancelamento.trim()}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {isCanceling ? 'Cancelando...' : 'Confirmar Cancelamento'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
