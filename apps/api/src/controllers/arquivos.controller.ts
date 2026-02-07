import { Response } from 'express';
import path from 'path';
import fs from 'fs';
import prisma from '../config/database';
import { AuthRequest } from '../middlewares/auth.middleware';
import { NotificacaoService } from '../services/notificacao.service';
import logger from '../config/logger';

export const uploadArquivo = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId!;
        const { projetoId } = req.body;
        const file = req.file;

        if (!file) {
            return res.status(400).json({
                error: 'Nenhum arquivo enviado',
            });
        }

        if (!projetoId) {
            // Remover arquivo se não tem projeto
            fs.unlinkSync(file.path);
            return res.status(400).json({
                error: 'Projeto é obrigatório',
            });
        }

        // Verificar se projeto existe e pertence ao usuário
        const projeto = await prisma.projeto.findFirst({
            where: { id: projetoId, userId },
        });

        if (!projeto) {
            // Remover arquivo se projeto não existe
            fs.unlinkSync(file.path);
            return res.status(404).json({
                error: 'Projeto não encontrado',
            });
        }

        // Criar registro no banco
        const arquivo = await prisma.arquivo.create({
            data: {
                projetoId,
                name: file.originalname,
                url: `/uploads/${file.filename}`,
                size: file.size,
                type: file.mimetype,
            },
        });

        // Notificar cliente e freela
        NotificacaoService.notificarNovoArquivo(arquivo.id).catch(() => {});

        return res.status(201).json({
            message: 'Arquivo enviado com sucesso',
            arquivo,
        });
    } catch (error) {
        logger.error({ err: error }, 'Upload arquivo error');

        // Remover arquivo em caso de erro
        if (req.file) {
            fs.unlinkSync(req.file.path);
        }

        return res.status(500).json({
            error: 'Erro ao enviar arquivo',
        });
    }
};

export const getArquivos = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId!;
        const { projetoId } = req.query;

        const where: Record<string, unknown> = {
            projeto: { userId },
        };

        if (projetoId) {
            where.projetoId = projetoId;
        }

        const arquivos = await prisma.arquivo.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: {
                projeto: {
                    select: {
                        number: true,
                        title: true,
                    },
                },
            },
        });

        return res.json(arquivos);
    } catch (error) {
        logger.error({ err: error }, 'Get arquivos error');
        return res.status(500).json({
            error: 'Erro ao buscar arquivos',
        });
    }
};

export const getArquivo = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId!;
        const { id } = req.params;

        const arquivo = await prisma.arquivo.findFirst({
            where: {
                id,
                projeto: { userId },
            },
            include: {
                projeto: true,
            },
        });

        if (!arquivo) {
            return res.status(404).json({
                error: 'Arquivo não encontrado',
            });
        }

        return res.json(arquivo);
    } catch (error) {
        logger.error({ err: error }, 'Get arquivo error');
        return res.status(500).json({
            error: 'Erro ao buscar arquivo',
        });
    }
};

export const downloadArquivo = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId!;
        const { id } = req.params;

        const arquivo = await prisma.arquivo.findFirst({
            where: {
                id,
                projeto: { userId },
            },
        });

        if (!arquivo) {
            return res.status(404).json({
                error: 'Arquivo não encontrado',
            });
        }

        const filePath = path.join(__dirname, '..', '..', 'uploads', path.basename(arquivo.url));

        // Verificar se arquivo existe no sistema de arquivos
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({
                error: 'Arquivo não encontrado no servidor',
            });
        }

        // Fazer download
        res.download(filePath, arquivo.name);
    } catch (error) {
        logger.error({ err: error }, 'Download arquivo error');
        return res.status(500).json({
            error: 'Erro ao fazer download do arquivo',
        });
    }
};

export const deleteArquivo = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId!;
        const { id } = req.params;

        const arquivo = await prisma.arquivo.findFirst({
            where: {
                id,
                projeto: { userId },
            },
        });

        if (!arquivo) {
            return res.status(404).json({
                error: 'Arquivo não encontrado',
            });
        }

        // Remover registro do banco primeiro (operação crítica)
        await prisma.arquivo.delete({
            where: { id },
        });

        // Remover arquivo do sistema de arquivos (best-effort)
        const filePath = path.join(__dirname, '..', '..', 'uploads', path.basename(arquivo.url));
        try {
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        } catch (fsError) {
            logger.error({ err: fsError }, 'Erro ao remover arquivo do disco');
        }

        return res.json({
            message: 'Arquivo excluído com sucesso',
        });
    } catch (error) {
        logger.error({ err: error }, 'Delete arquivo error');
        return res.status(500).json({
            error: 'Erro ao excluir arquivo',
        });
    }
};