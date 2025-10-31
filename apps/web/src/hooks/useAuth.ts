'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
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
    login: (data: LoginInput) => Promise<void>;
    register: (data: RegisterInput) => Promise<void>;
    logout: () => void;
    setUser: (user: User) => void;
}

export const useAuth = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            token: null,
            isLoading: false,

            login: async (data: LoginInput) => {
                set({ isLoading: true });
                try {
                    const response = await api.post('/auth/login', data);
                    const { user, token } = response.data;

                    localStorage.setItem('token', token);
                    set({ user, token, isLoading: false });
                } catch (error: unknown) {
                    set({ isLoading: false });
                    throw new Error(error instanceof Error ? error.message : 'Erro ao fazer login');
                }
            },

            register: async (data: RegisterInput) => {
                set({ isLoading: true });
                try {
                    const response = await api.post('/auth/register', data);
                    const { user, token } = response.data;

                    localStorage.setItem('token', token);
                    set({ user, token, isLoading: false });
                } catch (error: unknown) {
                    set({ isLoading: false });
                    throw new Error(error instanceof Error ? error.message : 'Erro ao criar conta');
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
        }
    )
);