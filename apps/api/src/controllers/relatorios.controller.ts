import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middlewares/auth.middleware';

export const getRelatorioFinanceiro = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId!;
        const { ano, mes } = req.query;

        // Data inicial e final para filtro
        const anoAtual = ano ? parseInt(ano as string) : new Date().getFullYear();
        const dataInicio = new Date(anoAtual, 0, 1); // 1º de janeiro
        const dataFim = new Date(anoAtual, 11, 31, 23, 59, 59); // 31 de dezembro

        // Faturamento mensal (pagamentos recebidos)
        const pagamentosPorMes = await prisma.$queryRaw<Array<{ mes: number; total: number }>>`
      SELECT 
        EXTRACT(MONTH FROM "paidAt") as mes,
        SUM(value) as total
      FROM "Pagamento"
      WHERE "userId" = ${userId}
        AND status = 'PAGO'
        AND "paidAt" >= ${dataInicio}
        AND "paidAt" <= ${dataFim}
      GROUP BY mes
      ORDER BY mes
    `;

        // Formatar faturamento mensal
        const faturamentoMensal = Array.from({ length: 12 }, (_, i) => {
            const mes = i + 1;
            const pagamento = pagamentosPorMes.find(p => Number(p.mes) === mes);
            return {
                mes: mes,
                mesNome: new Date(anoAtual, i).toLocaleString('pt-BR', { month: 'short' }),
                valor: pagamento ? Number(pagamento.total) : 0,
            };
        });

        // Projetos por status
        const projetosPorStatus = await prisma.projeto.groupBy({
            by: ['status'],
            where: {
                userId,
                createdAt: {
                    gte: dataInicio,
                    lte: dataFim,
                },
            },
            _count: {
                id: true,
            },
        });

        // Top 5 clientes
        const topClientes = await prisma.cliente.findMany({
            where: { userId },
            select: {
                id: true,
                name: true,
                company: true,
                projetos: {
                    where: {
                        createdAt: {
                            gte: dataInicio,
                            lte: dataFim,
                        },
                    },
                    select: {
                        value: true,
                    },
                },
            },
        });

        const clientesComValor = topClientes
            .map(cliente => ({
                id: cliente.id,
                nome: cliente.company || cliente.name,
                valor: cliente.projetos.reduce((sum, p) => sum + p.value.toNumber(), 0),
                projetos: cliente.projetos.length,
            }))
            .filter(c => c.valor > 0)
            .sort((a, b) => b.valor - a.valor)
            .slice(0, 5);

        // Taxa de conversão (Solicitações → Orçamentos → Projetos)
        const [totalSolicitacoes, totalOrcamentos, totalProjetos] = await Promise.all([
            prisma.solicitacao.count({
                where: {
                    userId,
                    createdAt: {
                        gte: dataInicio,
                        lte: dataFim,
                    },
                },
            }),
            prisma.orcamento.count({
                where: {
                    userId,
                    createdAt: {
                        gte: dataInicio,
                        lte: dataFim,
                    },
                },
            }),
            prisma.projeto.count({
                where: {
                    userId,
                    createdAt: {
                        gte: dataInicio,
                        lte: dataFim,
                    },
                },
            }),
        ]);

        const taxaConversao = {
            solicitacoes: totalSolicitacoes,
            orcamentos: totalOrcamentos,
            projetos: totalProjetos,
            solicitacaoParaOrcamento: totalSolicitacoes > 0
                ? ((totalOrcamentos / totalSolicitacoes) * 100).toFixed(1)
                : '0',
            orcamentoParaProjeto: totalOrcamentos > 0
                ? ((totalProjetos / totalOrcamentos) * 100).toFixed(1)
                : '0',
        };

        // Tempo médio de entrega
        const projetosConcluidos = await prisma.projeto.findMany({
            where: {
                userId,
                status: 'CONCLUIDO',
                completedAt: {
                    not: null,
                },
                createdAt: {
                    gte: dataInicio,
                    lte: dataFim,
                },
            },
            select: {
                startDate: true,
                completedAt: true,
            },
        });

        let tempoMedioEntrega = 0;
        if (projetosConcluidos.length > 0) {
            const totalDias = projetosConcluidos.reduce((sum, p) => {
                const dias = Math.ceil(
                    (new Date(p.completedAt!).getTime() - new Date(p.startDate).getTime()) /
                    (1000 * 60 * 60 * 24)
                );
                return sum + dias;
            }, 0);
            tempoMedioEntrega = Math.round(totalDias / projetosConcluidos.length);
        }

        // Resumo geral
        const [totalRecebido, totalAReceber, ticketMedio] = await Promise.all([
            prisma.pagamento.aggregate({
                where: {
                    userId,
                    status: 'PAGO',
                    paidAt: {
                        gte: dataInicio,
                        lte: dataFim,
                    },
                },
                _sum: { value: true },
            }),
            prisma.pagamento.aggregate({
                where: {
                    userId,
                    status: { in: ['PENDENTE', 'ATRASADO'] },
                },
                _sum: { value: true },
            }),
            prisma.projeto.aggregate({
                where: {
                    userId,
                    createdAt: {
                        gte: dataInicio,
                        lte: dataFim,
                    },
                },
                _avg: { value: true },
            }),
        ]);

        const resumo = {
            totalRecebido: totalRecebido._sum.value?.toNumber() || 0,
            totalAReceber: totalAReceber._sum.value?.toNumber() || 0,
            ticketMedio: ticketMedio._avg.value?.toNumber() || 0,
            projetosConcluidos: projetosConcluidos.length,
            tempoMedioEntrega,
        };

        return res.json({
            ano: anoAtual,
            faturamentoMensal,
            projetosPorStatus: projetosPorStatus.map(p => ({
                status: p.status,
                quantidade: p._count.id,
            })),
            topClientes: clientesComValor,
            taxaConversao,
            resumo,
        });
    } catch (error) {
        console.error('Get relatório financeiro error:', error);
        return res.status(500).json({
            error: 'Erro ao gerar relatório',
        });
    }
};

