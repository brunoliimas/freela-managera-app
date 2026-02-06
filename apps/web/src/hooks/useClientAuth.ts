'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import axios from 'axios';
import apiPortal from '@/lib/api-portal';

interface Cliente {
    id: string;
    name: string;
    email: string;
    company?: string;
    phone?: string;
    avatar?: string;
}

interface ClientAuthState {
    cliente: Cliente | null;
    isLoading: boolean;
    isHydrated: boolean;
    requestLogin: (email: string) => Promise<void>;
    verifyToken: (token: string) => Promise<void>;
    logout: () => Promise<void>;
    setCliente: (cliente: Cliente) => void;
    setHydrated: () => void;
}

export const useClientAuth = create<ClientAuthState>()(
    persist(
        (set) => ({
            cliente: null,
            isLoading: false,
            isHydrated: false,

            setHydrated: () => set({ isHydrated: true }),

            requestLogin: async (email: string) => {
                set({ isLoading: true });
                try {
                    await apiPortal.post('/request-login', { email });
                    set({ isLoading: false });
                } catch (error) {
                    set({ isLoading: false });
                    if (axios.isAxiosError(error)) {
                        throw new Error(error.response?.data?.error || 'Erro ao solicitar acesso');
                    }
                    throw new Error('Erro ao solicitar acesso');
                }
            },

            verifyToken: async (token: string) => {
                set({ isLoading: true });
                try {
                    const response = await apiPortal.post('/verify-token', { token });
                    const { cliente } = response.data;
                    set({ cliente, isLoading: false });
                } catch (error) {
                    set({ isLoading: false });
                    if (axios.isAxiosError(error)) {
                        throw new Error(error.response?.data?.error || 'Link inválido ou expirado');
                    }
                    throw new Error('Erro ao verificar acesso');
                }
            },

            logout: async () => {
                try {
                    await apiPortal.post('/logout');
                } catch {
                    // Limpar estado local mesmo se a chamada falhar
                }
                set({ cliente: null });
            },

            setCliente: (cliente: Cliente) => set({ cliente }),
        }),
        {
            name: 'client-auth-storage',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({ cliente: state.cliente }),
            onRehydrateStorage: () => (state) => {
                state?.setHydrated();
            },
        }
    )
);
