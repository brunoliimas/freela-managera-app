'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('Error:', error);
    }, [error]);

    return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4">
            <AlertTriangle className="h-16 w-16 text-red-500" />
            <h1 className="text-2xl font-bold">Algo deu errado</h1>
            <p className="text-center text-muted-foreground">
                Ocorreu um erro inesperado. Por favor, tente novamente.
            </p>
            <Button onClick={reset}>Tentar novamente</Button>
        </div>
    );
}
