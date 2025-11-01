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
    plan: string;
}

interface AuthState {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    isHydrated: boolean;
    login: (data: LoginInput) => Promise<void>;
    register: (data: RegisterInput) => Promise<void>;
    logout: () => void;
    setUser: (user: User) => void;
    setHydrated: () => void;
}

export const useAuth = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            token: null,
            isLoading: false,
            isHydrated: false,

            setHydrated: () => set({ isHydrated: true }),

            login: async (data: LoginInput) => {
                set({ isLoading: true });
                try {
                    const response = await api.post('/auth/login', data);
                    const { user, token } = response.data;

                    localStorage.setItem('token', token);
                    set({ user, token, isLoading: false });
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
                    const { user, token } = response.data;

                    localStorage.setItem('token', token);
                    set({ user, token, isLoading: false });
                } catch (error) {
                    set({ isLoading: false });
                    if (axios.isAxiosError(error)) {
                        throw new Error(error.response?.data?.error || 'Erro ao criar conta');
                    }
                    throw new Error('Erro ao criar conta');
                }
            },

            logout: () => {
                localStorage.removeItem('token');
                set({ user: null, token: null });
            },

            setUser: (user: User) => set({ user }),
        }),
        {
            name: 'auth-storage',
            storage: createJSONStorage(() => localStorage),
            onRehydrateStorage: () => (state) => {
                state?.setHydrated();
            },
        }
    )
);