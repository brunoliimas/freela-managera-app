import { Response } from 'express';
import { AuthRequest } from '../../middlewares/auth.middleware';

jest.mock('../../config/logger', () => ({
    __esModule: true,
    default: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

const mockPrismaTemplateFindMany = jest.fn();
const mockPrismaTemplateFindFirst = jest.fn();
const mockPrismaTemplateCreate = jest.fn();
const mockPrismaTemplateUpdate = jest.fn();
const mockPrismaTemplateDelete = jest.fn();

jest.mock('../../config/database', () => ({
    __esModule: true,
    default: {
        template: {
            findMany: mockPrismaTemplateFindMany,
            findFirst: mockPrismaTemplateFindFirst,
            create: mockPrismaTemplateCreate,
            update: mockPrismaTemplateUpdate,
            delete: mockPrismaTemplateDelete,
        },
    },
}));

import {
    getTemplates,
    getTemplate,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    duplicateTemplate,
} from '../../controllers/templates.controller';

describe('Templates Controller', () => {
    let mockRequest: Partial<AuthRequest>;
    let mockResponse: Partial<Response>;
    const userId = 'user-123';

    beforeEach(() => {
        mockRequest = {
            userId,
            query: {},
            params: {},
            body: {},
        };

        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };

        jest.clearAllMocks();
    });

    describe('getTemplates', () => {
        it('deve retornar lista de templates do usuário', async () => {
            const mockTemplates = [
                { id: '1', name: 'Template 1', type: 'PROPOSTA', userId },
                { id: '2', name: 'Template 2', type: 'CONTRATO', userId },
            ];

            mockPrismaTemplateFindMany.mockResolvedValue(mockTemplates);

            await getTemplates(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockPrismaTemplateFindMany).toHaveBeenCalledWith({
                where: { userId },
                orderBy: { updatedAt: 'desc' },
            });
            expect(mockResponse.json).toHaveBeenCalledWith(mockTemplates);
        });

        it('deve filtrar por tipo', async () => {
            mockRequest.query = { type: 'PROPOSTA' };
            mockPrismaTemplateFindMany.mockResolvedValue([]);

            await getTemplates(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockPrismaTemplateFindMany).toHaveBeenCalledWith({
                where: { userId, type: 'PROPOSTA' },
                orderBy: { updatedAt: 'desc' },
            });
        });

        it('deve filtrar por status ativo', async () => {
            mockRequest.query = { active: 'true' };
            mockPrismaTemplateFindMany.mockResolvedValue([]);

            await getTemplates(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockPrismaTemplateFindMany).toHaveBeenCalledWith({
                where: { userId, active: true },
                orderBy: { updatedAt: 'desc' },
            });
        });

        it('deve lidar com erro ao listar templates', async () => {
            mockPrismaTemplateFindMany.mockRejectedValue(new Error('Database error'));

            await getTemplates(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Erro ao listar templates',
            });
        });
    });

    describe('getTemplate', () => {
        it('deve retornar um template específico', async () => {
            const mockTemplate = { id: '1', name: 'Template 1', type: 'PROPOSTA', userId };
            mockRequest.params = { id: '1' };
            mockPrismaTemplateFindFirst.mockResolvedValue(mockTemplate);

            await getTemplate(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockPrismaTemplateFindFirst).toHaveBeenCalledWith({
                where: { id: '1', userId },
            });
            expect(mockResponse.json).toHaveBeenCalledWith(mockTemplate);
        });

        it('deve retornar 404 se template não encontrado', async () => {
            mockRequest.params = { id: 'not-found' };
            mockPrismaTemplateFindFirst.mockResolvedValue(null);

            await getTemplate(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Template não encontrado',
            });
        });

        it('deve lidar com erro ao buscar template', async () => {
            mockRequest.params = { id: '1' };
            mockPrismaTemplateFindFirst.mockRejectedValue(new Error('Database error'));

            await getTemplate(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Erro ao buscar template',
            });
        });
    });

    describe('createTemplate', () => {
        it('deve criar um novo template', async () => {
            mockRequest.body = {
                name: 'Novo Template',
                type: 'PROPOSTA',
                content: '<p>Conteúdo</p>',
                value: '1500.00',
            };

            const mockTemplate = {
                id: '1',
                name: 'Novo Template',
                type: 'PROPOSTA',
                content: '<p>Conteúdo</p>',
                value: 1500.0,
                userId,
            };

            mockPrismaTemplateCreate.mockResolvedValue(mockTemplate);

            await createTemplate(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockPrismaTemplateCreate).toHaveBeenCalledWith({
                data: {
                    name: 'Novo Template',
                    type: 'PROPOSTA',
                    content: '<p>Conteúdo</p>',
                    value: 1500.0,
                    userId,
                },
            });
            expect(mockResponse.status).toHaveBeenCalledWith(201);
            expect(mockResponse.json).toHaveBeenCalledWith(mockTemplate);
        });

        it('deve criar template sem valor', async () => {
            mockRequest.body = {
                name: 'Template Sem Valor',
                type: 'CONTRATO',
                content: '<p>Contrato</p>',
            };

            const mockTemplate = {
                id: '2',
                ...mockRequest.body,
                value: null,
                userId,
            };

            mockPrismaTemplateCreate.mockResolvedValue(mockTemplate);

            await createTemplate(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockPrismaTemplateCreate).toHaveBeenCalledWith({
                data: {
                    name: 'Template Sem Valor',
                    type: 'CONTRATO',
                    content: '<p>Contrato</p>',
                    value: null,
                    userId,
                },
            });
            expect(mockResponse.status).toHaveBeenCalledWith(201);
        });

        it('deve lidar com erro ao criar template', async () => {
            mockRequest.body = {
                name: 'Template',
                type: 'PROPOSTA',
                content: '<p>Test</p>',
            };

            mockPrismaTemplateCreate.mockRejectedValue(new Error('Database error'));

            await createTemplate(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Erro ao criar template',
            });
        });
    });

    describe('updateTemplate', () => {
        it('deve atualizar um template existente', async () => {
            mockRequest.params = { id: '1' };
            mockRequest.body = { name: 'Template Atualizado', active: false };

            mockPrismaTemplateFindFirst.mockResolvedValue({ id: '1', userId });
            const mockUpdated = { id: '1', name: 'Template Atualizado', active: false, userId };
            mockPrismaTemplateUpdate.mockResolvedValue(mockUpdated);

            await updateTemplate(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockPrismaTemplateFindFirst).toHaveBeenCalledWith({
                where: { id: '1', userId },
            });
            expect(mockPrismaTemplateUpdate).toHaveBeenCalledWith({
                where: { id: '1' },
                data: { name: 'Template Atualizado', active: false },
            });
            expect(mockResponse.json).toHaveBeenCalledWith(mockUpdated);
        });

        it('deve retornar 404 se template não encontrado', async () => {
            mockRequest.params = { id: 'not-found' };
            mockRequest.body = { name: 'Test' };
            mockPrismaTemplateFindFirst.mockResolvedValue(null);

            await updateTemplate(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Template não encontrado',
            });
        });

        it('deve lidar com erro ao atualizar template', async () => {
            mockRequest.params = { id: '1' };
            mockRequest.body = { name: 'Test' };

            mockPrismaTemplateFindFirst.mockResolvedValue({ id: '1', userId });
            mockPrismaTemplateUpdate.mockRejectedValue(new Error('Database error'));

            await updateTemplate(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Erro ao atualizar template',
            });
        });
    });

    describe('deleteTemplate', () => {
        it('deve excluir um template', async () => {
            mockRequest.params = { id: '1' };
            mockPrismaTemplateFindFirst.mockResolvedValue({ id: '1', userId });
            mockPrismaTemplateDelete.mockResolvedValue({ id: '1' });

            await deleteTemplate(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockPrismaTemplateDelete).toHaveBeenCalledWith({ where: { id: '1' } });
            expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Template excluído' });
        });

        it('deve retornar 404 se template não encontrado', async () => {
            mockRequest.params = { id: 'not-found' };
            mockPrismaTemplateFindFirst.mockResolvedValue(null);

            await deleteTemplate(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Template não encontrado',
            });
        });

        it('deve lidar com erro ao excluir template', async () => {
            mockRequest.params = { id: '1' };
            mockPrismaTemplateFindFirst.mockRejectedValue(new Error('Database error'));

            await deleteTemplate(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Erro ao excluir template',
            });
        });
    });

    describe('duplicateTemplate', () => {
        it('deve duplicar um template existente', async () => {
            mockRequest.params = { id: '1' };

            const existing = {
                id: '1',
                name: 'Template Original',
                type: 'PROPOSTA',
                content: '<p>Conteúdo</p>',
                value: 1500.0,
                userId,
            };

            const duplicated = {
                id: '2',
                name: 'Template Original (cópia)',
                type: 'PROPOSTA',
                content: '<p>Conteúdo</p>',
                value: 1500.0,
                userId,
            };

            mockPrismaTemplateFindFirst.mockResolvedValue(existing);
            mockPrismaTemplateCreate.mockResolvedValue(duplicated);

            await duplicateTemplate(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockPrismaTemplateCreate).toHaveBeenCalledWith({
                data: {
                    name: 'Template Original (cópia)',
                    type: 'PROPOSTA',
                    content: '<p>Conteúdo</p>',
                    value: 1500.0,
                    userId,
                },
            });
            expect(mockResponse.status).toHaveBeenCalledWith(201);
            expect(mockResponse.json).toHaveBeenCalledWith(duplicated);
        });

        it('deve retornar 404 se template original não encontrado', async () => {
            mockRequest.params = { id: 'not-found' };
            mockPrismaTemplateFindFirst.mockResolvedValue(null);

            await duplicateTemplate(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Template não encontrado',
            });
        });

        it('deve lidar com erro ao duplicar template', async () => {
            mockRequest.params = { id: '1' };
            mockPrismaTemplateFindFirst.mockRejectedValue(new Error('Database error'));

            await duplicateTemplate(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Erro ao duplicar template',
            });
        });
    });
});
