import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import logger from '../config/logger';

export const errorMiddleware = (
    error: Error,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    logger.error({ err: error }, 'Unhandled error');

    if (error instanceof AppError) {
        return res.status(error.statusCode).json({
            error: error.message,
        });
    }

    if (error.name === 'ValidationError') {
        return res.status(400).json({
            error: 'Dados inválidos',
            details: error.message,
        });
    }

    if (error.name === 'PrismaClientKnownRequestError') {
        return res.status(400).json({
            error: 'Erro no banco de dados',
            details: error.message,
        });
    }

    return res.status(500).json({
        error: 'Erro interno do servidor',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
};