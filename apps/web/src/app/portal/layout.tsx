'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useClientAuth } from '@/hooks/useClientAuth';
import { PortalSidebar } from '@/components/layouts/PortalSidebar';
import { usePortalTheme } from '@/hooks/useTheme';

const publicPaths = ['/portal/login', '/portal/login/enviado', '/portal/callback'];

export default function PortalLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const { cliente, isHydrated } = useClientAuth();

    const isPublicPath = publicPaths.some(p => pathname.startsWith(p));
    usePortalTheme();

    useEffect(() => {
        if (isHydrated && !cliente && !isPublicPath) {
            router.push('/portal/login');
        }
    }, [cliente, router, isHydrated, isPublicPath]);

    // Public pages (login, enviado, callback) render without sidebar
    if (isPublicPath) {
        return <>{children}</>;
    }

    // Wait for hydration
    if (!isHydrated) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
            </div>
        );
    }

    // No client after hydration → will redirect
    if (!cliente) {
        return null;
    }

    return (
        <div className="flex h-screen bg-slate-50">
            <PortalSidebar />
            <main className="flex-1 ml-64 overflow-y-auto">
                <div className="container mx-auto p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
