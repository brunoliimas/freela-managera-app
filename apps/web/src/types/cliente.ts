export interface Cliente {
    id: string;
    name: string;
    email: string;
    phone?: string;
    company?: string;
    cnpj?: string;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    notes?: string;
    avatar?: string;
    active: boolean;
    createdAt: string;
    updatedAt: string;
    _count?: {
        projetos: number;
        orcamentos: number;
    };
    projetos?: Projeto[];
    orcamentos?: Orcamento[];
}

export interface Projeto {
    id: string;
    title: string;
    value: number;
    status: 'EM_ANDAMENTO' | 'PAUSADO' | 'CONCLUIDO' | 'CANCELADO';
    createdAt: string;
}

export interface Orcamento {
    id: string;
    title: string;
    value: number;
    status: 'AGUARDANDO' | 'ENVIADO' | 'APROVADO' | 'RECUSADO' | 'EXPIRADO';
    createdAt: string;
}