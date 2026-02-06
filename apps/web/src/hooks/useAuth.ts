'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import axios from 'axios';
import api from '@/lib/api';
import { LoginInput, RegisterInput } from '@/lib/validations/auth';

interface User {
    id: string;
    name: string;
    email: string;
    phone?: string;
    company?: string;
    avatar?: string;
    plan: string;
}

interface AuthState {
    user: User | null;
    isLoading: boolean;
    isHydrated: boolean;
    login: (data: LoginInput) => Promise<void>;
    register: (data: RegisterInput) => Promise<void>;
    logout: () => Promise<void>;
    setUser: (user: User) => void;
    setHydrated: () => void;
}

export const useAuth = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            isLoading: false,
            isHydrated: false,

            setHydrated: () => set({ isHydrated: true }),

            login: async (data: LoginInput) => {
                set({ isLoading: true });
                try {
                    const response = await api.post('/auth/login', data);
                    const { user } = response.data;
                    // Token é gerenciado via httpOnly cookie pelo servidor
                    set({ user, isLoading: false });
                } catch (error) {
                    set({ isLoading: false });
                    if (axios.isAxiosError(error)) {
                        throw new Error(error.response?.data?.error || 'Erro ao fazer login');
                    }
                    throw new Error('Erro ao fazer login');
                }
            },

            register: async (data: RegisterInput) => {
                set({ isLoading: true });
                try {
                    const response = await api.post('/auth/register', data);
                    const { user } = response.data;
                    // Token é gerenciado via httpOnly cookie pelo servidor
                    set({ user, isLoading: false });
                } catch (error) {
                    set({ isLoading: false });
                    if (axios.isAxiosError(error)) {
                        throw new Error(error.response?.data?.error || 'Erro ao criar conta');
                    }
                    throw new Error('Erro ao criar conta');
                }
            },

            logout: async () => {
                try {
                    await api.post('/auth/logout');
                } catch {
                    // Limpar estado local mesmo se a chamada falhar
                }
                set({ user: null });
            },

            setUser: (user: User) => set({ user }),
        }),
        {
            name: 'auth-storage',
            storage: createJSONStorage(() => localStorage),
            // Persistir apenas dados do user (token não fica mais no client)
            partialize: (state) => ({ user: state.user }),
            onRehydrateStorage: () => (state) => {
                state?.setHydrated();
            },
        }
    )
);
