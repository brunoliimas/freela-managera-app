import { Response } from 'express';
import { AuthRequest } from '../../middlewares/auth.middleware';

jest.mock('../../config/logger', () => ({
    __esModule: true,
    default: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

const mockPrismaProjetoFindFirst = jest.fn();
const mockPrismaComentarioFindMany = jest.fn();
const mockPrismaComentarioFindFirst = jest.fn();
const mockPrismaComentarioCreate = jest.fn();
const mockPrismaComentarioUpdate = jest.fn();
const mockPrismaComentarioDelete = jest.fn();

jest.mock('../../config/database', () => ({
    __esModule: true,
    default: {
        projeto: {
            findFirst: mockPrismaProjetoFindFirst,
        },
        comentario: {
            findMany: mockPrismaComentarioFindMany,
            findFirst: mockPrismaComentarioFindFirst,
            create: mockPrismaComentarioCreate,
            update: mockPrismaComentarioUpdate,
            delete: mockPrismaComentarioDelete,
        },
    },
}));

import {
    getComentarios,
    createComentario,
    updateComentario,
    deleteComentario,
} from '../../controllers/comentarios.controller';

describe('Comentarios Controller', () => {
    let mockRequest: Partial<AuthRequest>;
    let mockResponse: Partial<Response>;
    const userId = 'user-123';
    const projetoId = 'projeto-456';

    beforeEach(() => {
        mockRequest = {
            userId,
            query: {},
            params: { projetoId },
            body: {},
        };

        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };

        jest.clearAllMocks();
    });

    describe('getComentarios', () => {
        it('deve retornar lista de comentários com replies', async () => {
            mockPrismaProjetoFindFirst.mockResolvedValue({ id: projetoId });

            const mockComentarios = [
                {
                    id: 'c1',
                    content: 'Comentário 1',
                    projetoId,
                    userId,
                    parentId: null,
                    user: { id: userId, name: 'User', avatar: null },
                    replies: [
                        {
                            id: 'c2',
                            content: 'Reply 1',
                            projetoId,
                            userId,
                            parentId: 'c1',
                            user: { id: userId, name: 'User', avatar: null },
                        },
                    ],
                },
            ];

            mockPrismaComentarioFindMany.mockResolvedValue(mockComentarios);

            await getComentarios(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockPrismaProjetoFindFirst).toHaveBeenCalledWith({
                where: { id: projetoId, userId },
                select: { id: true },
            });
            expect(mockPrismaComentarioFindMany).toHaveBeenCalledWith({
                where: { projetoId, parentId: null },
                include: {
                    user: { select: { id: true, name: true, avatar: true } },
                    replies: {
                        include: {
                            user: { select: { id: true, name: true, avatar: true } },
                        },
                        orderBy: { createdAt: 'asc' },
                    },
                },
                orderBy: { createdAt: 'desc' },
            });
            expect(mockResponse.json).toHaveBeenCalledWith(mockComentarios);
        });

        it('deve retornar 404 se projeto não encontrado', async () => {
            mockPrismaProjetoFindFirst.mockResolvedValue(null);

            await getComentarios(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Projeto não encontrado',
            });
        });

        it('deve lidar com erro ao listar comentários', async () => {
            mockPrismaProjetoFindFirst.mockRejectedValue(new Error('Database error'));

            await getComentarios(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Erro ao listar comentários',
            });
        });
    });

    describe('createComentario', () => {
        it('deve criar um novo comentário', async () => {
            mockRequest.body = { content: 'Novo comentário' };
            mockPrismaProjetoFindFirst.mockResolvedValue({ id: projetoId });

            const mockComentario = {
                id: 'c1',
                content: 'Novo comentário',
                userId,
                projetoId,
                parentId: null,
                user: { id: userId, name: 'User', avatar: null },
                replies: [],
            };

            mockPrismaComentarioCreate.mockResolvedValue(mockComentario);

            await createComentario(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockPrismaComentarioCreate).toHaveBeenCalledWith({
                data: {
                    content: 'Novo comentário',
                    userId,
                    projetoId,
                    parentId: null,
                },
                include: {
                    user: { select: { id: true, name: true, avatar: true } },
                    replies: {
                        include: {
                            user: { select: { id: true, name: true, avatar: true } },
                        },
                    },
                },
            });
            expect(mockResponse.status).toHaveBeenCalledWith(201);
            expect(mockResponse.json).toHaveBeenCalledWith(mockComentario);
        });

        it('deve criar uma reply a um comentário existente', async () => {
            mockRequest.body = { content: 'Reply', parentId: 'c1' };
            mockPrismaProjetoFindFirst.mockResolvedValue({ id: projetoId });
            mockPrismaComentarioFindFirst.mockResolvedValue({ id: 'c1', projetoId });

            const mockReply = {
                id: 'c2',
                content: 'Reply',
                userId,
                projetoId,
                parentId: 'c1',
                user: { id: userId, name: 'User', avatar: null },
                replies: [],
            };

            mockPrismaComentarioCreate.mockResolvedValue(mockReply);

            await createComentario(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockPrismaComentarioFindFirst).toHaveBeenCalledWith({
                where: { id: 'c1', projetoId },
            });
            expect(mockPrismaComentarioCreate).toHaveBeenCalledWith({
                data: {
                    content: 'Reply',
                    userId,
                    projetoId,
                    parentId: 'c1',
                },
                include: expect.any(Object),
            });
            expect(mockResponse.status).toHaveBeenCalledWith(201);
        });

        it('deve retornar 400 se conteúdo vazio', async () => {
            mockRequest.body = { content: '   ' };

            await createComentario(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Conteúdo é obrigatório',
            });
        });

        it('deve retornar 400 se conteúdo não fornecido', async () => {
            mockRequest.body = {};

            await createComentario(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Conteúdo é obrigatório',
            });
        });

        it('deve retornar 404 se projeto não encontrado', async () => {
            mockRequest.body = { content: 'Test' };
            mockPrismaProjetoFindFirst.mockResolvedValue(null);

            await createComentario(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Projeto não encontrado',
            });
        });

        it('deve retornar 404 se comentário pai não encontrado', async () => {
            mockRequest.body = { content: 'Reply', parentId: 'invalid' };
            mockPrismaProjetoFindFirst.mockResolvedValue({ id: projetoId });
            mockPrismaComentarioFindFirst.mockResolvedValue(null);

            await createComentario(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Comentário pai não encontrado',
            });
        });

        it('deve lidar com erro ao criar comentário', async () => {
            mockRequest.body = { content: 'Test' };
            mockPrismaProjetoFindFirst.mockResolvedValue({ id: projetoId });
            mockPrismaComentarioCreate.mockRejectedValue(new Error('Database error'));

            await createComentario(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Erro ao criar comentário',
            });
        });
    });

    describe('updateComentario', () => {
        it('deve atualizar um comentário do autor', async () => {
            mockRequest.params = { projetoId, id: 'c1' };
            mockRequest.body = { content: 'Atualizado' };

            mockPrismaComentarioFindFirst.mockResolvedValue({ id: 'c1', projetoId, userId });

            const mockUpdated = {
                id: 'c1',
                content: 'Atualizado',
                userId,
                projetoId,
                user: { id: userId, name: 'User', avatar: null },
            };
            mockPrismaComentarioUpdate.mockResolvedValue(mockUpdated);

            await updateComentario(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockPrismaComentarioFindFirst).toHaveBeenCalledWith({
                where: { id: 'c1', projetoId, userId },
            });
            expect(mockPrismaComentarioUpdate).toHaveBeenCalledWith({
                where: { id: 'c1' },
                data: { content: 'Atualizado' },
                include: {
                    user: { select: { id: true, name: true, avatar: true } },
                },
            });
            expect(mockResponse.json).toHaveBeenCalledWith(mockUpdated);
        });

        it('deve retornar 400 se conteúdo vazio', async () => {
            mockRequest.params = { projetoId, id: 'c1' };
            mockRequest.body = { content: '' };

            await updateComentario(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Conteúdo é obrigatório',
            });
        });

        it('deve retornar 404 se comentário não encontrado ou não é do autor', async () => {
            mockRequest.params = { projetoId, id: 'c1' };
            mockRequest.body = { content: 'Test' };
            mockPrismaComentarioFindFirst.mockResolvedValue(null);

            await updateComentario(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Comentário não encontrado',
            });
        });

        it('deve lidar com erro ao atualizar comentário', async () => {
            mockRequest.params = { projetoId, id: 'c1' };
            mockRequest.body = { content: 'Test' };
            mockPrismaComentarioFindFirst.mockRejectedValue(new Error('Database error'));

            await updateComentario(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Erro ao atualizar comentário',
            });
        });
    });

    describe('deleteComentario', () => {
        it('deve excluir um comentário do autor', async () => {
            mockRequest.params = { projetoId, id: 'c1' };
            mockPrismaComentarioFindFirst.mockResolvedValue({ id: 'c1', projetoId, userId });
            mockPrismaComentarioDelete.mockResolvedValue({ id: 'c1' });

            await deleteComentario(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockPrismaComentarioDelete).toHaveBeenCalledWith({ where: { id: 'c1' } });
            expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Comentário excluído' });
        });

        it('deve retornar 404 se comentário não encontrado ou não é do autor', async () => {
            mockRequest.params = { projetoId, id: 'c1' };
            mockPrismaComentarioFindFirst.mockResolvedValue(null);

            await deleteComentario(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Comentário não encontrado',
            });
        });

        it('deve lidar com erro ao excluir comentário', async () => {
            mockRequest.params = { projetoId, id: 'c1' };
            mockPrismaComentarioFindFirst.mockRejectedValue(new Error('Database error'));

            await deleteComentario(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Erro ao excluir comentário',
            });
        });
    });
});
