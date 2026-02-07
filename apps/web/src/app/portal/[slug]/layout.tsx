'use client';

import { use, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useClientAuth } from '@/hooks/useClientAuth';
import { PortalSidebar } from '@/components/layouts/PortalSidebar';
import { usePortalTheme } from '@/hooks/useTheme';
import { Breadcrumb } from '@/components/ui/breadcrumb';

export default function PortalLayout({ children, params }: { children: React.ReactNode; params: Promise<{ slug: string }> }) {
    const { slug } = use(params);
    const router = useRouter();
    const pathname = usePathname();
    const { cliente, isHydrated, isSessionExpired, logout } = useClientAuth();

    const publicPaths = [
        `/portal/${slug}/login`,
        `/portal/${slug}/login/enviado`,
        `/portal/${slug}/callback`,
    ];

    const isPublicPath = publicPaths.some(p => pathname.startsWith(p));
    usePortalTheme();

    useEffect(() => {
        if (!isHydrated || isPublicPath) return;

        if (!cliente || isSessionExpired()) {
            if (cliente) logout();
            router.push(`/portal/${slug}/login`);
            return;
        }

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible' && isSessionExpired()) {
                logout();
                router.push(`/portal/${slug}/login`);
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [cliente, router, isHydrated, isPublicPath, slug, isSessionExpired, logout]);

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
            <PortalSidebar slug={slug} />
            <div className="flex-1 ml-64 flex flex-col">
                <header className="h-14 border-b border-slate-200 bg-white flex items-center px-6 shrink-0">
                    <Breadcrumb homeLabel="Início" homeHref={`/portal/${slug}`} portalSlug={slug} />
                </header>
                <main className="flex-1 overflow-y-auto">
                    <div className="container mx-auto p-8">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
