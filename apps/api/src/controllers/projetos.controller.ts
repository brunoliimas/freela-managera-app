import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middlewares/auth.middleware';

export const getProjetos = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId!;
        const { status, clienteId } = req.query;

        const where: Record<string, unknown> = { userId };

        if (status) {
            where.status = status;
        }

        if (clienteId) {
            where.clienteId = clienteId;
        }

        const projetos = await prisma.projeto.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: {
                cliente: {
                    select: {
                        name: true,
                        email: true,
                        company: true,
                    },
                },
                _count: {
                    select: {
                        milestones: true,
                    },
                },
            },
        });

        return res.json(projetos);
    } catch (error) {
        console.error('Get projetos error:', error);
        return res.status(500).json({
            error: 'Erro ao buscar projetos',
        });
    }
};

export const getProjeto = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId!;
        const { id } = req.params;

        const projeto = await prisma.projeto.findFirst({
            where: {
                id,
                userId,
            },
            include: {
                cliente: true,
                orcamento: {
                    select: {
                        id: true,
                        number: true,
                        title: true,
                        value: true,
                    },
                },
                milestones: {
                    orderBy: { order: 'asc' },
                },
                arquivos: {
                    orderBy: { createdAt: 'desc' },
                },
                pagamentos: {
                    orderBy: { dueDate: 'asc' },
                },
            },
        });

        if (!projeto) {
            return res.status(404).json({
                error: 'Projeto não encontrado',
            });
        }

        return res.json(projeto);
    } catch (error) {
        console.error('Get projeto error:', error);
        return res.status(500).json({
            error: 'Erro ao buscar projeto',
        });
    }
};

export const createProjeto = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId!;
        const { clienteId, title, description, value, startDate, endDate, orcamentoId } = req.body;

        if (!clienteId || !title || !description || !value) {
            return res.status(400).json({
                error: 'Cliente, título, descrição e valor são obrigatórios',
            });
        }

        const lastProjeto = await prisma.projeto.findFirst({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });

        let nextNumber = 1;
        if (lastProjeto && lastProjeto.number) {
            const lastNumber = parseInt(lastProjeto.number.split('-')[1]);
            nextNumber = lastNumber + 1;
        }

        const number = `PRJ-${nextNumber.toString().padStart(3, '0')}`;

        const projeto = await prisma.projeto.create({
            data: {
                userId,
                clienteId,
                number,
                title,
                description,
                value: parseFloat(value),
                startDate: startDate ? new Date(startDate) : new Date(),
                endDate: endDate ? new Date(endDate) : null,
                orcamentoId,
            },
            include: {
                cliente: {
                    select: {
                        name: true,
                        email: true,
                        company: true,
                    },
                },
            },
        });

        return res.status(201).json({
            message: 'Projeto criado com sucesso',
            projeto,
        });
    } catch (error) {
        console.error('Create projeto error:', error);
        return res.status(500).json({
            error: 'Erro ao criar projeto',
        });
    }
};

export const createProjetoFromOrcamento = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId!;
        const { orcamentoId } = req.body;

        if (!orcamentoId) {
            return res.status(400).json({
                error: 'ID do orçamento é obrigatório',
            });
        }

        const orcamento = await prisma.orcamento.findFirst({
            where: {
                id: orcamentoId,
                userId,
            },
            include: {
                projeto: true,
            },
        });

        if (!orcamento) {
            return res.status(404).json({
                error: 'Orçamento não encontrado',
            });
        }

        if (orcamento.projeto) {
            return res.status(400).json({
                error: 'Este orçamento já foi convertido em projeto',
            });
        }

        if (orcamento.status !== 'APROVADO') {
            return res.status(400).json({
                error: 'Apenas orçamentos aprovados podem ser convertidos em projetos',
            });
        }

        const lastProjeto = await prisma.projeto.findFirst({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });

        let nextNumber = 1;
        if (lastProjeto && lastProjeto.number) {
            const lastNumber = parseInt(lastProjeto.number.split('-')[1]);
            nextNumber = lastNumber + 1;
        }

        const number = `PRJ-${nextNumber.toString().padStart(3, '0')}`;

        const projeto = await prisma.projeto.create({
            data: {
                userId,
                clienteId: orcamento.clienteId,
                number,
                title: orcamento.title,
                description: orcamento.description,
                value: orcamento.value,
                startDate: new Date(),
                endDate: orcamento.estimatedDays
                    ? new Date(Date.now() + orcamento.estimatedDays * 24 * 60 * 60 * 1000)
                    : null,
                orcamentoId: orcamento.id,
            },
            include: {
                cliente: {
                    select: {
                        name: true,
                        email: true,
                        company: true,
                    },
                },
            },
        });

        return res.status(201).json({
            message: 'Projeto criado a partir do orçamento com sucesso',
            projeto,
        });
    } catch (error) {
        console.error('Create projeto from orcamento error:', error);
        return res.status(500).json({
            error: 'Erro ao criar projeto',
        });
    }
};

export const updateProjeto = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId!;
        const { id } = req.params;
        const { title, description, value, startDate, endDate, status, progress, notes } = req.body;

        const projetoExists = await prisma.projeto.findFirst({
            where: { id, userId },
        });

        if (!projetoExists) {
            return res.status(404).json({
                error: 'Projeto não encontrado',
            });
        }

        const updateData: Record<string, unknown> = {};

        if (title !== undefined) updateData.title = title;
        if (description !== undefined) updateData.description = description;
        if (value !== undefined) updateData.value = parseFloat(value);
        if (startDate !== undefined) updateData.startDate = new Date(startDate);
        if (endDate !== undefined) updateData.endDate = endDate ? new Date(endDate) : null;
        if (status !== undefined) {
            updateData.status = status;
            if (status === 'CONCLUIDO' && !projetoExists.completedAt) {
                updateData.completedAt = new Date();
            }
        }
        if (progress !== undefined) updateData.progress = parseInt(progress);
        if (notes !== undefined) updateData.notes = notes;

        const projeto = await prisma.projeto.update({
            where: { id },
            data: updateData,
        });

        return res.json({
            message: 'Projeto atualizado com sucesso',
            projeto,
        });
    } catch (error) {
        console.error('Update projeto error:', error);
        return res.status(500).json({
            error: 'Erro ao atualizar projeto',
        });
    }
};

export const deleteProjeto = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId!;
        const { id } = req.params;

        const projeto = await prisma.projeto.findFirst({
            where: { id, userId },
        });

        if (!projeto) {
            return res.status(404).json({
                error: 'Projeto não encontrado',
            });
        }

        await prisma.projeto.delete({
            where: { id },
        });

        return res.json({
            message: 'Projeto excluído com sucesso',
        });
    } catch (error) {
        console.error('Delete projeto error:', error);
        return res.status(500).json({
            error: 'Erro ao excluir projeto',
        });
    }
};