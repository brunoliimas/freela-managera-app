import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middlewares/auth.middleware';
import logger from '../config/logger';

export const getTimeEntries = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId!;
        const { projetoId, billable, startDate, endDate } = req.query;

        const where: Record<string, unknown> = { userId };

        if (projetoId) where.projetoId = projetoId;
        if (billable !== undefined) where.billable = billable === 'true';
        if (startDate || endDate) {
            where.startTime = {};
            if (startDate) (where.startTime as Record<string, unknown>).gte = new Date(startDate as string);
            if (endDate) (where.startTime as Record<string, unknown>).lte = new Date(endDate as string);
        }

        const entries = await prisma.timeEntry.findMany({
            where,
            orderBy: { startTime: 'desc' },
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

        return res.json(entries);
    } catch (error) {
        logger.error({ err: error }, 'Get time entries error');
        return res.status(500).json({ error: 'Erro ao buscar registros de tempo' });
    }
};

export const getTimeEntry = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId!;
        const { id } = req.params;

        const entry = await prisma.timeEntry.findFirst({
            where: { id, userId },
            include: {
                projeto: {
                    include: { cliente: true },
                },
            },
        });

        if (!entry) {
            return res.status(404).json({ error: 'Registro não encontrado' });
        }

        return res.json(entry);
    } catch (error) {
        logger.error({ err: error }, 'Get time entry error');
        return res.status(500).json({ error: 'Erro ao buscar registro de tempo' });
    }
};

export const createTimeEntry = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId!;
        const { projetoId, description, startTime, endTime, duration, billable, hourlyRate } = req.body;

        if (!projetoId || !description || !startTime) {
            return res.status(400).json({ error: 'Projeto, descrição e hora de início são obrigatórios' });
        }

        const projeto = await prisma.projeto.findFirst({ where: { id: projetoId, userId } });
        if (!projeto) {
            return res.status(404).json({ error: 'Projeto não encontrado' });
        }

        const start = new Date(startTime);
        const end = endTime ? new Date(endTime) : null;
        const calcDuration = duration ?? (end ? Math.round((end.getTime() - start.getTime()) / 60000) : null);

        const entry = await prisma.timeEntry.create({
            data: {
                userId,
                projetoId,
                description,
                startTime: start,
                endTime: end,
                duration: calcDuration,
                billable: billable ?? true,
                hourlyRate: hourlyRate ? parseFloat(hourlyRate) : null,
            },
            include: {
                projeto: {
                    select: { number: true, title: true },
                },
            },
        });

        return res.status(201).json({ message: 'Registro criado com sucesso', entry });
    } catch (error) {
        logger.error({ err: error }, 'Create time entry error');
        return res.status(500).json({ error: 'Erro ao criar registro de tempo' });
    }
};

export const updateTimeEntry = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId!;
        const { id } = req.params;
        const { description, startTime, endTime, duration, billable, hourlyRate, projetoId } = req.body;

        const existing = await prisma.timeEntry.findFirst({ where: { id, userId } });
        if (!existing) {
            return res.status(404).json({ error: 'Registro não encontrado' });
        }

        const updateData: Record<string, unknown> = {};

        if (description !== undefined) updateData.description = description;
        if (projetoId !== undefined) updateData.projetoId = projetoId;
        if (billable !== undefined) updateData.billable = billable;
        if (hourlyRate !== undefined) updateData.hourlyRate = hourlyRate ? parseFloat(hourlyRate) : null;

        if (startTime !== undefined) updateData.startTime = new Date(startTime);
        if (endTime !== undefined) updateData.endTime = endTime ? new Date(endTime) : null;

        if (duration !== undefined) {
            updateData.duration = duration;
        } else if (startTime || endTime) {
            const start = startTime ? new Date(startTime) : existing.startTime;
            const end = endTime ? new Date(endTime) : existing.endTime;
            if (end) {
                updateData.duration = Math.round((end.getTime() - start.getTime()) / 60000);
            }
        }

        const entry = await prisma.timeEntry.update({
            where: { id },
            data: updateData,
        });

        return res.json({ message: 'Registro atualizado com sucesso', entry });
    } catch (error) {
        logger.error({ err: error }, 'Update time entry error');
        return res.status(500).json({ error: 'Erro ao atualizar registro de tempo' });
    }
};

export const deleteTimeEntry = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId!;
        const { id } = req.params;

        const entry = await prisma.timeEntry.findFirst({ where: { id, userId } });
        if (!entry) {
            return res.status(404).json({ error: 'Registro não encontrado' });
        }

        await prisma.timeEntry.delete({ where: { id } });

        return res.json({ message: 'Registro excluído com sucesso' });
    } catch (error) {
        logger.error({ err: error }, 'Delete time entry error');
        return res.status(500).json({ error: 'Erro ao excluir registro de tempo' });
    }
};

