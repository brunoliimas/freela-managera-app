import crypto from 'crypto';
import { Request, Response } from 'express';
import prisma from '../config/database';
import { generateToken } from '../utils/jwt';
import { setClientCookie, clearClientCookie } from '../utils/cookie';
import { sendEmail } from '../config/email';
import { ClientAuthRequest } from '../middlewares/clientAuth.middleware';
import { env } from '../config/env';
import logger from '../config/logger';
import { NotificacaoService } from '../services/notificacao.service';

// ==================== AUTH ====================

export const requestLogin = async (req: Request, res: Response) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Email é obrigatório' });
        }

        const cliente = await prisma.cliente.findFirst({
            where: { email, active: true },
            include: { user: { select: { slug: true } } },
        });

        // Retorna sucesso genérico por segurança (não revelar se email existe)
        if (!cliente) {
            return res.json({ message: 'Se o email estiver cadastrado, você receberá um link de acesso.' });
        }

        const slug = cliente.user?.slug;
        if (!slug) {
            logger.error({ clienteId: cliente.id }, 'Freelancer sem slug configurado');
            return res.status(500).json({ error: 'Erro na configuração do portal' });
        }

        const token = crypto.randomBytes(32).toString('hex');
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
        const tokenExpires = new Date(Date.now() + 30 * 60 * 1000); // 30 minutos

        await prisma.cliente.update({
            where: { id: cliente.id },
            data: {
                portalToken: tokenHash,
                portalTokenExpires: tokenExpires,
            },
        });

        const portalUrl = `${env.FRONTEND_URL}/portal/${slug}/callback?token=${token}`;

        await sendEmail({
            to: cliente.email,
            subject: `Acesse seu portal - ${env.APP_NAME}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #059669;">Portal do Cliente</h2>
                    <p>Olá, <strong>${cliente.name}</strong>!</p>
                    <p>Clique no botão abaixo para acessar seu portal:</p>
                    <a href="${portalUrl}" style="display: inline-block; background: #059669; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin: 16px 0;">
                        Acessar Portal
                    </a>
                    <p style="color: #666; font-size: 14px;">Este link expira em 30 minutos.</p>
                    <p style="color: #666; font-size: 12px;">Se você não solicitou este acesso, ignore este email.</p>
                </div>
            `,
        });

        return res.json({ message: 'Se o email estiver cadastrado, você receberá um link de acesso.' });
    } catch (error) {
        logger.error({ err: error }, 'Erro ao solicitar login do portal');
        return res.status(500).json({ error: 'Erro ao enviar link de acesso' });
    }
};

export const verifyToken = async (req: Request, res: Response) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({ error: 'Token é obrigatório' });
        }

        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

        const cliente = await prisma.cliente.findFirst({
            where: {
                portalToken: tokenHash,
                portalTokenExpires: { gt: new Date() },
            },
            include: { user: { select: { slug: true } } },
        });

        if (!cliente) {
            return res.status(400).json({ error: 'Link inválido ou expirado. Solicite um novo acesso.' });
        }

        // Limpar token usado
        await prisma.cliente.update({
            where: { id: cliente.id },
            data: {
                portalToken: null,
                portalTokenExpires: null,
            },
        });

        // Gerar JWT para o cliente
        const jwtToken = generateToken({ userId: cliente.id, email: cliente.email });
        setClientCookie(res, jwtToken);

        return res.json({
            message: 'Login realizado com sucesso',
            cliente: {
                id: cliente.id,
                name: cliente.name,
                email: cliente.email,
                company: cliente.company,
                phone: cliente.phone,
            },
            slug: cliente.user?.slug,
        });
    } catch (error) {
        logger.error({ err: error }, 'Erro ao verificar token do portal');
        return res.status(500).json({ error: 'Erro ao verificar token' });
    }
};

export const logout = async (req: ClientAuthRequest, res: Response) => {
    clearClientCookie(res);
    return res.json({ message: 'Logout realizado' });
};

// ==================== PERFIL ====================

export const getProfile = async (req: ClientAuthRequest, res: Response) => {
    try {
        const cliente = await prisma.cliente.findUnique({
            where: { id: req.clienteId! },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                company: true,
                cnpj: true,
                avatar: true,
                user: { select: { slug: true } },
            },
        });

        if (!cliente) {
            return res.status(404).json({ error: 'Cliente não encontrado' });
        }

        const { user, ...clienteData } = cliente;
        return res.json({ ...clienteData, slug: user?.slug });
    } catch (error) {
        logger.error({ err: error }, 'Erro ao buscar perfil do cliente');
        return res.status(500).json({ error: 'Erro ao buscar perfil' });
    }
};

