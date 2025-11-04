import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middlewares/auth.middleware';

export const getPagamentos = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId!;
        const { status, projetoId } = req.query;

        const where: Record<string, unknown> = {
            userId,
        };

        if (status) {
            where.status = status;
        }

        if (projetoId) {
            where.projetoId = projetoId;
        }

        const pagamentos = await prisma.pagamento.findMany({
            where,
            orderBy: { dueDate: 'asc' },
            include: {
                projeto: {
                    select: {
                        number: true,
                        title: true,
                        cliente: {
                            select: {
                                name: true,
                                company: true,
                            },
                        },
                    },
                },
            },
        });

        const now = new Date();
        const pagamentosComStatus = pagamentos.map((pagamento) => {
            let status = pagamento.status;

            if (status === 'PENDENTE' && new Date(pagamento.dueDate) < now) {
                status = 'ATRASADO';
            }

            return {
                ...pagamento,
                status,
            };
        });

        return res.json(pagamentosComStatus);
    } catch (error) {
        console.error('Get pagamentos error:', error);
        return res.status(500).json({
            error: 'Erro ao buscar pagamentos',
        });
    }
};

export const getPagamento = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId!;
        const { id } = req.params;

        const pagamento = await prisma.pagamento.findFirst({
            where: {
                id,
                userId,
            },
            include: {
                projeto: {
                    include: {
                        cliente: true,
                    },
                },
            },
        });

        if (!pagamento) {
            return res.status(404).json({
                error: 'Pagamento não encontrado',
            });
        }

        return res.json(pagamento);
    } catch (error) {
        console.error('Get pagamento error:', error);
        return res.status(500).json({
            error: 'Erro ao buscar pagamento',
        });
    }
};

export const createPagamento = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId!;
        const { projetoId, description, value, dueDate, method, notes } = req.body;

        if (!projetoId || !description || !value || !dueDate) {
            return res.status(400).json({
                error: 'Projeto, descrição, valor e data de vencimento são obrigatórios',
            });
        }

        const projeto = await prisma.projeto.findFirst({
            where: { id: projetoId, userId },
        });

        if (!projeto) {
            return res.status(404).json({
                error: 'Projeto não encontrado',
            });
        }

        const pagamento = await prisma.pagamento.create({
            data: {
                userId,
                projetoId,
                description,
                value: parseFloat(value),
                dueDate: new Date(dueDate),
                method,
                notes,
            },
            include: {
                projeto: {
                    select: {
                        number: true,
                        title: true,
                    },
                },
            },
        });

        return res.status(201).json({
            message: 'Pagamento criado com sucesso',
            pagamento,
        });
    } catch (error) {
        console.error('Create pagamento error:', error);
        return res.status(500).json({
            error: 'Erro ao criar pagamento',
        });
    }
};

export const createParcelas = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId!;
        const { projetoId, numeroParcelas, primeiroVencimento } = req.body;

        if (!projetoId || !numeroParcelas || !primeiroVencimento) {
            return res.status(400).json({
                error: 'Projeto, número de parcelas e primeiro vencimento são obrigatórios',
            });
        }

        const projeto = await prisma.projeto.findFirst({
            where: { id: projetoId, userId },
        });

        if (!projeto) {
            return res.status(404).json({
                error: 'Projeto não encontrado',
            });
        }

        const valorParcela = projeto.value.toNumber() / parseInt(numeroParcelas);
        const parcelas = [];

        for (let i = 0; i < parseInt(numeroParcelas); i++) {
            const dueDate = new Date(primeiroVencimento);
            dueDate.setMonth(dueDate.getMonth() + i);

            parcelas.push({
                userId,
                projetoId,
                description: `Parcela ${i + 1}/${numeroParcelas} - ${projeto.title}`,
                value: valorParcela,
                dueDate,
            });
        }

        const pagamentosCriados = await prisma.pagamento.createMany({
            data: parcelas,
        });

        return res.status(201).json({
            message: `${numeroParcelas} parcelas criadas com sucesso`,
            count: pagamentosCriados.count,
        });
    } catch (error) {
        console.error('Create parcelas error:', error);
        return res.status(500).json({
            error: 'Erro ao criar parcelas',
        });
    }
};

