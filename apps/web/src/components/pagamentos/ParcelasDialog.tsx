'use client';

import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { ParcelasForm } from './ParcelasForm';
import { ParcelasInput } from '@/lib/validations/pagamento';
import api from '@/lib/api';
import { toast } from 'sonner';
import axios from 'axios';

interface ParcelasDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    projetoId: string;
    valorProjeto: number;
    onSuccess: () => void;
}

export function ParcelasDialog({
    open,
    onOpenChange,
    projetoId,
    valorProjeto,
    onSuccess,
}: ParcelasDialogProps) {
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (data: ParcelasInput) => {
        setIsLoading(true);
        try {
            await api.post('/pagamentos/parcelas', data);
            toast.success('Parcelas geradas com sucesso!');
            onSuccess();
            onOpenChange(false);
        } catch (error) {
            if (axios.isAxiosError(error)) {
                toast.error(error.response?.data?.error || 'Erro ao gerar parcelas');
            } else {
                toast.error('Erro ao gerar parcelas');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Gerar Parcelas</DialogTitle>
                    <DialogDescription>
                        Crie parcelas automáticas para este projeto
                    </DialogDescription>
                </DialogHeader>
                <ParcelasForm
                    projetoId={projetoId}
                    valorProjeto={valorProjeto}
                    onSubmit={handleSubmit}
                    isLoading={isLoading}
                />
            </DialogContent>
        </Dialog>
    );
}