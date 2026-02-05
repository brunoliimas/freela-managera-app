import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { setTokenCookie, clearTokenCookie } from '../utils/cookie';
import { AppError } from '../utils/errors';
import logger from '../config/logger';

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

        const { user, token } = await AuthService.login(req.body.email, req.body.password);
        setTokenCookie(res, token);

        return res.json({
            message: 'Login realizado com sucesso',
            user,
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
