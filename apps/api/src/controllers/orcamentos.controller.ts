import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middlewares/auth.middleware';

export const getOrcamentos = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId!;
        const { status, clienteId } = req.query;

        const where: any = { userId };

        if (status) {
            where.status = status;
        }

        if (clienteId) {
            where.clienteId = clienteId;
        }

        const orcamentos = await prisma.orcamento.findMany({
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
                projeto: {
                    select: {
                        id: true,
                        number: true,
                    },
                },
            },
        });

        return res.json(orcamentos);
    } catch (error) {
        console.error('Get orcamentos error:', error);
        return res.status(500).json({
            error: 'Erro ao buscar orçamentos',
        });
    }
};

export const getOrcamento = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId!;
        const { id } = req.params;

        const orcamento = await prisma.orcamento.findFirst({
            where: {
                id,
                userId,
            },
            include: {
                cliente: true,
                projeto: true,
                solicitacao: {
                    select: {
                        id: true,
                        title: true,
                        description: true,
                        budget: true,
                        deadline: true,
                    },
                },
            },
        });

        if (!orcamento) {
            return res.status(404).json({
                error: 'Orçamento não encontrado',
            });
        }

        return res.json(orcamento);
    } catch (error) {
        console.error('Get orcamento error:', error);
        return res.status(500).json({
            error: 'Erro ao buscar orçamento',
        });
    }
};

export const createOrcamento = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId!;
        const {
            clienteId,
            title,
            description,
            value,
            estimatedDays,
            validUntil,
            notes,
            solicitacaoId
        } = req.body;

        if (!clienteId || !title || !description || !value) {
            return res.status(400).json({
                error: 'Cliente, título, descrição e valor são obrigatórios',
            });
        }

        const lastOrcamento = await prisma.orcamento.findFirst({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });

        let nextNumber = 1;
        if (lastOrcamento && lastOrcamento.number) {
            const lastNumber = parseInt(lastOrcamento.number.split('-')[1]);
            nextNumber = lastNumber + 1;
        }

        const number = `ORC-${nextNumber.toString().padStart(3, '0')}`;

        const data: any = {
            userId,
            clienteId,
            number,
            title,
            description,
            value: parseFloat(value),
            estimatedDays: estimatedDays ? parseInt(estimatedDays) : null,
            validUntil: validUntil ? new Date(validUntil) : null,
            notes,
        };

        if (solicitacaoId) {
            data.solicitacaoId = solicitacaoId;

            await prisma.solicitacao.update({
                where: { id: solicitacaoId },
                data: { status: 'ORCAMENTO_ENVIADO' },
            });
        }

        const orcamento = await prisma.orcamento.create({
            data,
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
            message: 'Orçamento criado com sucesso',
            orcamento,
        });
    } catch (error) {
        console.error('Create orcamento error:', error);
        return res.status(500).json({
            error: 'Erro ao criar orçamento',
        });
    }
};

export const updateOrcamento = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId!;
        const { id } = req.params;
        const {
            title,
            description,
            value,
            estimatedDays,
            validUntil,
            notes,
            status
        } = req.body;

        const orcamentoExists = await prisma.orcamento.findFirst({
            where: { id, userId },
        });

        if (!orcamentoExists) {
            return res.status(404).json({
                error: 'Orçamento não encontrado',
            });
        }

        const orcamento = await prisma.orcamento.update({
            where: { id },
            data: {
                title,
                description,
                value: value ? parseFloat(value) : undefined,
                estimatedDays: estimatedDays ? parseInt(estimatedDays) : undefined,
                validUntil: validUntil ? new Date(validUntil) : undefined,
                notes,
                status,
                sentAt: status === 'ENVIADO' && !orcamentoExists.sentAt ? new Date() : undefined,
                approvedAt: status === 'APROVADO' && !orcamentoExists.approvedAt ? new Date() : undefined,
            },
        });

        return res.json({
            message: 'Orçamento atualizado com sucesso',
            orcamento,
        });
    } catch (error) {
        console.error('Update orcamento error:', error);
        return res.status(500).json({
            error: 'Erro ao atualizar orçamento',
        });
    }
};

export const deleteOrcamento = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId!;
        const { id } = req.params;

        const orcamento = await prisma.orcamento.findFirst({
            where: { id, userId },
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
                error: 'Não é possível excluir orçamento com projeto associado',
            });
        }

        await prisma.orcamento.delete({
            where: { id },
        });

        return res.json({
            message: 'Orçamento excluído com sucesso',
        });
    } catch (error) {
        console.error('Delete orcamento error:', error);
        return res.status(500).json({
            error: 'Erro ao excluir orçamento',
        });
    }
};