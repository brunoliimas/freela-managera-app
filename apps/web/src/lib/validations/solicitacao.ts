import { z } from 'zod';

export const clienteCadastroSchema = z.object({
    name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
    email: z.email('Email inválido'),
    phone: z.string().optional(),
    company: z.string().min(3, 'Nome da empresa é obrigatório'),
    cnpj: z.string().min(14, 'CNPJ inválido'),
});

export const briefingSchema = z.object({
    title: z.string().min(5, 'Título deve ter no mínimo 5 caracteres'),
    description: z.string().min(50, 'Descrição deve ter no mínimo 50 caracteres'),
    budget: z.string().optional(),
    deadline: z.string().optional(),
});

export type ClienteCadastroInput = z.infer<typeof clienteCadastroSchema>;
export type BriefingInput = z.infer<typeof briefingSchema>;