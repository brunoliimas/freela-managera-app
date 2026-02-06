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

const SESSION_DURATION_MS = 2 * 60 * 60 * 1000; // 2 hours

interface ClientAuthState {
    cliente: Cliente | null;
    slug: string | null;
    loginAt: number | null;
    isLoading: boolean;
    isHydrated: boolean;
    requestLogin: (email: string) => Promise<void>;
    verifyToken: (token: string) => Promise<void>;
    logout: () => Promise<void>;
    setCliente: (cliente: Cliente) => void;
    setHydrated: () => void;
    isSessionExpired: () => boolean;
}

export const useClientAuth = create<ClientAuthState>()(
    persist(
        (set, get) => ({
            cliente: null,
            slug: null,
            loginAt: null,
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
                    const { cliente, slug } = response.data;
                    set({ cliente, slug, loginAt: Date.now(), isLoading: false });
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
                set({ cliente: null, slug: null, loginAt: null });
            },

            setCliente: (cliente: Cliente) => set({ cliente }),

            isSessionExpired: () => {
                const { loginAt } = get();
                if (!loginAt) return true;
                return Date.now() - loginAt > SESSION_DURATION_MS;
            },
        }),
        {
            name: 'client-auth-storage',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({ cliente: state.cliente, slug: state.slug, loginAt: state.loginAt }),
            onRehydrateStorage: () => (state) => {
                state?.setHydrated();
            },
        }
    )
);
