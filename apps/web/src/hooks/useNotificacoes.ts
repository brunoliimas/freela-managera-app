'use client';

import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { Notificacao, NotificacoesResponse } from '@/types/notificacao';

const POLL_INTERVAL = 30_000; // 30 seconds

export function useNotificacoes() {
    const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isLoading, setIsLoading] = useState(false);

    const fetchUnreadCount = useCallback(async () => {
        try {
            const { data } = await api.get<{ count: number }>('/notificacoes/unread-count');
            setUnreadCount(data.count);
        } catch {
            // silently fail
        }
    }, []);

    const fetchNotificacoes = useCallback(async () => {
        setIsLoading(true);
        try {
            const { data } = await api.get<NotificacoesResponse>('/notificacoes');
            setNotificacoes(data.notificacoes);
            setUnreadCount(data.unreadCount);
        } catch {
            // silently fail
        } finally {
            setIsLoading(false);
        }
    }, []);

    const markAsRead = useCallback(async (id: string) => {
        try {
            await api.patch(`/notificacoes/${id}/read`);
            setNotificacoes(prev =>
                prev.map(n => n.id === id ? { ...n, read: true, readAt: new Date().toISOString() } : n)
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch {
            // silently fail
        }
    }, []);

    const markAllAsRead = useCallback(async () => {
        try {
            await api.patch('/notificacoes/read-all');
            setNotificacoes(prev => prev.map(n => ({ ...n, read: true, readAt: new Date().toISOString() })));
            setUnreadCount(0);
        } catch {
            // silently fail
        }
    }, []);

    // Poll unread count
    useEffect(() => {
        fetchUnreadCount();
        const interval = setInterval(fetchUnreadCount, POLL_INTERVAL);
        return () => clearInterval(interval);
    }, [fetchUnreadCount]);

    return {
        notificacoes,
        unreadCount,
        isLoading,
        fetchNotificacoes,
        markAsRead,
        markAllAsRead,
    };
}
