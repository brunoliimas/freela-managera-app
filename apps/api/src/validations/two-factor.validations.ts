import { z } from 'zod';

export const enable2FASchema = z.object({
    secret: z.string().min(1, 'Secret é obrigatório'),
    token: z.string().length(6, 'Código deve ter 6 dígitos'),
});

export const verify2FASchema = z.object({
    tempToken: z.string().min(1, 'Token temporário é obrigatório'),
    token: z.string().length(6, 'Código deve ter 6 dígitos'),
});

export const verifyRecoverySchema = z.object({
    tempToken: z.string().min(1, 'Token temporário é obrigatório'),
    recoveryCode: z.string().min(1, 'Código de recuperação é obrigatório'),
});

export const disable2FASchema = z.object({
    password: z.string().min(1, 'Senha é obrigatória'),
});
