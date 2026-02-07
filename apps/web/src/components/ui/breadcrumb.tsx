'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight } from 'lucide-react';

const labels: Record<string, string> = {
    dashboard: 'Dashboard',
    clientes: 'Clientes',
    orcamentos: 'Orçamentos',
    projetos: 'Projetos',
    solicitacoes: 'Solicitações',
    pagamentos: 'Pagamentos',
    relatorios: 'Relatórios',
    arquivos: 'Arquivos',
    calendario: 'Calendário',
    configuracoes: 'Configurações',
    'nova-solicitacao': 'Nova Solicitação',
};

interface BreadcrumbProps {
    homeLabel: string;
    homeHref: string;
    portalSlug?: string;
}

export function Breadcrumb({ homeLabel, homeHref, portalSlug }: BreadcrumbProps) {
    const pathname = usePathname();

    // Strip base prefix (portal or dashboard) so we only breadcrumb sub-pages
    let relevantPath = pathname;
    if (portalSlug) {
        const prefix = `/portal/${portalSlug}`;
        relevantPath = pathname.startsWith(prefix) ? pathname.slice(prefix.length) : pathname;
    } else if (pathname.startsWith(homeHref)) {
        relevantPath = pathname.slice(homeHref.length);
    }

    // Split into segments and filter empty
    const segments = relevantPath.split('/').filter(Boolean);

    // Build breadcrumb items from known segments only
    const items: { label: string; href: string }[] = [];
    let currentPath = portalSlug ? `/portal/${portalSlug}` : homeHref;

    for (const segment of segments) {
        const label = labels[segment];
        if (!label) continue; // Skip unknown segments (IDs, etc.)
        currentPath += `/${segment}`;
        items.push({ label, href: currentPath });
    }

    // Don't show breadcrumb if we're at home (no items)
    if (items.length === 0) return null;

    return (
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm">
            <Link
                href={homeHref}
                className="text-slate-400 hover:text-slate-600 transition-colors"
            >
                {homeLabel}
            </Link>
            {items.map((item, index) => {
                const isLast = index === items.length - 1;
                return (
                    <span key={item.href} className="flex items-center gap-1.5">
                        <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
                        {isLast ? (
                            <span className="text-slate-700 font-medium">{item.label}</span>
                        ) : (
                            <Link
                                href={item.href}
                                className="text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                {item.label}
                            </Link>
                        )}
                    </span>
                );
            })}
        </nav>
    );
}
