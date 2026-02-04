import jwt, { SignOptions, Secret } from 'jsonwebtoken';

const getJwtSecret = (): Secret => {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error(
            'JWT_SECRET não está definido. Configure a variável de ambiente JWT_SECRET antes de iniciar o servidor.'
        );
    }
    return secret;
};

const JWT_SECRET: Secret = getJwtSecret();
const JWT_EXPIRES_IN: number = Number(process.env.JWT_EXPIRES_IN) || 60 * 60 * 24; // 1 dia

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
