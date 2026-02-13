import jwt, { SignOptions, Secret } from 'jsonwebtoken';
import { env } from '../config/env';

const JWT_SECRET: Secret = env.JWT_SECRET;
const JWT_EXPIRES_IN: number = env.JWT_EXPIRES_IN;

export interface JwtPayload {
    userId: string;
    email: string;
    twoFactorVerified?: boolean;
}

export interface TempTokenPayload {
    userId: string;
    pending2FA: true;
}

export const generateToken = (payload: JwtPayload): string => {
    const options: SignOptions = { expiresIn: JWT_EXPIRES_IN };
    return jwt.sign(payload, JWT_SECRET, options);
};

export const generateTempToken = (payload: TempTokenPayload): string => {
    const options: SignOptions = { expiresIn: 300 }; // 5 minutes
    return jwt.sign(payload, JWT_SECRET, options);
};

export const verifyToken = (token: string): JwtPayload => {
    try {
        return jwt.verify(token, JWT_SECRET) as JwtPayload;
    } catch {
        throw new Error('Token inválido ou expirado');
    }
};

export const verifyTempToken = (token: string): TempTokenPayload => {
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as TempTokenPayload;
        if (!decoded.pending2FA) {
            throw new Error('Token não é um token 2FA temporário');
        }
        return decoded;
    } catch {
        throw new Error('Token temporário inválido ou expirado');
    }
};
