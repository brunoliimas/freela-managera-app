import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';
import { swaggerSpec } from './swagger';

export function setupSwagger(app: Express) {
    app.use(
        '/api/docs',
        swaggerUi.serve,
        swaggerUi.setup(swaggerSpec, {
            customSiteTitle: 'Freela Manager API',
            customCss: '.swagger-ui .topbar { display: none }',
        })
    );

    app.get('/api/docs/json', (req, res) => {
        res.json(swaggerSpec);
    });
}
