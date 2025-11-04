export interface Projeto {
    id: string;
    number: string;
    title: string;
    description: string;
    value: number;
    startDate: string;
    endDate?: string;
    status: 'EM_ANDAMENTO' | 'PAUSADO' | 'CONCLUIDO' | 'CANCELADO';
    progress: number;
    notes?: string;
    createdAt: string;
    updatedAt: string;
    completedAt?: string;
    userId: string;
    clienteId: string;
    cliente?: {
        name: string;
        email: string;
        company?: string;
    };
    orcamentoId?: string;
    orcamento?: {
        id: string;
        number: string;
        title: string;
        value: number;
    };
    milestones?: Milestone[];
    arquivos?: Arquivo[];
    pagamentos?: Pagamento[];
    _count?: {
        milestones: number;
    };
}

export interface Milestone {
    id: string;
    title: string;
    description?: string;
    order: number;
    completed: boolean;
    completedAt?: string;
    createdAt: string;
    updatedAt: string;
    projetoId: string;
}

export interface Arquivo {
    id: string;
    name: string;
    url: string;
    size: number;
    type: string;
    createdAt: string;
    projetoId: string;
}

export interface Pagamento {
    id: string;
    description: string;
    value: number;
    dueDate: string;
    paidAt?: string;
    status: 'PENDENTE' | 'PAGO' | 'ATRASADO' | 'CANCELADO';
    method?: string;
    notes?: string;
    receipt?: string;
    createdAt: string;
    updatedAt: string;
}