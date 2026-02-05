'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Home } from 'lucide-react';
import Link from 'next/link';

export default function DashboardError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('Dashboard Error:', error);
    }, [error]);

    return (
        <div className="flex h-full flex-col items-center justify-center gap-4 px-4 py-20">
            <AlertTriangle className="h-16 w-16 text-red-500" />
            <h1 className="text-2xl font-bold">Erro ao carregar</h1>
            <p className="text-center text-muted-foreground">
                Ocorreu um erro ao carregar esta página. Tente novamente ou volte ao dashboard.
            </p>
            <div className="flex gap-4">
                <Button onClick={reset}>Tentar novamente</Button>
                <Link href="/dashboard">
                    <Button variant="outline" className="gap-2">
                        <Home className="h-4 w-4" />
                        Dashboard
                    </Button>
                </Link>
            </div>
        </div>
    );
}
