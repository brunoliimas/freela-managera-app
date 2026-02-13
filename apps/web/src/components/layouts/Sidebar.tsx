'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Users,
    FileText,
    FolderKanban,
    BarChart3,
    Paperclip,
    CreditCard,
    Calendar,
    Receipt,
    Clock,
    Wallet,
    LayoutTemplate,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

const menuItems = [
    {
        title: 'Dashboard',
        href: '/dashboard',
        icon: LayoutDashboard,
    },
    {
        title: 'Calendário',
        href: '/calendario',
        icon: Calendar,
    },
    {
        title: 'Clientes',
        href: '/clientes',
        icon: Users,
    },
    {
        title: 'Orçamentos',
        href: '/orcamentos',
        icon: FileText,
    },
    {
        title: 'Templates',
        href: '/templates',
        icon: LayoutTemplate,
    },
    {
        title: 'Projetos',
        href: '/projetos',
        icon: FolderKanban,
    },
    {
        title: 'Pagamentos',
        href: '/pagamentos',
        icon: CreditCard,
    },
    {
        title: 'Time Tracking',
        href: '/time-tracking',
        icon: Clock,
    },
    {
        title: 'Despesas',
        href: '/despesas',
        icon: Wallet,
    },
    {
        title: 'Notas Fiscais',
        href: '/notas-fiscais',
        icon: Receipt,
    },
    {
        title: 'Relatórios',
        href: '/relatorios',
        icon: BarChart3,
    },
    {
        title: 'Arquivos',
        href: '/arquivos',
        icon: Paperclip,
    },
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <div className="flex flex-col h-full bg-slate-900 text-white w-64 fixed left-0 top-0">
            {/* Logo/Header */}
            <div className="p-6">
                <h1 className="text-2xl font-bold">FreelanceHub</h1>
                <p className="text-sm text-slate-400 mt-1">Gestão de Projetos</p>
            </div>

            <Separator className="bg-slate-700" />

            {/* Menu Items */}
            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                                isActive
                                    ? 'bg-blue-600 text-white'
                                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                            )}
                        >
                            <Icon size={20} />
                            <span className="font-medium">{item.title}</span>
                        </Link>
                    );
                })}
            </nav>

        </div>
    );
}