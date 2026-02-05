import { z } from 'zod';

export const createPagamentoSchema = z.object({
    projetoId: z.string().min(1, 'Projeto é obrigatório'),
    description: z.string().min(1, 'Descrição é obrigatória'),
    value: z.union([z.string(), z.number()]),
    dueDate: z.string().min(1, 'Data de vencimento é obrigatória'),
    method: z.string().optional(),
    notes: z.string().optional(),
});

export const createParcelasSchema = z.object({
    projetoId: z.string().min(1, 'Projeto é obrigatório'),
    numeroParcelas: z.union([z.string(), z.number()]),
    primeiroVencimento: z.string().min(1, 'Data do primeiro vencimento é obrigatória'),
});
