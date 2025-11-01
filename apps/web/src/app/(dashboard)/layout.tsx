'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';

export default function Layout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const { user, token, isHydrated } = useAuth();

    useEffect(() => {
        // Só redireciona após a hidratação estar completa
        if (isHydrated && (!token || !user)) {
            router.push('/login');
        }
    }, [token, user, router, isHydrated]);

    // Aguardar hidratação
    if (!isHydrated) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    // Se não tiver token após hidratação, não renderiza nada (vai redirecionar)
    if (!token || !user) {
        return null;
    }

    return <DashboardLayout>{children}</DashboardLayout>;
}