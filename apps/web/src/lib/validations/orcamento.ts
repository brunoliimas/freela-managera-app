import { z } from 'zod';

export const orcamentoSchema = z.object({
    clienteId: z.string().min(1, 'Cliente é obrigatório'),
    title: z.string().min(5, 'Título deve ter no mínimo 5 caracteres'),
    description: z.string().min(20, 'Descrição deve ter no mínimo 20 caracteres'),
    value: z.string().min(1, 'Valor é obrigatório'),
    estimatedDays: z.string().optional(),
    validUntil: z.string().optional(),
    notes: z.string().optional(),
});

export type OrcamentoInput = z.infer<typeof orcamentoSchema>;