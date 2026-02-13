import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middlewares/auth.middleware';
import logger from '../config/logger';

export const getTemplates = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId!;
        const { type, active } = req.query;

        const where: Record<string, unknown> = { userId };
        if (type) where.type = type;
        if (active !== undefined) where.active = active === 'true';

        const templates = await prisma.template.findMany({
            where,
            orderBy: { updatedAt: 'desc' },
        });

        return res.json(templates);
    } catch (error) {
        logger.error({ err: error }, 'Erro ao listar templates');
        return res.status(500).json({ error: 'Erro ao listar templates' });
    }
};

export const getTemplate = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId!;
        const { id } = req.params;

        const template = await prisma.template.findFirst({
            where: { id, userId },
        });

        if (!template) {
            return res.status(404).json({ error: 'Template não encontrado' });
        }

        return res.json(template);
    } catch (error) {
        logger.error({ err: error }, 'Erro ao buscar template');
        return res.status(500).json({ error: 'Erro ao buscar template' });
    }
};

export const createTemplate = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId!;
        const { name, type, content, value } = req.body;

        const template = await prisma.template.create({
            data: {
                name,
                type,
                content,
                value: value ? parseFloat(String(value)) : null,
                userId,
            },
        });

        logger.info({ templateId: template.id }, 'Template criado');
        return res.status(201).json(template);
    } catch (error) {
        logger.error({ err: error }, 'Erro ao criar template');
        return res.status(500).json({ error: 'Erro ao criar template' });
    }
};

export const updateTemplate = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId!;
        const { id } = req.params;

        const existing = await prisma.template.findFirst({
            where: { id, userId },
        });

        if (!existing) {
            return res.status(404).json({ error: 'Template não encontrado' });
        }

        const { name, type, content, value, active } = req.body;

        const data: Record<string, unknown> = {};
        if (name !== undefined) data.name = name;
        if (type !== undefined) data.type = type;
        if (content !== undefined) data.content = content;
        if (value !== undefined) data.value = value !== null ? parseFloat(String(value)) : null;
        if (active !== undefined) data.active = active;

        const template = await prisma.template.update({
            where: { id },
            data,
        });

        return res.json(template);
    } catch (error) {
        logger.error({ err: error }, 'Erro ao atualizar template');
        return res.status(500).json({ error: 'Erro ao atualizar template' });
    }
};

export const deleteTemplate = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId!;
        const { id } = req.params;

        const existing = await prisma.template.findFirst({
            where: { id, userId },
        });

        if (!existing) {
            return res.status(404).json({ error: 'Template não encontrado' });
        }

        await prisma.template.delete({ where: { id } });

        return res.json({ message: 'Template excluído' });
    } catch (error) {
        logger.error({ err: error }, 'Erro ao excluir template');
        return res.status(500).json({ error: 'Erro ao excluir template' });
    }
};

export const duplicateTemplate = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId!;
        const { id } = req.params;

        const existing = await prisma.template.findFirst({
            where: { id, userId },
        });

        if (!existing) {
            return res.status(404).json({ error: 'Template não encontrado' });
        }

        const template = await prisma.template.create({
            data: {
                name: `${existing.name} (cópia)`,
                type: existing.type,
                content: existing.content,
                value: existing.value,
                userId,
            },
        });

        logger.info({ templateId: template.id, sourceId: id }, 'Template duplicado');
        return res.status(201).json(template);
    } catch (error) {
        logger.error({ err: error }, 'Erro ao duplicar template');
        return res.status(500).json({ error: 'Erro ao duplicar template' });
    }
};
