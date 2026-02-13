import rateLimit from 'express-rate-limit';

// Rate limit para rotas de autenticação (login/register)
// Mais restritivo: 10 tentativas por IP a cada 15 minutos
export const authRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    limit: 10,
    message: {
        error: 'Muitas tentativas. Tente novamente em 15 minutos.',
    },
    standardHeaders: 'draft-7',
    legacyHeaders: false,
});

// Rate limit geral para a API
export const apiRateLimit = rateLimit({
    windowMs: 60 * 1000, // 1 minuto
    limit: process.env.NODE_ENV === 'production' ? 100 : 500,
    message: {
        error: 'Limite de requisições excedido. Tente novamente em instantes.',
    },
    standardHeaders: 'draft-7',
    legacyHeaders: false,
});
