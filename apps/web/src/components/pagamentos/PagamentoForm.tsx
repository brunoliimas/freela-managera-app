'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RichTextEditorCompact } from '@/components/ui/rich-text-editor-compact';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { pagamentoSchema, PagamentoInput } from '@/lib/validations/pagamento';
import { Pagamento } from '@/types/projeto';
import { Projeto } from '@/types/projeto';
import api from '@/lib/api';
import { toast } from 'sonner';
import { maskCurrency, unmaskCurrency } from '@/lib/masks';

interface PagamentoFormProps {
    pagamento?: Pagamento;
    projetoId?: string;
    onSubmit: (data: PagamentoInput) => Promise<void>;
    isLoading?: boolean;
}

export function PagamentoForm({ pagamento, projetoId, onSubmit, isLoading }: PagamentoFormProps) {
    const [projetos, setProjetos] = useState<Projeto[]>([]);
    const [loadingProjetos, setLoadingProjetos] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
        setValue,
        watch,
    } = useForm<PagamentoInput>({
        resolver: zodResolver(pagamentoSchema),
        defaultValues: pagamento
            ? {
                projetoId: pagamento.projetoId,
                description: pagamento.description,
                value: pagamento.value.toString(),
                dueDate: new Date(pagamento.dueDate).toISOString().split('T')[0],
                method: pagamento.method || '',
                notes: pagamento.notes || '',
            }
            : projetoId
                ? {
                    projetoId,
                }
                : undefined,
    });

    const selectedProjetoId = watch('projetoId');

    useEffect(() => {
        if (!projetoId && !pagamento) {
            fetchProjetos();
        }
    }, [projetoId, pagamento]);

    const fetchProjetos = async () => {
        try {
            setLoadingProjetos(true);
            const response = await api.get('/projetos', {
                params: { status: 'EM_ANDAMENTO' },
            });
            setProjetos(response.data);
        } catch (error) {
            toast.error('Erro ao carregar projetos');
        } finally {
            setLoadingProjetos(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
                <h3 className="text-lg font-semibold">Informações do Pagamento</h3>

                {!projetoId && !pagamento && (
                    <div className="space-y-2">
                        <Label htmlFor="projetoId">Projeto *</Label>
                        <Select
                            value={selectedProjetoId}
                            onValueChange={(value) => setValue('projetoId', value)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione um projeto" />
                            </SelectTrigger>
                            <SelectContent>
                                {loadingProjetos ? (
                                    <SelectItem value="loading" disabled>
                                        Carregando...
                                    </SelectItem>
                                ) : (
                                    projetos.map((projeto) => (
                                        <SelectItem key={projeto.id} value={projeto.id}>
                                            {projeto.number} - {projeto.title}
                                        </SelectItem>
                                    ))
                                )}
                            </SelectContent>
                        </Select>
                        {errors.projetoId && (
                            <p className="text-sm text-red-500">{errors.projetoId.message}</p>
                        )}
                    </div>
                )}

                <div className="space-y-2">
                    <Label htmlFor="description">Descrição *</Label>
                    <Input
                        id="description"
                        placeholder="Ex: Primeira parcela do projeto"
                        {...register('description')}
                    />
                    {errors.description && (
                        <p className="text-sm text-red-500">{errors.description.message}</p>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        <Label htmlFor="dueDate">Data de Vencimento *</Label>
                        <Input
                            id="dueDate"
                            type="date"
                            {...register('dueDate')}
                        />
                        {errors.dueDate && (
                            <p className="text-sm text-red-500">{errors.dueDate.message}</p>
                        )}
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="method">Método de Pagamento</Label>
                    <Select
                        value={watch('method') || undefined}
                        onValueChange={(value) => setValue('method', value)}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Selecione o método" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="PIX">PIX</SelectItem>
                            <SelectItem value="Transferência">Transferência Bancária</SelectItem>
                            <SelectItem value="Boleto">Boleto</SelectItem>
                            <SelectItem value="Cartão">Cartão de Crédito</SelectItem>
                            <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="notes">Observações</Label>
                    <RichTextEditorCompact
                        value={watch('notes') || ''}
                        onChange={(value) => setValue('notes', value)}
                        placeholder="Informações adicionais sobre o pagamento..."
                    />
                </div>
            </div>

            <div className="flex gap-4 justify-end">
                <Button type="submit" disabled={isLoading}>
                    {isLoading ? 'Salvando...' : pagamento ? 'Atualizar Pagamento' : 'Criar Pagamento'}
                </Button>
            </div>
        </form>
    );
}