// ==================== PROJETOS ====================

export const getMeusProjetos = async (req: ClientAuthRequest, res: Response) => {
    try {
        const projetos = await prisma.projeto.findMany({
            where: { clienteId: req.clienteId! },
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                number: true,
                title: true,
                description: true,
                value: true,
                status: true,
                progress: true,
                startDate: true,
                endDate: true,
                completedAt: true,
                milestones: {
                    select: { id: true, title: true, completed: true, order: true },
                    orderBy: { order: 'asc' },
                },
            },
        });

        return res.json(projetos);
    } catch (error) {
        logger.error({ err: error }, 'Erro ao buscar projetos do portal');
        return res.status(500).json({ error: 'Erro ao buscar projetos' });
    }
};

export const getMeuProjeto = async (req: ClientAuthRequest, res: Response) => {
    try {
        const projeto = await prisma.projeto.findFirst({
            where: { id: req.params.id, clienteId: req.clienteId! },
            select: {
                id: true,
                number: true,
                title: true,
                description: true,
                value: true,
                status: true,
                progress: true,
                startDate: true,
                endDate: true,
                completedAt: true,
                notes: true,
                milestones: {
                    select: { id: true, title: true, description: true, completed: true, completedAt: true, order: true },
                    orderBy: { order: 'asc' },
                },
                arquivos: {
                    select: { id: true, name: true, size: true, type: true, createdAt: true },
                    orderBy: { createdAt: 'desc' },
                },
                pagamentos: {
                    select: { id: true, description: true, value: true, dueDate: true, paidAt: true, status: true, method: true },
                    orderBy: { dueDate: 'asc' },
                },
            },
        });

        if (!projeto) {
            return res.status(404).json({ error: 'Projeto não encontrado' });
        }

        return res.json(projeto);
    } catch (error) {
        logger.error({ err: error }, 'Erro ao buscar projeto do portal');
        return res.status(500).json({ error: 'Erro ao buscar projeto' });
    }
};

// ==================== ORÇAMENTOS ====================

export const getMeusOrcamentos = async (req: ClientAuthRequest, res: Response) => {
    try {
        const orcamentos = await prisma.orcamento.findMany({
            where: { clienteId: req.clienteId! },
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                number: true,
                title: true,
                description: true,
                value: true,
                status: true,
                validUntil: true,
                estimatedDays: true,
                createdAt: true,
                sentAt: true,
                approvedAt: true,
            },
        });

        return res.json(orcamentos);
    } catch (error) {
        logger.error({ err: error }, 'Erro ao buscar orçamentos do portal');
        return res.status(500).json({ error: 'Erro ao buscar orçamentos' });
    }
};

export const responderOrcamento = async (req: ClientAuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { acao } = req.body;

        if (!acao || !['APROVADO', 'RECUSADO'].includes(acao)) {
            return res.status(400).json({ error: 'Ação deve ser APROVADO ou RECUSADO' });
        }

        const orcamento = await prisma.orcamento.findFirst({
            where: { id, clienteId: req.clienteId! },
            include: { projeto: true },
        });

        if (!orcamento) {
            return res.status(404).json({ error: 'Orçamento não encontrado' });
        }

        if (orcamento.status !== 'ENVIADO') {
            return res.status(400).json({ error: 'Apenas orçamentos com status ENVIADO podem ser respondidos' });
        }

        const updated = await prisma.orcamento.update({
            where: { id },
            data: {
                status: acao,
                approvedAt: acao === 'APROVADO' ? new Date() : undefined,
            },
        });

        let projeto = null;

        // Auto-criar projeto quando aprovado
        if (acao === 'APROVADO' && !orcamento.projeto) {
            projeto = await prisma.$transaction(async (tx) => {
                const lastProjeto = await tx.projeto.findFirst({
                    where: { userId: orcamento.userId },
                    orderBy: { createdAt: 'desc' },
                });

                let nextNumber = 1;
                if (lastProjeto?.number) {
                    const lastNumber = parseInt(lastProjeto.number.split('-')[1]);
                    nextNumber = lastNumber + 1;
                }

                const number = `PRJ-${nextNumber.toString().padStart(3, '0')}`;

                return tx.projeto.create({
                    data: {
                        userId: orcamento.userId,
                        clienteId: orcamento.clienteId,
                        number,
                        title: orcamento.title,
                        description: orcamento.description,
                        value: orcamento.value,
                        startDate: new Date(),
                        endDate: orcamento.estimatedDays
                            ? new Date(Date.now() + orcamento.estimatedDays * 24 * 60 * 60 * 1000)
                            : null,
                        orcamentoId: orcamento.id,
                    },
                });
            });

            // Notificações async
            NotificacaoService.notificarOrcamentoAprovado(orcamento.id).catch(() => {});
            NotificacaoService.notificarProjetoIniciado(projeto.id).catch(() => {});
        } else if (acao === 'APROVADO') {
            NotificacaoService.notificarOrcamentoAprovado(orcamento.id).catch(() => {});
        } else {
            NotificacaoService.notificarOrcamentoRecusado(orcamento.id).catch(() => {});
        }

        return res.json({
            message: acao === 'APROVADO' ? 'Orçamento aprovado com sucesso' : 'Orçamento recusado',
            orcamento: updated,
            projeto,
        });
    } catch (error) {
        logger.error({ err: error }, 'Erro ao responder orçamento do portal');
        return res.status(500).json({ error: 'Erro ao responder orçamento' });
    }
};

