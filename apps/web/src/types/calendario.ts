export interface CalendarEvent {
    id: string;
    type: 'projeto' | 'pagamento' | 'orcamento' | 'solicitacao';
    title: string;
    date: string;
    endDate?: string;
    status: string;
    color: string;
    meta?: Record<string, unknown>;
}
