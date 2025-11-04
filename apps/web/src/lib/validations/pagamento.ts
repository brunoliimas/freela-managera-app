import { z } from 'zod';

export const pagamentoSchema = z.object({
    projetoId: z.string().min(1, 'Projeto é obrigatório'),
    description: z.string().min(3, 'Descrição deve ter no mínimo 3 caracteres'),
    value: z.string().min(1, 'Valor é obrigatório'),
    dueDate: z.string().min(1, 'Data de vencimento é obrigatória'),
    method: z.string().optional(),
    notes: z.string().optional(),
});

export const parcelasSchema = z.object({
    projetoId: z.string().min(1, 'Projeto é obrigatório'),
    numeroParcelas: z.string().min(1, 'Número de parcelas é obrigatório'),
    primeiroVencimento: z.string().min(1, 'Data do primeiro vencimento é obrigatória'),
});

export const marcarPagoSchema = z.object({
    method: z.string().optional(),
    notes: z.string().optional(),
    receipt: z.string().optional(),
});

export type PagamentoInput = z.infer<typeof pagamentoSchema>;
export type ParcelasInput = z.infer<typeof parcelasSchema>;
export type MarcarPagoInput = z.infer<typeof marcarPagoSchema>;