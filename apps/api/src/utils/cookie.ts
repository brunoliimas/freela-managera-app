import { Response, CookieOptions } from 'express';

const isProduction = process.env.NODE_ENV === 'production';

const COOKIE_OPTIONS: CookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    maxAge: Number(process.env.JWT_EXPIRES_IN || 86400) * 1000, // converter segundos para ms
    path: '/',
};

export const setTokenCookie = (res: Response, token: string): void => {
    res.cookie('token', token, COOKIE_OPTIONS);
};

export const clearTokenCookie = (res: Response): void => {
    res.clearCookie('token', {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'strict' : 'lax',
        path: '/',
    });
};
