import { z } from 'zod';

export const registerSchema = z.object({
    name: z.string().min(1, 'Nome é obrigatório'),
    email: z.string().email('Email inválido'),
    password: z.string().min(1, 'Senha é obrigatória'),
    phone: z.string().optional(),
    company: z.string().optional(),
});

export const loginSchema = z.object({
    email: z.string().email('Email inválido'),
    password: z.string().min(1, 'Senha é obrigatória'),
});

export const forgotPasswordSchema = z.object({
    email: z.string().email('Email inválido'),
});

export const resetPasswordSchema = z.object({
    token: z.string().min(1, 'Token é obrigatório'),
    password: z.string().min(6, 'A senha deve ter no mínimo 6 caracteres'),
});

export const changePasswordSchema = z.object({
    currentPassword: z.string().min(1, 'Senha atual é obrigatória'),
    newPassword: z.string().min(6, 'A nova senha deve ter no mínimo 6 caracteres'),
});

export const updateProfileSchema = z.object({
    name: z.string().min(1, 'Nome é obrigatório').optional(),
    phone: z.string().optional(),
    company: z.string().optional(),
    bio: z.string().optional(),
    cpf: z.string().optional(),
    cnpj: z.string().optional(),
});
