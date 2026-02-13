'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ShieldCheck, KeyRound } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

export default function TwoFactorVerifyPage() {
    const router = useRouter();
    const { verify2FA, verifyRecoveryCode, pending2FA, isLoading, clearPending2FA } = useAuth();
    const [code, setCode] = useState('');
    const [useRecovery, setUseRecovery] = useState(false);

    useEffect(() => {
        if (!pending2FA) {
            router.replace('/login');
        }
    }, [pending2FA, router]);

    if (!pending2FA) {
        return null;
    }

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!code.trim()) return;

        try {
            if (useRecovery) {
                await verifyRecoveryCode(code.trim());
            } else {
                await verify2FA(code.trim());
            }
            toast.success('Login realizado!', {
                description: 'Bem-vindo de volta.',
            });
            router.push('/dashboard');
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Código inválido';
            toast.error('Erro na verificação', { description: message });
        }
    };

    return (
        <Card>
            <CardHeader className="space-y-1">
                <CardTitle className="text-2xl font-bold flex items-center gap-2">
                    {useRecovery ? (
                        <KeyRound className="h-6 w-6" />
                    ) : (
                        <ShieldCheck className="h-6 w-6" />
                    )}
                    Verificação em duas etapas
                </CardTitle>
                <CardDescription>
                    {useRecovery
                        ? 'Digite um dos seus códigos de recuperação'
                        : 'Digite o código de 6 dígitos do seu aplicativo autenticador'
                    }
                </CardDescription>
            </CardHeader>
            <form onSubmit={onSubmit}>
                <CardContent className="space-y-4 mb-4">
                    <div className="space-y-2">
                        <Label htmlFor="code">
                            {useRecovery ? 'Código de recuperação' : 'Código de verificação'}
                        </Label>
                        <Input
                            id="code"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            placeholder={useRecovery ? 'xxxxxxxx' : '000000'}
                            maxLength={useRecovery ? 8 : 6}
                            autoFocus
                            autoComplete="one-time-code"
                        />
                    </div>

                    <Button type="submit" className="w-full" disabled={isLoading || !code.trim()}>
                        {isLoading ? 'Verificando...' : 'Verificar'}
                    </Button>

                    <Button
                        type="button"
                        variant="ghost"
                        className="w-full text-sm"
                        onClick={() => { setUseRecovery(!useRecovery); setCode(''); }}
                    >
                        {useRecovery
                            ? 'Usar código do aplicativo autenticador'
                            : 'Perdeu acesso ao app? Use um código de recuperação'
                        }
                    </Button>

                    <div className="text-center">
                        <Link
                            href="/login"
                            onClick={clearPending2FA}
                            className="text-sm text-slate-500 hover:underline"
                        >
                            Voltar ao login
                        </Link>
                    </div>
                </CardContent>
            </form>
        </Card>
    );
}
