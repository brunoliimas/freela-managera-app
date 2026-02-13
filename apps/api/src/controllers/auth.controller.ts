import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { AuthService } from '../services/auth.service';
import { setTokenCookie, clearTokenCookie } from '../utils/cookie';
import { AppError } from '../utils/errors';
import logger from '../config/logger';
import prisma from '../config/database';

export const register = async (req: Request, res: Response) => {
    try {
        // Validação básica (fallback - middleware Zod valida na rota)
        if (!req.body.name || !req.body.email || !req.body.password) {
            return res.status(400).json({
                error: 'Nome, email e senha são obrigatórios',
            });
        }

        const { user, token } = await AuthService.register(req.body);
        setTokenCookie(res, token);

        return res.status(201).json({
            message: 'Usuário criado com sucesso',
            user,
        });
    } catch (error) {
        if (error instanceof AppError) {
            return res.status(error.statusCode).json({ error: error.message });
        }
        logger.error({ err: error }, 'Register error');
        return res.status(500).json({
            error: 'Erro ao criar usuário',
        });
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        // Validação básica (fallback - middleware Zod valida na rota)
        if (!req.body.email || !req.body.password) {
            return res.status(400).json({
                error: 'Email e senha são obrigatórios',
            });
        }

        const result = await AuthService.login(req.body.email, req.body.password);

        if (result.requires2FA) {
            return res.json({
                requires2FA: true,
                tempToken: result.tempToken,
                message: 'Verificação 2FA necessária',
            });
        }

        setTokenCookie(res, result.token!);

        return res.json({
            message: 'Login realizado com sucesso',
            user: result.user,
        });
    } catch (error) {
        if (error instanceof AppError) {
            return res.status(error.statusCode).json({ error: error.message });
        }
        logger.error({ err: error }, 'Login error');
        return res.status(500).json({
            error: 'Erro ao fazer login',
        });
    }
};

export const getProfile = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const user = await AuthService.getProfile(userId);
        return res.json(user);
    } catch (error) {
        if (error instanceof AppError) {
            return res.status(error.statusCode).json({ error: error.message });
        }
        logger.error({ err: error }, 'Get profile error');
        return res.status(500).json({
            error: 'Erro ao buscar perfil',
        });
    }
};

export const logout = (_req: Request, res: Response) => {
    clearTokenCookie(res);
    return res.json({ message: 'Logout realizado com sucesso' });
};

export const forgotPassword = async (req: Request, res: Response) => {
    try {
        // Validação básica (fallback - middleware Zod valida na rota)
        if (!req.body.email) {
            return res.status(400).json({
                error: 'Email é obrigatório',
            });
        }

        const successMessage = 'Se o email estiver cadastrado, você receberá um link para redefinir sua senha.';

        await AuthService.forgotPassword(req.body.email);

        return res.json({ message: successMessage });
    } catch (error) {
        logger.error({ err: error }, 'Forgot password error');
        return res.status(500).json({
            error: 'Erro ao processar solicitação de recuperação de senha',
        });
    }
};

export const resetPassword = async (req: Request, res: Response) => {
    try {
        // Validação básica (fallback - middleware Zod valida na rota)
        if (!req.body.token || !req.body.password) {
            return res.status(400).json({
                error: 'Token e nova senha são obrigatórios',
            });
        }

        if (req.body.password.length < 6) {
            return res.status(400).json({
                error: 'A senha deve ter no mínimo 6 caracteres',
            });
        }

        await AuthService.resetPassword(req.body.token, req.body.password);

        return res.json({
            message: 'Senha redefinida com sucesso. Faça login com sua nova senha.',
        });
    } catch (error) {
        if (error instanceof AppError) {
            return res.status(error.statusCode).json({ error: error.message });
        }
        logger.error({ err: error }, 'Reset password error');
        return res.status(500).json({
            error: 'Erro ao redefinir senha',
        });
    }
};

export const updateProfile = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const { name, phone, company, bio, cpf, cnpj } = req.body;

        const user = await AuthService.updateProfile(userId, { name, phone, company, bio, cpf, cnpj });

        return res.json({
            message: 'Perfil atualizado com sucesso',
            user,
        });
    } catch (error) {
        if (error instanceof AppError) {
            return res.status(error.statusCode).json({ error: error.message });
        }
        logger.error({ err: error }, 'Update profile error');
        return res.status(500).json({
            error: 'Erro ao atualizar perfil',
        });
    }
};

export const changePassword = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const { currentPassword, newPassword } = req.body;

        await AuthService.changePassword(userId, currentPassword, newPassword);

        return res.json({
            message: 'Senha alterada com sucesso',
        });
    } catch (error) {
        if (error instanceof AppError) {
            return res.status(error.statusCode).json({ error: error.message });
        }
        logger.error({ err: error }, 'Change password error');
        return res.status(500).json({
            error: 'Erro ao alterar senha',
        });
    }
};

export const uploadAvatar = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const file = req.file;

        if (!file) {
            return res.status(400).json({ error: 'Arquivo é obrigatório' });
        }

        // Buscar avatar atual para cleanup
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { avatar: true },
        });

        // Deletar avatar anterior
        if (user?.avatar) {
            const oldPath = path.join(__dirname, '..', '..', user.avatar);
            if (fs.existsSync(oldPath)) {
                fs.unlinkSync(oldPath);
            }
        }

        const avatarUrl = `/uploads/${file.filename}`;

        const updated = await prisma.user.update({
            where: { id: userId },
            data: { avatar: avatarUrl },
            select: { id: true, avatar: true },
        });

        return res.json({
            message: 'Avatar atualizado com sucesso',
            avatar: updated.avatar,
        });
    } catch (error) {
        logger.error({ err: error }, 'Upload avatar error');
        return res.status(500).json({
            error: 'Erro ao atualizar avatar',
        });
    }
};
