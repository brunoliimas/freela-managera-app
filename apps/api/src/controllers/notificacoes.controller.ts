import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middlewares/auth.middleware';
import logger from '../config/logger';

export const getNotificacoes = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId!;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const skip = (page - 1) * limit;

        const [notificacoes, total, unreadCount] = await Promise.all([
            prisma.notificacao.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            prisma.notificacao.count({ where: { userId } }),
            prisma.notificacao.count({ where: { userId, read: false } }),
        ]);

        return res.json({
            notificacoes,
            unreadCount,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        logger.error({ err: error }, 'Get notificacoes error');
        return res.status(500).json({ error: 'Erro ao buscar notificações' });
    }
};

export const getUnreadCount = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId!;
        const count = await prisma.notificacao.count({
            where: { userId, read: false },
        });
        return res.json({ count });
    } catch (error) {
        logger.error({ err: error }, 'Get unread count error');
        return res.status(500).json({ error: 'Erro ao buscar contagem' });
    }
};

export const markAsRead = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId!;
        const { id } = req.params;

        const notificacao = await prisma.notificacao.findFirst({
            where: { id, userId },
        });

        if (!notificacao) {
            return res.status(404).json({ error: 'Notificação não encontrada' });
        }

        await prisma.notificacao.update({
            where: { id },
            data: { read: true, readAt: new Date() },
        });

        return res.json({ message: 'Notificação marcada como lida' });
    } catch (error) {
        logger.error({ err: error }, 'Mark as read error');
        return res.status(500).json({ error: 'Erro ao marcar como lida' });
    }
};

export const markAllAsRead = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId!;

        await prisma.notificacao.updateMany({
            where: { userId, read: false },
            data: { read: true, readAt: new Date() },
        });

        return res.json({ message: 'Todas as notificações marcadas como lidas' });
    } catch (error) {
        logger.error({ err: error }, 'Mark all as read error');
        return res.status(500).json({ error: 'Erro ao marcar todas como lidas' });
    }
};
