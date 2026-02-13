import { Response } from 'express';
import { AuthRequest } from '../../middlewares/auth.middleware';

jest.mock('../../config/logger', () => ({
    __esModule: true,
    default: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

const mockPrismaClienteFindMany = jest.fn();
const mockPrismaClienteFindFirst = jest.fn();
const mockPrismaClienteCreate = jest.fn();
const mockPrismaClienteUpdate = jest.fn();
const mockPrismaClienteDelete = jest.fn();
const mockPrismaClienteCount = jest.fn();
const mockPrismaUserFindUnique = jest.fn();

jest.mock('../../config/database', () => ({
    __esModule: true,
    default: {
        cliente: {
            findMany: mockPrismaClienteFindMany,
            findFirst: mockPrismaClienteFindFirst,
            create: mockPrismaClienteCreate,
            update: mockPrismaClienteUpdate,
            delete: mockPrismaClienteDelete,
            count: mockPrismaClienteCount,
        },
        user: {
            findUnique: mockPrismaUserFindUnique,
        },
    },
}));

import {
    getClientes,
    getCliente,
    createCliente,
    updateCliente,
    deleteCliente,
} from '../../controllers/clientes.controller';

describe('Clientes Controller', () => {
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

    describe('getClientes', () => {
        it('deve retornar lista de clientes do usuário', async () => {
            const mockClientes = [
                {
                    id: '1',
                    name: 'Cliente 1',
                    email: 'cliente1@test.com',
                    userId,
                    _count: { projetos: 2, orcamentos: 1 },
                },
                {
                    id: '2',
                    name: 'Cliente 2',
                    email: 'cliente2@test.com',
                    userId,
                    _count: { projetos: 0, orcamentos: 3 },
                },
            ];

            mockPrismaClienteFindMany.mockResolvedValue(mockClientes);

            await getClientes(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockPrismaClienteFindMany).toHaveBeenCalledWith({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                include: {
                    _count: {
                        select: {
                            projetos: true,
                            orcamentos: true,
                        },
                    },
                },
            });

            expect(mockResponse.json).toHaveBeenCalledWith(mockClientes);
        });

        it('deve filtrar clientes por busca', async () => {
            mockRequest.query = { search: 'test' };

            mockPrismaClienteFindMany.mockResolvedValue([]);

            await getClientes(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockPrismaClienteFindMany).toHaveBeenCalledWith({
                where: {
                    userId,
                    OR: [
                        { name: { contains: 'test', mode: 'insensitive' } },
                        { email: { contains: 'test', mode: 'insensitive' } },
                        { company: { contains: 'test', mode: 'insensitive' } },
                    ],
                },
                orderBy: { createdAt: 'desc' },
                include: expect.any(Object),
            });
        });

        it('deve filtrar clientes por status ativo', async () => {
            mockRequest.query = { active: 'true' };

            mockPrismaClienteFindMany.mockResolvedValue([]);

            await getClientes(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockPrismaClienteFindMany).toHaveBeenCalledWith({
                where: {
                    userId,
                    active: true,
                },
                orderBy: { createdAt: 'desc' },
                include: expect.any(Object),
            });
        });

        it('deve lidar com erro ao buscar clientes', async () => {
            mockPrismaClienteFindMany.mockRejectedValue(new Error('Database error'));

            await getClientes(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Erro ao buscar clientes',
            });
        });
    });

    describe('getCliente', () => {
        it('deve retornar um cliente específico', async () => {
            const mockCliente = {
                id: '1',
                name: 'Cliente 1',
                email: 'cliente1@test.com',
                userId,
                orcamentos: [],
                projetos: [],
            };

            mockRequest.params = { id: '1' };
            mockPrismaClienteFindFirst.mockResolvedValue(mockCliente);

            await getCliente(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockPrismaClienteFindFirst).toHaveBeenCalledWith({
                where: {
                    id: '1',
                    userId,
                },
                include: {
                    orcamentos: {
                        orderBy: { createdAt: 'desc' },
                        take: 10,
                    },
                    projetos: {
                        orderBy: { createdAt: 'desc' },
                        take: 10,
                    },
                },
            });

            expect(mockResponse.json).toHaveBeenCalledWith(mockCliente);
        });

        it('deve retornar 404 se cliente não encontrado', async () => {
            mockRequest.params = { id: 'not-found' };
            mockPrismaClienteFindFirst.mockResolvedValue(null);

            await getCliente(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Cliente não encontrado',
            });
        });

        it('deve lidar com erro ao buscar cliente', async () => {
            mockRequest.params = { id: '1' };
            mockPrismaClienteFindFirst.mockRejectedValue(new Error('Database error'));

            await getCliente(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Erro ao buscar cliente',
            });
        });
    });

    describe('createCliente', () => {
        beforeEach(() => {
            // Default: user com plano FREE (limite de 3 clientes)
            mockPrismaUserFindUnique.mockResolvedValue({ plan: 'FREE' });
            mockPrismaClienteCount.mockResolvedValue(0);
        });

        it('deve criar um novo cliente', async () => {
            mockRequest.body = {
                name: 'Novo Cliente',
                email: 'novo@test.com',
                phone: '11999999999',
                company: 'Empresa Teste',
            };

            const mockCliente = {
                id: '1',
                ...mockRequest.body,
                userId,
            };

            mockPrismaClienteFindFirst.mockResolvedValue(null);
            mockPrismaClienteCreate.mockResolvedValue(mockCliente);

            await createCliente(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockPrismaClienteFindFirst).toHaveBeenCalledWith({
                where: {
                    userId,
                    email: 'novo@test.com',
                },
            });

            expect(mockPrismaClienteCreate).toHaveBeenCalledWith({
                data: {
                    userId,
                    name: 'Novo Cliente',
                    email: 'novo@test.com',
                    phone: '11999999999',
                    company: 'Empresa Teste',
                    cnpj: undefined,
                    address: undefined,
                    city: undefined,
                    state: undefined,
                    zipCode: undefined,
                    notes: undefined,
                },
            });

            expect(mockResponse.status).toHaveBeenCalledWith(201);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Cliente criado com sucesso',
                cliente: mockCliente,
            });
        });

        it('deve retornar erro se nome não fornecido', async () => {
            mockRequest.body = {
                email: 'test@test.com',
            };

            await createCliente(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Nome e email são obrigatórios',
            });
        });

        it('deve retornar erro se email não fornecido', async () => {
            mockRequest.body = {
                name: 'Cliente',
            };

            await createCliente(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Nome e email são obrigatórios',
            });
        });

        it('deve retornar erro se email já existe', async () => {
            mockRequest.body = {
                name: 'Cliente',
                email: 'existente@test.com',
            };

            mockPrismaClienteFindFirst.mockResolvedValue({
                id: '1',
                email: 'existente@test.com',
            });

            await createCliente(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Já existe um cliente com este email',
            });
        });

        it('deve lidar com erro ao criar cliente', async () => {
            mockRequest.body = {
                name: 'Cliente',
                email: 'novo@test.com',
            };

            mockPrismaClienteFindFirst.mockResolvedValue(null);
            mockPrismaClienteCreate.mockRejectedValue(new Error('Database error'));

            await createCliente(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Erro ao criar cliente',
            });
        });
    });

    describe('updateCliente', () => {
        it('deve atualizar um cliente existente', async () => {
            mockRequest.params = { id: '1' };
            mockRequest.body = {
                name: 'Cliente Atualizado',
                email: 'atualizado@test.com',
            };

            const mockExistingCliente = {
                id: '1',
                userId,
            };

            const mockUpdatedCliente = {
                id: '1',
                ...mockRequest.body,
                userId,
            };

            mockPrismaClienteFindFirst.mockResolvedValue(mockExistingCliente);
            mockPrismaClienteUpdate.mockResolvedValue(mockUpdatedCliente);

            await updateCliente(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockPrismaClienteFindFirst).toHaveBeenCalledWith({
                where: { id: '1', userId },
            });

            expect(mockPrismaClienteUpdate).toHaveBeenCalledWith({
                where: { id: '1' },
                data: {
                    name: 'Cliente Atualizado',
                    email: 'atualizado@test.com',
                    phone: undefined,
                    company: undefined,
                    cnpj: undefined,
                    address: undefined,
                    city: undefined,
                    state: undefined,
                    zipCode: undefined,
                    notes: undefined,
                    active: undefined,
                },
            });

            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Cliente atualizado com sucesso',
                cliente: mockUpdatedCliente,
            });
        });

        it('deve retornar 404 se cliente não encontrado', async () => {
            mockRequest.params = { id: 'not-found' };
            mockRequest.body = { name: 'Test' };

            mockPrismaClienteFindFirst.mockResolvedValue(null);

            await updateCliente(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Cliente não encontrado',
            });
        });

        it('deve lidar com erro ao atualizar cliente', async () => {
            mockRequest.params = { id: '1' };
            mockRequest.body = { name: 'Test' };

            mockPrismaClienteFindFirst.mockResolvedValue({ id: '1', userId });
            mockPrismaClienteUpdate.mockRejectedValue(new Error('Database error'));

            await updateCliente(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Erro ao atualizar cliente',
            });
        });
    });

    describe('deleteCliente', () => {
        it('deve excluir um cliente sem projetos ou orçamentos', async () => {
            mockRequest.params = { id: '1' };

            const mockCliente = {
                id: '1',
                userId,
                _count: {
                    projetos: 0,
                    orcamentos: 0,
                },
            };

            mockPrismaClienteFindFirst.mockResolvedValue(mockCliente);
            mockPrismaClienteDelete.mockResolvedValue(mockCliente);

            await deleteCliente(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockPrismaClienteFindFirst).toHaveBeenCalledWith({
                where: { id: '1', userId },
                include: {
                    _count: {
                        select: {
                            projetos: true,
                            orcamentos: true,
                        },
                    },
                },
            });

            expect(mockPrismaClienteDelete).toHaveBeenCalledWith({
                where: { id: '1' },
            });

            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Cliente excluído com sucesso',
            });
        });

        it('deve retornar 404 se cliente não encontrado', async () => {
            mockRequest.params = { id: 'not-found' };

            mockPrismaClienteFindFirst.mockResolvedValue(null);

            await deleteCliente(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Cliente não encontrado',
            });
        });

        it('deve retornar erro se cliente tem projetos', async () => {
            mockRequest.params = { id: '1' };

            const mockCliente = {
                id: '1',
                userId,
                _count: {
                    projetos: 2,
                    orcamentos: 0,
                },
            };

            mockPrismaClienteFindFirst.mockResolvedValue(mockCliente);

            await deleteCliente(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Não é possível excluir cliente com projetos ou orçamentos associados',
                hint: 'Desative o cliente ao invés de excluí-lo',
            });
        });

        it('deve retornar erro se cliente tem orçamentos', async () => {
            mockRequest.params = { id: '1' };

            const mockCliente = {
                id: '1',
                userId,
                _count: {
                    projetos: 0,
                    orcamentos: 3,
                },
            };

            mockPrismaClienteFindFirst.mockResolvedValue(mockCliente);

            await deleteCliente(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Não é possível excluir cliente com projetos ou orçamentos associados',
                hint: 'Desative o cliente ao invés de excluí-lo',
            });
        });

        it('deve lidar com erro ao excluir cliente', async () => {
            mockRequest.params = { id: '1' };

            mockPrismaClienteFindFirst.mockRejectedValue(new Error('Database error'));

            await deleteCliente(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Erro ao excluir cliente',
            });
        });
    });
});