export const getComparacaoAnual = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId!;
        const anoAtual = new Date().getFullYear();
        const anoAnterior = anoAtual - 1;

        const dadosAnos = await Promise.all([
            // Ano atual
            prisma.pagamento.aggregate({
                where: {
                    userId,
                    status: 'PAGO',
                    paidAt: {
                        gte: new Date(anoAtual, 0, 1),
                        lte: new Date(anoAtual, 11, 31),
                    },
                },
                _sum: { value: true },
                _count: true,
            }),
            // Ano anterior
            prisma.pagamento.aggregate({
                where: {
                    userId,
                    status: 'PAGO',
                    paidAt: {
                        gte: new Date(anoAnterior, 0, 1),
                        lte: new Date(anoAnterior, 11, 31),
                    },
                },
                _sum: { value: true },
                _count: true,
            }),
        ]);

        const valorAnoAtual = dadosAnos[0]._sum.value?.toNumber() || 0;
        const valorAnoAnterior = dadosAnos[1]._sum.value?.toNumber() || 0;

        const crescimento = valorAnoAnterior > 0
            ? (((valorAnoAtual - valorAnoAnterior) / valorAnoAnterior) * 100).toFixed(1)
            : '0';

        return res.json({
            anoAtual: {
                ano: anoAtual,
                faturamento: valorAnoAtual,
                pagamentos: dadosAnos[0]._count,
            },
            anoAnterior: {
                ano: anoAnterior,
                faturamento: valorAnoAnterior,
                pagamentos: dadosAnos[1]._count,
            },
            crescimento: Number(crescimento),
        });
    } catch (error) {
        console.error('Get comparação anual error:', error);
        return res.status(500).json({
            error: 'Erro ao gerar comparação',
        });
    }
};