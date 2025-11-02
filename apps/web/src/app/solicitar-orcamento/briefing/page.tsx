'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Calendar, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { briefingSchema, BriefingInput } from '@/lib/validations/solicitacao';
import { ClientePublico } from '@/types/solicitacao';
import apiPublic from '@/lib/api-public';
import { toast } from 'sonner';
import axios from 'axios';

export default function BriefingPage() {
    const router = useRouter();

    // Lazy initialization - lê do sessionStorage apenas uma vez
    const [cliente] = useState<ClientePublico | null>(() => {
        if (typeof window === 'undefined') return null;
        const clienteData = sessionStorage.getItem('cliente');
        return clienteData ? JSON.parse(clienteData) : null;
    });

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<BriefingInput>({
        resolver: zodResolver(briefingSchema),
    });

    // Apenas para o side effect de redirecionamento
    useEffect(() => {
        if (!cliente) {
            toast.error('Sessão expirada. Por favor, comece novamente.');
            router.push('/solicitar-orcamento');
        }
    }, [cliente, router]);

    const onSubmit = async (data: BriefingInput) => {
        if (!cliente) return;

        try {
            await apiPublic.post('/solicitacoes/solicitar', {
                clienteId: cliente.id,
                title: data.title,
                description: data.description,
                budget: data.budget ? parseFloat(data.budget) : undefined,
                deadline: data.deadline || undefined,
            });

            // Limpar sessionStorage
            sessionStorage.removeItem('cliente');

            toast.success('Solicitação enviada com sucesso!');
            router.push('/solicitar-orcamento/sucesso');
        } catch (error) {
            if (axios.isAxiosError(error)) {
                toast.error(error.response?.data?.error || 'Erro ao enviar solicitação');
            } else {
                toast.error('Erro ao enviar solicitação');
            }
        }
    };

    // Se não tem cliente, não renderiza nada (vai redirecionar)
    if (!cliente) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-slate-100">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-slate-100 p-4">
            <Card className="w-full max-w-3xl">
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
                            <CardTitle>Conte-nos sobre seu projeto</CardTitle>
                            <CardDescription>
                                Solicitante: {cliente.name} - {cliente.company}
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="title">Título do Projeto *</Label>
                            <Input
                                id="title"
                                placeholder="Ex: Desenvolvimento de Site Institucional"
                                {...register('title')}
                            />
                            {errors.title && (
                                <p className="text-sm text-red-500">{errors.title.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Descrição Detalhada *</Label>
                            <Textarea
                                id="description"
                                placeholder="Descreva seu projeto com o máximo de detalhes possível: objetivos, funcionalidades desejadas, público-alvo, referências, etc."
                                rows={8}
                                {...register('description')}
                            />
                            {errors.description && (
                                <p className="text-sm text-red-500">{errors.description.message}</p>
                            )}
                            <p className="text-xs text-slate-500">
                                Mínimo de 50 caracteres. Quanto mais detalhes, melhor será o orçamento!
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="budget">Orçamento Estimado (opcional)</Label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <Input
                                        id="budget"
                                        type="number"
                                        placeholder="5000"
                                        className="pl-10"
                                        {...register('budget')}
                                    />
                                </div>
                                <p className="text-xs text-slate-500">
                                    Isso nos ajuda a personalizar melhor a proposta
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="deadline">Prazo Desejado (opcional)</Label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <Input
                                        id="deadline"
                                        type="date"
                                        className="pl-10"
                                        {...register('deadline')}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <p className="text-sm text-blue-800">
                                <strong>O que acontece depois?</strong>
                                <br />
                                Analisaremos seu projeto e enviaremos um orçamento detalhado para o email cadastrado em até 48 horas úteis.
                            </p>
                        </div>

                        <Button
                            type="submit"
                            className="w-full"
                            size="lg"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Enviando...' : 'Enviar Solicitação'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}