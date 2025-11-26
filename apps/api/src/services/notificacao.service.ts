import { sendEmail } from '../config/email';
import {
    templateNovaSolicitacao,
    templateLembretePagamento,
    templatePagamentoVencido,
    templateOrcamentoAprovado,
    templateOrcamentoCliente,
} from '../templates/email-templates';
import prisma from '../config/database';

export class NotificacaoService {
    // Notificar nova solicitação
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
                    ? `R$ ${solicitacao.budget.toNumber().toLocaleString('pt-BR')}`
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

            console.log('✅ Email de nova solicitação enviado');
        } catch (error) {
            console.error('❌ Erro ao notificar nova solicitação:', error);
        }
    }

    // Notificar orçamento aprovado
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
                valor: `R$ ${orcamento.value.toNumber().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                clienteNome: orcamento.cliente.name,
            });

            await sendEmail({
                to: orcamento.user.email,
                subject: `Orçamento aprovado: ${orcamento.number}`,
                html,
            });

            console.log('✅ Email de orçamento aprovado enviado');
        } catch (error) {
            console.error('❌ Erro ao notificar orçamento aprovado:', error);
        }
    }

    // Enviar orçamento para cliente
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
                valor: `R$ ${orcamento.value.toNumber().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
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

            // Atualizar status e data de envio
            await prisma.orcamento.update({
                where: { id: orcamentoId },
                data: {
                    status: 'ENVIADO',
                    sentAt: new Date(),
                },
            });

            console.log('✅ Orçamento enviado para cliente');
            return { success: true };
        } catch (error) {
            console.error('❌ Erro ao enviar orçamento para cliente:', error);
            return { success: false, error };
        }
    }

    // Verificar pagamentos próximos (executado por cron)
    static async verificarPagamentosProximos() {
        try {
            const dataLimite = new Date();
            dataLimite.setDate(dataLimite.getDate() + 7); // 7 dias

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
                    valor: `R$ ${pagamento.value.toNumber().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                    vencimento: new Date(pagamento.dueDate).toLocaleDateString('pt-BR'),
                    diasRestantes,
                    clienteNome: pagamento.projeto.cliente.name,
                    projetoTitulo: pagamento.projeto.title,
                });

                await sendEmail({
                    to: pagamento.user.email,
                    subject: `⏰ Lembrete: Pagamento vence em ${diasRestantes} dia(s)`,
                    html,
                });
            }

            console.log(`✅ ${pagamentosProximos.length} lembretes de pagamento enviados`);
        } catch (error) {
            console.error('❌ Erro ao verificar pagamentos próximos:', error);
        }
    }

    // Verificar pagamentos vencidos (executado por cron)
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
                // Atualizar status para ATRASADO
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
                    valor: `R$ ${pagamento.value.toNumber().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                    vencimento: new Date(pagamento.dueDate).toLocaleDateString('pt-BR'),
                    diasAtraso,
                    clienteNome: pagamento.projeto.cliente.name,
                    clienteEmail: pagamento.projeto.cliente.email,
                    projetoTitulo: pagamento.projeto.title,
                });

                await sendEmail({
                    to: pagamento.user.email,
                    subject: `🚨 Pagamento vencido há ${diasAtraso} dia(s)`,
                    html,
                });
            }

            console.log(`✅ ${pagamentosVencidos.length} alertas de pagamento vencido enviados`);
        } catch (error) {
            console.error('❌ Erro ao verificar pagamentos vencidos:', error);
        }
    }
}