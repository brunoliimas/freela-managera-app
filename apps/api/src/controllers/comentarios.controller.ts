import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middlewares/auth.middleware';
import logger from '../config/logger';

const USER_SELECT = { id: true, name: true, avatar: true };

export const getComentarios = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId!;
        const { projetoId } = req.params;

        // Verify project belongs to user
        const projeto = await prisma.projeto.findFirst({
            where: { id: projetoId, userId },
            select: { id: true },
        });

        if (!projeto) {
            return res.status(404).json({ error: 'Projeto não encontrado' });
        }

        // Fetch top-level comments with nested replies (1 level deep)
        const comentarios = await prisma.comentario.findMany({
            where: { projetoId, parentId: null },
            include: {
                user: { select: USER_SELECT },
                replies: {
                    include: {
                        user: { select: USER_SELECT },
                    },
                    orderBy: { createdAt: 'asc' },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        return res.json(comentarios);
    } catch (error) {
        logger.error({ err: error }, 'Erro ao listar comentários');
        return res.status(500).json({ error: 'Erro ao listar comentários' });
    }
};

export const createComentario = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId!;
        const { projetoId } = req.params;
        const { content, parentId } = req.body;

        if (!content || !content.trim()) {
            return res.status(400).json({ error: 'Conteúdo é obrigatório' });
        }

        // Verify project belongs to user
        const projeto = await prisma.projeto.findFirst({
            where: { id: projetoId, userId },
            select: { id: true },
        });

        if (!projeto) {
            return res.status(404).json({ error: 'Projeto não encontrado' });
        }

        // If replying, verify parent comment exists in same project
        if (parentId) {
            const parent = await prisma.comentario.findFirst({
                where: { id: parentId, projetoId },
            });

            if (!parent) {
                return res.status(404).json({ error: 'Comentário pai não encontrado' });
            }
        }

        const comentario = await prisma.comentario.create({
            data: {
                content: content.trim(),
                userId,
                projetoId,
                parentId: parentId || null,
            },
            include: {
                user: { select: USER_SELECT },
                replies: {
                    include: {
                        user: { select: USER_SELECT },
                    },
                },
            },
        });

        logger.info({ comentarioId: comentario.id, projetoId }, 'Comentário criado');
        return res.status(201).json(comentario);
    } catch (error) {
        logger.error({ err: error }, 'Erro ao criar comentário');
        return res.status(500).json({ error: 'Erro ao criar comentário' });
    }
};

export const updateComentario = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId!;
        const { projetoId, id } = req.params;
        const { content } = req.body;

        if (!content || !content.trim()) {
            return res.status(400).json({ error: 'Conteúdo é obrigatório' });
        }

        const existing = await prisma.comentario.findFirst({
            where: { id, projetoId, userId },
        });

        if (!existing) {
            return res.status(404).json({ error: 'Comentário não encontrado' });
        }

        const comentario = await prisma.comentario.update({
            where: { id },
            data: { content: content.trim() },
            include: {
                user: { select: USER_SELECT },
            },
        });

        return res.json(comentario);
    } catch (error) {
        logger.error({ err: error }, 'Erro ao atualizar comentário');
        return res.status(500).json({ error: 'Erro ao atualizar comentário' });
    }
};

export const deleteComentario = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId!;
        const { projetoId, id } = req.params;

        const existing = await prisma.comentario.findFirst({
            where: { id, projetoId, userId },
        });

        if (!existing) {
            return res.status(404).json({ error: 'Comentário não encontrado' });
        }

        // Cascade delete handles replies automatically
        await prisma.comentario.delete({ where: { id } });

        return res.json({ message: 'Comentário excluído' });
    } catch (error) {
        logger.error({ err: error }, 'Erro ao excluir comentário');
        return res.status(500).json({ error: 'Erro ao excluir comentário' });
    }
};
