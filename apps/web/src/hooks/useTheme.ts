'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { useEffect } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeState {
    theme: Theme;
    setTheme: (theme: Theme) => void;
}

// ==================== FREELANCER THEME ====================

export const useFreelancerThemeStore = create<ThemeState>()(
    persist(
        (set) => ({
            theme: 'system',
            setTheme: (theme: Theme) => set({ theme }),
        }),
        {
            name: 'freela-theme-storage',
            storage: createJSONStorage(() => localStorage),
        }
    )
);

// ==================== PORTAL THEME ====================

export const usePortalThemeStore = create<ThemeState>()(
    persist(
        (set) => ({
            theme: 'system',
            setTheme: (theme: Theme) => set({ theme }),
        }),
        {
            name: 'portal-theme-storage',
            storage: createJSONStorage(() => localStorage),
        }
    )
);

// ==================== HELPERS ====================

function getSystemTheme(): 'light' | 'dark' {
    if (typeof window === 'undefined') return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme: Theme) {
    if (typeof window === 'undefined') return;
    const root = document.documentElement;
    const effective = theme === 'system' ? getSystemTheme() : theme;
    root.classList.remove('light', 'dark');
    root.classList.add(effective);
}

// ==================== HOOKS ====================

/** Freelancer dashboard theme */
export function useFreelancerTheme() {
    const { theme, setTheme } = useFreelancerThemeStore();

    useEffect(() => {
        applyTheme(theme);

        if (theme === 'system') {
            const mq = window.matchMedia('(prefers-color-scheme: dark)');
            const handler = () => applyTheme('system');
            mq.addEventListener('change', handler);
            return () => mq.removeEventListener('change', handler);
        }
    }, [theme]);

    return { theme, setTheme };
}

/** Portal client theme */
export function usePortalTheme() {
    const { theme, setTheme } = usePortalThemeStore();

    useEffect(() => {
        applyTheme(theme);

        if (theme === 'system') {
            const mq = window.matchMedia('(prefers-color-scheme: dark)');
            const handler = () => applyTheme('system');
            mq.addEventListener('change', handler);
            return () => mq.removeEventListener('change', handler);
        }
    }, [theme]);

    return { theme, setTheme };
}

/** Landing page — always follows system preference */
export function useLandingTheme() {
    useEffect(() => {
        applyTheme('system');

        const mq = window.matchMedia('(prefers-color-scheme: dark)');
        const handler = () => applyTheme('system');
        mq.addEventListener('change', handler);
        return () => mq.removeEventListener('change', handler);
    }, []);
}

// Backward compat
export const useThemeStore = useFreelancerThemeStore;
export const useTheme = useFreelancerTheme;
