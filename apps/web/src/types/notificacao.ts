export type NotificacaoType =
    | 'ORCAMENTO_APROVADO'
    | 'ORCAMENTO_RECUSADO'
    | 'PROJETO_CRIADO'
    | 'PAGAMENTO_CONFIRMADO'
    | 'PAGAMENTO_LEMBRETE'
    | 'PAGAMENTO_VENCIDO'
    | 'MILESTONE_CONCLUIDO'
    | 'ARQUIVO_DISPONIVEL'
    | 'SOLICITACAO_RECEBIDA';

export interface Notificacao {
    id: string;
    type: NotificacaoType;
    title: string;
    message: string;
    link?: string;
    read: boolean;
    readAt?: string;
    createdAt: string;
}

export interface NotificacoesResponse {
    notificacoes: Notificacao[];
    unreadCount: number;
    pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
    };
}
