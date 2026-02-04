import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import routes from './routes';
import { errorMiddleware } from './middlewares/error.middleware';
import { apiRateLimit } from './middlewares/rate-limit.middleware';
import path from 'path';
import { iniciarCronJobs } from './cron/jobs';

const app = express();
const PORT = process.env.PORT || 3001;

const allowedOrigins = (process.env.ALLOWED_ORIGINS || process.env.FRONTEND_URL || 'http://localhost:3000')
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
// Rate limiting geral
app.use('/api', apiRateLimit);
// Servir arquivos estáticos (uploads)
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));
// Routes
app.use('/api', routes);

// Error handling
app.use(errorMiddleware);

// Iniciar cron jobs
iniciarCronJobs();

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📚 API docs: http://localhost:${PORT}/api/health`);
});