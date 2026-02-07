import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middlewares/auth.middleware';
import logger from '../config/logger';
import { NotificacaoService } from '../services/notificacao.service';

export const getMilestones = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId!;
        const { projetoId } = req.params;

        const projeto = await prisma.projeto.findFirst({
            where: {
                id: projetoId,
                userId,
            },
        });

        if (!projeto) {
            return res.status(404).json({
                error: 'Projeto não encontrado',
            });
        }

        const milestones = await prisma.milestone.findMany({
            where: { projetoId },
            orderBy: { order: 'asc' },
        });

        return res.json(milestones);
    } catch (error) {
        logger.error({ err: error }, 'Get milestones error');
        return res.status(500).json({
            error: 'Erro ao buscar milestones',
        });
    }
};

export const createMilestone = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId!;
        const { projetoId } = req.params;
        const { title, description } = req.body;

        if (!title) {
            return res.status(400).json({
                error: 'Título é obrigatório',
            });
        }

        const projeto = await prisma.projeto.findFirst({
            where: {
                id: projetoId,
                userId,
            },
        });

        if (!projeto) {
            return res.status(404).json({
                error: 'Projeto não encontrado',
            });
        }

        const lastMilestone = await prisma.milestone.findFirst({
            where: { projetoId },
            orderBy: { order: 'desc' },
        });

        const order = lastMilestone ? lastMilestone.order + 1 : 1;

        const milestone = await prisma.milestone.create({
            data: {
                projetoId,
                title,
                description,
                order,
            },
        });

        return res.status(201).json({
            message: 'Milestone criado com sucesso',
            milestone,
        });
    } catch (error) {
        logger.error({ err: error }, 'Create milestone error');
        return res.status(500).json({
            error: 'Erro ao criar milestone',
        });
    }
};

export const updateMilestone = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId!;
        const { projetoId, id } = req.params;
        const { title, description, completed } = req.body;

        const milestone = await prisma.milestone.findFirst({
            where: {
                id,
                projetoId,
                projeto: {
                    userId,
                },
            },
        });

        if (!milestone) {
            return res.status(404).json({
                error: 'Milestone não encontrado',
            });
        }

        const updateData: Record<string, unknown> = {};

        if (title !== undefined) updateData.title = title;
        if (description !== undefined) updateData.description = description;
        if (completed !== undefined) {
            updateData.completed = completed;
            if (completed && !milestone.completedAt) {
                updateData.completedAt = new Date();
            } else if (!completed) {
                updateData.completedAt = null;
            }
        }

        const { updated } = await prisma.$transaction(async (tx) => {
            const updated = await tx.milestone.update({
                where: { id },
                data: updateData,
            });

            const allMilestones = await tx.milestone.findMany({
                where: { projetoId },
            });

            const completedCount = allMilestones.filter(m => m.completed).length;
            const progress = Math.round((completedCount / allMilestones.length) * 100);

            await tx.projeto.update({
                where: { id: projetoId },
                data: { progress },
            });

            return { updated };
        });

        // Notificar se milestone foi marcado como concluído
        if (completed && !milestone.completedAt) {
            NotificacaoService.notificarMilestoneConcluido(id, projetoId).catch(() => {});
        }

        return res.json({
            message: 'Milestone atualizado com sucesso',
            milestone: updated,
        });
    } catch (error) {
        logger.error({ err: error }, 'Update milestone error');
        return res.status(500).json({
            error: 'Erro ao atualizar milestone',
        });
    }
};

export const deleteMilestone = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId!;
        const { projetoId, id } = req.params;

        const milestone = await prisma.milestone.findFirst({
            where: {
                id,
                projetoId,
                projeto: {
                    userId,
                },
            },
        });

        if (!milestone) {
            return res.status(404).json({
                error: 'Milestone não encontrado',
            });
        }

        await prisma.milestone.delete({
            where: { id },
        });

        return res.json({
            message: 'Milestone excluído com sucesso',
        });
    } catch (error) {
        logger.error({ err: error }, 'Delete milestone error');
        return res.status(500).json({
            error: 'Erro ao excluir milestone',
        });
    }
};