'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useClientAuth } from '@/hooks/useClientAuth';
import { toast } from 'sonner';
import { Mail } from 'lucide-react';

export default function PortalLoginPage() {
    const router = useRouter();
    const { requestLogin, isLoading } = useClientAuth();
    const [email, setEmail] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email.trim()) {
            toast.error('Informe seu email');
            return;
        }

        try {
            await requestLogin(email);
            router.push('/portal/login/enviado');
        } catch (error: unknown) {
            let message = 'Erro ao solicitar acesso';
            if (error instanceof Error) {
                message = error.message;
            }
            toast.error('Erro ao solicitar acesso', {
                description: message,
            });
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-emerald-50">
            <div className="w-full max-w-md px-4">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-emerald-900">Portal do Cliente</h1>
                    <p className="text-emerald-600 mt-2">Acompanhe seus projetos e pagamentos</p>
                </div>

                <Card>
                    <CardHeader className="space-y-1">
                        <CardTitle className="text-2xl font-bold">Acessar Portal</CardTitle>
                        <CardDescription>
                            Informe seu email para receber um link de acesso
                        </CardDescription>
                    </CardHeader>
                    <form onSubmit={handleSubmit}>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="seu@email.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>

                            <Button
                                type="submit"
                                className="w-full bg-emerald-600 hover:bg-emerald-700"
                                disabled={isLoading}
                            >
                                <Mail className="mr-2 h-4 w-4" />
                                {isLoading ? 'Enviando...' : 'Enviar link de acesso'}
                            </Button>
                        </CardContent>
                    </form>
                </Card>
            </div>
        </div>
    );
}
