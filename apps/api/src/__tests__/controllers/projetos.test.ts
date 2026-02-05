import { Response } from 'express';
import { AuthRequest } from '../../middlewares/auth.middleware';

jest.mock('../../config/logger', () => ({
    __esModule: true,
    default: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

const mockPrismaProjetoFindMany = jest.fn();
const mockPrismaProjetoFindFirst = jest.fn();
const mockPrismaProjetoCreate = jest.fn();
const mockPrismaProjetoUpdate = jest.fn();
const mockPrismaProjetoDelete = jest.fn();
const mockPrismaOrcamentoFindFirst = jest.fn();

const mockPrismaInstance = {
    projeto: {
        findMany: mockPrismaProjetoFindMany,
        findFirst: mockPrismaProjetoFindFirst,
        create: mockPrismaProjetoCreate,
        update: mockPrismaProjetoUpdate,
        delete: mockPrismaProjetoDelete,
    },
    orcamento: {
        findFirst: mockPrismaOrcamentoFindFirst,
    },
};

jest.mock('../../config/database', () => ({
    __esModule: true,
    default: {
        ...mockPrismaInstance,
        $transaction: jest.fn((fn) => fn(mockPrismaInstance)),
    },
}));

import {
    getProjetos,
    getProjeto,
    createProjeto,
    createProjetoFromOrcamento,
    updateProjeto,
    deleteProjeto,
} from '../../controllers/projetos.controller';

describe('Projetos Controller', () => {
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

    describe('getProjetos', () => {
        it('deve retornar lista de projetos do usuário', async () => {
            const mockProjetos = [
                {
                    id: '1',
                    title: 'Projeto 1',
                    userId,
                    cliente: { name: 'Cliente 1' },
                    _count: { milestones: 3 },
                },
            ];

            mockPrismaProjetoFindMany.mockResolvedValue(mockProjetos);

            await getProjetos(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockPrismaProjetoFindMany).toHaveBeenCalledWith({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                include: {
                    cliente: {
                        select: {
                            name: true,
                            email: true,
                            company: true,
                        },
                    },
                    _count: {
                        select: {
                            milestones: true,
                        },
                    },
                },
            });

            expect(mockResponse.json).toHaveBeenCalledWith(mockProjetos);
        });

        it('deve filtrar projetos por status', async () => {
            mockRequest.query = { status: 'EM_ANDAMENTO' };

            mockPrismaProjetoFindMany.mockResolvedValue([]);

            await getProjetos(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockPrismaProjetoFindMany).toHaveBeenCalledWith({
                where: {
                    userId,
                    status: 'EM_ANDAMENTO',
                },
                orderBy: { createdAt: 'desc' },
                include: expect.any(Object),
            });
        });

        it('deve filtrar projetos por clienteId', async () => {
            mockRequest.query = { clienteId: 'cliente-1' };

            mockPrismaProjetoFindMany.mockResolvedValue([]);

            await getProjetos(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockPrismaProjetoFindMany).toHaveBeenCalledWith({
                where: {
                    userId,
                    clienteId: 'cliente-1',
                },
                orderBy: { createdAt: 'desc' },
                include: expect.any(Object),
            });
        });

        it('deve lidar com erro ao buscar projetos', async () => {
            mockPrismaProjetoFindMany.mockRejectedValue(new Error('Database error'));

            await getProjetos(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Erro ao buscar projetos',
            });
        });
    });

    describe('getProjeto', () => {
        it('deve retornar um projeto específico', async () => {
            const mockProjeto = {
                id: '1',
                title: 'Projeto 1',
                userId,
                cliente: {},
                orcamento: null,
                milestones: [],
                arquivos: [],
                pagamentos: [],
            };

            mockRequest.params = { id: '1' };
            mockPrismaProjetoFindFirst.mockResolvedValue(mockProjeto);

            await getProjeto(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockPrismaProjetoFindFirst).toHaveBeenCalledWith({
                where: {
                    id: '1',
                    userId,
                },
                include: {
                    cliente: true,
                    orcamento: {
                        select: {
                            id: true,
                            number: true,
                            title: true,
                            value: true,
                        },
                    },
                    milestones: {
                        orderBy: { order: 'asc' },
                    },
                    arquivos: {
                        orderBy: { createdAt: 'desc' },
                    },
                    pagamentos: {
                        orderBy: { dueDate: 'asc' },
                    },
                },
            });

            expect(mockResponse.json).toHaveBeenCalledWith(mockProjeto);
        });

        it('deve retornar 404 se projeto não encontrado', async () => {
            mockRequest.params = { id: 'not-found' };
            mockPrismaProjetoFindFirst.mockResolvedValue(null);

            await getProjeto(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Projeto não encontrado',
            });
        });

        it('deve lidar com erro ao buscar projeto', async () => {
            mockRequest.params = { id: '1' };
            mockPrismaProjetoFindFirst.mockRejectedValue(new Error('Database error'));

            await getProjeto(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Erro ao buscar projeto',
            });
        });
    });

    describe('createProjeto', () => {
        it('deve criar um novo projeto', async () => {
            mockRequest.body = {
                clienteId: 'cliente-1',
                title: 'Novo Projeto',
                description: 'Descrição do projeto',
                value: '10000',
            };

            mockPrismaProjetoFindFirst.mockResolvedValue(null);

            const mockProjeto = {
                id: '1',
                number: 'PRJ-001',
                ...mockRequest.body,
                userId,
                cliente: { name: 'Cliente 1' },
            };

            mockPrismaProjetoCreate.mockResolvedValue(mockProjeto);

            await createProjeto(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockPrismaProjetoFindFirst).toHaveBeenCalledWith({
                where: { userId },
                orderBy: { createdAt: 'desc' },
            });

            expect(mockPrismaProjetoCreate).toHaveBeenCalledWith({
                data: {
                    userId,
                    clienteId: 'cliente-1',
                    number: 'PRJ-001',
                    title: 'Novo Projeto',
                    description: 'Descrição do projeto',
                    value: 10000,
                    startDate: expect.any(Date),
                    endDate: null,
                    orcamentoId: undefined,
                },
                include: expect.any(Object),
            });

            expect(mockResponse.status).toHaveBeenCalledWith(201);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Projeto criado com sucesso',
                projeto: mockProjeto,
            });
        });

        it('deve gerar número sequencial corretamente', async () => {
            mockRequest.body = {
                clienteId: 'cliente-1',
                title: 'Projeto',
                description: 'Descrição',
                value: '5000',
            };

            mockPrismaProjetoFindFirst.mockResolvedValue({
                number: 'PRJ-005',
            });

            mockPrismaProjetoCreate.mockResolvedValue({
                id: '1',
                number: 'PRJ-006',
            });

            await createProjeto(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockPrismaProjetoCreate).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        number: 'PRJ-006',
                    }),
                })
            );
        });

        it('deve retornar erro se campos obrigatórios não fornecidos', async () => {
            mockRequest.body = {
                clienteId: 'cliente-1',
                title: 'Projeto',
            };

            await createProjeto(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Cliente, título, descrição e valor são obrigatórios',
            });
        });

        it('deve lidar com erro ao criar projeto', async () => {
            mockRequest.body = {
                clienteId: 'cliente-1',
                title: 'Projeto',
                description: 'Descrição',
                value: '5000',
            };

            mockPrismaProjetoFindFirst.mockResolvedValue(null);
            mockPrismaProjetoCreate.mockRejectedValue(new Error('Database error'));

            await createProjeto(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Erro ao criar projeto',
            });
        });
    });

    describe('createProjetoFromOrcamento', () => {
        it('deve criar projeto a partir de orçamento aprovado', async () => {
            mockRequest.body = {
                orcamentoId: 'orcamento-1',
            };

            const mockOrcamento = {
                id: 'orcamento-1',
                userId,
                clienteId: 'cliente-1',
                title: 'Orçamento Aprovado',
                description: 'Descrição',
                value: 15000,
                status: 'APROVADO',
                estimatedDays: 30,
                projeto: null,
            };

            mockPrismaOrcamentoFindFirst.mockResolvedValue(mockOrcamento);
            mockPrismaProjetoFindFirst.mockResolvedValue(null);

            const mockProjeto = {
                id: '1',
                number: 'PRJ-001',
                title: mockOrcamento.title,
                userId,
            };

            mockPrismaProjetoCreate.mockResolvedValue(mockProjeto);

            await createProjetoFromOrcamento(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockPrismaOrcamentoFindFirst).toHaveBeenCalledWith({
                where: {
                    id: 'orcamento-1',
                    userId,
                },
                include: {
                    projeto: true,
                },
            });

            expect(mockPrismaProjetoCreate).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        userId,
                        clienteId: 'cliente-1',
                        title: 'Orçamento Aprovado',
                        description: 'Descrição',
                        value: 15000,
                        orcamentoId: 'orcamento-1',
                    }),
                })
            );

            expect(mockResponse.status).toHaveBeenCalledWith(201);
        });

        it('deve retornar erro se orcamentoId não fornecido', async () => {
            mockRequest.body = {};

            await createProjetoFromOrcamento(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'ID do orçamento é obrigatório',
            });
        });

        it('deve retornar 404 se orçamento não encontrado', async () => {
            mockRequest.body = { orcamentoId: 'not-found' };

            mockPrismaOrcamentoFindFirst.mockResolvedValue(null);

            await createProjetoFromOrcamento(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Orçamento não encontrado',
            });
        });

        it('deve retornar erro se orçamento já foi convertido', async () => {
            mockRequest.body = { orcamentoId: 'orcamento-1' };

            mockPrismaOrcamentoFindFirst.mockResolvedValue({
                id: 'orcamento-1',
                projeto: { id: 'projeto-1' },
            });

            await createProjetoFromOrcamento(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Este orçamento já foi convertido em projeto',
            });
        });

        it('deve retornar erro se orçamento não está aprovado', async () => {
            mockRequest.body = { orcamentoId: 'orcamento-1' };

            mockPrismaOrcamentoFindFirst.mockResolvedValue({
                id: 'orcamento-1',
                status: 'PENDENTE',
                projeto: null,
            });

            await createProjetoFromOrcamento(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Apenas orçamentos aprovados podem ser convertidos em projetos',
            });
        });
    });

    describe('updateProjeto', () => {
        it('deve atualizar um projeto existente', async () => {
            mockRequest.params = { id: '1' };
            mockRequest.body = {
                title: 'Projeto Atualizado',
                status: 'EM_ANDAMENTO',
            };

            const mockExistingProjeto = {
                id: '1',
                userId,
                status: 'AGUARDANDO_INICIO',
            };

            const mockUpdatedProjeto = {
                id: '1',
                title: 'Projeto Atualizado',
                status: 'EM_ANDAMENTO',
                userId,
            };

            mockPrismaProjetoFindFirst.mockResolvedValue(mockExistingProjeto);
            mockPrismaProjetoUpdate.mockResolvedValue(mockUpdatedProjeto);

            await updateProjeto(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockPrismaProjetoUpdate).toHaveBeenCalledWith({
                where: { id: '1' },
                data: {
                    title: 'Projeto Atualizado',
                    status: 'EM_ANDAMENTO',
                },
            });

            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Projeto atualizado com sucesso',
                projeto: mockUpdatedProjeto,
            });
        });

        it('deve marcar projeto como concluído e setar progresso para 100%', async () => {
            mockRequest.params = { id: '1' };
            mockRequest.body = {
                status: 'CONCLUIDO',
            };

            mockPrismaProjetoFindFirst.mockResolvedValue({
                id: '1',
                userId,
                status: 'EM_ANDAMENTO',
                completedAt: null,
            });

            mockPrismaProjetoUpdate.mockResolvedValue({
                id: '1',
                status: 'CONCLUIDO',
            });

            await updateProjeto(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockPrismaProjetoUpdate).toHaveBeenCalledWith({
                where: { id: '1' },
                data: {
                    status: 'CONCLUIDO',
                    completedAt: expect.any(Date),
                    progress: 100,
                },
            });
        });

        it('deve retornar 404 se projeto não encontrado', async () => {
            mockRequest.params = { id: 'not-found' };
            mockRequest.body = { title: 'Test' };

            mockPrismaProjetoFindFirst.mockResolvedValue(null);

            await updateProjeto(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Projeto não encontrado',
            });
        });

        it('deve lidar com erro ao atualizar projeto', async () => {
            mockRequest.params = { id: '1' };
            mockRequest.body = { title: 'Test' };

            mockPrismaProjetoFindFirst.mockResolvedValue({ id: '1', userId });
            mockPrismaProjetoUpdate.mockRejectedValue(new Error('Database error'));

            await updateProjeto(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Erro ao atualizar projeto',
            });
        });
    });

    describe('deleteProjeto', () => {
        it('deve excluir um projeto', async () => {
            mockRequest.params = { id: '1' };

            const mockProjeto = {
                id: '1',
                userId,
            };

            mockPrismaProjetoFindFirst.mockResolvedValue(mockProjeto);
            mockPrismaProjetoDelete.mockResolvedValue(mockProjeto);

            await deleteProjeto(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockPrismaProjetoFindFirst).toHaveBeenCalledWith({
                where: { id: '1', userId },
            });

            expect(mockPrismaProjetoDelete).toHaveBeenCalledWith({
                where: { id: '1' },
            });

            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Projeto excluído com sucesso',
            });
        });

        it('deve retornar 404 se projeto não encontrado', async () => {
            mockRequest.params = { id: 'not-found' };

            mockPrismaProjetoFindFirst.mockResolvedValue(null);

            await deleteProjeto(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Projeto não encontrado',
            });
        });

        it('deve lidar com erro ao excluir projeto', async () => {
            mockRequest.params = { id: '1' };

            mockPrismaProjetoFindFirst.mockRejectedValue(new Error('Database error'));

            await deleteProjeto(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Erro ao excluir projeto',
            });
        });
    });
});
