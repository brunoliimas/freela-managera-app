import { z } from 'zod';

export const clienteSchema = z.object({
    name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
    email: z.email('Email inválido'),
    phone: z.string().optional(),
    company: z.string().optional(),
    cnpj: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zipCode: z.string().optional(),
    notes: z.string().optional(),
    active: z.boolean().default(true),
});

export type ClienteInput = z.infer<typeof clienteSchema>;