import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middlewares/auth.middleware';
import logger from '../config/logger';
import { streamCSV } from '../utils/csv-generator';

const STATUS_LABELS: Record<string, string> = {
    PENDENTE: 'Pendente',
    PAGO: 'Pago',
    ATRASADO: 'Atrasado',
    CANCELADO: 'Cancelado',
    EM_ANDAMENTO: 'Em andamento',
    PAUSADO: 'Pausado',
    CONCLUIDO: 'Concluído',
    AUTORIZADA: 'Autorizada',
    PROCESSANDO: 'Processando',
    REJEITADA: 'Rejeitada',
};

function formatDate(date: Date | null | undefined): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString('pt-BR');
}

function formatCurrency(value: number | { toNumber: () => number }): string {
    const num = typeof value === 'number' ? value : value.toNumber();
    return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export const exportPagamentos = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId!;

        const pagamentos = await prisma.pagamento.findMany({
            where: { userId },
            orderBy: { dueDate: 'desc' },
            include: {
                projeto: {
                    select: {
                        number: true,
                        title: true,
                        cliente: {
                            select: { name: true, company: true },
                        },
                    },
                },
            },
        });

        const data = pagamentos.map((p) => ({
            descricao: p.description,
            projeto: `${p.projeto.number} - ${p.projeto.title}`,
            cliente: p.projeto.cliente.company || p.projeto.cliente.name,
            valor: formatCurrency(p.value),
            vencimento: formatDate(p.dueDate),
            pagamento: formatDate(p.paidAt),
            status: STATUS_LABELS[p.status] || p.status,
            metodo: p.method || '',
        }));

        streamCSV(res, 'pagamentos.csv', [
            { key: 'descricao', header: 'Descrição' },
            { key: 'projeto', header: 'Projeto' },
            { key: 'cliente', header: 'Cliente' },
            { key: 'valor', header: 'Valor (R$)' },
            { key: 'vencimento', header: 'Vencimento' },
            { key: 'pagamento', header: 'Data Pagamento' },
            { key: 'status', header: 'Status' },
            { key: 'metodo', header: 'Método' },
        ], data);
    } catch (error) {
        logger.error({ err: error }, 'Export pagamentos CSV error');
        return res.status(500).json({ error: 'Erro ao exportar pagamentos' });
    }
};

export const exportProjetos = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId!;

        const projetos = await prisma.projeto.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            include: {
                cliente: {
                    select: { name: true, company: true },
                },
            },
        });

        const data = projetos.map((p) => ({
            numero: p.number,
            titulo: p.title,
            cliente: p.cliente.company || p.cliente.name,
            valor: formatCurrency(p.value),
            status: STATUS_LABELS[p.status] || p.status,
            progresso: `${p.progress}%`,
            inicio: formatDate(p.startDate),
            termino: formatDate(p.endDate),
            conclusao: formatDate(p.completedAt),
        }));

        streamCSV(res, 'projetos.csv', [
            { key: 'numero', header: 'Número' },
            { key: 'titulo', header: 'Título' },
            { key: 'cliente', header: 'Cliente' },
            { key: 'valor', header: 'Valor (R$)' },
            { key: 'status', header: 'Status' },
            { key: 'progresso', header: 'Progresso' },
            { key: 'inicio', header: 'Início' },
            { key: 'termino', header: 'Término' },
            { key: 'conclusao', header: 'Conclusão' },
        ], data);
    } catch (error) {
        logger.error({ err: error }, 'Export projetos CSV error');
        return res.status(500).json({ error: 'Erro ao exportar projetos' });
    }
};

export const exportClientes = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId!;

        const clientes = await prisma.cliente.findMany({
            where: { userId },
            orderBy: { name: 'asc' },
        });

        const data = clientes.map((c) => ({
            nome: c.name,
            email: c.email,
            telefone: c.phone || '',
            empresa: c.company || '',
            cnpj: c.cnpj || '',
            cidade: c.city || '',
            estado: c.state || '',
            ativo: c.active ? 'Sim' : 'Não',
        }));

        streamCSV(res, 'clientes.csv', [
            { key: 'nome', header: 'Nome' },
            { key: 'email', header: 'Email' },
            { key: 'telefone', header: 'Telefone' },
            { key: 'empresa', header: 'Empresa' },
            { key: 'cnpj', header: 'CNPJ' },
            { key: 'cidade', header: 'Cidade' },
            { key: 'estado', header: 'Estado' },
            { key: 'ativo', header: 'Ativo' },
        ], data);
    } catch (error) {
        logger.error({ err: error }, 'Export clientes CSV error');
        return res.status(500).json({ error: 'Erro ao exportar clientes' });
    }
};

export const exportRelatorioFinanceiro = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId!;
        const ano = req.query.ano ? parseInt(req.query.ano as string) : new Date().getFullYear();

        const dataInicio = new Date(ano, 0, 1);
        const dataFim = new Date(ano, 11, 31, 23, 59, 59);

        const pagamentosPorMes = await prisma.$queryRaw<Array<{ mes: number; total: number; quantidade: bigint }>>`
            SELECT
                EXTRACT(MONTH FROM "paidAt") as mes,
                SUM(value) as total,
                COUNT(*) as quantidade
            FROM "pagamentos"
            WHERE "userId" = ${userId}
                AND status = 'PAGO'
                AND "paidAt" >= ${dataInicio}
                AND "paidAt" <= ${dataFim}
            GROUP BY mes
            ORDER BY mes
        `;

        const meses = [
            'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
            'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
        ];

        const data = meses.map((mesNome, i) => {
            const mes = i + 1;
            const pagamento = pagamentosPorMes.find(p => Number(p.mes) === mes);
            return {
                mes: mesNome,
                faturamento: pagamento ? formatCurrency(Number(pagamento.total)) : '0,00',
                pagamentos: pagamento ? Number(pagamento.quantidade).toString() : '0',
            };
        });

        streamCSV(res, `relatorio-financeiro-${ano}.csv`, [
            { key: 'mes', header: 'Mês' },
            { key: 'faturamento', header: 'Faturamento (R$)' },
            { key: 'pagamentos', header: 'Qtd. Pagamentos' },
        ], data);
    } catch (error) {
        logger.error({ err: error }, 'Export relatório financeiro CSV error');
        return res.status(500).json({ error: 'Erro ao exportar relatório financeiro' });
    }
};

