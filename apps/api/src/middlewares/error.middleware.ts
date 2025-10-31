import { Request, Response, NextFunction } from 'express';

export const errorMiddleware = (
    error: Error,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    console.error('Error:', error);

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