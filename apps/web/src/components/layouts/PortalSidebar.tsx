'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    FolderKanban,
    FileText,
    CreditCard,
    PlusCircle,
    LogOut,
    Sun,
    Moon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useClientAuth } from '@/hooks/useClientAuth';
import { usePortalThemeStore } from '@/hooks/useTheme';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

interface PortalSidebarProps {
    slug: string;
}

export function PortalSidebar({ slug }: PortalSidebarProps) {
    const pathname = usePathname();
    const { cliente, logout } = useClientAuth();

    const menuItems = [
        { title: 'Início', href: `/portal/${slug}`, icon: LayoutDashboard },
        { title: 'Projetos', href: `/portal/${slug}/projetos`, icon: FolderKanban },
        { title: 'Orçamentos', href: `/portal/${slug}/orcamentos`, icon: FileText },
        { title: 'Pagamentos', href: `/portal/${slug}/pagamentos`, icon: CreditCard },
        { title: 'Nova Solicitação', href: `/portal/${slug}/nova-solicitacao`, icon: PlusCircle },
    ];
    const { theme, setTheme } = usePortalThemeStore();

    const toggleTheme = () => {
        const next = theme === 'dark' ? 'light' : 'dark';
        setTheme(next);
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <div className="flex flex-col h-full bg-emerald-900 text-white w-64 fixed left-0 top-0">
            {/* Logo/Header */}
            <div className="p-6">
                <h1 className="text-2xl font-bold">Portal do Cliente</h1>
                <p className="text-sm text-emerald-300 mt-1">Acompanhe seus projetos</p>
            </div>

            <Separator className="bg-emerald-700" />

            {/* Menu Items */}
            <nav className="flex-1 p-4 space-y-2">
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href ||
                        (item.href !== `/portal/${slug}` && pathname.startsWith(item.href));

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                                isActive
                                    ? 'bg-emerald-600 text-white'
                                    : 'text-emerald-200 hover:bg-emerald-800 hover:text-white'
                            )}
                        >
                            <Icon size={20} />
                            <span className="font-medium">{item.title}</span>
                        </Link>
                    );
                })}
            </nav>

            <Separator className="bg-emerald-700" />

            {/* Client Info */}
            <div className="p-4 space-y-2">
                <div className="flex items-center gap-3 px-4 py-3">
                    <Avatar>
                        {cliente?.avatar && (
                            <AvatarImage
                                src={cliente.avatar.startsWith('http') ? cliente.avatar : `${process.env.NEXT_PUBLIC_API_URL}${cliente.avatar}`}
                                alt={cliente.name}
                            />
                        )}
                        <AvatarFallback className="bg-emerald-600">
                            {cliente?.name ? getInitials(cliente.name) : 'C'}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{cliente?.name}</p>
                        <p className="text-xs text-emerald-300 truncate">{cliente?.email}</p>
                    </div>
                </div>

                <Button
                    variant="ghost"
                    className="w-full justify-start text-emerald-200 hover:bg-emerald-800 hover:text-white cursor-pointer"
                    onClick={toggleTheme}
                >
                    {theme === 'dark' ? <Sun size={20} className="mr-3" /> : <Moon size={20} className="mr-3" />}
                    {theme === 'dark' ? 'Tema Claro' : 'Tema Escuro'}
                </Button>

                <Button
                    variant="ghost"
                    className="w-full justify-start text-emerald-200 hover:bg-emerald-800 hover:text-white cursor-pointer"
                    onClick={logout}
                >
                    <LogOut size={20} className="mr-3" />
                    Sair
                </Button>
            </div>
        </div>
    );
}
