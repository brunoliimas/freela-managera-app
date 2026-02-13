import { generateSecret, generateURI, verifySync } from 'otplib';
import QRCode from 'qrcode';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import prisma from '../config/database';
import { AppError } from '../utils/errors';
import { env } from '../config/env';

export class TwoFactorService {
    static async generateSetup(userId: string) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { email: true, twoFactorEnabled: true },
        });

        if (!user) throw new AppError('Usuário não encontrado', 404);
        if (user.twoFactorEnabled) throw new AppError('2FA já está habilitado', 400);

        const secret = generateSecret();
        const otpauthUrl = generateURI({
            issuer: env.APP_NAME,
            label: user.email,
            secret,
        });
        const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);

        return { secret, qrCodeDataUrl, otpauthUrl };
    }

    static async enable(userId: string, secret: string, token: string) {
        const result = verifySync({ token, secret });
        if (!result.valid) throw new AppError('Código inválido. Tente novamente.', 400);

        const recoveryCodes = Array.from({ length: 10 }, () =>
            crypto.randomBytes(4).toString('hex')
        );

        const hashedCodes = await Promise.all(
            recoveryCodes.map((code) => bcrypt.hash(code, 10))
        );

        await prisma.user.update({
            where: { id: userId },
            data: {
                twoFactorEnabled: true,
                twoFactorSecret: secret,
                twoFactorRecoveryCodes: hashedCodes,
            },
        });

        return { recoveryCodes };
    }

    static async verifyToken(userId: string, token: string): Promise<boolean> {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { twoFactorSecret: true, twoFactorEnabled: true },
        });

        if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
            throw new AppError('2FA não está habilitado', 400);
        }

        const result = verifySync({ token, secret: user.twoFactorSecret });
        return result.valid;
    }

    static async verifyRecoveryCode(userId: string, code: string): Promise<boolean> {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { twoFactorRecoveryCodes: true, twoFactorEnabled: true },
        });

        if (!user || !user.twoFactorEnabled) {
            throw new AppError('2FA não está habilitado', 400);
        }

        for (let i = 0; i < user.twoFactorRecoveryCodes.length; i++) {
            const isMatch = await bcrypt.compare(code, user.twoFactorRecoveryCodes[i]);
            if (isMatch) {
                const updatedCodes = [...user.twoFactorRecoveryCodes];
                updatedCodes.splice(i, 1);
                await prisma.user.update({
                    where: { id: userId },
                    data: { twoFactorRecoveryCodes: updatedCodes },
                });
                return true;
            }
        }

        return false;
    }

    static async disable(userId: string): Promise<void> {
        await prisma.user.update({
            where: { id: userId },
            data: {
                twoFactorEnabled: false,
                twoFactorSecret: null,
                twoFactorRecoveryCodes: [],
            },
        });
    }
}
