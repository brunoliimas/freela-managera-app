'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { toast } from 'sonner';
import { Send, DollarSign, Calendar } from 'lucide-react';
import apiPortal from '@/lib/api-portal';
import { maskCurrency, unmaskCurrency } from '@/lib/masks';
import axios from 'axios';

const solicitacaoSchema = z.object({
    title: z.string().min(5, 'Título deve ter no mínimo 5 caracteres'),
    description: z.string().min(10, 'Descrição deve ter no mínimo 10 caracteres'),
    budget: z.string().optional(),
    deadline: z.string().optional(),
});

type SolicitacaoInput = z.infer<typeof solicitacaoSchema>;

export default function PortalNovaSolicitacaoPage() {
    const router = useRouter();

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        setValue,
        watch,
    } = useForm<SolicitacaoInput>({
        resolver: zodResolver(solicitacaoSchema),
    });

    const onSubmit = async (data: SolicitacaoInput) => {
        try {
            await apiPortal.post('/solicitacoes', {
                title: data.title,
                description: data.description,
                budget: data.budget ? parseFloat(data.budget) : undefined,
                deadline: data.deadline || undefined,
            });

            toast.success('Solicitação enviada!', {
                description: 'Entraremos em contato em breve.',
            });
            router.push('/portal');
        } catch (error) {
            if (axios.isAxiosError(error)) {
                toast.error(error.response?.data?.error || 'Erro ao enviar solicitação');
            } else {
                toast.error('Erro ao enviar solicitação');
            }
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-slate-900">Nova Solicitação</h1>
                <p className="text-slate-600 mt-1">Envie uma nova solicitação de serviço</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Detalhes da Solicitação</CardTitle>
                    <CardDescription>
                        Descreva o que você precisa e entraremos em contato para discutir os detalhes
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="title">Título do Projeto *</Label>
                            <Input
                                id="title"
                                placeholder="Ex: Criar landing page, Redesign do site..."
                                {...register('title')}
                            />
                            {errors.title && (
                                <p className="text-sm text-red-500">{errors.title.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Descrição Detalhada *</Label>
                            <RichTextEditor
                                value={watch('description') || ''}
                                onChange={(value) => setValue('description', value)}
                                placeholder="Descreva seu projeto com o máximo de detalhes possível: objetivos, funcionalidades desejadas, referências, etc."
                            />
                            {errors.description && (
                                <p className="text-sm text-red-500">{errors.description.message}</p>
                            )}
                            <p className="text-xs text-slate-500">
                                Quanto mais detalhes, melhor será a proposta!
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="budget">Orçamento Estimado (opcional)</Label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <Input
                                        id="budget"
                                        placeholder="5.000,00"
                                        className="pl-10"
                                        value={watch('budget') ? maskCurrency(String(Math.round(parseFloat(watch('budget')!) * 100))) : ''}
                                        onChange={(e) => {
                                            const masked = maskCurrency(e.target.value);
                                            e.target.value = masked;
                                            setValue('budget', unmaskCurrency(masked));
                                        }}
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

                        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                            <p className="text-sm text-emerald-800">
                                <strong>O que acontece depois?</strong>
                                <br />
                                Analisaremos seu projeto e enviaremos um orçamento detalhado para o email cadastrado.
                            </p>
                        </div>

                        <Button
                            type="submit"
                            className="w-full bg-emerald-600 hover:bg-emerald-700"
                            size="lg"
                            disabled={isSubmitting}
                        >
                            <Send className="mr-2 h-4 w-4" />
                            {isSubmitting ? 'Enviando...' : 'Enviar Solicitação'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
