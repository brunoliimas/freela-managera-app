import { z } from 'zod';

export const createTemplateSchema = z.object({
    name: z.string().min(1, 'Nome é obrigatório'),
    type: z.enum(['PROPOSTA', 'CONTRATO', 'RECIBO']),
    content: z.string().min(1, 'Conteúdo é obrigatório'),
    value: z.union([z.string(), z.number()]).optional(),
});

export const updateTemplateSchema = z.object({
    name: z.string().min(1, 'Nome é obrigatório').optional(),
    type: z.enum(['PROPOSTA', 'CONTRATO', 'RECIBO']).optional(),
    content: z.string().min(1, 'Conteúdo é obrigatório').optional(),
    value: z.union([z.string(), z.number()]).nullable().optional(),
    active: z.boolean().optional(),
});
