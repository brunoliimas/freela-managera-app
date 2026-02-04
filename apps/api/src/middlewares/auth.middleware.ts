import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';

export interface AuthRequest extends Request {
    userId?: string;
    userEmail?: string;
}

export const authMiddleware = (
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

        next();
    } catch (error) {
        return res.status(401).json({ error: 'Token inválido ou expirado' });
    }
};