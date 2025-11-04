'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { parcelasSchema, ParcelasInput } from '@/lib/validations/pagamento';
import { formatCurrency } from '@/lib/format';

interface ParcelasFormProps {
    projetoId: string;
    valorProjeto: number;
    onSubmit: (data: ParcelasInput) => Promise<void>;
    isLoading?: boolean;
}

export function ParcelasForm({ projetoId, valorProjeto, onSubmit, isLoading }: ParcelasFormProps) {
    const {
        register,
        handleSubmit,
        formState: { errors },
        watch,
    } = useForm<ParcelasInput>({
        resolver: zodResolver(parcelasSchema),
        defaultValues: {
            projetoId,
        },
    });

    const numeroParcelas = watch('numeroParcelas');
    const valorParcela = numeroParcelas ? valorProjeto / parseInt(numeroParcelas) : 0;

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
                <h3 className="text-lg font-semibold">Gerar Parcelas Automáticas</h3>

                <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-blue-800">
                        O valor total do projeto é <strong>{formatCurrency(valorProjeto)}</strong>.
                        {valorParcela > 0 && (
                            <span className="block mt-2">
                                Cada parcela terá o valor de <strong>{formatCurrency(valorParcela)}</strong>.
                            </span>
                        )}
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="numeroParcelas">Número de Parcelas *</Label>
                        <Input
                            id="numeroParcelas"
                            type="number"
                            min="2"
                            max="12"
                            placeholder="Ex: 3"
                            {...register('numeroParcelas')}
                        />
                        {errors.numeroParcelas && (
                            <p className="text-sm text-red-500">{errors.numeroParcelas.message}</p>
                        )}
                        <p className="text-xs text-slate-500">Máximo: 12 parcelas</p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="primeiroVencimento">Primeiro Vencimento *</Label>
                        <Input
                            id="primeiroVencimento"
                            type="date"
                            {...register('primeiroVencimento')}
                        />
                        {errors.primeiroVencimento && (
                            <p className="text-sm text-red-500">{errors.primeiroVencimento.message}</p>
                        )}
                        <p className="text-xs text-slate-500">As demais vencerão mensalmente</p>
                    </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-lg">
                    <p className="text-sm text-slate-600">
                        💡 <strong>Como funciona:</strong> As parcelas serão criadas automaticamente
                        com o mesmo valor dividido igualmente. Cada parcela vencerá no mesmo dia
                        dos meses seguintes.
                    </p>
                </div>
            </div>

            <div className="flex gap-4 justify-end">
                <Button type="submit" disabled={isLoading}>
                    {isLoading ? 'Gerando...' : 'Gerar Parcelas'}
                </Button>
            </div>
        </form>
    );
}