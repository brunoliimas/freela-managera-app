'use client';

import { use } from 'react';
import { CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function SucessoPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = use(params);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-slate-100 p-4">
            <Card className="w-full max-w-lg text-center">
                <CardHeader>
                    <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                        <CheckCircle className="h-10 w-10 text-green-600" />
                    </div>
                    <CardTitle className="text-2xl">Solicitação Enviada!</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2 text-slate-600">
                        <p>
                            Recebemos sua solicitação de orçamento com sucesso!
                        </p>
                        <p>
                            Analisaremos seu projeto e enviaremos uma proposta detalhada para o email cadastrado em até <strong>48 horas úteis</strong>.
                        </p>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-sm text-left space-y-2">
                        <p className="font-semibold text-slate-900">Próximos passos:</p>
                        <ul className="list-disc list-inside space-y-1 text-slate-600">
                            <li>Fique atento ao seu email</li>
                            <li>Caso aprovado, iniciaremos o projeto</li>
                            <li>Dúvidas? Entre em contato conosco</li>
                        </ul>
                    </div>

                    <Button
                        className="w-full"
                        onClick={() => window.location.href = `/f/${slug}/solicitar-orcamento`}
                    >
                        Fazer Nova Solicitação
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
