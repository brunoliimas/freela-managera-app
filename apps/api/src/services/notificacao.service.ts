import { sendEmail } from '../config/email';
import {
    templateNovaSolicitacao,
    templateLembretePagamento,
    templatePagamentoVencido,
    templateOrcamentoAprovado,
    templateOrcamentoCliente,
    templateLembretePagamentoCliente,
    templatePagamentoVencidoCliente,
    templatePagamentoConfirmadoCliente,
    templateProjetoIniciadoCliente,
    templateMilestoneConcluidoCliente,
    templateNovoArquivoCliente,
} from '../templates/email-templates';
import prisma from '../config/database';
import logger from '../config/logger';
import { env } from '../config/env';
import { NotificacaoType } from '@prisma/client';

export class NotificacaoService {
    // ============================================
    // HELPERS
    // ============================================

    static async criarNotificacaoInApp(data: {
        userId: string;
        type: NotificacaoType;
        title: string;
        message: string;
        link?: string;
    }) {
        try {
            await prisma.notificacao.create({ data });
        } catch (error) {
            logger.error({ err: error }, 'Erro ao criar notificação in-app');
        }
    }

    static async getPortalUrl(userId: string): Promise<string | null> {
        try {
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { slug: true },
            });
            if (!user?.slug) return null;
            return `${env.FRONTEND_URL}/portal/${user.slug}`;
        } catch {
            return null;
        }
    }

    static formatCurrency(value: number): string {
        return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    }

    // ============================================
    // NOTIFICAÇÕES EXISTENTES (para o freela)
    // ============================================

    static async notificarNovaSolicitacao(solicitacaoId: string) {
        try {
            const solicitacao = await prisma.solicitacao.findUnique({
                where: { id: solicitacaoId },
                include: {
                    cliente: {
                        include: {
                            user: true,
                        },
                    },
                },
            });

            if (!solicitacao) return;

            const html = templateNovaSolicitacao({
                solicitacaoTitulo: solicitacao.title,
                clienteNome: solicitacao.cliente.name,
                clienteEmail: solicitacao.cliente.email,
                descricao: solicitacao.description,
                orcamento: solicitacao.budget
                    ? this.formatCurrency(solicitacao.budget.toNumber())
                    : undefined,
                prazo: solicitacao.deadline
                    ? new Date(solicitacao.deadline).toLocaleDateString('pt-BR')
                    : undefined,
            });

            await sendEmail({
                to: solicitacao.cliente.user.email,
                subject: `Nova solicitação: ${solicitacao.title}`,
                html,
            });

            // In-app notification para o freela
            await this.criarNotificacaoInApp({
                userId: solicitacao.cliente.user.id,
                type: 'SOLICITACAO_RECEBIDA',
                title: 'Nova solicitação recebida',
                message: `${solicitacao.cliente.name} enviou: ${solicitacao.title}`,
                link: '/solicitacoes',
            });

            logger.info('Email de nova solicitação enviado');
        } catch (error) {
            logger.error({ err: error }, 'Erro ao notificar nova solicitação');
        }
    }

    static async notificarOrcamentoAprovado(orcamentoId: string) {
        try {
            const orcamento = await prisma.orcamento.findUnique({
                where: { id: orcamentoId },
                include: {
                    cliente: true,
                    user: true,
                },
            });

            if (!orcamento) return;

            const html = templateOrcamentoAprovado({
                orcamentoNumero: orcamento.number,
                titulo: orcamento.title,
                valor: this.formatCurrency(orcamento.value.toNumber()),
                clienteNome: orcamento.cliente.name,
            });

            await sendEmail({
                to: orcamento.user.email,
                subject: `Orçamento aprovado: ${orcamento.number}`,
                html,
            });

            // In-app notification para o freela
            await this.criarNotificacaoInApp({
                userId: orcamento.userId,
                type: 'ORCAMENTO_APROVADO',
                title: 'Orçamento aprovado!',
                message: `${orcamento.cliente.name} aprovou ${orcamento.number} - ${orcamento.title}`,
                link: '/orcamentos',
            });

            logger.info('Email de orçamento aprovado enviado');
        } catch (error) {
            logger.error({ err: error }, 'Erro ao notificar orçamento aprovado');
        }
    }

    static async notificarOrcamentoRecusado(orcamentoId: string) {
        try {
            const orcamento = await prisma.orcamento.findUnique({
                where: { id: orcamentoId },
                include: {
                    cliente: true,
                    user: true,
                },
            });

            if (!orcamento) return;

            // In-app notification para o freela
            await this.criarNotificacaoInApp({
                userId: orcamento.userId,
                type: 'ORCAMENTO_RECUSADO',
                title: 'Orçamento recusado',
                message: `${orcamento.cliente.name} recusou ${orcamento.number} - ${orcamento.title}`,
                link: '/orcamentos',
            });

            logger.info('Notificação de orçamento recusado criada');
        } catch (error) {
            logger.error({ err: error }, 'Erro ao notificar orçamento recusado');
        }
    }

    static async enviarOrcamentoParaCliente(orcamentoId: string) {
        try {
            const orcamento = await prisma.orcamento.findUnique({
                where: { id: orcamentoId },
                include: {
                    cliente: true,
                    user: true,
                },
            });

            if (!orcamento) return;

            const html = templateOrcamentoCliente({
                orcamentoNumero: orcamento.number,
                titulo: orcamento.title,
                descricao: orcamento.description,
                valor: this.formatCurrency(orcamento.value.toNumber()),
                prazoEstimado: orcamento.estimatedDays
                    ? `${orcamento.estimatedDays} dias`
                    : undefined,
                validade: orcamento.validUntil
                    ? new Date(orcamento.validUntil).toLocaleDateString('pt-BR')
                    : undefined,
                empresaNome: orcamento.user.company || orcamento.user.name,
                empresaEmail: orcamento.user.email,
                empresaTelefone: orcamento.user.phone || undefined,
            });

            await sendEmail({
                to: orcamento.cliente.email,
                subject: `Orçamento ${orcamento.number} - ${orcamento.title}`,
                html,
            });

            await prisma.orcamento.update({
                where: { id: orcamentoId },
                data: {
                    status: 'ENVIADO',
                    sentAt: new Date(),
                },
            });

            logger.info('Orçamento enviado para cliente');
            return { success: true };
        } catch (error) {
            logger.error({ err: error }, 'Erro ao enviar orçamento para cliente');
            return { success: false, error };
        }
    }

    // ============================================
    // NOTIFICAÇÕES NOVAS (para o cliente + in-app freela)
    // ============================================

    static async notificarPagamentoConfirmado(pagamentoId: string) {
        try {
            const pagamento = await prisma.pagamento.findUnique({
                where: { id: pagamentoId },
                include: {
                    user: true,
                    projeto: {
                        include: { cliente: true },
                    },
                },
            });

            if (!pagamento) return;

            const portalUrl = await this.getPortalUrl(pagamento.userId);
            const empresaNome = pagamento.user.company || pagamento.user.name;

            // Email para o cliente
            if (portalUrl) {
                const html = templatePagamentoConfirmadoCliente({
                    clienteNome: pagamento.projeto.cliente.name,
                    descricao: pagamento.description,
                    valor: this.formatCurrency(pagamento.value.toNumber()),
                    projetoTitulo: pagamento.projeto.title,
                    empresaNome,
                    portalUrl,
                });

                await sendEmail({
                    to: pagamento.projeto.cliente.email,
                    subject: `Pagamento confirmado - ${pagamento.projeto.title}`,
                    html,
                });
            }

            // In-app para o freela
            await this.criarNotificacaoInApp({
                userId: pagamento.userId,
                type: 'PAGAMENTO_CONFIRMADO',
                title: 'Pagamento confirmado',
                message: `${pagamento.description} - ${pagamento.projeto.title} (${this.formatCurrency(pagamento.value.toNumber())})`,
                link: '/pagamentos',
            });

            logger.info('Notificação de pagamento confirmado enviada');
        } catch (error) {
            logger.error({ err: error }, 'Erro ao notificar pagamento confirmado');
        }
    }

    static async notificarProjetoIniciado(projetoId: string) {
        try {
            const projeto = await prisma.projeto.findUnique({
                where: { id: projetoId },
                include: {
                    user: true,
                    cliente: true,
                },
            });

            if (!projeto) return;

            const portalUrl = await this.getPortalUrl(projeto.userId);
            const empresaNome = projeto.user.company || projeto.user.name;

            // Email para o cliente
            if (portalUrl) {
                const html = templateProjetoIniciadoCliente({
                    clienteNome: projeto.cliente.name,
                    projetoNumero: projeto.number,
                    projetoTitulo: projeto.title,
                    empresaNome,
                    portalUrl,
                });

                await sendEmail({
                    to: projeto.cliente.email,
                    subject: `Projeto iniciado: ${projeto.number} - ${projeto.title}`,
                    html,
                });
            }

            // In-app para o freela
            await this.criarNotificacaoInApp({
                userId: projeto.userId,
                type: 'PROJETO_CRIADO',
                title: 'Projeto criado',
                message: `${projeto.number} - ${projeto.title} para ${projeto.cliente.name}`,
                link: `/projetos/${projeto.id}`,
            });

            logger.info('Notificação de projeto iniciado enviada');
        } catch (error) {
            logger.error({ err: error }, 'Erro ao notificar projeto iniciado');
        }
    }

    static async notificarMilestoneConcluido(milestoneId: string, projetoId: string) {
        try {
            const [milestone, projeto] = await Promise.all([
                prisma.milestone.findUnique({ where: { id: milestoneId } }),
                prisma.projeto.findUnique({
                    where: { id: projetoId },
                    include: { user: true, cliente: true },
                }),
            ]);

            if (!milestone || !projeto) return;

            const portalUrl = await this.getPortalUrl(projeto.userId);
            const empresaNome = projeto.user.company || projeto.user.name;

            // Email para o cliente
            if (portalUrl) {
                const html = templateMilestoneConcluidoCliente({
                    clienteNome: projeto.cliente.name,
                    milestoneTitulo: milestone.title,
                    projetoTitulo: projeto.title,
                    progresso: projeto.progress,
                    empresaNome,
                    portalUrl,
                });

                await sendEmail({
                    to: projeto.cliente.email,
                    subject: `Etapa concluída: ${milestone.title} - ${projeto.title}`,
                    html,
                });
            }

            // In-app para o freela
            await this.criarNotificacaoInApp({
                userId: projeto.userId,
                type: 'MILESTONE_CONCLUIDO',
                title: 'Etapa concluída',
                message: `${milestone.title} - ${projeto.title} (${projeto.progress}%)`,
                link: `/projetos/${projeto.id}`,
            });

            logger.info('Notificação de milestone concluído enviada');
        } catch (error) {
            logger.error({ err: error }, 'Erro ao notificar milestone concluído');
        }
    }

    static async notificarNovoArquivo(arquivoId: string) {
        try {
            const arquivo = await prisma.arquivo.findUnique({
                where: { id: arquivoId },
                include: {
                    projeto: {
                        include: { user: true, cliente: true },
                    },
                },
            });

            if (!arquivo) return;

            const portalUrl = await this.getPortalUrl(arquivo.projeto.userId);
            const empresaNome = arquivo.projeto.user.company || arquivo.projeto.user.name;

            // Email para o cliente
            if (portalUrl) {
                const html = templateNovoArquivoCliente({
                    clienteNome: arquivo.projeto.cliente.name,
                    arquivoNome: arquivo.name,
                    projetoTitulo: arquivo.projeto.title,
                    empresaNome,
                    portalUrl,
                });

                await sendEmail({
                    to: arquivo.projeto.cliente.email,
                    subject: `Novo arquivo: ${arquivo.name} - ${arquivo.projeto.title}`,
                    html,
                });
            }

            // In-app para o freela
            await this.criarNotificacaoInApp({
                userId: arquivo.projeto.userId,
                type: 'ARQUIVO_DISPONIVEL',
                title: 'Arquivo enviado',
                message: `${arquivo.name} adicionado em ${arquivo.projeto.title}`,
                link: `/projetos/${arquivo.projeto.id}`,
            });

            logger.info('Notificação de novo arquivo enviada');
        } catch (error) {
            logger.error({ err: error }, 'Erro ao notificar novo arquivo');
        }
    }

    // ============================================
    // CRON JOBS (para freela)
    // ============================================

    static async verificarPagamentosProximos() {
        try {
            const dataLimite = new Date();
            dataLimite.setDate(dataLimite.getDate() + 7);

            const pagamentosProximos = await prisma.pagamento.findMany({
                where: {
                    status: 'PENDENTE',
                    dueDate: {
                        gte: new Date(),
                        lte: dataLimite,
                    },
                },
                include: {
                    user: true,
                    projeto: {
                        include: {
                            cliente: true,
                        },
                    },
                },
            });

            for (const pagamento of pagamentosProximos) {
                const diasRestantes = Math.ceil(
                    (new Date(pagamento.dueDate).getTime() - new Date().getTime()) /
                    (1000 * 60 * 60 * 24)
                );

                const html = templateLembretePagamento({
                    descricao: pagamento.description,
                    valor: this.formatCurrency(pagamento.value.toNumber()),
                    vencimento: new Date(pagamento.dueDate).toLocaleDateString('pt-BR'),
                    diasRestantes,
                    clienteNome: pagamento.projeto.cliente.name,
                    projetoTitulo: pagamento.projeto.title,
                });

                await sendEmail({
                    to: pagamento.user.email,
                    subject: `Lembrete: Pagamento vence em ${diasRestantes} dia(s)`,
                    html,
                });
            }

            logger.info({ count: pagamentosProximos.length }, 'Lembretes de pagamento enviados');
        } catch (error) {
            logger.error({ err: error }, 'Erro ao verificar pagamentos próximos');
        }
    }

    static async verificarPagamentosVencidos() {
        try {
            const pagamentosVencidos = await prisma.pagamento.findMany({
                where: {
                    status: 'PENDENTE',
                    dueDate: {
                        lt: new Date(),
                    },
                },
                include: {
                    user: true,
                    projeto: {
                        include: {
                            cliente: true,
                        },
                    },
                },
            });

            for (const pagamento of pagamentosVencidos) {
                await prisma.pagamento.update({
                    where: { id: pagamento.id },
                    data: { status: 'ATRASADO' },
                });

                const diasAtraso = Math.ceil(
                    (new Date().getTime() - new Date(pagamento.dueDate).getTime()) /
                    (1000 * 60 * 60 * 24)
                );

                const html = templatePagamentoVencido({
                    descricao: pagamento.description,
                    valor: this.formatCurrency(pagamento.value.toNumber()),
                    vencimento: new Date(pagamento.dueDate).toLocaleDateString('pt-BR'),
                    diasAtraso,
                    clienteNome: pagamento.projeto.cliente.name,
                    clienteEmail: pagamento.projeto.cliente.email,
                    projetoTitulo: pagamento.projeto.title,
                });

                await sendEmail({
                    to: pagamento.user.email,
                    subject: `Pagamento vencido há ${diasAtraso} dia(s)`,
                    html,
                });
            }

            logger.info({ count: pagamentosVencidos.length }, 'Alertas de pagamento vencido enviados');
        } catch (error) {
            logger.error({ err: error }, 'Erro ao verificar pagamentos vencidos');
        }
    }

    // ============================================
    // CRON JOBS (para cliente)
    // ============================================

    static async verificarPagamentosProximosCliente() {
        try {
            const dataLimite = new Date();
            dataLimite.setDate(dataLimite.getDate() + 3);

            const pagamentosProximos = await prisma.pagamento.findMany({
                where: {
                    status: 'PENDENTE',
                    dueDate: {
                        gte: new Date(),
                        lte: dataLimite,
                    },
                },
                include: {
                    user: true,
                    projeto: {
                        include: {
                            cliente: true,
                        },
                    },
                },
            });

            for (const pagamento of pagamentosProximos) {
                const diasRestantes = Math.ceil(
                    (new Date(pagamento.dueDate).getTime() - new Date().getTime()) /
                    (1000 * 60 * 60 * 24)
                );

                const portalUrl = await this.getPortalUrl(pagamento.userId);
                if (!portalUrl) continue;

                const empresaNome = pagamento.user.company || pagamento.user.name;

                const html = templateLembretePagamentoCliente({
                    clienteNome: pagamento.projeto.cliente.name,
                    descricao: pagamento.description,
                    valor: this.formatCurrency(pagamento.value.toNumber()),
                    vencimento: new Date(pagamento.dueDate).toLocaleDateString('pt-BR'),
                    diasRestantes,
                    projetoTitulo: pagamento.projeto.title,
                    empresaNome,
                    portalUrl,
                });

                await sendEmail({
                    to: pagamento.projeto.cliente.email,
                    subject: `Lembrete: Pagamento vence em ${diasRestantes} dia(s)`,
                    html,
                });

                // In-app para o freela
                await this.criarNotificacaoInApp({
                    userId: pagamento.userId,
                    type: 'PAGAMENTO_LEMBRETE',
                    title: 'Lembrete de pagamento enviado',
                    message: `Lembrete enviado para ${pagamento.projeto.cliente.name} - ${pagamento.description}`,
                    link: '/pagamentos',
                });
            }

            logger.info({ count: pagamentosProximos.length }, 'Lembretes de pagamento para cliente enviados');
        } catch (error) {
            logger.error({ err: error }, 'Erro ao verificar pagamentos próximos do cliente');
        }
    }

    static async verificarPagamentosVencidosCliente() {
        try {
            const pagamentosVencidos = await prisma.pagamento.findMany({
                where: {
                    status: { in: ['PENDENTE', 'ATRASADO'] },
                    dueDate: {
                        lt: new Date(),
                    },
                },
                include: {
                    user: true,
                    projeto: {
                        include: {
                            cliente: true,
                        },
                    },
                },
            });

            for (const pagamento of pagamentosVencidos) {
                const diasAtraso = Math.ceil(
                    (new Date().getTime() - new Date(pagamento.dueDate).getTime()) /
                    (1000 * 60 * 60 * 24)
                );

                const portalUrl = await this.getPortalUrl(pagamento.userId);
                if (!portalUrl) continue;

                const empresaNome = pagamento.user.company || pagamento.user.name;

                const html = templatePagamentoVencidoCliente({
                    clienteNome: pagamento.projeto.cliente.name,
                    descricao: pagamento.description,
                    valor: this.formatCurrency(pagamento.value.toNumber()),
                    vencimento: new Date(pagamento.dueDate).toLocaleDateString('pt-BR'),
                    diasAtraso,
                    projetoTitulo: pagamento.projeto.title,
                    empresaNome,
                    portalUrl,
                });

                await sendEmail({
                    to: pagamento.projeto.cliente.email,
                    subject: `Pagamento em atraso há ${diasAtraso} dia(s)`,
                    html,
                });

                // In-app para o freela
                await this.criarNotificacaoInApp({
                    userId: pagamento.userId,
                    type: 'PAGAMENTO_VENCIDO',
                    title: 'Alerta de pagamento vencido',
                    message: `Cobrança enviada para ${pagamento.projeto.cliente.name} - ${pagamento.description} (${diasAtraso} dia(s) de atraso)`,
                    link: '/pagamentos',
                });
            }

            logger.info({ count: pagamentosVencidos.length }, 'Alertas de pagamento vencido para cliente enviados');
        } catch (error) {
            logger.error({ err: error }, 'Erro ao verificar pagamentos vencidos do cliente');
        }
    }
}
