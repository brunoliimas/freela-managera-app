import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import prisma from '../config/database';

export interface AuthRequest extends Request {
    userId?: string;
    userEmail?: string;
}

export const authMiddleware = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        // 1. Tentar ler token do cookie httpOnly (preferencial)
        let token = req.cookies?.token;

        // 2. Fallback para Authorization header (compatibilidade com mobile/API clients)
        if (!token) {
            const authHeader = req.headers.authorization;
            if (authHeader) {
                const [scheme, headerToken] = authHeader.split(' ');
                if (scheme === 'Bearer' && headerToken) {
                    token = headerToken;
                }
            }
        }

        if (!token) {
            return res.status(401).json({ error: 'Token não fornecido' });
        }

        const decoded = verifyToken(token);

        req.userId = decoded.userId;
        req.userEmail = decoded.email;

        // Check 2FA enforcement
        if (!decoded.twoFactorVerified) {
            const user = await prisma.user.findUnique({
                where: { id: decoded.userId },
                select: { twoFactorEnabled: true },
            });

            if (user?.twoFactorEnabled) {
                return res.status(403).json({
                    error: 'Verificação 2FA necessária',
                    requires2FA: true,
                });
            }
        }

        next();
    } catch {
        return res.status(401).json({ error: 'Token inválido ou expirado' });
    }
};
