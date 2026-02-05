import { z } from 'zod';

const envSchema = z.object({
    // Servidor
    PORT: z.coerce.number().default(3001),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

    // Banco de dados
    DATABASE_URL: z.string().min(1, 'DATABASE_URL é obrigatória'),

    // JWT
    JWT_SECRET: z.string().min(32, 'JWT_SECRET deve ter no mínimo 32 caracteres'),
    JWT_EXPIRES_IN: z.coerce.number().default(86400),

    // CORS / Frontend
    FRONTEND_URL: z.string().default('http://localhost:3000'),
    ALLOWED_ORIGINS: z.string().optional(),

    // Email (SMTP)
    SMTP_HOST: z.string().default('smtp.gmail.com'),
    SMTP_PORT: z.coerce.number().default(587),
    SMTP_USER: z.string().optional(),
    SMTP_PASS: z.string().optional(),
    SMTP_FROM: z.string().optional(),

    // App
    APP_NAME: z.string().default('FreelanceManager'),
    APP_URL: z.string().default('http://localhost:3000'),
});

export type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
    const result = envSchema.safeParse(process.env);

    if (!result.success) {
        const errors = result.error.issues.map(
            (issue) => `  - ${issue.path.join('.')}: ${issue.message}`
        );

        console.error('Erro na validação das variáveis de ambiente:');
        console.error(errors.join('\n'));
        process.exit(1);
    }

    return result.data;
}

export const env = validateEnv();