// ==================== PAGAMENTOS ====================

export const getMeusPagamentos = async (req: ClientAuthRequest, res: Response) => {
    try {
        const pagamentos = await prisma.pagamento.findMany({
            where: {
                projeto: { clienteId: req.clienteId! },
            },
            orderBy: { dueDate: 'asc' },
            select: {
                id: true,
                description: true,
                value: true,
                dueDate: true,
                paidAt: true,
                status: true,
                method: true,
                paymentUrl: true,
                projeto: {
                    select: { number: true, title: true },
                },
            },
        });

        // Calcular status dinâmico (ATRASADO)
        const now = new Date();
        const pagamentosComStatus = pagamentos.map((p) => ({
            ...p,
            status:
                p.status === 'PENDENTE' && new Date(p.dueDate) < now
                    ? 'ATRASADO'
                    : p.status,
        }));

        return res.json(pagamentosComStatus);
    } catch (error) {
        logger.error({ err: error }, 'Erro ao buscar pagamentos do portal');
        return res.status(500).json({ error: 'Erro ao buscar pagamentos' });
    }
};

// ==================== CHECKOUT (PAGAMENTO ONLINE) ====================

export const checkoutPagamento = async (req: ClientAuthRequest, res: Response) => {
    try {
        const { id } = req.params;

        // Verifica se pagamento pertence a um projeto deste cliente
        const pagamento = await prisma.pagamento.findFirst({
            where: {
                id,
                projeto: { clienteId: req.clienteId! },
            },
            select: { id: true, status: true, paymentUrl: true },
        });

        if (!pagamento) {
            return res.status(404).json({ error: 'Pagamento não encontrado' });
        }

        if (pagamento.status === 'PAGO') {
            return res.status(400).json({ error: 'Este pagamento já foi pago' });
        }

        if (!pagamento.paymentUrl) {
            return res.status(400).json({ error: 'Link de pagamento ainda não foi gerado pelo freelancer' });
        }

        return res.json({ url: pagamento.paymentUrl });
    } catch (error) {
        logger.error({ err: error }, 'Erro no checkout do portal');
        return res.status(500).json({ error: 'Erro ao processar checkout' });
    }
};

// ==================== SOLICITAÇÕES ====================

export const criarSolicitacao = async (req: ClientAuthRequest, res: Response) => {
    try {
        const { title, description, budget, deadline } = req.body;

        if (!title || !description) {
            return res.status(400).json({ error: 'Título e descrição são obrigatórios' });
        }

        const solicitacao = await prisma.solicitacao.create({
            data: {
                clienteId: req.clienteId!,
                title,
                description,
                budget: budget || null,
                deadline: deadline ? new Date(deadline) : null,
            },
        });

        return res.status(201).json({
            message: 'Solicitação enviada com sucesso',
            solicitacao,
        });
    } catch (error) {
        logger.error({ err: error }, 'Erro ao criar solicitação do portal');
        return res.status(500).json({ error: 'Erro ao enviar solicitação' });
    }
};
