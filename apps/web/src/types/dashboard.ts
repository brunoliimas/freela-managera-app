export interface DashboardStats {
    clientes: {
        total: number;
        ativos: number;
    };
    solicitacoes: {
        total: number;
        novas: number;
    };
    orcamentos: {
        total: number;
        enviados: number;
        aprovados: number;
        valorTotal: number;
    };
    projetos: {
        total: number;
        emAndamento: number;
        concluidos: number;
        valorTotal: number;
        valorAndamento: number;
        valorConcluidos: number;
    };
    timeTracking: {
        horasEstaSemana: number;
        minutosEstaSemana: number;
    };
    despesas: {
        totalEsteMes: number;
    };
}

export interface DashboardRecentes {
    solicitacoes: Array<{
        id: string;
        title: string;
        status: string;
        createdAt: string;
        cliente: {
            name: string;
            company?: string;
        };
    }>;
    orcamentos: Array<{
        id: string;
        number: string;
        title: string;
        value: number;
        status: string;
        createdAt: string;
        cliente: {
            name: string;
            company?: string;
        };
    }>;
    projetos: Array<{
        id: string;
        number: string;
        title: string;
        value: number;
        status: string;
        progress: number;
        createdAt: string;
        cliente: {
            name: string;
            company?: string;
        };
    }>;
}

export interface DashboardData {
    stats: DashboardStats;
    recentes: DashboardRecentes;
}