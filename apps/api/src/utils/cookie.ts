import { Response, CookieOptions } from 'express';
import { env } from '../config/env';

const isProduction = env.NODE_ENV === 'production';

const COOKIE_OPTIONS: CookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    maxAge: env.JWT_EXPIRES_IN * 1000,
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

export const setClientCookie = (res: Response, token: string): void => {
    res.cookie('client_token', token, COOKIE_OPTIONS);
};

export const clearClientCookie = (res: Response): void => {
    res.clearCookie('client_token', {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'strict' : 'lax',
        path: '/',
    });
};
