import { Response } from 'express';
import { TwoFactorService } from '../services/two-factor.service';
import { generateToken, verifyTempToken } from '../utils/jwt';
import { setTokenCookie } from '../utils/cookie';
import { AppError } from '../utils/errors';
import logger from '../config/logger';
import prisma from '../config/database';
import bcrypt from 'bcryptjs';
import { AuthRequest } from '../middlewares/auth.middleware';

export const setup2FA = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId!;
        const result = await TwoFactorService.generateSetup(userId);
        return res.json(result);
    } catch (error) {
        if (error instanceof AppError) {
            return res.status(error.statusCode).json({ error: error.message });
        }
        logger.error({ err: error }, '2FA setup error');
        return res.status(500).json({ error: 'Erro ao configurar 2FA' });
    }
};

export const enable2FA = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId!;
        const { secret, token } = req.body;

        const result = await TwoFactorService.enable(userId, secret, token);

        return res.json({
            message: '2FA habilitado com sucesso',
            recoveryCodes: result.recoveryCodes,
        });
    } catch (error) {
        if (error instanceof AppError) {
            return res.status(error.statusCode).json({ error: error.message });
        }
        logger.error({ err: error }, '2FA enable error');
        return res.status(500).json({ error: 'Erro ao habilitar 2FA' });
    }
};

export const verify2FA = async (req: AuthRequest, res: Response) => {
    try {
        const { tempToken, token } = req.body;

        const decoded = verifyTempToken(tempToken);
        const isValid = await TwoFactorService.verifyToken(decoded.userId, token);

        if (!isValid) {
            return res.status(400).json({ error: 'Código inválido' });
        }

        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
        });

        if (!user) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        const fullToken = generateToken({
            userId: user.id,
            email: user.email,
            twoFactorVerified: true,
        });
        setTokenCookie(res, fullToken);

        const { password: _, twoFactorSecret: _s, twoFactorRecoveryCodes: _r, ...safeUser } = user;

        return res.json({
            message: 'Verificação 2FA realizada com sucesso',
            user: safeUser,
        });
    } catch (error) {
        if (error instanceof AppError) {
            return res.status(error.statusCode).json({ error: error.message });
        }
        logger.error({ err: error }, '2FA verify error');
        return res.status(500).json({ error: 'Erro ao verificar 2FA' });
    }
};

export const verifyRecoveryCode = async (req: AuthRequest, res: Response) => {
    try {
        const { tempToken, recoveryCode } = req.body;

        const decoded = verifyTempToken(tempToken);
        const isValid = await TwoFactorService.verifyRecoveryCode(decoded.userId, recoveryCode);

        if (!isValid) {
            return res.status(400).json({ error: 'Código de recuperação inválido' });
        }

        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
        });

        if (!user) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        const fullToken = generateToken({
            userId: user.id,
            email: user.email,
            twoFactorVerified: true,
        });
        setTokenCookie(res, fullToken);

        const { password: _, twoFactorSecret: _s, twoFactorRecoveryCodes: _r, ...safeUser } = user;

        return res.json({
            message: 'Verificação por código de recuperação realizada',
            user: safeUser,
            remainingRecoveryCodes: user.twoFactorRecoveryCodes.length - 1,
        });
    } catch (error) {
        if (error instanceof AppError) {
            return res.status(error.statusCode).json({ error: error.message });
        }
        logger.error({ err: error }, '2FA recovery verify error');
        return res.status(500).json({ error: 'Erro ao verificar código de recuperação' });
    }
};

export const disable2FA = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId!;
        const { password } = req.body;

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { password: true },
        });

        if (!user) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ error: 'Senha incorreta' });
        }

        await TwoFactorService.disable(userId);

        return res.json({ message: '2FA desabilitado com sucesso' });
    } catch (error) {
        if (error instanceof AppError) {
            return res.status(error.statusCode).json({ error: error.message });
        }
        logger.error({ err: error }, '2FA disable error');
        return res.status(500).json({ error: 'Erro ao desabilitar 2FA' });
    }
};
