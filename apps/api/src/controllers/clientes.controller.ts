import { Response } from 'express';
import fs from 'fs';
import path from 'path';
import prisma from '../config/database';
import { AuthRequest } from '../middlewares/auth.middleware';
import logger from '../config/logger';

export const getClientes = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId!;
        const { search, active } = req.query;

        const where: any = { userId };

        if (search) {
            where.OR = [
                { name: { contains: search as string, mode: 'insensitive' } },
                { email: { contains: search as string, mode: 'insensitive' } },
                { company: { contains: search as string, mode: 'insensitive' } },
            ];
        }

        if (active !== undefined) {
            where.active = active === 'true';
        }

        const clientes = await prisma.cliente.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: {
                _count: {
                    select: {
                        projetos: true,
                        orcamentos: true,
                    },
                },
            },
        });

        return res.json(clientes);
    } catch (error) {
        logger.error({ err: error }, 'Get clientes error');
        return res.status(500).json({
            error: 'Erro ao buscar clientes',
        });
    }
};

export const getCliente = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId!;
        const { id } = req.params;

        const cliente = await prisma.cliente.findFirst({
            where: {
                id,
                userId,
            },
            include: {
                orcamentos: {
                    orderBy: { createdAt: 'desc' },
                    take: 10,
                },
                projetos: {
                    orderBy: { createdAt: 'desc' },
                    take: 10,
                },
            },
        });

        if (!cliente) {
            return res.status(404).json({
                error: 'Cliente não encontrado',
            });
        }

        return res.json(cliente);
    } catch (error) {
        logger.error({ err: error }, 'Get cliente error');
        return res.status(500).json({
            error: 'Erro ao buscar cliente',
        });
    }
};

export const createCliente = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId!;
        const { name, email, phone, company, cnpj, address, city, state, zipCode, notes, active } = req.body;

        if (!name || !email) {
            return res.status(400).json({
                error: 'Nome e email são obrigatórios',
            });
        }

        // Verificar se email já existe para este usuário
        const clienteExists = await prisma.cliente.findFirst({
            where: {
                userId,
                email,
            },
        });

        if (clienteExists) {
            return res.status(400).json({
                error: 'Já existe um cliente com este email',
            });
        }

        const cliente = await prisma.cliente.create({
            data: {
                userId,
                name,
                email,
                phone,
                company,
                cnpj,
                address,
                city,
                state,
                zipCode,
                notes,
                active,
            },
        });

        return res.status(201).json({
            message: 'Cliente criado com sucesso',
            cliente,
        });
    } catch (error) {
        logger.error({ err: error }, 'Create cliente error');
        return res.status(500).json({
            error: 'Erro ao criar cliente',
        });
    }
};

export const updateCliente = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId!;
        const { id } = req.params;
        const { name, email, phone, company, cnpj, address, city, state, zipCode, notes, active } = req.body;

        // Verificar se cliente pertence ao usuário
        const clienteExists = await prisma.cliente.findFirst({
            where: { id, userId },
        });

        if (!clienteExists) {
            return res.status(404).json({
                error: 'Cliente não encontrado',
            });
        }

        const cliente = await prisma.cliente.update({
            where: { id },
            data: {
                name,
                email,
                phone,
                company,
                cnpj,
                address,
                city,
                state,
                zipCode,
                notes,
                active,
            },
        });

        return res.json({
            message: 'Cliente atualizado com sucesso',
            cliente,
        });
    } catch (error) {
        logger.error({ err: error }, 'Update cliente error');
        return res.status(500).json({
            error: 'Erro ao atualizar cliente',
        });
    }
};

export const deleteCliente = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId!;
        const { id } = req.params;

        // Verificar se cliente pertence ao usuário
        const cliente = await prisma.cliente.findFirst({
            where: { id, userId },
            include: {
                _count: {
                    select: {
                        projetos: true,
                        orcamentos: true,
                    },
                },
            },
        });

        if (!cliente) {
            return res.status(404).json({
                error: 'Cliente não encontrado',
            });
        }

        // Verificar se tem projetos ou orçamentos
        if (cliente._count.projetos > 0 || cliente._count.orcamentos > 0) {
            return res.status(400).json({
                error: 'Não é possível excluir cliente com projetos ou orçamentos associados',
                hint: 'Desative o cliente ao invés de excluí-lo',
            });
        }

        await prisma.cliente.delete({
            where: { id },
        });

        return res.json({
            message: 'Cliente excluído com sucesso',
        });
    } catch (error) {
        logger.error({ err: error }, 'Delete cliente error');
        return res.status(500).json({
            error: 'Erro ao excluir cliente',
        });
    }
};

export const uploadClienteAvatar = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId!;
        const { id } = req.params;
        const file = req.file;

        if (!file) {
            return res.status(400).json({ error: 'Arquivo é obrigatório' });
        }

        const cliente = await prisma.cliente.findFirst({
            where: { id, userId },
            select: { avatar: true },
        });

        if (!cliente) {
            // Cleanup uploaded file
            fs.unlinkSync(file.path);
            return res.status(404).json({ error: 'Cliente não encontrado' });
        }

        // Deletar avatar anterior
        if (cliente.avatar) {
            const oldPath = path.join(__dirname, '..', '..', cliente.avatar);
            if (fs.existsSync(oldPath)) {
                fs.unlinkSync(oldPath);
            }
        }

        const avatarUrl = `/uploads/${file.filename}`;

        const updated = await prisma.cliente.update({
            where: { id },
            data: { avatar: avatarUrl },
            select: { id: true, avatar: true },
        });

        return res.json({
            message: 'Avatar do cliente atualizado com sucesso',
            avatar: updated.avatar,
        });
    } catch (error) {
        logger.error({ err: error }, 'Upload cliente avatar error');
        return res.status(500).json({
            error: 'Erro ao atualizar avatar do cliente',
        });
    }
};