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
import { projetoSchema, ProjetoInput } from '@/lib/validations/projeto';
import { Projeto } from '@/types/projeto';
import { Cliente } from '@/types/cliente';
import api from '@/lib/api';
import { toast } from 'sonner';

interface ProjetoFormProps {
    projeto?: Projeto;
    onSubmit: (data: ProjetoInput) => Promise<void>;
    isLoading?: boolean;
}

export function ProjetoForm({ projeto, onSubmit, isLoading }: ProjetoFormProps) {
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [loadingClientes, setLoadingClientes] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
        setValue,
        watch,
    } = useForm<ProjetoInput>({
        resolver: zodResolver(projetoSchema),
        defaultValues: projeto
            ? {
                clienteId: projeto.clienteId,
                title: projeto.title,
                description: projeto.description,
                value: projeto.value.toString(),
                startDate: new Date(projeto.startDate).toISOString().split('T')[0],
                endDate: projeto.endDate
                    ? new Date(projeto.endDate).toISOString().split('T')[0]
                    : '',
                notes: projeto.notes || '',
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
                        disabled={!!projeto}
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
                    <Label htmlFor="description">Descrição *</Label>
                    <Textarea
                        id="description"
                        placeholder="Descreva o escopo do projeto..."
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
                            placeholder="10000.00"
                            {...register('value')}
                        />
                        {errors.value && (
                            <p className="text-sm text-red-500">{errors.value.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="startDate">Data de Início</Label>
                        <Input
                            id="startDate"
                            type="date"
                            {...register('startDate')}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="endDate">Data de Entrega</Label>
                        <Input
                            id="endDate"
                            type="date"
                            {...register('endDate')}
                        />
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <h3 className="text-lg font-semibold">Observações</h3>

                <div className="space-y-2">
                    <Label htmlFor="notes">Notas do Projeto</Label>
                    <Textarea
                        id="notes"
                        placeholder="Informações adicionais, requisitos especiais..."
                        rows={3}
                        {...register('notes')}
                    />
                </div>
            </div>

            <div className="flex gap-4 justify-end">
                <Button type="submit" disabled={isLoading}>
                    {isLoading ? 'Salvando...' : projeto ? 'Atualizar Projeto' : 'Criar Projeto'}
                </Button>
            </div>
        </form>
    );
}