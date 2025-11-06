import { Response } from 'express';
import path from 'path';
import fs from 'fs';
import prisma from '../config/database';
import { AuthRequest } from '../middlewares/auth.middleware';

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

        return res.status(201).json({
            message: 'Arquivo enviado com sucesso',
            arquivo,
        });
    } catch (error) {
        console.error('Upload arquivo error:', error);

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
        console.error('Get arquivos error:', error);
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
        console.error('Get arquivo error:', error);
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
        console.error('Download arquivo error:', error);
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

        // Remover arquivo do sistema de arquivos
        const filePath = path.join(__dirname, '..', '..', 'uploads', path.basename(arquivo.url));
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        // Remover registro do banco
        await prisma.arquivo.delete({
            where: { id },
        });

        return res.json({
            message: 'Arquivo excluído com sucesso',
        });
    } catch (error) {
        console.error('Delete arquivo error:', error);
        return res.status(500).json({
            error: 'Erro ao excluir arquivo',
        });
    }
};