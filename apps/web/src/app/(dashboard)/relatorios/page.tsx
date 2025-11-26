'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Clock, Target } from 'lucide-react';
import { formatCurrency } from '@/lib/format';
import api from '@/lib/api';
import { toast } from 'sonner';
import type { RelatorioFinanceiro, ComparacaoAnual } from '@/types/relatorio';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const STATUS_LABELS: Record<string, string> = {
    EM_ANDAMENTO: 'Em Andamento',
    PAUSADO: 'Pausado',
    CONCLUIDO: 'Concluído',
    CANCELADO: 'Cancelado',
};

export default function RelatoriosPage() {
    const [loading, setLoading] = useState(true);
    const [anoSelecionado, setAnoSelecionado] = useState(new Date().getFullYear().toString());
    const [relatorio, setRelatorio] = useState<RelatorioFinanceiro | null>(null);
    const [comparacao, setComparacao] = useState<ComparacaoAnual | null>(null);

    const fetchRelatorios = async () => {
        try {
            setLoading(true);
            const [relatorioRes, comparacaoRes] = await Promise.all([
                api.get<RelatorioFinanceiro>(`/relatorios/financeiro?ano=${anoSelecionado}`),
                api.get<ComparacaoAnual>('/relatorios/comparacao-anual'),
            ]);
            setRelatorio(relatorioRes.data);
            setComparacao(comparacaoRes.data);
        } catch (error) {
            toast.error('Erro ao carregar relatórios');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRelatorios();
    }, [anoSelecionado]);

    if (loading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-10 w-64" />
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton key={i} className="h-32" />
                    ))}
                </div>
                <Skeleton className="h-96" />
            </div>
        );
    }

    if (!relatorio) return null;

    const anos = Array.from(
        { length: 5 },
        (_, i) => new Date().getFullYear() - i
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Relatórios</h1>
                    <p className="text-slate-600 mt-1">
                        Análise financeira e métricas do negócio
                    </p>
                </div>
                <Select value={anoSelecionado} onValueChange={setAnoSelecionado}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {anos.map((ano) => (
                            <SelectItem key={ano} value={ano.toString()}>
                                {ano}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Cards de Resumo */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-green-100 rounded-full">
                                <DollarSign className="h-6 w-6 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-600">Total Recebido</p>
                                <p className="text-2xl font-bold text-slate-900">
                                    {formatCurrency(relatorio.resumo.totalRecebido)}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-yellow-100 rounded-full">
                                <DollarSign className="h-6 w-6 text-yellow-600" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-600">A Receber</p>
                                <p className="text-2xl font-bold text-slate-900">
                                    {formatCurrency(relatorio.resumo.totalAReceber)}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-blue-100 rounded-full">
                                <Target className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-600">Ticket Médio</p>
                                <p className="text-2xl font-bold text-slate-900">
                                    {formatCurrency(relatorio.resumo.ticketMedio)}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-purple-100 rounded-full">
                                <Clock className="h-6 w-6 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-600">Tempo Médio</p>
                                <p className="text-2xl font-bold text-slate-900">
                                    {relatorio.resumo.tempoMedioEntrega} dias
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Comparação Anual */}
            {comparacao && (
                <Card>
                    <CardHeader>
                        <CardTitle>Comparação Anual</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <p className="text-sm text-slate-600 mb-2">{comparacao.anoAnterior.ano}</p>
                                <p className="text-2xl font-bold text-slate-900">
                                    {formatCurrency(comparacao.anoAnterior.faturamento)}
                                </p>
                                <p className="text-sm text-slate-500 mt-1">
                                    {comparacao.anoAnterior.pagamentos} pagamentos
                                </p>
                            </div>

                            <div>
                                <p className="text-sm text-slate-600 mb-2">{comparacao.anoAtual.ano}</p>
                                <p className="text-2xl font-bold text-slate-900">
                                    {formatCurrency(comparacao.anoAtual.faturamento)}
                                </p>
                                <p className="text-sm text-slate-500 mt-1">
                                    {comparacao.anoAtual.pagamentos} pagamentos
                                </p>
                            </div>

                            <div>
                                <p className="text-sm text-slate-600 mb-2">Crescimento</p>
                                <div className="flex items-center gap-2">
                                    {comparacao.crescimento >= 0 ? (
                                        <TrendingUp className="h-6 w-6 text-green-600" />
                                    ) : (
                                        <TrendingDown className="h-6 w-6 text-red-600" />
                                    )}
                                    <p
                                        className={`text-2xl font-bold ${comparacao.crescimento >= 0 ? 'text-green-600' : 'text-red-600'
                                            }`}
                                    >
                                        {comparacao.crescimento >= 0 ? '+' : ''}
                                        {comparacao.crescimento}%
                                    </p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Gráfico de Faturamento Mensal */}
            <Card>
                <CardHeader>
                    <CardTitle>Faturamento Mensal - {anoSelecionado}</CardTitle>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={relatorio.faturamentoMensal}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="mesNome" />
                            <YAxis />
                            <Tooltip
                                formatter={(value: number) => formatCurrency(value)}
                            />
                            <Legend />
                            <Line
                                type="monotone"
                                dataKey="valor"
                                stroke="#3b82f6"
                                strokeWidth={2}
                                name="Faturamento"
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Projetos por Status */}
                <Card>
                    <CardHeader>
                        <CardTitle>Projetos por Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={relatorio.projetosPorStatus.map((item) => ({
                                        name: STATUS_LABELS[item.status] || item.status,
                                        value: item.quantidade,
                                    }))}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={(entry: { name: string; percent?: number }) => {
                                        const percent = entry.percent || 0;
                                        return `${entry.name} ${(percent * 100).toFixed(0)}%`;
                                    }}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {relatorio.projetosPorStatus.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Top Clientes */}
                <Card>
                    <CardHeader>
                        <CardTitle>Top 5 Clientes</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={relatorio.topClientes}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="nome" />
                                <YAxis />
                                <Tooltip
                                    formatter={(value: number) => formatCurrency(value)}
                                />
                                <Legend />
                                <Bar dataKey="valor" fill="#10b981" name="Valor Total" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Taxa de Conversão */}
            <Card>
                <CardHeader>
                    <CardTitle>Taxa de Conversão</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="text-center">
                            <p className="text-4xl font-bold text-blue-600">
                                {relatorio.taxaConversao.solicitacoes}
                            </p>
                            <p className="text-sm text-slate-600 mt-2">Solicitações</p>
                        </div>

                        <div className="text-center">
                            <p className="text-4xl font-bold text-green-600">
                                {relatorio.taxaConversao.orcamentos}
                            </p>
                            <p className="text-sm text-slate-600 mt-2">Orçamentos</p>
                            <p className="text-xs text-slate-500 mt-1">
                                {relatorio.taxaConversao.solicitacaoParaOrcamento}% de conversão
                            </p>
                        </div>

                        <div className="text-center">
                            <p className="text-4xl font-bold text-purple-600">
                                {relatorio.taxaConversao.projetos}
                            </p>
                            <p className="text-sm text-slate-600 mt-2">Projetos</p>
                            <p className="text-xs text-slate-500 mt-1">
                                {relatorio.taxaConversao.orcamentoParaProjeto}% de conversão
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}