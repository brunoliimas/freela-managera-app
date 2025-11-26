'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Users,
    FileText,
    FolderKanban,
    Settings,
    LogOut,
    BarChart3,
    Paperclip,
    CreditCard
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

const menuItems = [
    {
        title: 'Dashboard',
        href: '/dashboard',
        icon: LayoutDashboard,
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
    const { user, logout } = useAuth();

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <div className="flex flex-col h-full bg-slate-900 text-white w-64 fixed left-0 top-0">
            {/* Logo/Header */}
            <div className="p-6">
                <h1 className="text-2xl font-bold">FreelanceHub</h1>
                <p className="text-sm text-slate-400 mt-1">Gestão de Projetos</p>
            </div>

            <Separator className="bg-slate-700" />

            {/* Menu Items */}
            <nav className="flex-1 p-4 space-y-2">
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

            <Separator className="bg-slate-700" />

            {/* User Info */}
            <div className="p-4 space-y-2">
                

                <div className="flex items-center gap-3 px-4 py-3">
                    <Avatar>
                        <AvatarFallback className="bg-blue-600">
                            {user?.name ? getInitials(user.name) : 'U'}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{user?.name}</p>
                        <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                    </div>
                </div>
                <Link
                    href="/configuracoes"
                    className={cn(
                        'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                        pathname === '/configuracoes'
                            ? 'bg-blue-600 text-white'
                            : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    )}
                >
                    <Settings size={20} />
                    <span className="font-medium">Configurações</span>
                </Link>

                <Button
                    variant="ghost"
                    className="w-full justify-start text-slate-300 hover:bg-slate-800 hover:text-white cursor-pointer"
                    onClick={logout}
                >
                    <LogOut size={20} className="mr-3" />
                    Sair
                </Button>
            </div>
        </div>
    );
}