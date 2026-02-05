import { Response } from 'express';
import { AuthRequest } from '../../middlewares/auth.middleware';

jest.mock('../../config/logger', () => ({
    __esModule: true,
    default: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

jest.mock('../../services/notificacao.service', () => ({
    NotificacaoService: {
        notificarOrcamentoAprovado: jest.fn().mockResolvedValue(undefined),
        enviarOrcamentoParaCliente: jest.fn(),
    },
}));

jest.mock('../../utils/pdf-generator', () => ({
    gerarOrcamentoPDF: jest.fn(),
}));

jest.mock('../../utils/pdf-data', () => ({
    prepareDadosParaPDF: jest.fn().mockReturnValue({ empresa: {}, cliente: {}, orcamento: {} }),
}));

const mockOrcamentoFindFirst = jest.fn();
const mockOrcamentoFindMany = jest.fn();
const mockOrcamentoCreate = jest.fn();
const mockOrcamentoUpdate = jest.fn();
const mockOrcamentoDelete = jest.fn();
const mockClienteFindFirst = jest.fn();
const mockSolicitacaoUpdate = jest.fn();

const mockTxOrcamentoCreate = jest.fn();
const mockTxSolicitacaoUpdate = jest.fn();

jest.mock('../../config/database', () => ({
    __esModule: true,
    default: {
        orcamento: {
            findFirst: mockOrcamentoFindFirst,
            findMany: mockOrcamentoFindMany,
            create: mockOrcamentoCreate,
            update: mockOrcamentoUpdate,
            delete: mockOrcamentoDelete,
        },
        cliente: {
            findFirst: mockClienteFindFirst,
        },
        solicitacao: {
            update: mockSolicitacaoUpdate,
        },
        $transaction: jest.fn((fn) => fn({
            orcamento: {
                create: mockTxOrcamentoCreate,
            },
            solicitacao: {
                update: mockTxSolicitacaoUpdate,
            },
        })),
    },
}));

import { NotificacaoService } from '../../services/notificacao.service';
import {
    gerarPDFOrcamento,
    getOrcamentos,
    getOrcamento,
    createOrcamento,
    updateOrcamento,
    enviarOrcamentoPorEmail,
    deleteOrcamento,
} from '../../controllers/orcamentos.controller';

describe('Orcamentos Controller', () => {
    let mockRequest: Partial<AuthRequest>;
    let mockResponse: Partial<Response>;
    const userId = 'user-123';
    const orcamentoId = 'orcamento-123';
    const clienteId = 'cliente-123';

    beforeEach(() => {
        mockRequest = {
            userId,
            body: {},
            params: {},
            query: {},
        };

        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
            setHeader: jest.fn(),
        };

        jest.clearAllMocks();
    });

    describe('gerarPDFOrcamento', () => {
        beforeEach(() => {
            mockRequest.params = { id: orcamentoId };
        });

        it('deve gerar PDF com sucesso', async () => {
            const orcamento = { id: orcamentoId, number: 'ORC-001', cliente: {}, user: {} };
            mockOrcamentoFindFirst.mockResolvedValue(orcamento);

            await gerarPDFOrcamento(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockResponse.setHeader).toHaveBeenCalledWith('Content-Type', 'application/pdf');
            expect(mockResponse.setHeader).toHaveBeenCalledWith(
                'Content-Disposition',
                'attachment; filename=orcamento-ORC-001.pdf'
            );
        });

        it('deve retornar 404 se orçamento não encontrado', async () => {
            mockOrcamentoFindFirst.mockResolvedValue(null);

            await gerarPDFOrcamento(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Orçamento não encontrado' });
        });

        it('deve retornar erro 500 em caso de falha', async () => {
            mockOrcamentoFindFirst.mockRejectedValue(new Error('Database error'));

            await gerarPDFOrcamento(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Erro ao gerar PDF' });
        });
    });

    describe('getOrcamentos', () => {
        it('deve retornar lista de orçamentos', async () => {
            const orcamentos = [{ id: orcamentoId, title: 'Orcamento 1' }];
            mockOrcamentoFindMany.mockResolvedValue(orcamentos);

            await getOrcamentos(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockResponse.json).toHaveBeenCalledWith(orcamentos);
        });

        it('deve filtrar por status', async () => {
            mockRequest.query = { status: 'ENVIADO' };
            mockOrcamentoFindMany.mockResolvedValue([]);

            await getOrcamentos(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockOrcamentoFindMany).toHaveBeenCalledWith(expect.objectContaining({
                where: expect.objectContaining({ status: 'ENVIADO' }),
            }));
        });

        it('deve filtrar por clienteId', async () => {
            mockRequest.query = { clienteId };
            mockOrcamentoFindMany.mockResolvedValue([]);

            await getOrcamentos(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockOrcamentoFindMany).toHaveBeenCalledWith(expect.objectContaining({
                where: expect.objectContaining({ clienteId }),
            }));
        });

        it('deve retornar erro 500 em caso de falha', async () => {
            mockOrcamentoFindMany.mockRejectedValue(new Error('Database error'));

            await getOrcamentos(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Erro ao buscar orçamentos' });
        });
    });

    describe('getOrcamento', () => {
        beforeEach(() => {
            mockRequest.params = { id: orcamentoId };
        });

        it('deve retornar orçamento específico', async () => {
            const orcamento = { id: orcamentoId, title: 'Orcamento' };
            mockOrcamentoFindFirst.mockResolvedValue(orcamento);

            await getOrcamento(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockResponse.json).toHaveBeenCalledWith(orcamento);
        });

        it('deve retornar 404 se não encontrado', async () => {
            mockOrcamentoFindFirst.mockResolvedValue(null);

            await getOrcamento(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Orçamento não encontrado' });
        });

        it('deve retornar erro 500 em caso de falha', async () => {
            mockOrcamentoFindFirst.mockRejectedValue(new Error('Database error'));

            await getOrcamento(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Erro ao buscar orçamento' });
        });
    });

    describe('createOrcamento', () => {
        it('deve criar orçamento com sucesso', async () => {
            mockRequest.body = { clienteId, title: 'Orcamento', description: 'Desc', value: '1000' };
            mockClienteFindFirst.mockResolvedValue({ id: clienteId, userId });
            mockOrcamentoFindFirst.mockResolvedValue(null);
            const newOrcamento = { id: orcamentoId, number: 'ORC-001', title: 'Orcamento' };
            mockTxOrcamentoCreate.mockResolvedValue(newOrcamento);

            await createOrcamento(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(201);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Orçamento criado com sucesso',
                orcamento: newOrcamento,
            });
        });

        it('deve criar com solicitacaoId e atualizar status', async () => {
            mockRequest.body = { clienteId, title: 'Orcamento', description: 'Desc', value: '1000', solicitacaoId: 'sol-123' };
            mockClienteFindFirst.mockResolvedValue({ id: clienteId, userId });
            mockOrcamentoFindFirst.mockResolvedValue(null);
            mockTxOrcamentoCreate.mockResolvedValue({ id: orcamentoId });
            mockTxSolicitacaoUpdate.mockResolvedValue({});

            await createOrcamento(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockTxSolicitacaoUpdate).toHaveBeenCalledWith({
                where: { id: 'sol-123' },
                data: { status: 'ORCAMENTO_ENVIADO' },
            });
        });

        it('deve retornar 400 se campos obrigatórios não fornecidos', async () => {
            mockRequest.body = { clienteId };

            await createOrcamento(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Cliente, título, descrição e valor são obrigatórios',
            });
        });

        it('deve retornar 404 se cliente não encontrado', async () => {
            mockRequest.body = { clienteId, title: 'Orc', description: 'Desc', value: '1000' };
            mockClienteFindFirst.mockResolvedValue(null);

            await createOrcamento(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Cliente não encontrado' });
        });

        it('deve retornar erro 500 em caso de falha', async () => {
            mockRequest.body = { clienteId, title: 'Orc', description: 'Desc', value: '1000' };
            mockClienteFindFirst.mockRejectedValue(new Error('Database error'));

            await createOrcamento(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Erro ao criar orçamento' });
        });
    });

    describe('updateOrcamento', () => {
        beforeEach(() => {
            mockRequest.params = { id: orcamentoId };
        });

        it('deve atualizar orçamento com sucesso', async () => {
            mockRequest.body = { title: 'Título Atualizado' };
            mockOrcamentoFindFirst.mockResolvedValue({ id: orcamentoId, status: 'AGUARDANDO' });
            const updated = { id: orcamentoId, title: 'Título Atualizado' };
            mockOrcamentoUpdate.mockResolvedValue(updated);

            await updateOrcamento(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Orçamento atualizado com sucesso',
                orcamento: updated,
            });
        });

        it('deve definir sentAt quando status muda para ENVIADO', async () => {
            mockRequest.body = { status: 'ENVIADO' };
            mockOrcamentoFindFirst.mockResolvedValue({ id: orcamentoId, status: 'AGUARDANDO', sentAt: null });
            mockOrcamentoUpdate.mockResolvedValue({ id: orcamentoId, status: 'ENVIADO' });

            await updateOrcamento(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockOrcamentoUpdate).toHaveBeenCalledWith({
                where: { id: orcamentoId },
                data: expect.objectContaining({ sentAt: expect.any(Date) }),
            });
        });

        it('deve definir approvedAt e notificar quando status muda para APROVADO', async () => {
            mockRequest.body = { status: 'APROVADO' };
            mockOrcamentoFindFirst.mockResolvedValue({ id: orcamentoId, status: 'ENVIADO', approvedAt: null });
            mockOrcamentoUpdate.mockResolvedValue({ id: orcamentoId, status: 'APROVADO' });

            await updateOrcamento(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockOrcamentoUpdate).toHaveBeenCalledWith({
                where: { id: orcamentoId },
                data: expect.objectContaining({ approvedAt: expect.any(Date) }),
            });
            expect(NotificacaoService.notificarOrcamentoAprovado).toHaveBeenCalledWith(orcamentoId);
        });

        it('deve retornar 404 se não encontrado', async () => {
            mockRequest.body = { title: 'Teste' };
            mockOrcamentoFindFirst.mockResolvedValue(null);

            await updateOrcamento(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Orçamento não encontrado' });
        });

        it('deve retornar erro 500 em caso de falha', async () => {
            mockRequest.body = { title: 'Teste' };
            mockOrcamentoFindFirst.mockRejectedValue(new Error('Database error'));

            await updateOrcamento(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Erro ao atualizar orçamento' });
        });
    });

    describe('enviarOrcamentoPorEmail', () => {
        beforeEach(() => {
            mockRequest.params = { id: orcamentoId };
        });

        it('deve enviar email com sucesso', async () => {
            mockOrcamentoFindFirst.mockResolvedValue({ id: orcamentoId });
            (NotificacaoService.enviarOrcamentoParaCliente as jest.Mock).mockResolvedValue({ success: true });

            await enviarOrcamentoPorEmail(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Orçamento enviado por email com sucesso' });
        });

        it('deve retornar 404 se orçamento não encontrado', async () => {
            mockOrcamentoFindFirst.mockResolvedValue(null);

            await enviarOrcamentoPorEmail(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Orçamento não encontrado' });
        });

        it('deve retornar 500 se envio de email falhar', async () => {
            mockOrcamentoFindFirst.mockResolvedValue({ id: orcamentoId });
            (NotificacaoService.enviarOrcamentoParaCliente as jest.Mock).mockResolvedValue({ success: false });

            await enviarOrcamentoPorEmail(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Erro ao enviar email' });
        });

        it('deve retornar erro 500 em caso de exceção', async () => {
            mockOrcamentoFindFirst.mockRejectedValue(new Error('Database error'));

            await enviarOrcamentoPorEmail(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Erro ao enviar orçamento por email' });
        });
    });

    describe('deleteOrcamento', () => {
        beforeEach(() => {
            mockRequest.params = { id: orcamentoId };
        });

        it('deve excluir orçamento com sucesso', async () => {
            mockOrcamentoFindFirst.mockResolvedValue({ id: orcamentoId, projeto: null });
            mockOrcamentoDelete.mockResolvedValue({});

            await deleteOrcamento(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockOrcamentoDelete).toHaveBeenCalledWith({ where: { id: orcamentoId } });
            expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Orçamento excluído com sucesso' });
        });

        it('deve retornar 404 se não encontrado', async () => {
            mockOrcamentoFindFirst.mockResolvedValue(null);

            await deleteOrcamento(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Orçamento não encontrado' });
        });

        it('deve retornar 400 se tem projeto associado', async () => {
            mockOrcamentoFindFirst.mockResolvedValue({ id: orcamentoId, projeto: { id: 'proj-1' } });

            await deleteOrcamento(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Não é possível excluir orçamento com projeto associado',
            });
        });

        it('deve retornar erro 500 em caso de falha', async () => {
            mockOrcamentoFindFirst.mockRejectedValue(new Error('Database error'));

            await deleteOrcamento(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Erro ao excluir orçamento' });
        });
    });
});
