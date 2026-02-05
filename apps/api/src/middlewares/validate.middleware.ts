import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

export const validate = (schema: z.ZodType) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const result = schema.safeParse(req.body);

        if (!result.success) {
            const errors = result.error.issues.map((issue) => ({
                campo: issue.path.join('.'),
                mensagem: issue.message,
            }));

            return res.status(400).json({
                error: 'Dados inválidos',
                details: errors,
            });
        }

        req.body = result.data;
        next();
    };
};
