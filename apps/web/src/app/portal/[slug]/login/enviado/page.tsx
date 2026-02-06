'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail, ArrowLeft } from 'lucide-react';

export default function PortalLoginEnviadoPage() {
    const { slug } = useParams<{ slug: string }>();
    return (
        <div className="flex items-center justify-center min-h-screen bg-emerald-50">
            <div className="w-full max-w-md px-4">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-emerald-900">Portal do Cliente</h1>
                </div>

                <Card>
                    <CardHeader className="text-center space-y-4">
                        <div className="mx-auto w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
                            <Mail className="h-8 w-8 text-emerald-600" />
                        </div>
                        <CardTitle className="text-2xl font-bold">Verifique seu email</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center space-y-4">
                        <p className="text-slate-600">
                            Enviamos um link de acesso para o seu email.
                            Clique no link para entrar no portal.
                        </p>
                        <p className="text-sm text-slate-500">
                            O link expira em 1 hora. Se não encontrar o email,
                            verifique sua caixa de spam.
                        </p>

                        <Link href={`/portal/${slug}/login`}>
                            <Button variant="outline" className="mt-4">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Voltar ao login
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
