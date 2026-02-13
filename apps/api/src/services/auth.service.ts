import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import prisma from '../config/database';
import { generateToken } from '../utils/jwt';
import { sendEmail } from '../config/email';
import { templateRecuperacaoSenha } from '../templates/email-templates';
import { AppError } from '../utils/errors';
import { generateUniqueSlug } from '../utils/slugify';
import { env } from '../config/env';
import { BillingService } from './billing.service';

const USER_SELECT = {
    id: true,
    name: true,
    email: true,
    phone: true,
    company: true,
    slug: true,
    plan: true,
    createdAt: true,
};

const PROFILE_SELECT = {
    ...USER_SELECT,
    bio: true,
    avatar: true,
    cpf: true,
    cnpj: true,
    stripeAccountStatus: true,
    subscriptionStatus: true,
    currentPeriodEnd: true,
    // Dados fiscais
    enotasEmpresaId: true,
    cnae: true,
    issAliquota: true,
    inscricaoMunicipal: true,
    regimeTributario: true,
    codigoServico: true,
};

interface RegisterInput {
    name: string;
    email: string;
    password: string;
    phone?: string;
    company?: string;
}

interface LoginResult {
    user: Record<string, unknown>;
    token: string;
}

interface RegisterResult {
    user: Record<string, unknown>;
    token: string;
}

export class AuthService {
    static async register(input: RegisterInput): Promise<RegisterResult> {
        const { name, email, password, phone, company } = input;

        const userExists = await prisma.user.findUnique({
            where: { email },
        });

        if (userExists) {
            throw new AppError('Email já cadastrado', 400);
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const slug = await generateUniqueSlug(name);

        const user = await prisma.user.create({
            data: { name, email, password: hashedPassword, phone, company, slug },
            select: USER_SELECT,
        });

        const token = generateToken({ userId: user.id, email: user.email });

        // Criar Stripe Customer async (não bloqueia registro)
        BillingService.ensureCustomer(user.id).catch(() => {});

        return { user, token };
    }

    static async login(email: string, password: string): Promise<LoginResult> {
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            throw new AppError('Email ou senha incorretos', 401);
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            throw new AppError('Email ou senha incorretos', 401);
        }

        const token = generateToken({ userId: user.id, email: user.email });
        const { password: _, ...userWithoutPassword } = user;

        return { user: userWithoutPassword, token };
    }

    static async forgotPassword(email: string): Promise<void> {
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) return;

        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
        const resetExpires = new Date(Date.now() + 60 * 60 * 1000);

        await prisma.user.update({
            where: { id: user.id },
            data: {
                resetPasswordToken: resetTokenHash,
                resetPasswordExpires: resetExpires,
            },
        });

        const frontendUrl = env.FRONTEND_URL;
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
    }

    static async resetPassword(token: string, password: string): Promise<void> {
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

        const user = await prisma.user.findFirst({
            where: {
                resetPasswordToken: tokenHash,
                resetPasswordExpires: { gt: new Date() },
            },
        });

        if (!user) {
            throw new AppError('Token inválido ou expirado. Solicite uma nova recuperação de senha.', 400);
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                resetPasswordToken: null,
                resetPasswordExpires: null,
            },
        });
    }

    static async getProfile(userId: string) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: PROFILE_SELECT,
        });

        if (!user) {
            throw new AppError('Usuário não encontrado', 404);
        }

        return user;
    }

    static async updateProfile(userId: string, data: { name?: string; phone?: string; company?: string; bio?: string; cpf?: string; cnpj?: string; slug?: string }) {
        if (data.slug) {
            const existing = await prisma.user.findUnique({ where: { slug: data.slug } });
            if (existing && existing.id !== userId) {
                throw new AppError('Este slug já está em uso', 400);
            }
        }

        return prisma.user.update({
            where: { id: userId },
            data,
            select: PROFILE_SELECT,
        });
    }

    static async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            throw new AppError('Usuário não encontrado', 404);
        }

        const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

        if (!isPasswordValid) {
            throw new AppError('Senha atual incorreta', 400);
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await prisma.user.update({
            where: { id: userId },
            data: { password: hashedPassword },
        });
    }
}
