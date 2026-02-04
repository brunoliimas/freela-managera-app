import { Request, Response } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import prisma from '../config/database';
import { generateToken } from '../utils/jwt';
import { setTokenCookie, clearTokenCookie } from '../utils/cookie';
import { sendEmail } from '../config/email';
import { templateRecuperacaoSenha } from '../templates/email-templates';

export const register = async (req: Request, res: Response) => {
    try {
        const { name, email, password, phone, company } = req.body;

        // Validação básica
        if (!name || !email || !password) {
            return res.status(400).json({
                error: 'Nome, email e senha são obrigatórios',
            });
        }

        // Verificar se usuário já existe
        const userExists = await prisma.user.findUnique({
            where: { email },
        });

        if (userExists) {
            return res.status(400).json({
                error: 'Email já cadastrado',
            });
        }

        // Hash da senha
        const hashedPassword = await bcrypt.hash(password, 10);

        // Criar usuário
        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                phone,
                company,
            },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                company: true,
                plan: true,
                createdAt: true,
            },
        });

        // Gerar token
        const token = generateToken({
            userId: user.id,
            email: user.email,
        });

        setTokenCookie(res, token);

        return res.status(201).json({
            message: 'Usuário criado com sucesso',
            user,
        });
    } catch (error) {
        console.error('Register error:', error);
        return res.status(500).json({
            error: 'Erro ao criar usuário',
        });
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        // Validação básica
        if (!email || !password) {
            return res.status(400).json({
                error: 'Email e senha são obrigatórios',
            });
        }

        // Buscar usuário
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            return res.status(401).json({
                error: 'Email ou senha incorretos',
            });
        }

        // Verificar senha
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({
                error: 'Email ou senha incorretos',
            });
        }

        // Gerar token
        const token = generateToken({
            userId: user.id,
            email: user.email,
        });

        // Retornar dados do usuário (sem senha)
        const { password: _, ...userWithoutPassword } = user;

        setTokenCookie(res, token);

        return res.json({
            message: 'Login realizado com sucesso',
            user: userWithoutPassword,
        });
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({
            error: 'Erro ao fazer login',
        });
    }
};

export const getProfile = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                company: true,
                bio: true,
                avatar: true,
                plan: true,
                createdAt: true,
            },
        });

        if (!user) {
            return res.status(404).json({
                error: 'Usuário não encontrado',
            });
        }

        return res.json(user);
    } catch (error) {
        console.error('Get profile error:', error);
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
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                error: 'Email é obrigatório',
            });
        }

        // Resposta genérica para não vazar se o email existe
        const successMessage = 'Se o email estiver cadastrado, você receberá um link para redefinir sua senha.';

        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            return res.json({ message: successMessage });
        }

        // Gerar token de reset
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
        const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

        // Salvar hash do token no banco
        await prisma.user.update({
            where: { id: user.id },
            data: {
                resetPasswordToken: resetTokenHash,
                resetPasswordExpires: resetExpires,
            },
        });

        // Enviar email
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

        const html = templateRecuperacaoSenha({
            nome: user.name,
            resetUrl,
        });

        await sendEmail({
            to: user.email,
            subject: 'Recuperação de Senha - FreelanceManager',
            html,
        });

        return res.json({ message: successMessage });
    } catch (error) {
        console.error('Forgot password error:', error);
        return res.status(500).json({
            error: 'Erro ao processar solicitação de recuperação de senha',
        });
    }
};

export const resetPassword = async (req: Request, res: Response) => {
    try {
        const { token, password } = req.body;

        if (!token || !password) {
            return res.status(400).json({
                error: 'Token e nova senha são obrigatórios',
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                error: 'A senha deve ter no mínimo 6 caracteres',
            });
        }

        // Hash do token recebido para comparar com o armazenado
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

        const user = await prisma.user.findFirst({
            where: {
                resetPasswordToken: tokenHash,
                resetPasswordExpires: {
                    gt: new Date(),
                },
            },
        });

        if (!user) {
            return res.status(400).json({
                error: 'Token inválido ou expirado. Solicite uma nova recuperação de senha.',
            });
        }

        // Hash da nova senha
        const hashedPassword = await bcrypt.hash(password, 10);

        // Atualizar senha e limpar campos de reset
        await prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                resetPasswordToken: null,
                resetPasswordExpires: null,
            },
        });

        return res.json({
            message: 'Senha redefinida com sucesso. Faça login com sua nova senha.',
        });
    } catch (error) {
        console.error('Reset password error:', error);
        return res.status(500).json({
            error: 'Erro ao redefinir senha',
        });
    }
};

export const updateProfile = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).userId;
        const { name, phone, company, bio } = req.body;

        const user = await prisma.user.update({
            where: { id: userId },
            data: {
                name,
                phone,
                company,
                bio,
            },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                company: true,
                bio: true,
                avatar: true,
                plan: true,
                createdAt: true,
            },
        });

        return res.json({
            message: 'Perfil atualizado com sucesso',
            user,
        });
    } catch (error) {
        console.error('Update profile error:', error);
        return res.status(500).json({
            error: 'Erro ao atualizar perfil',
        });
    }
};