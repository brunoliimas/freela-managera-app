import { OrcamentoPDFData } from './pdf-generator';

interface OrcamentoInput {
    number: string;
    title: string;
    description: string;
    value: any; // Prisma Decimal or number
    estimatedDays?: number | null;
    validUntil?: Date | null;
    createdAt: Date;
    cliente: {
        name: string;
        email: string;
        phone?: string | null;
        company?: string | null;
        cnpj?: string | null;
    };
    user: {
        name: string;
        company?: string | null;
        email: string;
        phone?: string | null;
        cnpj?: string | null;
    };
}

/**
 * Valida se orçamento tem todos os dados necessários para gerar PDF
 */
export function validarOrcamentoParaPDF(orcamento: OrcamentoInput): void {
    if (!orcamento.title || orcamento.title.trim() === '') {
        throw new Error('Título do orçamento é obrigatório');
    }

    if (!orcamento.description || orcamento.description.trim() === '') {
        throw new Error('Descrição do orçamento é obrigatória');
    }

    const valor = typeof orcamento.value === 'number'
        ? orcamento.value
        : orcamento.value?.toNumber();

    if (!valor || valor <= 0) {
        throw new Error('Valor do orçamento deve ser maior que zero');
    }

    if (!orcamento.cliente) {
        throw new Error('Dados do cliente são obrigatórios');
    }

    if (!orcamento.cliente.name || !orcamento.cliente.email) {
        throw new Error('Nome e email do cliente são obrigatórios');
    }

    if (!orcamento.user) {
        throw new Error('Dados da empresa são obrigatórios');
    }
}

/**
 * Formata dados da empresa para o PDF
 */
export function formatarEmpresaData(user: OrcamentoInput['user']) {
    return {
        name: user.company || user.name,
        email: user.email,
        phone: user.phone || undefined,
        cnpj: user.cnpj || undefined,
        address: undefined,
    };
}

/**
 * Formata dados do cliente para o PDF
 */
export function formatarClienteData(cliente: OrcamentoInput['cliente']) {
    return {
        name: cliente.name,
        email: cliente.email,
        phone: cliente.phone || undefined,
        company: cliente.company || undefined,
        cnpj: cliente.cnpj || undefined,
    };
}

/**
 * Prepara todos os dados do orçamento para geração do PDF
 */
export function prepareDadosParaPDF(orcamento: OrcamentoInput): OrcamentoPDFData {
    // Validar dados
    validarOrcamentoParaPDF(orcamento);

    // Converter valor (pode ser Prisma Decimal)
    const valor = typeof orcamento.value === 'number'
        ? orcamento.value
        : orcamento.value.toNumber();

    return {
        number: orcamento.number,
        title: orcamento.title,
        description: orcamento.description,
        value: valor,
        estimatedDays: orcamento.estimatedDays || undefined,
        validUntil: orcamento.validUntil || undefined,
        createdAt: orcamento.createdAt,
        cliente: formatarClienteData(orcamento.cliente),
        empresa: formatarEmpresaData(orcamento.user),
    };
}