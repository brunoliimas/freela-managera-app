import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../config/database';
import { generateToken } from '../utils/jwt';

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

        return res.status(201).json({
            message: 'Usuário criado com sucesso',
            user,
            token,
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

        return res.json({
            message: 'Login realizado com sucesso',
            user: userWithoutPassword,
            token,
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