import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    errorFormat: 'minimal',
});

// Silenciar avisos de deprecação do Prisma 7
if (process.env.NODE_ENV !== 'test') {
    const originalWarn = console.warn;
    console.warn = (...args: any[]) => {
        const warning = args[0];
        if (typeof warning === 'string' && warning.includes('datasource property')) {
            return; // Ignorar aviso de datasource do Prisma 7
        }
        originalWarn.apply(console, args);
    };
}

export default prisma;