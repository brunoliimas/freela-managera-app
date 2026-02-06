import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';

export interface ClientAuthRequest extends Request {
    clienteId?: string;
    clienteEmail?: string;
}

export const clientAuthMiddleware = (
    req: ClientAuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const token = req.cookies?.client_token;

        if (!token) {
            return res.status(401).json({ error: 'Token não fornecido' });
        }

        const decoded = verifyToken(token);

        req.clienteId = decoded.userId;
        req.clienteEmail = decoded.email;

        next();
    } catch {
        return res.status(401).json({ error: 'Token inválido ou expirado' });
    }
};
