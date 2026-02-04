'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';

export default function Layout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const { user, isHydrated } = useAuth();

    useEffect(() => {
        // Só redireciona após a hidratação estar completa
        if (isHydrated && !user) {
            router.push('/login');
        }
    }, [user, router, isHydrated]);

    // Aguardar hidratação
    if (!isHydrated) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    // Se não tiver user após hidratação, não renderiza nada (vai redirecionar)
    if (!user) {
        return null;
    }

    return <DashboardLayout>{children}</DashboardLayout>;
}