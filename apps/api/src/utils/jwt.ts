import jwt, { SignOptions, Secret } from 'jsonwebtoken';
import { env } from '../config/env';

const JWT_SECRET: Secret = env.JWT_SECRET;
const JWT_EXPIRES_IN: number = env.JWT_EXPIRES_IN;

export interface JwtPayload {
    userId: string;
    email: string;
}

export const generateToken = (payload: JwtPayload): string => {
    const options: SignOptions = { expiresIn: JWT_EXPIRES_IN };
    return jwt.sign(payload, JWT_SECRET, options);
};

export const verifyToken = (token: string): JwtPayload => {
    try {
        return jwt.verify(token, JWT_SECRET) as JwtPayload;
    } catch {
        throw new Error('Token inválido ou expirado');
    }
};
