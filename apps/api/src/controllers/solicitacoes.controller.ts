import { Request, Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middlewares/auth.middleware';
import { NotificacaoService } from '../services/notificacao.service';

// Rota PÚBLICA - Cliente cria solicitação
export const createSolicitacao = async (req: Request, res: Response) => {
    try {
        const { clienteId, title, description, budget, deadline, attachments } = req.body;

        if (!clienteId || !title || !description) {
            return res.status(400).json({
                error: 'Cliente, título e descrição são obrigatórios',
            });
        }

        // Verificar se cliente existe
        const cliente = await prisma.cliente.findUnique({
            where: { id: clienteId },
        });

        if (!cliente) {
            return res.status(404).json({
                error: 'Cliente não encontrado',
            });
        }

        const solicitacao = await prisma.solicitacao.create({
            data: {
                clienteId,
                title,
                description,
                budget: budget ? parseFloat(budget) : null,
                deadline: deadline ? new Date(deadline) : null,
                attachments,
            },
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

        NotificacaoService.notificarNovaSolicitacao(solicitacao.id).catch(err => {
            console.error('Erro ao enviar notificação:', err);
            // Não bloqueia a resposta se email falhar
        });

        return res.status(201).json({
            message: 'Solicitação enviada com sucesso!',
            solicitacao,
        });
    } catch (error) {
        console.error('Create solicitacao error:', error);
        return res.status(500).json({
            error: 'Erro ao criar solicitação',
        });
    }
};

// Rota PÚBLICA - Buscar cliente por CNPJ
export const findClienteByCnpj = async (req: Request, res: Response) => {
    try {
        const { cnpj } = req.params;

        if (!cnpj) {
            return res.status(400).json({
                error: 'CNPJ é obrigatório',
            });
        }

        // Remover formatação do CNPJ
        const cnpjClean = cnpj.replace(/[^\d]/g, '');

        const cliente = await prisma.cliente.findFirst({
            where: {
                cnpj: {
                    contains: cnpjClean,
                },
            },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                company: true,
                cnpj: true,
            },
        });

        if (!cliente) {
            return res.status(404).json({
                error: 'Cliente não encontrado',
            });
        }

        return res.json(cliente);
    } catch (error) {
        console.error('Find cliente by CNPJ error:', error);
        return res.status(500).json({
            error: 'Erro ao buscar cliente',
        });
    }
};

// Rota PÚBLICA - Criar novo cliente (cadastro público)
export const createClientePublic = async (req: Request, res: Response) => {
    try {
        const { name, email, phone, company, cnpj } = req.body;

        if (!name || !email) {
            return res.status(400).json({
                error: 'Nome e email são obrigatórios',
            });
        }

        // Verificar se email já existe
        const clienteExists = await prisma.cliente.findFirst({
            where: { email },
        });

        if (clienteExists) {
            return res.status(400).json({
                error: 'Já existe um cliente com este email',
            });
        }

        // Pegar o primeiro usuário (você) - ajuste conforme necessário
        const user = await prisma.user.findFirst();

        if (!user) {
            return res.status(500).json({
                error: 'Erro ao criar cliente - usuário não encontrado',
            });
        }

        const cliente = await prisma.cliente.create({
            data: {
                userId: user.id,
                name,
                email,
                phone,
                company,
                cnpj,
            },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                company: true,
                cnpj: true,
            },
        });

        return res.status(201).json({
            message: 'Cadastro realizado com sucesso!',
            cliente,
        });
    } catch (error) {
        console.error('Create cliente public error:', error);
        return res.status(500).json({
            error: 'Erro ao criar cadastro',
        });
    }
};

// Rotas PRIVADAS (com autenticação) - Para você gerenciar

export const getSolicitacoes = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId!;
        const { status } = req.query;

        const where: any = {
            cliente: {
                userId,
            },
        };

        if (status) {
            where.status = status;
        }

        const solicitacoes = await prisma.solicitacao.findMany({
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
                orcamento: {
                    select: {
                        id: true,
                        number: true,
                        status: true,
                    },
                },
            },
        });

        return res.json(solicitacoes);
    } catch (error) {
        console.error('Get solicitacoes error:', error);
        return res.status(500).json({
            error: 'Erro ao buscar solicitações',
        });
    }
};

export const getSolicitacao = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId!;
        const { id } = req.params;

        const solicitacao = await prisma.solicitacao.findFirst({
            where: {
                id,
                cliente: {
                    userId,
                },
            },
            include: {
                cliente: true,
                orcamento: true,
            },
        });

        if (!solicitacao) {
            return res.status(404).json({
                error: 'Solicitação não encontrada',
            });
        }

        return res.json(solicitacao);
    } catch (error) {
        console.error('Get solicitacao error:', error);
        return res.status(500).json({
            error: 'Erro ao buscar solicitação',
        });
    }
};

export const updateSolicitacaoStatus = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId!;
        const { id } = req.params;
        const { status, notes } = req.body;

        const solicitacao = await prisma.solicitacao.findFirst({
            where: {
                id,
                cliente: {
                    userId,
                },
            },
        });

        if (!solicitacao) {
            return res.status(404).json({
                error: 'Solicitação não encontrada',
            });
        }

        const updated = await prisma.solicitacao.update({
            where: { id },
            data: {
                status,
                notes,
            },
        });

        return res.json({
            message: 'Status atualizado com sucesso',
            solicitacao: updated,
        });
    } catch (error) {
        console.error('Update solicitacao status error:', error);
        return res.status(500).json({
            error: 'Erro ao atualizar status',
        });
    }
};