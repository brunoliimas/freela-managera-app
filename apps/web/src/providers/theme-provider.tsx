'use client';

import { useEffect } from 'react';
import { useThemeStore } from '@/hooks/useTheme';

function getSystemTheme(): 'light' | 'dark' {
    if (typeof window === 'undefined') return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme: 'light' | 'dark' | 'system') {
    if (typeof window === 'undefined') return;

    const root = document.documentElement;
    const effectiveTheme = theme === 'system' ? getSystemTheme() : theme;

    root.classList.remove('light', 'dark');
    root.classList.add(effectiveTheme);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const theme = useThemeStore((state) => state.theme);

    useEffect(() => {
        applyTheme(theme);

        if (theme === 'system') {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            const handleChange = () => applyTheme('system');
            mediaQuery.addEventListener('change', handleChange);
            return () => mediaQuery.removeEventListener('change', handleChange);
        }
    }, [theme]);

    return <>{children}</>;
}
