import { z } from 'zod';

export const createSolicitacaoSchema = z.object({
    clienteId: z.string().min(1, 'Cliente é obrigatório'),
    title: z.string().min(1, 'Título é obrigatório'),
    description: z.string().min(1, 'Descrição é obrigatória'),
    budget: z.union([z.string(), z.number()]).optional(),
    deadline: z.string().optional(),
});

export const createClientePublicSchema = z.object({
    name: z.string().min(1, 'Nome é obrigatório'),
    email: z.string().email('Email inválido'),
    phone: z.string().optional(),
    company: z.string().optional(),
    cnpj: z.string().optional(),
    userId: z.string().min(1, 'Identificação do profissional é obrigatória'),
});