export const exportNotasFiscais = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId!;

        const notasFiscais = await prisma.notaFiscal.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            include: {
                pagamento: {
                    select: {
                        description: true,
                        projeto: {
                            select: {
                                title: true,
                                cliente: {
                                    select: { name: true, company: true },
                                },
                            },
                        },
                    },
                },
            },
        });

        const data = notasFiscais.map((nf) => ({
            numero: nf.numero || '',
            descricao: nf.descricaoServico,
            cliente: nf.pagamento.projeto.cliente.company || nf.pagamento.projeto.cliente.name,
            projeto: nf.pagamento.projeto.title,
            valor: formatCurrency(nf.valor),
            iss: formatCurrency(nf.issValor),
            status: STATUS_LABELS[nf.status] || nf.status,
            emissao: formatDate(nf.emitidaEm),
            verificacao: nf.codigoVerificacao || '',
        }));

        streamCSV(res, 'notas-fiscais.csv', [
            { key: 'numero', header: 'Número' },
            { key: 'descricao', header: 'Descrição do Serviço' },
            { key: 'cliente', header: 'Cliente' },
            { key: 'projeto', header: 'Projeto' },
            { key: 'valor', header: 'Valor (R$)' },
            { key: 'iss', header: 'ISS (R$)' },
            { key: 'status', header: 'Status' },
            { key: 'emissao', header: 'Data Emissão' },
            { key: 'verificacao', header: 'Código Verificação' },
        ], data);
    } catch (error) {
        logger.error({ err: error }, 'Export notas fiscais CSV error');
        return res.status(500).json({ error: 'Erro ao exportar notas fiscais' });
    }
};

export const exportTimeEntries = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId!;

        const entries = await prisma.timeEntry.findMany({
            where: { userId },
            orderBy: { startTime: 'desc' },
            include: {
                projeto: {
                    select: {
                        number: true,
                        title: true,
                        cliente: {
                            select: { name: true, company: true },
                        },
                    },
                },
            },
        });

        const data = entries.map((e) => {
            const horas = e.duration ? Math.floor(e.duration / 60) : 0;
            const minutos = e.duration ? e.duration % 60 : 0;
            return {
                descricao: e.description,
                projeto: `${e.projeto.number} - ${e.projeto.title}`,
                cliente: e.projeto.cliente.company || e.projeto.cliente.name,
                inicio: e.startTime.toLocaleString('pt-BR'),
                fim: e.endTime?.toLocaleString('pt-BR') || '',
                duracao: e.duration ? `${horas}h${minutos.toString().padStart(2, '0')}m` : '',
                billable: e.billable ? 'Sim' : 'Não',
                valorHora: e.hourlyRate ? formatCurrency(e.hourlyRate) : '',
            };
        });

        streamCSV(res, 'time-entries.csv', [
            { key: 'descricao', header: 'Descrição' },
            { key: 'projeto', header: 'Projeto' },
            { key: 'cliente', header: 'Cliente' },
            { key: 'inicio', header: 'Início' },
            { key: 'fim', header: 'Fim' },
            { key: 'duracao', header: 'Duração' },
            { key: 'billable', header: 'Faturável' },
            { key: 'valorHora', header: 'Valor/Hora (R$)' },
        ], data);
    } catch (error) {
        logger.error({ err: error }, 'Export time entries CSV error');
        return res.status(500).json({ error: 'Erro ao exportar registros de tempo' });
    }
};

const CATEGORY_LABELS: Record<string, string> = {
    SOFTWARE: 'Software / Licenças',
    HARDWARE: 'Hardware / Equipamentos',
    TRANSPORTE: 'Transporte',
    ALIMENTACAO: 'Alimentação',
    MARKETING: 'Marketing',
    EDUCACAO: 'Educação',
    ESCRITORIO: 'Escritório',
    IMPOSTOS: 'Impostos / Taxas',
    OUTROS: 'Outros',
};

export const exportDespesas = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId!;

        const despesas = await prisma.despesa.findMany({
            where: { userId },
            orderBy: { date: 'desc' },
            include: {
                projeto: {
                    select: {
                        number: true,
                        title: true,
                    },
                },
            },
        });

        const data = despesas.map((d) => ({
            descricao: d.description,
            categoria: CATEGORY_LABELS[d.category] || d.category,
            projeto: d.projeto ? `${d.projeto.number} - ${d.projeto.title}` : '',
            valor: formatCurrency(d.value),
            data: formatDate(d.date),
            notas: d.notes || '',
        }));

        streamCSV(res, 'despesas.csv', [
            { key: 'descricao', header: 'Descrição' },
            { key: 'categoria', header: 'Categoria' },
            { key: 'projeto', header: 'Projeto' },
            { key: 'valor', header: 'Valor (R$)' },
            { key: 'data', header: 'Data' },
            { key: 'notas', header: 'Observações' },
        ], data);
    } catch (error) {
        logger.error({ err: error }, 'Export despesas CSV error');
        return res.status(500).json({ error: 'Erro ao exportar despesas' });
    }
};
