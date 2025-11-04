'use client';

import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { PagamentoForm } from './PagamentoForm';
import { Pagamento } from '@/types/projeto';
import { PagamentoInput } from '@/lib/validations/pagamento';
import api from '@/lib/api';
import { toast } from 'sonner';
import axios from 'axios';

interface PagamentoDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    pagamento?: Pagamento;
    projetoId?: string;
    onSuccess: () => void;
}

export function PagamentoDialog({
    open,
    onOpenChange,
    pagamento,
    projetoId,
    onSuccess,
}: PagamentoDialogProps) {
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (data: PagamentoInput) => {
        setIsLoading(true);
        try {
            if (pagamento) {
                await api.put(`/pagamentos/${pagamento.id}`, data);
                toast.success('Pagamento atualizado com sucesso!');
            } else {
                await api.post('/pagamentos', data);
                toast.success('Pagamento criado com sucesso!');
            }

            onSuccess();
            onOpenChange(false);
        } catch (error) {
            if (axios.isAxiosError(error)) {
                toast.error(error.response?.data?.error || 'Erro ao salvar pagamento');
            } else {
                toast.error('Erro ao salvar pagamento');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {pagamento ? 'Editar Pagamento' : 'Novo Pagamento'}
                    </DialogTitle>
                    <DialogDescription>
                        {pagamento
                            ? 'Atualize as informações do pagamento'
                            : 'Registre um novo pagamento a receber'}
                    </DialogDescription>
                </DialogHeader>
                <PagamentoForm
                    pagamento={pagamento}
                    projetoId={projetoId}
                    onSubmit={handleSubmit}
                    isLoading={isLoading}
                />
            </DialogContent>
        </Dialog>
    );
}