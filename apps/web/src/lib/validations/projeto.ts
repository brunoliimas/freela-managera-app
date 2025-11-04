import { z } from 'zod';

export const projetoSchema = z.object({
    clienteId: z.string().min(1, 'Cliente é obrigatório'),
    title: z.string().min(5, 'Título deve ter no mínimo 5 caracteres'),
    description: z.string().min(20, 'Descrição deve ter no mínimo 20 caracteres'),
    value: z.string().min(1, 'Valor é obrigatório'),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    notes: z.string().optional(),
});

export const milestoneSchema = z.object({
    title: z.string().min(3, 'Título deve ter no mínimo 3 caracteres'),
    description: z.string().optional(),
});

export type ProjetoInput = z.infer<typeof projetoSchema>;
export type MilestoneInput = z.infer<typeof milestoneSchema>;