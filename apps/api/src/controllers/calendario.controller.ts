import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middlewares/auth.middleware';
import logger from '../config/logger';

interface CalendarEvent {
    id: string;
    type: 'projeto' | 'pagamento' | 'orcamento' | 'solicitacao';
    title: string;
    date: string;
    endDate?: string;
    status: string;
    color: string;
    meta?: Record<string, unknown>;
}

export const getEventos = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId!;
        const { start, end } = req.query;

        if (!start || !end) {
            return res.status(400).json({ error: 'Parâmetros start e end são obrigatórios' });
        }

        const startDate = new Date(start as string);
        const endDate = new Date(end as string);

        const [projetos, pagamentos, orcamentos, solicitacoes] = await Promise.all([
            prisma.projeto.findMany({
                where: {
                    userId,
                    OR: [
                        { startDate: { gte: startDate, lte: endDate } },
                        { endDate: { gte: startDate, lte: endDate } },
                    ],
                },
                select: {
                    id: true,
                    title: true,
                    number: true,
                    startDate: true,
                    endDate: true,
                    status: true,
                    cliente: { select: { name: true } },
                },
            }),
            prisma.pagamento.findMany({
                where: {
                    userId,
                    dueDate: { gte: startDate, lte: endDate },
                },
                select: {
                    id: true,
                    description: true,
                    value: true,
                    dueDate: true,
                    status: true,
                    projeto: {
                        select: { number: true, title: true },
                    },
                },
            }),
            prisma.orcamento.findMany({
                where: {
                    userId,
                    validUntil: { gte: startDate, lte: endDate },
                },
                select: {
                    id: true,
                    title: true,
                    number: true,
                    validUntil: true,
                    status: true,
                    cliente: { select: { name: true } },
                },
            }),
            prisma.solicitacao.findMany({
                where: {
                    cliente: { userId },
                    deadline: { gte: startDate, lte: endDate },
                },
                select: {
                    id: true,
                    title: true,
                    deadline: true,
                    status: true,
                    cliente: { select: { name: true } },
                },
            }),
        ]);

        const events: CalendarEvent[] = [];

        // Projetos
        for (const p of projetos) {
            events.push({
                id: `projeto-start-${p.id}`,
                type: 'projeto',
                title: `${p.number} - ${p.title}`,
                date: p.startDate.toISOString(),
                endDate: p.endDate?.toISOString(),
                status: p.status,
                color: '#3b82f6',
                meta: { clienteName: p.cliente.name },
            });
        }

        // Pagamentos
        for (const pg of pagamentos) {
            const isPago = pg.status === 'PAGO';
            const isAtrasado = pg.status === 'ATRASADO' || (!isPago && pg.status === 'PENDENTE' && new Date(pg.dueDate) < new Date());
            events.push({
                id: `pagamento-${pg.id}`,
                type: 'pagamento',
                title: `${pg.projeto.number} - ${pg.description}`,
                date: pg.dueDate.toISOString(),
                status: isAtrasado ? 'ATRASADO' : pg.status,
                color: isPago ? '#22c55e' : isAtrasado ? '#ef4444' : '#eab308',
                meta: { value: Number(pg.value), projetoTitle: pg.projeto.title },
            });
        }

        // Orçamentos
        for (const o of orcamentos) {
            events.push({
                id: `orcamento-${o.id}`,
                type: 'orcamento',
                title: `${o.number} - ${o.title}`,
                date: o.validUntil!.toISOString(),
                status: o.status,
                color: '#8b5cf6',
                meta: { clienteName: o.cliente.name },
            });
        }

        // Solicitações
        for (const s of solicitacoes) {
            events.push({
                id: `solicitacao-${s.id}`,
                type: 'solicitacao',
                title: s.title,
                date: s.deadline!.toISOString(),
                status: s.status,
                color: '#f97316',
                meta: { clienteName: s.cliente.name },
            });
        }

        return res.json(events);
    } catch (error) {
        logger.error({ err: error }, 'Erro ao buscar eventos do calendário');
        return res.status(500).json({ error: 'Erro ao buscar eventos do calendário' });
    }
};
