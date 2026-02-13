'use client';

import { useRouter } from 'next/navigation';
import { ChevronDown, Settings, LogOut } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { useFreelancerTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

const getInitials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

export function DashboardLayout({ children }: { children: React.ReactNode }) {
    useFreelancerTheme();
    const router = useRouter();
    const { user, logout } = useAuth();

    return (
        <div className="flex h-screen bg-slate-50">
            <Sidebar />
            <div className="flex-1 ml-64 flex flex-col">
                <header className="h-14 border-b border-slate-200 bg-white flex items-center justify-end gap-4 px-6 shrink-0">
                    <NotificationCenter />

                    <DropdownMenu>
                        <DropdownMenuTrigger className="flex items-center gap-3 rounded-lg px-2 py-1.5 cursor-pointer hover:bg-slate-100 transition-colors outline-none">
                            <Avatar className="h-8 w-8">
                                {user?.avatar && (
                                    <AvatarImage
                                        src={user.avatar.startsWith('http') ? user.avatar : `${process.env.NEXT_PUBLIC_API_URL}${user.avatar}`}
                                        alt={user.name}
                                    />
                                )}
                                <AvatarFallback className="bg-blue-600 text-white text-xs">
                                    {user?.name ? getInitials(user.name) : 'U'}
                                </AvatarFallback>
                            </Avatar>
                            <div className="text-left hidden sm:block">
                                <div className="flex items-center gap-1.5">
                                    <p className="text-sm font-medium text-slate-900">{user?.name}</p>
                                    {user?.plan && user.plan !== 'FREE' && (
                                        <span className={cn(
                                            'text-[10px] font-bold px-1.5 py-0.5 rounded',
                                            user.plan === 'PRO' ? 'bg-blue-500 text-white' : 'bg-amber-500 text-white'
                                        )}>
                                            {user.plan}
                                        </span>
                                    )}
                                </div>
                                {/* <p className="text-xs text-slate-500">{user?.email}</p> */}
                            </div>
                            <ChevronDown size={16} className="text-slate-400" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={() => router.push('/configuracoes')}>
                                <Settings size={16} className="mr-2" />
                                Configurações
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={logout}>
                                <LogOut size={16} className="mr-2" />
                                Sair
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </header>
                <main className="flex-1 overflow-y-auto">
                    <div className="container mx-auto p-8">
                        <Breadcrumb homeLabel="Dashboard" homeHref="/dashboard" />
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
