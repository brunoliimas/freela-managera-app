import { z } from 'zod';

export const createOrcamentoSchema = z.object({
    clienteId: z.string().min(1, 'Cliente é obrigatório'),
    title: z.string().min(1, 'Título é obrigatório'),
    description: z.string().min(1, 'Descrição é obrigatória'),
    value: z.union([z.string(), z.number()]),
    estimatedDays: z.union([z.string(), z.number()]).optional(),
    validUntil: z.string().optional(),
    notes: z.string().optional(),
    solicitacaoId: z.string().optional(),
});
