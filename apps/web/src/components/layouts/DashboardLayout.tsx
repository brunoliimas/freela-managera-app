'use client';

import { Sidebar } from './Sidebar';
import { useFreelancerTheme } from '@/hooks/useTheme';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
    useFreelancerTheme();

    return (
        <div className="flex h-screen bg-slate-50">
            <Sidebar />
            <main className="flex-1 ml-64 overflow-y-auto">
                <div className="container mx-auto p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
