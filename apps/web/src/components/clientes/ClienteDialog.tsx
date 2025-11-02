'use client';

import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { ClienteForm } from './ClienteForm';
import { Cliente } from '@/types/cliente';
import { ClienteInput } from '@/lib/validations/cliente';
import api from '@/lib/api';
import { toast } from 'sonner';
import axios from 'axios';

interface ClienteDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    cliente?: Cliente;
    onSuccess: () => void;
}

export function ClienteDialog({ open, onOpenChange, cliente, onSuccess }: ClienteDialogProps) {
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (data: ClienteInput) => {
        setIsLoading(true);
        try {
            if (cliente) {
                // Atualizar
                await api.put(`/clientes/${cliente.id}`, data);
                toast.success('Cliente atualizado com sucesso!');
            } else {
                // Criar
                await api.post('/clientes', data);
                toast.success('Cliente criado com sucesso!');
            }
            onSuccess();
            onOpenChange(false);
        } catch (error) {
            if (axios.isAxiosError(error)) {
                toast.error(error.response?.data?.error || 'Erro ao salvar cliente');
            } else {
                toast.error('Erro ao salvar cliente');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {cliente ? 'Editar Cliente' : 'Novo Cliente'}
                    </DialogTitle>
                    <DialogDescription>
                        {cliente
                            ? 'Atualize as informações do cliente'
                            : 'Preencha os dados para cadastrar um novo cliente'
                        }
                    </DialogDescription>
                </DialogHeader>
                <ClienteForm
                    cliente={cliente}
                    onSubmit={handleSubmit}
                    isLoading={isLoading}
                />
            </DialogContent>
        </Dialog>
    );
}