import { z } from 'zod';

export const createClienteSchema = z.object({
    name: z.string().min(1, 'Nome é obrigatório'),
    email: z.string().email('Email inválido'),
    phone: z.string().optional(),
    company: z.string().optional(),
    cnpj: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zipCode: z.string().optional(),
    notes: z.string().optional(),
    active: z.boolean().optional(),
});
