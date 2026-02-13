import { Response, NextFunction } from 'express';
import type { Plan } from '@prisma/client';
import prisma from '../config/database';
import { AuthRequest } from './auth.middleware';

const PLAN_HIERARCHY: Record<Plan, number> = {
    FREE: 0,
    PRO: 1,
    ENTERPRISE: 2,
};

/**
 * Middleware que verifica se o usuário tem o plano mínimo necessário.
 * Deve ser usado DEPOIS do authMiddleware.
 */
export const requirePlan = (minimumPlan: Plan) => {
    return async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const user = await prisma.user.findUnique({
                where: { id: req.userId! },
                select: { plan: true },
            });

            if (!user) {
                return res.status(401).json({ error: 'Usuário não encontrado' });
            }

            if (PLAN_HIERARCHY[user.plan] < PLAN_HIERARCHY[minimumPlan]) {
                return res.status(403).json({
                    error: `Esta funcionalidade requer o plano ${minimumPlan} ou superior`,
                    requiredPlan: minimumPlan,
                    currentPlan: user.plan,
                });
            }

            next();
        } catch {
            return res.status(500).json({ error: 'Erro ao verificar plano' });
        }
    };
};
