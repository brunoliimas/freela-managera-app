'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
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
import { marcarPagoSchema, MarcarPagoInput } from '@/lib/validations/pagamento';
import { Pagamento } from '@/types/projeto';
import { formatCurrency, formatDate } from '@/lib/format';
import api from '@/lib/api';
import { toast } from 'sonner';
import axios from 'axios';

interface MarcarPagoDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    pagamento: Pagamento;
    onSuccess: () => void;
}

export function MarcarPagoDialog({
    open,
    onOpenChange,
    pagamento,
    onSuccess,
}: MarcarPagoDialogProps) {
    const [isLoading, setIsLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
        setValue,
        watch,
    } = useForm<MarcarPagoInput>({
        resolver: zodResolver(marcarPagoSchema),
    });

    const handleMarcarPago = async (data: MarcarPagoInput) => {
        setIsLoading(true);
        try {
            await api.post(`/pagamentos/${pagamento.id}/marcar-pago`, data);
            toast.success('Pagamento marcado como pago!');
            onSuccess();
            onOpenChange(false);
        } catch (error) {
            if (axios.isAxiosError(error)) {
                toast.error(error.response?.data?.error || 'Erro ao marcar pagamento');
            } else {
                toast.error('Erro ao marcar pagamento');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Marcar Pagamento como Pago</DialogTitle>
                    <DialogDescription>
                        Confirme o recebimento do pagamento
                    </DialogDescription>
                </DialogHeader>

                <div className="bg-slate-50 p-4 rounded-lg mb-4">
                    <div className="space-y-1">
                        <p className="text-sm text-slate-600">Descrição:</p>
                        <p className="font-medium">{pagamento.description}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-3">
                        <div>
                            <p className="text-sm text-slate-600">Valor:</p>
                            <p className="font-semibold text-green-600">
                                {formatCurrency(pagamento.value)}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-slate-600">Vencimento:</p>
                            <p className="font-medium">{formatDate(pagamento.dueDate)}</p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit(handleMarcarPago)} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="method">Método de Pagamento</Label>
                        <Select
                            value={watch('method')}
                            onValueChange={(value) => setValue('method', value)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Como foi pago?" />
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
                        <Label htmlFor="receipt">Link do Comprovante</Label>
                        <Input
                            id="receipt"
                            type="url"
                            placeholder="https://..."
                            {...register('receipt')}
                        />
                        <p className="text-xs text-slate-500">
                            Cole o link do comprovante (ex: Google Drive, Dropbox)
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="notes">Observações</Label>
                        <Textarea
                            id="notes"
                            placeholder="Informações sobre o recebimento..."
                            rows={3}
                            {...register('notes')}
                        />
                    </div>

                    <div className="flex gap-4 justify-end pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? 'Confirmando...' : 'Confirmar Pagamento'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}