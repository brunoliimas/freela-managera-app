'use client';

import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { ProjetoForm } from './ProjetoForm';
import { Projeto } from '@/types/projeto';
import { ProjetoInput } from '@/lib/validations/projeto';
import api from '@/lib/api';
import { toast } from 'sonner';
import axios from 'axios';

interface ProjetoDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    projeto?: Projeto;
    onSuccess: () => void;
}

export function ProjetoDialog({
    open,
    onOpenChange,
    projeto,
    onSuccess,
}: ProjetoDialogProps) {
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (data: ProjetoInput) => {
        setIsLoading(true);
        try {
            if (projeto) {
                await api.put(`/projetos/${projeto.id}`, data);
                toast.success('Projeto atualizado com sucesso!');
            } else {
                await api.post('/projetos', data);
                toast.success('Projeto criado com sucesso!');
            }

            onSuccess();
            onOpenChange(false);
        } catch (error) {
            if (axios.isAxiosError(error)) {
                toast.error(error.response?.data?.error || 'Erro ao salvar projeto');
            } else {
                toast.error('Erro ao salvar projeto');
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
                        {projeto ? 'Editar Projeto' : 'Novo Projeto'}
                    </DialogTitle>
                    <DialogDescription>
                        {projeto
                            ? 'Atualize as informações do projeto'
                            : 'Preencha os dados para criar um novo projeto'}
                    </DialogDescription>
                </DialogHeader>
                <ProjetoForm
                    projeto={projeto}
                    onSubmit={handleSubmit}
                    isLoading={isLoading}
                />
            </DialogContent>
        </Dialog>
    );
}