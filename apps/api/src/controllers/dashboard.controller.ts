import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middlewares/auth.middleware';

export const getDashboard = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId!;

        const [
            totalClientes,
            clientesAtivos,
            totalSolicitacoes,
            novasSolicitacoes,
            totalOrcamentos,
            orcamentosEnviados,
            orcamentosAprovados,
            totalProjetos,
            projetosAndamento,
            projetosConcluidos,
            solicitacoesRecentes,
            orcamentosRecentes,
            projetosRecentes,
        ] = await Promise.all([
            prisma.cliente.count({
                where: { userId },
            }),
            prisma.cliente.count({
                where: { userId, active: true },
            }),
            prisma.solicitacao.count({
                where: { cliente: { userId } },
            }),
            prisma.solicitacao.count({
                where: {
                    cliente: { userId },
                    status: 'NOVA',
                },
            }),
            prisma.orcamento.count({
                where: { userId },
            }),
            prisma.orcamento.count({
                where: { userId, status: 'ENVIADO' },
            }),
            prisma.orcamento.count({
                where: { userId, status: 'APROVADO' },
            }),
            prisma.projeto.count({
                where: { userId },
            }),
            prisma.projeto.count({
                where: { userId, status: 'EM_ANDAMENTO' },
            }),
            prisma.projeto.count({
                where: { userId, status: 'CONCLUIDO' },
            }),
            prisma.solicitacao.findMany({
                where: { cliente: { userId } },
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
        ]);

        const valoresOrcamentos = await prisma.orcamento.aggregate({
            where: { userId },
            _sum: {
                value: true,
            },
        });

        const valoresProjetos = await prisma.projeto.aggregate({
            where: { userId },
            _sum: {
                value: true,
            },
        });

        const valorProjetosAndamento = await prisma.projeto.aggregate({
            where: { userId, status: 'EM_ANDAMENTO' },
            _sum: {
                value: true,
            },
        });

        const valorProjetosConcluidos = await prisma.projeto.aggregate({
            where: { userId, status: 'CONCLUIDO' },
            _sum: {
                value: true,
            },
        });

        return res.json({
            stats: {
                clientes: {
                    total: totalClientes,
                    ativos: clientesAtivos,
                },
                solicitacoes: {
                    total: totalSolicitacoes,
                    novas: novasSolicitacoes,
                },
                orcamentos: {
                    total: totalOrcamentos,
                    enviados: orcamentosEnviados,
                    aprovados: orcamentosAprovados,
                    valorTotal: valoresOrcamentos._sum.value || 0,
                },
                projetos: {
                    total: totalProjetos,
                    emAndamento: projetosAndamento,
                    concluidos: projetosConcluidos,
                    valorTotal: valoresProjetos._sum.value || 0,
                    valorAndamento: valorProjetosAndamento._sum.value || 0,
                    valorConcluidos: valorProjetosConcluidos._sum.value || 0,
                },
            },
            recentes: {
                solicitacoes: solicitacoesRecentes,
                orcamentos: orcamentosRecentes,
                projetos: projetosRecentes,
            },
        });
    } catch (error) {
        console.error('Dashboard error:', error);
        return res.status(500).json({
            error: 'Erro ao carregar dashboard',
        });
    }
};