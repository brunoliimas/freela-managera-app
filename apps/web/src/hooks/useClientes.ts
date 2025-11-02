'use client';

import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { Cliente } from '@/types/cliente';
import { toast } from 'sonner';

type ClienteQueryParams = {
    search?: string;
    active?: 'true' | 'false';
};

export function useClientes() {
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all');

    const fetchClientes = useCallback(async () => {
        try {
            setLoading(true);
            const params: ClienteQueryParams = {};

            if (search) {
                params.search = search;
            }

            if (activeFilter === 'active') {
                params.active = 'true';
            } else if (activeFilter === 'inactive') {
                params.active = 'false';
            }

            const response = await api.get('/clientes', { params });
            setClientes(response.data);
        } catch (error) {
            toast.error('Erro ao carregar clientes');
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, [search, activeFilter]);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchClientes();
        }, 300); // Debounce de 300ms

        return () => clearTimeout(timeoutId);
    }, [fetchClientes]);

    return {
        clientes,
        loading,
        search,
        setSearch,
        activeFilter,
        setActiveFilter,
        refetch: fetchClientes,
    };
}