'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { useEffect } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeState {
    theme: Theme;
    setTheme: (theme: Theme) => void;
}

export const useThemeStore = create<ThemeState>()(
    persist(
        (set) => ({
            theme: 'system',
            setTheme: (theme: Theme) => set({ theme }),
        }),
        {
            name: 'theme-storage',
            storage: createJSONStorage(() => localStorage),
        }
    )
);

function getSystemTheme(): 'light' | 'dark' {
    if (typeof window === 'undefined') return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme: Theme) {
    if (typeof window === 'undefined') return;

    const root = document.documentElement;
    const effectiveTheme = theme === 'system' ? getSystemTheme() : theme;

    root.classList.remove('light', 'dark');
    root.classList.add(effectiveTheme);
}

export function useTheme() {
    const { theme, setTheme } = useThemeStore();

    useEffect(() => {
        applyTheme(theme);

        if (theme === 'system') {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            const handleChange = () => applyTheme('system');
            mediaQuery.addEventListener('change', handleChange);
            return () => mediaQuery.removeEventListener('change', handleChange);
        }
    }, [theme]);

    return { theme, setTheme };
}
