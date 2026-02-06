'use client';

import { useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RichTextEditorCompact } from '@/components/ui/rich-text-editor-compact';
import { Switch } from '@/components/ui/switch';
import { clienteSchema, ClienteInput } from '@/lib/validations/cliente';
import { Cliente } from '@/types/cliente';
import { maskPhone, maskCnpj, maskCep } from '@/lib/masks';

interface ClienteFormProps {
    cliente?: Cliente;
    onSubmit: (data: ClienteInput) => Promise<void>;
    isLoading?: boolean;
}

export function ClienteForm({ cliente, onSubmit, isLoading }: ClienteFormProps) {
    const {
        register,
        handleSubmit,
        formState: { errors },
        setValue,
        control,
    } = useForm({
        resolver: zodResolver(clienteSchema),
        defaultValues: cliente || {
            active: true,
        },
    });

    const active = useWatch({
        control,
        name: 'active',
        defaultValue: cliente?.active ?? true,
    });

    useEffect(() => {
        if (cliente) {
            setValue('active', cliente.active);
        }
    }, [cliente, setValue]);

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Informações Básicas */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold">Informações Básicas</h3>

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
                            placeholder="joao@email.com"
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
                            maxLength={15}
                            {...register('phone', {
                                onChange: (e) => { e.target.value = maskPhone(e.target.value); },
                            })}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="company">Empresa</Label>
                        <Input
                            id="company"
                            placeholder="Nome da Empresa"
                            {...register('company')}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="cnpj">CNPJ</Label>
                        <Input
                            id="cnpj"
                            placeholder="00.000.000/0000-00"
                            maxLength={18}
                            {...register('cnpj', {
                                onChange: (e) => { e.target.value = maskCnpj(e.target.value); },
                            })}
                        />
                    </div>
                </div>
            </div>

            {/* Endereço */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold">Endereço</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="address">Logradouro</Label>
                        <Input
                            id="address"
                            placeholder="Rua, número, complemento"
                            {...register('address')}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="city">Cidade</Label>
                        <Input
                            id="city"
                            placeholder="São Paulo"
                            {...register('city')}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="state">Estado</Label>
                        <Input
                            id="state"
                            placeholder="SP"
                            maxLength={2}
                            {...register('state')}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="zipCode">CEP</Label>
                        <Input
                            id="zipCode"
                            placeholder="00000-000"
                            maxLength={9}
                            {...register('zipCode', {
                                onChange: (e) => { e.target.value = maskCep(e.target.value); },
                            })}
                        />
                    </div>
                </div>
            </div>

            {/* Observações */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold">Observações</h3>

                <div className="space-y-2">
                    <Label htmlFor="notes">Anotações sobre o cliente</Label>
                    <RichTextEditorCompact
                        value={useWatch({ control, name: 'notes' }) || ''}
                        onChange={(value) => setValue('notes', value)}
                        placeholder="Informações adicionais, preferências, etc..."
                    />
                </div>
            </div>

            {/* Status */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-0.5">
                    <Label htmlFor="active">Cliente Ativo</Label>
                    <p className="text-sm text-slate-500">
                        Clientes inativos não aparecem nas listagens principais
                    </p>
                </div>
                <Switch
                    id="active"
                    checked={active}
                    onCheckedChange={(checked) => setValue('active', checked)}
                />
            </div>

            {/* Botões */}
            <div className="flex gap-4 justify-end">
                <Button
                    type="submit"
                    disabled={isLoading}
                >
                    {isLoading ? 'Salvando...' : cliente ? 'Atualizar Cliente' : 'Criar Cliente'}
                </Button>
            </div>
        </form>
    );
}