export const updatePagamento = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId!;
        const { id } = req.params;
        const { description, value, dueDate, status, method, notes, receipt } = req.body;

        const pagamentoExists = await prisma.pagamento.findFirst({
            where: {
                id,
                userId,
            },
        });

        if (!pagamentoExists) {
            return res.status(404).json({
                error: 'Pagamento não encontrado',
            });
        }

        const updateData: Record<string, unknown> = {};

        if (description !== undefined) updateData.description = description;
        if (value !== undefined) updateData.value = parseFloat(value);
        if (dueDate !== undefined) updateData.dueDate = new Date(dueDate);
        if (method !== undefined) updateData.method = method;
        if (notes !== undefined) updateData.notes = notes;
        if (receipt !== undefined) updateData.receipt = receipt;

        if (status !== undefined) {
            updateData.status = status;
            if (status === 'PAGO' && !pagamentoExists.paidAt) {
                updateData.paidAt = new Date();
            } else if (status !== 'PAGO') {
                updateData.paidAt = null;
            }
        }

        const pagamento = await prisma.pagamento.update({
            where: { id },
            data: updateData,
        });

        return res.json({
            message: 'Pagamento atualizado com sucesso',
            pagamento,
        });
    } catch (error) {
        console.error('Update pagamento error:', error);
        return res.status(500).json({
            error: 'Erro ao atualizar pagamento',
        });
    }
};

export const marcarComoPago = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId!;
        const { id } = req.params;
        const { method, notes, receipt } = req.body;

        const pagamentoExists = await prisma.pagamento.findFirst({
            where: {
                id,
                userId,
            },
        });

        if (!pagamentoExists) {
            return res.status(404).json({
                error: 'Pagamento não encontrado',
            });
        }

        const pagamento = await prisma.pagamento.update({
            where: { id },
            data: {
                status: 'PAGO',
                paidAt: new Date(),
                method,
                notes,
                receipt,
            },
        });

        return res.json({
            message: 'Pagamento marcado como pago',
            pagamento,
        });
    } catch (error) {
        console.error('Marcar como pago error:', error);
        return res.status(500).json({
            error: 'Erro ao marcar pagamento como pago',
        });
    }
};

export const deletePagamento = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId!;
        const { id } = req.params;

        const pagamento = await prisma.pagamento.findFirst({
            where: {
                id,
                userId,
            },
        });

        if (!pagamento) {
            return res.status(404).json({
                error: 'Pagamento não encontrado',
            });
        }

        await prisma.pagamento.delete({
            where: { id },
        });

        return res.json({
            message: 'Pagamento excluído com sucesso',
        });
    } catch (error) {
        console.error('Delete pagamento error:', error);
        return res.status(500).json({
            error: 'Erro ao excluir pagamento',
        });
    }
};

export const getResumoFinanceiro = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId!;

        const [totalRecebido, totalPendente, totalAtrasado, pagamentosProximos] = await Promise.all([
            prisma.pagamento.aggregate({
                where: {
                    userId,
                    status: 'PAGO',
                },
                _sum: { value: true },
            }),
            prisma.pagamento.aggregate({
                where: {
                    userId,
                    status: 'PENDENTE',
                },
                _sum: { value: true },
            }),
            prisma.pagamento.aggregate({
                where: {
                    userId,
                    status: 'PENDENTE',
                    dueDate: { lt: new Date() },
                },
                _sum: { value: true },
            }),
            prisma.pagamento.findMany({
                where: {
                    userId,
                    status: 'PENDENTE',
                    dueDate: {
                        gte: new Date(),
                        lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                    },
                },
                orderBy: { dueDate: 'asc' },
                take: 5,
                include: {
                    projeto: {
                        select: {
                            number: true,
                            title: true,
                            cliente: {
                                select: {
                                    name: true,
                                },
                            },
                        },
                    },
                },
            }),
        ]);

        return res.json({
            totalRecebido: totalRecebido._sum.value || 0,
            totalPendente: totalPendente._sum.value || 0,
            totalAtrasado: totalAtrasado._sum.value || 0,
            pagamentosProximos,
        });
    } catch (error) {
        console.error('Get resumo financeiro error:', error);
        return res.status(500).json({
            error: 'Erro ao buscar resumo financeiro',
        });
    }
};