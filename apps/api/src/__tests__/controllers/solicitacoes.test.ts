import { Request, Response } from 'express';
import { AuthRequest } from '../../middlewares/auth.middleware';

jest.mock('../../config/logger', () => ({
    __esModule: true,
    default: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

jest.mock('../../services/notificacao.service', () => ({
    NotificacaoService: {
        notificarNovaSolicitacao: jest.fn().mockResolvedValue(undefined),
    },
}));

const mockClienteFindUnique = jest.fn();
const mockClienteFindFirst = jest.fn();
const mockClienteCreate = jest.fn();
const mockSolicitacaoCreate = jest.fn();
const mockSolicitacaoFindMany = jest.fn();
const mockSolicitacaoFindFirst = jest.fn();
const mockSolicitacaoUpdate = jest.fn();
const mockUserFindUnique = jest.fn();

jest.mock('../../config/database', () => ({
    __esModule: true,
    default: {
        cliente: {
            findUnique: mockClienteFindUnique,
            findFirst: mockClienteFindFirst,
            create: mockClienteCreate,
        },
        solicitacao: {
            create: mockSolicitacaoCreate,
            findMany: mockSolicitacaoFindMany,
            findFirst: mockSolicitacaoFindFirst,
            update: mockSolicitacaoUpdate,
        },
        user: {
            findUnique: mockUserFindUnique,
        },
    },
}));

import {
    createSolicitacao,
    findClienteByCnpj,
    createClientePublic,
    getSolicitacoes,
    getSolicitacao,
    updateSolicitacaoStatus,
} from '../../controllers/solicitacoes.controller';

describe('Solicitacoes Controller', () => {
    let mockRequest: Partial<Request | AuthRequest>;
    let mockResponse: Partial<Response>;
    const userId = 'user-123';
    const clienteId = 'cliente-123';

    beforeEach(() => {
        mockRequest = {
            body: {},
            params: {},
            query: {},
        };

        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };

        jest.clearAllMocks();
    });

    describe('createSolicitacao (PUBLIC)', () => {
        it('deve criar solicitação com sucesso', async () => {
            mockRequest.body = { clienteId, title: 'Teste', description: 'Descrição teste' };
            mockClienteFindUnique.mockResolvedValue({ id: clienteId });
            const createdSolicitacao = { id: 'sol-1', title: 'Teste', cliente: { name: 'Cliente' } };
            mockSolicitacaoCreate.mockResolvedValue(createdSolicitacao);

            await createSolicitacao(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(201);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Solicitação enviada com sucesso!',
                solicitacao: createdSolicitacao,
            });
        });

        it('deve retornar 400 se campos obrigatórios não fornecidos', async () => {
            mockRequest.body = { clienteId };

            await createSolicitacao(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Cliente, título e descrição são obrigatórios',
            });
        });

        it('deve retornar 404 se cliente não encontrado', async () => {
            mockRequest.body = { clienteId, title: 'Teste', description: 'Desc' };
            mockClienteFindUnique.mockResolvedValue(null);

            await createSolicitacao(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Cliente não encontrado' });
        });

        it('deve retornar erro 500 em caso de falha', async () => {
            mockRequest.body = { clienteId, title: 'Teste', description: 'Desc' };
            mockClienteFindUnique.mockRejectedValue(new Error('Database error'));

            await createSolicitacao(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Erro ao criar solicitação' });
        });
    });

    describe('findClienteByCnpj (PUBLIC)', () => {
        it('deve encontrar cliente por CNPJ', async () => {
            mockRequest.params = { cnpj: '12.345.678/0001-90' };
            const cliente = { id: clienteId, name: 'Empresa', cnpj: '12345678000190' };
            mockClienteFindFirst.mockResolvedValue(cliente);

            await findClienteByCnpj(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.json).toHaveBeenCalledWith(cliente);
        });

        it('deve retornar 404 se cliente não encontrado', async () => {
            mockRequest.params = { cnpj: '12345678000190' };
            mockClienteFindFirst.mockResolvedValue(null);

            await findClienteByCnpj(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Cliente não encontrado' });
        });

        it('deve retornar erro 500 em caso de falha', async () => {
            mockRequest.params = { cnpj: '12345678000190' };
            mockClienteFindFirst.mockRejectedValue(new Error('Database error'));

            await findClienteByCnpj(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Erro ao buscar cliente' });
        });
    });

    describe('createClientePublic (PUBLIC)', () => {
        it('deve criar cliente com sucesso', async () => {
            mockRequest.body = { name: 'Novo Cliente', email: 'novo@email.com', userId };
            mockUserFindUnique.mockResolvedValue({ id: userId });
            mockClienteFindFirst.mockResolvedValue(null);
            const newCliente = { id: 'new-cliente', name: 'Novo Cliente', email: 'novo@email.com' };
            mockClienteCreate.mockResolvedValue(newCliente);

            await createClientePublic(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(201);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Cadastro realizado com sucesso!',
                cliente: newCliente,
            });
        });

        it('deve retornar 400 se nome ou email não fornecidos', async () => {
            mockRequest.body = { name: 'Teste' };

            await createClientePublic(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Nome e email são obrigatórios' });
        });

        it('deve retornar 400 se userId não fornecido', async () => {
            mockRequest.body = { name: 'Teste', email: 'test@email.com' };

            await createClientePublic(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Identificação do profissional é obrigatória' });
        });

        it('deve retornar 404 se usuário não encontrado', async () => {
            mockRequest.body = { name: 'Teste', email: 'test@email.com', userId };
            mockUserFindUnique.mockResolvedValue(null);

            await createClientePublic(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Profissional não encontrado' });
        });

        it('deve retornar 400 se email já existe', async () => {
            mockRequest.body = { name: 'Teste', email: 'existing@email.com', userId };
            mockUserFindUnique.mockResolvedValue({ id: userId });
            mockClienteFindFirst.mockResolvedValue({ id: 'existing', email: 'existing@email.com' });

            await createClientePublic(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Já existe um cliente com este email' });
        });

        it('deve retornar erro 500 em caso de falha', async () => {
            mockRequest.body = { name: 'Teste', email: 'test@email.com', userId };
            mockUserFindUnique.mockRejectedValue(new Error('Database error'));

            await createClientePublic(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Erro ao criar cadastro' });
        });
    });

    describe('getSolicitacoes (PRIVATE)', () => {
        beforeEach(() => {
            (mockRequest as AuthRequest).userId = userId;
        });

        it('deve retornar lista de solicitações', async () => {
            const solicitacoes = [{ id: 'sol-1', title: 'Solicitacao 1' }];
            mockSolicitacaoFindMany.mockResolvedValue(solicitacoes);

            await getSolicitacoes(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockResponse.json).toHaveBeenCalledWith(solicitacoes);
        });

        it('deve filtrar por status', async () => {
            mockRequest.query = { status: 'NOVA' };
            mockSolicitacaoFindMany.mockResolvedValue([]);

            await getSolicitacoes(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockSolicitacaoFindMany).toHaveBeenCalledWith(expect.objectContaining({
                where: expect.objectContaining({ status: 'NOVA' }),
            }));
        });

        it('deve retornar erro 500 em caso de falha', async () => {
            mockSolicitacaoFindMany.mockRejectedValue(new Error('Database error'));

            await getSolicitacoes(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Erro ao buscar solicitações' });
        });
    });

    describe('getSolicitacao (PRIVATE)', () => {
        beforeEach(() => {
            (mockRequest as AuthRequest).userId = userId;
            mockRequest.params = { id: 'sol-123' };
        });

        it('deve retornar solicitação específica', async () => {
            const solicitacao = { id: 'sol-123', title: 'Solicitacao' };
            mockSolicitacaoFindFirst.mockResolvedValue(solicitacao);

            await getSolicitacao(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockResponse.json).toHaveBeenCalledWith(solicitacao);
        });

        it('deve retornar 404 se não encontrada', async () => {
            mockSolicitacaoFindFirst.mockResolvedValue(null);

            await getSolicitacao(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Solicitação não encontrada' });
        });

        it('deve retornar erro 500 em caso de falha', async () => {
            mockSolicitacaoFindFirst.mockRejectedValue(new Error('Database error'));

            await getSolicitacao(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Erro ao buscar solicitação' });
        });
    });

    describe('updateSolicitacaoStatus (PRIVATE)', () => {
        beforeEach(() => {
            (mockRequest as AuthRequest).userId = userId;
            mockRequest.params = { id: 'sol-123' };
        });

        it('deve atualizar status com sucesso', async () => {
            mockRequest.body = { status: 'ANALISANDO', notes: 'Em análise' };
            mockSolicitacaoFindFirst.mockResolvedValue({ id: 'sol-123' });
            const updated = { id: 'sol-123', status: 'ANALISANDO', notes: 'Em análise' };
            mockSolicitacaoUpdate.mockResolvedValue(updated);

            await updateSolicitacaoStatus(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Status atualizado com sucesso',
                solicitacao: updated,
            });
        });

        it('deve retornar 404 se não encontrada', async () => {
            mockRequest.body = { status: 'ANALISANDO' };
            mockSolicitacaoFindFirst.mockResolvedValue(null);

            await updateSolicitacaoStatus(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Solicitação não encontrada' });
        });

        it('deve retornar erro 500 em caso de falha', async () => {
            mockRequest.body = { status: 'ANALISANDO' };
            mockSolicitacaoFindFirst.mockRejectedValue(new Error('Database error'));

            await updateSolicitacaoStatus(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Erro ao atualizar status' });
        });
    });
});
