import 'dotenv/config';
import { env } from './config/env';
import logger from './config/logger';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import routes from './routes';
import { errorMiddleware } from './middlewares/error.middleware';
import { apiRateLimit } from './middlewares/rate-limit.middleware';
import path from 'path';
import { iniciarCronJobs } from './cron/jobs';
import { setupSwagger } from './docs/setupSwagger';

const app = express();

const allowedOrigins = (env.ALLOWED_ORIGINS || env.FRONTEND_URL)
    .split(',')
    .map((origin) => origin.trim());

// Middlewares
app.use(cors({
    origin: (origin, callback) => {
        // Permitir requests sem origin (ex: mobile apps, curl, Postman)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        return callback(new Error(`Origin ${origin} não permitida pelo CORS`));
    },
    credentials: true,
}));
app.use(cookieParser());
app.use(express.json());
// Swagger docs (fora do versionamento)
setupSwagger(app);
// Health check (fora do versionamento)
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'API is running!',
        timestamp: new Date().toISOString(),
    });
});
// Rate limiting geral
app.use('/api/v1', apiRateLimit);
// Servir arquivos estáticos (uploads)
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));
// Routes
app.use('/api/v1', routes);

// Error handling
app.use(errorMiddleware);

// Iniciar cron jobs
iniciarCronJobs();

// Iniciar servidor
app.listen(env.PORT, () => {
    logger.info(`Server running on http://localhost:${env.PORT}`);
});
