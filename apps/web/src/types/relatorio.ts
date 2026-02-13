export interface FaturamentoMensal {
    mes: number;
    mesNome: string;
    valor: number;
}

export interface ProjetoPorStatus {
    status: string;
    quantidade: number;
}

export interface TopCliente {
    id: string;
    nome: string;
    valor: number;
    projetos: number;
}

export interface TaxaConversao {
    solicitacoes: number;
    orcamentos: number;
    projetos: number;
    solicitacaoParaOrcamento: string;
    orcamentoParaProjeto: string;
}

export interface DespesaMensal {
    mes: number;
    mesNome: string;
    valor: number;
}

export interface HorasMensal {
    mes: number;
    mesNome: string;
    horas: number;
}

export interface ResumoFinanceiro {
    totalRecebido: number;
    totalAReceber: number;
    ticketMedio: number;
    projetosConcluidos: number;
    tempoMedioEntrega: number;
    totalDespesas?: number;
    lucroLiquido?: number;
    totalHoras?: number;
    valorHoraEfetivo?: number;
}

export interface RelatorioFinanceiro {
    ano: number;
    faturamentoMensal: FaturamentoMensal[];
    despesasMensal?: DespesaMensal[];
    horasMensal?: HorasMensal[];
    projetosPorStatus: ProjetoPorStatus[];
    topClientes: TopCliente[];
    taxaConversao: TaxaConversao;
    resumo: ResumoFinanceiro;
}

export interface ComparacaoAnual {
    anoAtual: {
        ano: number;
        faturamento: number;
        pagamentos: number;
    };
    anoAnterior: {
        ano: number;
        faturamento: number;
        pagamentos: number;
    };
    crescimento: number;
}