'use client';

import { Sidebar } from './Sidebar';
import { useFreelancerTheme } from '@/hooks/useTheme';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';
import { Breadcrumb } from '@/components/ui/breadcrumb';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
    useFreelancerTheme();

    return (
        <div className="flex h-screen bg-slate-50">
            <Sidebar />
            <div className="flex-1 ml-64 flex flex-col">
                <header className="h-14 border-b border-slate-200 bg-white flex items-center justify-between px-6 shrink-0">
                    <Breadcrumb homeLabel="Dashboard" homeHref="/dashboard" />
                    <NotificationCenter />
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
