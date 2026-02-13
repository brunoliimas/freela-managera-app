import type { Plan } from '@prisma/client';

export interface PlanLimits {
    maxClientes: number;
    maxProjetos: number;
    pagamentoOnline: boolean;
    relatorios: boolean;
}

export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
    FREE: {
        maxClientes: 3,
        maxProjetos: 5,
        pagamentoOnline: false,
        relatorios: false,
    },
    PRO: {
        maxClientes: Infinity,
        maxProjetos: Infinity,
        pagamentoOnline: true,
        relatorios: true,
    },
    ENTERPRISE: {
        maxClientes: Infinity,
        maxProjetos: Infinity,
        pagamentoOnline: true,
        relatorios: true,
    },
};