export const startTimer = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId!;
        const { projetoId, description, billable, hourlyRate } = req.body;

        if (!projetoId || !description) {
            return res.status(400).json({ error: 'Projeto e descrição são obrigatórios' });
        }

        const projeto = await prisma.projeto.findFirst({ where: { id: projetoId, userId } });
        if (!projeto) {
            return res.status(404).json({ error: 'Projeto não encontrado' });
        }

        // Verificar se já tem timer rodando
        const activeTimer = await prisma.timeEntry.findFirst({
            where: { userId, endTime: null },
        });

        if (activeTimer) {
            return res.status(400).json({ error: 'Já existe um timer em andamento. Pare-o antes de iniciar outro.' });
        }

        const entry = await prisma.timeEntry.create({
            data: {
                userId,
                projetoId,
                description,
                startTime: new Date(),
                billable: billable ?? true,
                hourlyRate: hourlyRate ? parseFloat(hourlyRate) : null,
            },
            include: {
                projeto: {
                    select: { number: true, title: true },
                },
            },
        });

        return res.status(201).json({ message: 'Timer iniciado', entry });
    } catch (error) {
        logger.error({ err: error }, 'Start timer error');
        return res.status(500).json({ error: 'Erro ao iniciar timer' });
    }
};

export const stopTimer = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId!;
        const { id } = req.params;

        const entry = await prisma.timeEntry.findFirst({
            where: { id, userId },
        });

        if (!entry) {
            return res.status(404).json({ error: 'Registro não encontrado' });
        }

        if (entry.endTime) {
            return res.status(400).json({ error: 'Este timer já foi parado' });
        }

        const endTime = new Date();
        const duration = Math.round((endTime.getTime() - entry.startTime.getTime()) / 60000);

        const updated = await prisma.timeEntry.update({
            where: { id },
            data: { endTime, duration },
            include: {
                projeto: {
                    select: { number: true, title: true },
                },
            },
        });

        return res.json({ message: 'Timer parado', entry: updated });
    } catch (error) {
        logger.error({ err: error }, 'Stop timer error');
        return res.status(500).json({ error: 'Erro ao parar timer' });
    }
};

export const getActiveTimer = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId!;

        const entry = await prisma.timeEntry.findFirst({
            where: { userId, endTime: null },
            include: {
                projeto: {
                    select: { number: true, title: true },
                },
            },
        });

        return res.json(entry);
    } catch (error) {
        logger.error({ err: error }, 'Get active timer error');
        return res.status(500).json({ error: 'Erro ao buscar timer ativo' });
    }
};

export const getResumoHoras = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId!;
        const { startDate, endDate } = req.query;

        const where: Record<string, unknown> = { userId, endTime: { not: null } };

        if (startDate || endDate) {
            where.startTime = {};
            if (startDate) (where.startTime as Record<string, unknown>).gte = new Date(startDate as string);
            if (endDate) (where.startTime as Record<string, unknown>).lte = new Date(endDate as string);
        }

        const [totalGeral, totalBillable, porProjeto] = await Promise.all([
            prisma.timeEntry.aggregate({
                where,
                _sum: { duration: true },
                _count: true,
            }),
            prisma.timeEntry.aggregate({
                where: { ...where, billable: true },
                _sum: { duration: true },
            }),
            prisma.timeEntry.groupBy({
                by: ['projetoId'],
                where,
                _sum: { duration: true },
                _count: true,
            }),
        ]);

        // Buscar nomes dos projetos
        const projetoIds = porProjeto.map(p => p.projetoId);
        const projetos = await prisma.projeto.findMany({
            where: { id: { in: projetoIds } },
            select: { id: true, number: true, title: true },
        });

        const projetoMap = new Map(projetos.map(p => [p.id, p]));

        return res.json({
            totalMinutos: totalGeral._sum.duration || 0,
            totalHoras: Number(((totalGeral._sum.duration || 0) / 60).toFixed(1)),
            totalEntries: totalGeral._count,
            billableMinutos: totalBillable._sum.duration || 0,
            billableHoras: Number(((totalBillable._sum.duration || 0) / 60).toFixed(1)),
            porProjeto: porProjeto.map(p => ({
                projetoId: p.projetoId,
                projeto: projetoMap.get(p.projetoId),
                totalMinutos: p._sum.duration || 0,
                totalHoras: Number(((p._sum.duration || 0) / 60).toFixed(1)),
                entries: p._count,
            })),
        });
    } catch (error) {
        logger.error({ err: error }, 'Get resumo horas error');
        return res.status(500).json({ error: 'Erro ao buscar resumo de horas' });
    }
};
