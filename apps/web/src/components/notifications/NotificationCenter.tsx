'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Check, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useNotificacoes } from '@/hooks/useNotificacoes';
import { Notificacao, NotificacaoType } from '@/types/notificacao';
import { cn } from '@/lib/utils';

const typeIcons: Record<NotificacaoType, string> = {
    ORCAMENTO_APROVADO: '✅',
    ORCAMENTO_RECUSADO: '❌',
    PROJETO_CRIADO: '🚀',
    PAGAMENTO_CONFIRMADO: '💰',
    PAGAMENTO_LEMBRETE: '⏰',
    PAGAMENTO_VENCIDO: '🚨',
    MILESTONE_CONCLUIDO: '🎯',
    ARQUIVO_DISPONIVEL: '📎',
    SOLICITACAO_RECEBIDA: '🎉',
};

function timeAgo(dateStr: string): string {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60_000);

    if (diffMin < 1) return 'agora';
    if (diffMin < 60) return `${diffMin}min`;

    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h`;

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d`;

    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

function NotificationItem({ notificacao, onRead }: { notificacao: Notificacao; onRead: (id: string, link?: string) => void }) {
    return (
        <DropdownMenuItem
            className={cn(
                'flex items-start gap-3 p-3 cursor-pointer',
                !notificacao.read && 'bg-blue-50'
            )}
            onClick={() => onRead(notificacao.id, notificacao.link)}
        >
            <span className="text-lg shrink-0 mt-0.5">
                {typeIcons[notificacao.type] || '🔔'}
            </span>
            <div className="flex-1 min-w-0">
                <p className={cn('text-sm', !notificacao.read && 'font-semibold')}>
                    {notificacao.title}
                </p>
                <p className="text-xs text-slate-500 truncate">
                    {notificacao.message}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                    {timeAgo(notificacao.createdAt)}
                </p>
            </div>
            {!notificacao.read && (
                <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-2" />
            )}
        </DropdownMenuItem>
    );
}

export function NotificationCenter() {
    const router = useRouter();
    const { notificacoes, unreadCount, fetchNotificacoes, markAsRead, markAllAsRead } = useNotificacoes();

    const handleRead = (id: string, link?: string) => {
        markAsRead(id);
        if (link) {
            router.push(link);
        }
    };

    return (
        <DropdownMenu onOpenChange={(open) => { if (open) fetchNotificacoes(); }}>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative cursor-pointer">
                    <Bell className="h-5 w-5 text-slate-600" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-medium">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto">
                <div className="flex items-center justify-between px-3 py-2">
                    <DropdownMenuLabel className="p-0">Notificações</DropdownMenuLabel>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-auto p-1 text-xs text-blue-600 hover:text-blue-700"
                            onClick={(e) => {
                                e.preventDefault();
                                markAllAsRead();
                            }}
                        >
                            <CheckCheck className="h-3 w-3 mr-1" />
                            Marcar todas
                        </Button>
                    )}
                </div>
                <DropdownMenuSeparator />
                {notificacoes.length === 0 ? (
                    <div className="py-8 text-center text-sm text-slate-500">
                        Nenhuma notificação
                    </div>
                ) : (
                    notificacoes.map(n => (
                        <NotificationItem key={n.id} notificacao={n} onRead={handleRead} />
                    ))
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
