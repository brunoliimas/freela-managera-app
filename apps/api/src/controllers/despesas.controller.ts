import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middlewares/auth.middleware';
import logger from '../config/logger';

const CATEGORY_LABELS: Record<string, string> = {
    SOFTWARE: 'Software / Licenças',
    HARDWARE: 'Hardware / Equipamentos',
    TRANSPORTE: 'Transporte',
    ALIMENTACAO: 'Alimentação',
    MARKETING: 'Marketing',
    EDUCACAO: 'Educação',
    ESCRITORIO: 'Escritório',
    IMPOSTOS: 'Impostos / Taxas',
    OUTROS: 'Outros',
};

export const getDespesas = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId!;
        const { projetoId, category, startDate, endDate } = req.query;

        const where: Record<string, unknown> = { userId };

        if (projetoId) where.projetoId = projetoId;
        if (category) where.category = category;
        if (startDate || endDate) {
            where.date = {};
            if (startDate) (where.date as Record<string, unknown>).gte = new Date(startDate as string);
            if (endDate) (where.date as Record<string, unknown>).lte = new Date(endDate as string);
        }

        const despesas = await prisma.despesa.findMany({
            where,
            orderBy: { date: 'desc' },
            include: {
                projeto: {
                    select: {
                        number: true,
                        title: true,
                        cliente: {
                            select: { name: true, company: true },
                        },
                    },
                },
            },
        });

        return res.json(despesas);
    } catch (error) {
        logger.error({ err: error }, 'Get despesas error');
        return res.status(500).json({ error: 'Erro ao buscar despesas' });
    }
};

export const getDespesa = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId!;
        const { id } = req.params;

        const despesa = await prisma.despesa.findFirst({
            where: { id, userId },
            include: {
                projeto: {
                    include: { cliente: true },
                },
            },
        });

        if (!despesa) {
            return res.status(404).json({ error: 'Despesa não encontrada' });
        }

        return res.json(despesa);
    } catch (error) {
        logger.error({ err: error }, 'Get despesa error');
        return res.status(500).json({ error: 'Erro ao buscar despesa' });
    }
};

export const createDespesa = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId!;
        const { description, value, date, category, projetoId, receipt, notes } = req.body;

        if (!description || !value || !date || !category) {
            return res.status(400).json({ error: 'Descrição, valor, data e categoria são obrigatórios' });
        }

        if (projetoId) {
            const projeto = await prisma.projeto.findFirst({ where: { id: projetoId, userId } });
            if (!projeto) {
                return res.status(404).json({ error: 'Projeto não encontrado' });
            }
        }

        const despesa = await prisma.despesa.create({
            data: {
                userId,
                description,
                value: parseFloat(value),
                date: new Date(date),
                category,
                projetoId: projetoId || null,
                receipt,
                notes,
            },
            include: {
                projeto: {
                    select: { number: true, title: true },
                },
            },
        });

        return res.status(201).json({ message: 'Despesa criada com sucesso', despesa });
    } catch (error) {
        logger.error({ err: error }, 'Create despesa error');
        return res.status(500).json({ error: 'Erro ao criar despesa' });
    }
};

export const updateDespesa = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId!;
        const { id } = req.params;
        const { description, value, date, category, projetoId, receipt, notes } = req.body;

        const existing = await prisma.despesa.findFirst({ where: { id, userId } });
        if (!existing) {
            return res.status(404).json({ error: 'Despesa não encontrada' });
        }

        const updateData: Record<string, unknown> = {};

        if (description !== undefined) updateData.description = description;
        if (value !== undefined) updateData.value = parseFloat(value);
        if (date !== undefined) updateData.date = new Date(date);
        if (category !== undefined) updateData.category = category;
        if (projetoId !== undefined) updateData.projetoId = projetoId || null;
        if (receipt !== undefined) updateData.receipt = receipt;
        if (notes !== undefined) updateData.notes = notes;

        const despesa = await prisma.despesa.update({
            where: { id },
            data: updateData,
        });

        return res.json({ message: 'Despesa atualizada com sucesso', despesa });
    } catch (error) {
        logger.error({ err: error }, 'Update despesa error');
        return res.status(500).json({ error: 'Erro ao atualizar despesa' });
    }
};

export const deleteDespesa = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId!;
        const { id } = req.params;

        const despesa = await prisma.despesa.findFirst({ where: { id, userId } });
        if (!despesa) {
            return res.status(404).json({ error: 'Despesa não encontrada' });
        }

        await prisma.despesa.delete({ where: { id } });

        return res.json({ message: 'Despesa excluída com sucesso' });
    } catch (error) {
        logger.error({ err: error }, 'Delete despesa error');
        return res.status(500).json({ error: 'Erro ao excluir despesa' });
    }
};

export const getResumoDespesas = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId!;
        const { startDate, endDate } = req.query;

        const where: Record<string, unknown> = { userId };

        if (startDate || endDate) {
            where.date = {};
            if (startDate) (where.date as Record<string, unknown>).gte = new Date(startDate as string);
            if (endDate) (where.date as Record<string, unknown>).lte = new Date(endDate as string);
        }

        const [totalGeral, porCategoria] = await Promise.all([
            prisma.despesa.aggregate({
                where,
                _sum: { value: true },
                _count: true,
            }),
            prisma.despesa.groupBy({
                by: ['category'],
                where,
                _sum: { value: true },
                _count: true,
                orderBy: { _sum: { value: 'desc' } },
            }),
        ]);

        return res.json({
            total: totalGeral._sum.value?.toNumber() || 0,
            count: totalGeral._count,
            porCategoria: porCategoria.map(c => ({
                category: c.category,
                label: CATEGORY_LABELS[c.category] || c.category,
                total: c._sum.value?.toNumber() || 0,
                count: c._count,
            })),
        });
    } catch (error) {
        logger.error({ err: error }, 'Get resumo despesas error');
        return res.status(500).json({ error: 'Erro ao buscar resumo de despesas' });
    }
};

export { CATEGORY_LABELS };
