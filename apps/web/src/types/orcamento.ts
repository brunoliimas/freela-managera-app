export interface Orcamento {
    id: string;
    number: string;
    title: string;
    description: string;
    value: number;
    estimatedDays?: number;
    validUntil?: string;
    status: 'AGUARDANDO' | 'ENVIADO' | 'APROVADO' | 'RECUSADO' | 'EXPIRADO';
    notes?: string;
    createdAt: string;
    updatedAt: string;
    sentAt?: string;
    approvedAt?: string;
    clienteId: string;
    cliente?: {
        name: string;
        email: string;
        company?: string;
    };
    solicitacaoId?: string;
    solicitacao?: {
        id: string;
        title: string;
        description: string;
        budget?: number;
        deadline?: string;
    };
    projeto?: {
        id: string;
        number: string;
    };
}