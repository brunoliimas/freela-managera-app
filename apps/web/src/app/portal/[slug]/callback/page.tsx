'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import { useClientAuth } from '@/hooks/useClientAuth';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function PortalCallbackPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { slug } = useParams<{ slug: string }>();
    const { verifyToken } = useClientAuth();
    const [error, setError] = useState<string | null>(null);
    const hasVerified = useRef(false);

    useEffect(() => {
        if (hasVerified.current) return;
        hasVerified.current = true;

        const verify = async () => {
            const token = searchParams.get('token');

            if (!token) {
                setError('Link inválido. Nenhum token encontrado.');
                return;
            }

            try {
                await verifyToken(token);
                toast.success('Acesso confirmado!', {
                    description: 'Bem-vindo ao portal.',
                });
                router.push(`/portal/${slug}`);
            } catch (err: unknown) {
                let message = 'Link inválido ou expirado';
                if (err instanceof Error) {
                    message = err.message;
                }
                setError(message);
            }
        };

        verify();
    }, [searchParams, verifyToken, router, slug]);

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-emerald-50">
                <div className="w-full max-w-md px-4">
                    <Card>
                        <CardHeader className="text-center space-y-4">
                            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                                <AlertCircle className="h-8 w-8 text-red-600" />
                            </div>
                            <CardTitle className="text-xl font-bold">Erro ao verificar acesso</CardTitle>
                        </CardHeader>
                        <CardContent className="text-center space-y-4">
                            <p className="text-slate-600">{error}</p>
                            <Link href={`/portal/${slug}/login`}>
                                <Button className="bg-emerald-600 hover:bg-emerald-700">
                                    Solicitar novo link
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-emerald-50">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
                <p className="mt-4 text-emerald-700">Verificando acesso...</p>
            </div>
        </div>
    );
}
