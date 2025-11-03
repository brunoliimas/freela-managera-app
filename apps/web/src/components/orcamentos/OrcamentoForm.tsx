'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [loadingClientes, setLoadingClientes] = useState(false);

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
    }, []);

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
                    <Textarea
                        id="description"
                        placeholder="Descreva o escopo do projeto, entregas, tecnologias..."
                        rows={6}
                        {...register('description')}
                    />
                    {errors.description && (
                        <p className="text-sm text-red-500">{errors.description.message}</p>
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
                            type="number"
                            step="0.01"
                            placeholder="5000.00"
                            {...register('value')}
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
                    <Textarea
                        id="notes"
                        placeholder="Anotações sobre negociação, detalhes técnicos, etc..."
                        rows={3}
                        {...register('notes')}
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