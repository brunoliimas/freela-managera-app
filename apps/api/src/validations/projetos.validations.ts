import { z } from 'zod';

export const createProjetoSchema = z.object({
    clienteId: z.string().min(1, 'Cliente é obrigatório'),
    title: z.string().min(1, 'Título é obrigatório'),
    description: z.string().min(1, 'Descrição é obrigatória'),
    value: z.union([z.string(), z.number()]),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    orcamentoId: z.string().optional(),
});

export const createProjetoFromOrcamentoSchema = z.object({
    orcamentoId: z.string().min(1, 'ID do orçamento é obrigatório'),
});

export const createMilestoneSchema = z.object({
    title: z.string().min(1, 'Título é obrigatório'),
    description: z.string().optional(),
});
