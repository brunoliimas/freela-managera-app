'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, UserPlus, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import apiPublic from '@/lib/api-public';
import { toast } from 'sonner';
import axios from 'axios';

export default function SolicitarOrcamentoPage() {
    const router = useRouter();
    const [option, setOption] = useState<'cliente' | 'cadastro' | null>(null);
    const [cnpj, setCnpj] = useState('');
    const [loading, setLoading] = useState(false);

    const handleBuscarCNPJ = async () => {
        if (!cnpj) {
            toast.error('Digite o CNPJ');
            return;
        }

        setLoading(true);
        try {
            const cnpjClean = cnpj.replace(/[^\d]/g, '');
            const response = await apiPublic.get(`/solicitacoes/cliente/buscar-cnpj/${cnpjClean}`);

            // Salvar dados do cliente no sessionStorage
            sessionStorage.setItem('cliente', JSON.stringify(response.data));

            toast.success('Cliente encontrado!');
            router.push('/solicitar-orcamento/briefing');
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 404) {
                toast.error('CNPJ não encontrado. Faça seu cadastro primeiro.');
                setOption('cadastro');
            } else {
                toast.error('Erro ao buscar CNPJ');
            }
        } finally {
            setLoading(false);
        }
    };

    // const handleNovoCadastro = () => {
    //     router.push('/solicitar-orcamento/cadastro');
    // };

    useEffect(() => {
        if (option === 'cadastro') {
            router.push('/solicitar-orcamento/cadastro');
        }
    }, [option, router]);

    if (option === null) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 to-slate-100 p-4">
                <div className="w-full max-w-4xl space-y-8">
                    {/* Header */}
                    <div className="text-center">
                        <h1 className="text-4xl font-bold text-slate-900 mb-3">
                            Solicitar Orçamento
                        </h1>
                        <p className="text-lg text-slate-600">
                            Escolha uma opção para começar
                        </p>
                    </div>

                    {/* Opções */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Já sou cliente */}
                        <Card
                            className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-blue-500"
                            onClick={() => setOption('cliente')}
                        >
                            <CardHeader>
                                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                                    <Building2 className="h-6 w-6 text-blue-600" />
                                </div>
                                <CardTitle>Já sou cliente</CardTitle>
                                <CardDescription>
                                    Se você já trabalhou conosco, informe seu CNPJ para agilizar
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Button className="w-full" size="lg">
                                    Continuar
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </CardContent>
                        </Card>

                        {/* Ainda não sou cliente */}
                        <Card
                            className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-green-500"
                            onClick={() => setOption('cadastro')}
                        >
                            <CardHeader>
                                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                                    <UserPlus className="h-6 w-6 text-green-600" />
                                </div>
                                <CardTitle>Ainda não sou cliente</CardTitle>
                                <CardDescription>
                                    Faça seu cadastro rápido e solicite seu orçamento
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Button className="w-full" size="lg" variant="outline">
                                    Fazer Cadastro
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        );
    }

    if (option === 'cliente') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-slate-100 p-4">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle>Buscar por CNPJ</CardTitle>
                        <CardDescription>
                            Digite seu CNPJ para recuperar seus dados
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="cnpj">CNPJ</Label>
                            <Input
                                id="cnpj"
                                placeholder="00.000.000/0000-00"
                                value={cnpj}
                                onChange={(e) => setCnpj(e.target.value)}
                                maxLength={18}
                            />
                        </div>
                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                className="flex-1"
                                onClick={() => setOption(null)}
                            >
                                Voltar
                            </Button>
                            <Button
                                className="flex-1"
                                onClick={handleBuscarCNPJ}
                                disabled={loading}
                            >
                                {loading ? 'Buscando...' : 'Continuar'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return null;
}