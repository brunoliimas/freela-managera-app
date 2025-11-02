export interface Solicitacao {
    id: string;
    title: string;
    description: string;
    budget?: number;
    deadline?: string;
    attachments?: string[];
    status: 'NOVA' | 'ANALISANDO' | 'ORCAMENTO_ENVIADO' | 'ARQUIVADA';
    createdAt: string;
    updatedAt: string;
    clienteId: string;
    cliente?: {
        name: string;
        email: string;
        company?: string;
    };
}

export interface ClientePublico {
    id: string;
    name: string;
    email: string;
    phone?: string;
    company?: string;
    cnpj?: string;
}