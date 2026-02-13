'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { orcamentoSchema, OrcamentoInput } from '@/lib/validations/orcamento';
import { Orcamento } from '@/types/orcamento';
import { Cliente } from '@/types/cliente';
import api from '@/lib/api';
import { toast } from 'sonner';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { RichTextEditorCompact } from '../ui/rich-text-editor-compact';
import { maskCurrency, unmaskCurrency } from '@/lib/masks';
import { useAuth } from '@/hooks/useAuth';
import { LayoutTemplate } from 'lucide-react';

interface TemplateOption {
    id: string;
    name: string;
    content: string;
    value: number | null;
}

interface OrcamentoFormProps {
    orcamento?: Orcamento;
    solicitacao?: {
        id: string;
        title: string;
        description: string;
        clienteId: string;
    };
    onSubmit: (data: OrcamentoInput) => Promise<void>;
    isLoading?: boolean;
}

export function OrcamentoForm({ orcamento, solicitacao, onSubmit, isLoading }: OrcamentoFormProps) {
    const { user } = useAuth();
    const isPro = user?.plan === 'PRO' || user?.plan === 'ENTERPRISE';
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [loadingClientes, setLoadingClientes] = useState(false);
    const [templates, setTemplates] = useState<TemplateOption[]>([]);

    const {
        register,
        handleSubmit,
        formState: { errors },
        setValue,
        watch,
    } = useForm<OrcamentoInput>({
        resolver: zodResolver(orcamentoSchema),
        defaultValues: orcamento
            ? {
                clienteId: orcamento.clienteId,
                title: orcamento.title,
                description: orcamento.description,
                value: orcamento.value.toString(),
                estimatedDays: orcamento.estimatedDays?.toString() || '',
                validUntil: orcamento.validUntil
                    ? new Date(orcamento.validUntil).toISOString().split('T')[0]
                    : '',
                notes: orcamento.notes || '',
            }
            : solicitacao
                ? {
                    clienteId: solicitacao.clienteId,
                    title: solicitacao.title,
                    description: solicitacao.description,
                }
                : undefined,
    });

    const clienteId = watch('clienteId');

    useEffect(() => {
        fetchClientes();
        if (isPro && !orcamento) {
            fetchTemplates();
        }
    }, []);

    const fetchTemplates = async () => {
        try {
            const response = await api.get('/templates', {
                params: { type: 'PROPOSTA', active: 'true' },
            });
            setTemplates(response.data);
        } catch {
            // Silently fail — templates are optional
        }
    };

    const applyTemplate = (templateId: string) => {
        const template = templates.find(t => t.id === templateId);
        if (!template) return;

        setValue('title', template.name);
        setValue('description', template.content);
        if (template.value) {
            setValue('value', String(template.value));
        }
        toast.success('Template aplicado');
    };

    const fetchClientes = async () => {
        try {
            setLoadingClientes(true);
            const response = await api.get('/clientes', {
                params: { active: 'true' },
            });
            setClientes(response.data);
        } catch (error) {
            toast.error('Erro ao carregar clientes');
        } finally {
            setLoadingClientes(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Template Selector (PRO only, new orcamentos only) */}
            {!orcamento && !solicitacao && (
                <div className="space-y-2">
                    {isPro && templates.length > 0 ? (
                        <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <LayoutTemplate className="h-5 w-5 text-blue-600 shrink-0" />
                            <div className="flex-1">
                                <Select onValueChange={applyTemplate}>
                                    <SelectTrigger className="bg-white">
                                        <SelectValue placeholder="Usar template de proposta..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {templates.map(t => (
                                            <SelectItem key={t.id} value={t.id}>
                                                {t.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    ) : !isPro ? (
                        <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                            <LayoutTemplate className="h-5 w-5 text-slate-400 shrink-0" />
                            <p className="text-sm text-slate-500">
                                Upgrade para o plano PRO para usar templates de proposta
                            </p>
                        </div>
                    ) : null}
                </div>
            )}

            <div className="space-y-4">
                <h3 className="text-lg font-semibold">Informações Básicas</h3>

                <div className="space-y-2">
                    <Label htmlFor="clienteId">Cliente *</Label>
                    <Select
                        value={clienteId}
                        onValueChange={(value) => setValue('clienteId', value)}
                        disabled={!!solicitacao || !!orcamento}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Selecione um cliente" />
                        </SelectTrigger>
                        <SelectContent>
                            {loadingClientes ? (
                                <SelectItem value="loading" disabled>
                                    Carregando...
                                </SelectItem>
                            ) : (
                                clientes.map((cliente) => (
                                    <SelectItem key={cliente.id} value={cliente.id}>
                                        {cliente.name} {cliente.company && `- ${cliente.company}`}
                                    </SelectItem>
                                ))
                            )}
                        </SelectContent>
                    </Select>
                    {errors.clienteId && (
                        <p className="text-sm text-red-500">{errors.clienteId.message}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="title">Título do Orçamento *</Label>
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
                    <RichTextEditor
                        value={watch('description') || ''}
                        onChange={(value) => setValue('description', value)}
                        placeholder="Descreva o projeto em detalhes..."
                    />
                    {errors.description && (
                        <p className="text-sm text-red-600">{errors.description.message}</p>
                    )}
                </div>
            </div>

            <div className="space-y-4">
                <h3 className="text-lg font-semibold">Valores e Prazos</h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="value">Valor (R$) *</Label>
                        <Input
                            id="value"
                            placeholder="5.000,00"
                            value={watch('value') ? maskCurrency(String(Math.round(parseFloat(watch('value')) * 100))) : ''}
                            onChange={(e) => {
                                const masked = maskCurrency(e.target.value);
                                e.target.value = masked;
                                setValue('value', unmaskCurrency(masked));
                            }}
                        />
                        {errors.value && (
                            <p className="text-sm text-red-500">{errors.value.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="estimatedDays">Prazo Estimado (dias)</Label>
                        <Input
                            id="estimatedDays"
                            type="number"
                            placeholder="30"
                            {...register('estimatedDays')}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="validUntil">Válido até</Label>
                        <Input
                            id="validUntil"
                            type="date"
                            {...register('validUntil')}
                        />
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <h3 className="text-lg font-semibold">Observações Internas</h3>

                <div className="space-y-2">
                    <Label htmlFor="notes">Notas (visível apenas para você)</Label>
                    <RichTextEditorCompact
                        value={watch('notes') || ''}
                        onChange={(value) => setValue('notes', value)}
                        placeholder="Notas..."
                    />

                </div>
            </div>

            <div className="flex gap-4 justify-end">
                <Button type="submit" disabled={isLoading}>
                    {isLoading ? 'Salvando...' : orcamento ? 'Atualizar Orçamento' : 'Criar Orçamento'}
                </Button>
            </div>
        </form>
    );
}