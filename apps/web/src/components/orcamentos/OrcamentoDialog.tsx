'use client';

import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { OrcamentoForm } from './OrcamentoForm';
import { Orcamento } from '@/types/orcamento';
import { OrcamentoInput } from '@/lib/validations/orcamento';
import api from '@/lib/api';
import { toast } from 'sonner';
import axios from 'axios';

interface OrcamentoDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    orcamento?: Orcamento;
    solicitacao?: {
        id: string;
        title: string;
        description: string;
        clienteId: string;
    };
    onSuccess: () => void;
}

export function OrcamentoDialog({
    open,
    onOpenChange,
    orcamento,
    solicitacao,
    onSuccess,
}: OrcamentoDialogProps) {
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (data: OrcamentoInput) => {
        setIsLoading(true);
        try {
            const payload = {
                ...data,
                solicitacaoId: solicitacao?.id,
            };

            if (orcamento) {
                await api.put(`/orcamentos/${orcamento.id}`, payload);
                toast.success('Orçamento atualizado com sucesso!');
            } else {
                await api.post('/orcamentos', payload);
                toast.success('Orçamento criado com sucesso!');
            }

            onSuccess();
            onOpenChange(false);
        } catch (error) {
            if (axios.isAxiosError(error)) {
                toast.error(error.response?.data?.error || 'Erro ao salvar orçamento');
            } else {
                toast.error('Erro ao salvar orçamento');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {orcamento ? 'Editar Orçamento' : 'Novo Orçamento'}
                    </DialogTitle>
                    <DialogDescription>
                        {orcamento
                            ? 'Atualize as informações do orçamento'
                            : solicitacao
                                ? 'Criando orçamento a partir da solicitação'
                                : 'Preencha os dados para criar um novo orçamento'}
                    </DialogDescription>
                </DialogHeader>
                <OrcamentoForm
                    orcamento={orcamento}
                    solicitacao={solicitacao}
                    onSubmit={handleSubmit}
                    isLoading={isLoading}
                />
            </DialogContent>
        </Dialog>
    );
}