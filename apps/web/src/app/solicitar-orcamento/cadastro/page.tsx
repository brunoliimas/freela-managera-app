'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { clienteCadastroSchema, ClienteCadastroInput } from '@/lib/validations/solicitacao';
import apiPublic from '@/lib/api-public';
import { toast } from 'sonner';
import axios from 'axios';

export default function CadastroPage() {
    const router = useRouter();

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<ClienteCadastroInput>({
        resolver: zodResolver(clienteCadastroSchema),
    });

    const onSubmit = async (data: ClienteCadastroInput) => {
        try {
            const response = await apiPublic.post('/solicitacoes/cliente/cadastrar', data);

            // Salvar dados do cliente no sessionStorage
            sessionStorage.setItem('cliente', JSON.stringify(response.data.cliente));

            toast.success('Cadastro realizado com sucesso!');
            router.push('/solicitar-orcamento/briefing');
        } catch (error) {
            if (axios.isAxiosError(error)) {
                toast.error(error.response?.data?.error || 'Erro ao realizar cadastro');
            } else {
                toast.error('Erro ao realizar cadastro');
            }
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-slate-100 p-4">
            <Card className="w-full max-w-2xl">
                <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.push('/solicitar-orcamento')}
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div>
                            <CardTitle>Cadastro de Cliente</CardTitle>
                            <CardDescription>
                                Preencha seus dados para continuar
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Nome Completo *</Label>
                                <Input
                                    id="name"
                                    placeholder="João da Silva"
                                    {...register('name')}
                                />
                                {errors.name && (
                                    <p className="text-sm text-red-500">{errors.name.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">Email *</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="joao@empresa.com"
                                    {...register('email')}
                                />
                                {errors.email && (
                                    <p className="text-sm text-red-500">{errors.email.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="phone">Telefone</Label>
                                <Input
                                    id="phone"
                                    placeholder="(11) 99999-9999"
                                    {...register('phone')}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="cnpj">CNPJ *</Label>
                                <Input
                                    id="cnpj"
                                    placeholder="00.000.000/0000-00"
                                    maxLength={18}
                                    {...register('cnpj')}
                                />
                                {errors.cnpj && (
                                    <p className="text-sm text-red-500">{errors.cnpj.message}</p>
                                )}
                            </div>

                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="company">Nome da Empresa *</Label>
                                <Input
                                    id="company"
                                    placeholder="Empresa XYZ Ltda"
                                    {...register('company')}
                                />
                                {errors.company && (
                                    <p className="text-sm text-red-500">{errors.company.message}</p>
                                )}
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full"
                            size="lg"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Cadastrando...' : 'Continuar para o Briefing'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}