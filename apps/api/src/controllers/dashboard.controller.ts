import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middlewares/auth.middleware';

export const getDashboardStats = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId!;

        // Buscar dados em paralelo para melhor performance
        const [
            totalClientes,
            clientesAtivos,
            totalProjetos,
            projetosEmAndamento,
            projetosConcluidos,
            totalOrcamentos,
            orcamentosAguardando,
            orcamentosEnviados,
            orcamentosAprovados,
            pagamentosPendentes,
            pagamentosPagos,
            faturamentoTotal,
            faturamentoRecebido,
            projetosRecentes,
            orcamentosRecentes,
            totalSolicitacoes,
            solicitacoesNovas,
            solicitacoesRecentes,
        ] = await Promise.all([
            // Clientes
            prisma.cliente.count({ where: { userId } }),
            prisma.cliente.count({ where: { userId, active: true } }),

            // Projetos
            prisma.projeto.count({ where: { userId } }),
            prisma.projeto.count({
                where: { userId, status: 'EM_ANDAMENTO' }
            }),
            prisma.projeto.count({
                where: { userId, status: 'CONCLUIDO' }
            }),

            // Orçamentos
            prisma.orcamento.count({ where: { userId } }),
            prisma.orcamento.count({
                where: { userId, status: 'AGUARDANDO' }
            }),
            prisma.orcamento.count({
                where: { userId, status: 'ENVIADO' }
            }),
            prisma.orcamento.count({
                where: { userId, status: 'APROVADO' }
            }),

            // Pagamentos
            prisma.pagamento.count({
                where: { userId, status: 'PENDENTE' }
            }),
            prisma.pagamento.count({
                where: { userId, status: 'PAGO' }
            }),

            // Faturamento total (soma de todos os projetos)
            prisma.projeto.aggregate({
                where: { userId },
                _sum: { value: true },
            }),

            // Faturamento recebido (soma de pagamentos pagos)
            prisma.pagamento.aggregate({
                where: { userId, status: 'PAGO' },
                _sum: { value: true },
            }),

            // Projetos recentes
            prisma.projeto.findMany({
                where: { userId },
                take: 5,
                orderBy: { createdAt: 'desc' },
                include: {
                    cliente: {
                        select: {
                            name: true,
                            company: true,
                        },
                    },
                },
            }),

            // Orçamentos recentes
            prisma.orcamento.findMany({
                where: { userId },
                take: 5,
                orderBy: { createdAt: 'desc' },
                include: {
                    cliente: {
                        select: {
                            name: true,
                            company: true,
                        },
                    },
                },
            }),
            prisma.solicitacao.count({
                where: {
                    cliente: { userId },
                },
            }),

            prisma.solicitacao.count({
                where: {
                    cliente: { userId },
                    status: 'NOVA',
                },
            }),

            prisma.solicitacao.findMany({
                where: {
                    cliente: { userId },
                },
                take: 5,
                orderBy: { createdAt: 'desc' },
                include: {
                    cliente: {
                        select: {
                            name: true,
                            company: true,
                        },
                    },
                },
            }),
        ]);



        // Calcular valores pendentes
        const faturamentoPendente = Number(faturamentoTotal._sum.value || 0) - Number(faturamentoRecebido._sum.value || 0);

        // Calcular taxa de conversão de orçamentos
        const taxaConversao = totalOrcamentos > 0
            ? ((orcamentosAprovados / totalOrcamentos) * 100).toFixed(1)
            : '0';

        return res.json({
            clientes: {
                total: totalClientes,
                ativos: clientesAtivos,
            },
            projetos: {
                total: totalProjetos,
                emAndamento: projetosEmAndamento,
                concluidos: projetosConcluidos,
            },
            orcamentos: {
                total: totalOrcamentos,
                aguardando: orcamentosAguardando,
                enviados: orcamentosEnviados,
                aprovados: orcamentosAprovados,
                taxaConversao: `${taxaConversao}%`,
            },
            solicitacoes: { 
                total: totalSolicitacoes,
                novas: solicitacoesNovas,
            },
            financeiro: {
                faturamentoTotal: faturamentoTotal._sum.value || 0,
                recebido: faturamentoRecebido._sum.value || 0,
                pendente: faturamentoPendente,
                pagamentosPendentes,
                pagamentosPagos,
            },
            recentes: {
                projetos: projetosRecentes,
                orcamentos: orcamentosRecentes,
                solicitacoes: solicitacoesRecentes,
            },
        });
    } catch (error) {
        console.error('Get dashboard stats error:', error);
        return res.status(500).json({
            error: 'Erro ao buscar estatísticas',
        });
    }
};