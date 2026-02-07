import { Response } from 'express';
import { AuthRequest } from '../../middlewares/auth.middleware';

jest.mock('../../services/notificacao.service', () => ({
    NotificacaoService: {
        notificarPagamentoConfirmado: jest.fn().mockResolvedValue(undefined),
    },
}));

// Mocks
const mockPrismaFindMany = jest.fn();
const mockPrismaFindFirst = jest.fn();
const mockPrismaCreate = jest.fn();
const mockPrismaCreateMany = jest.fn();
const mockPrismaUpdate = jest.fn();
const mockPrismaDelete = jest.fn();
const mockPrismaAggregate = jest.fn();

// Mock do Prisma
jest.mock('../../config/database', () => ({
    __esModule: true,
    default: {
        pagamento: {
            findMany: mockPrismaFindMany,
            findFirst: mockPrismaFindFirst,
            create: mockPrismaCreate,
            createMany: mockPrismaCreateMany,
            update: mockPrismaUpdate,
            delete: mockPrismaDelete,
            aggregate: mockPrismaAggregate,
        },
        projeto: {
            findFirst: jest.fn(),
        },
    },
}));

// Importar depois dos mocks
import prisma from '../../config/database';
import {
    getPagamentos,
    getPagamento,
    createPagamento,
    createParcelas,
    updatePagamento,
    marcarComoPago,
    deletePagamento,
    getResumoFinanceiro,
} from '../../controllers/pagamentos.controller';

describe('Pagamentos Controller', () => {
    let mockRequest: Partial<AuthRequest>;
    let mockResponse: Partial<Response>;

    beforeEach(() => {
        mockRequest = {
            userId: 'user-123',
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

    describe('getPagamentos', () => {
        it('deve retornar todos os pagamentos do usuário', async () => {
            const mockPagamentos = [
                {
                    id: '1',
                    userId: 'user-123',
                    projetoId: 'proj-1',
                    description: 'Pagamento 1',
                    value: 1000,
                    dueDate: new Date('2025-12-31'),
                    status: 'PENDENTE',
                    projeto: {
                        number: 1,
                        title: 'Projeto 1',
                        cliente: { name: 'Cliente 1', company: 'Empresa 1' },
                    },
                },
            ];

            mockPrismaFindMany.mockResolvedValue(mockPagamentos);

            await getPagamentos(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockPrismaFindMany).toHaveBeenCalledWith({
                where: { userId: 'user-123' },
                orderBy: { dueDate: 'asc' },
                include: {
                    projeto: {
                        select: {
                            number: true,
                            title: true,
                            cliente: {
                                select: {
                                    name: true,
                                    company: true,
                                },
                            },
                        },
                    },
                },
            });

            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.arrayContaining([
                    expect.objectContaining({
                        id: '1',
                        description: 'Pagamento 1',
                    }),
                ])
            );
        });

        it('deve filtrar por status', async () => {
            mockRequest.query = { status: 'PAGO' };
            mockPrismaFindMany.mockResolvedValue([]);

            await getPagamentos(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockPrismaFindMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        userId: 'user-123',
                        status: 'PAGO',
                    }),
                })
            );
        });

        it('deve filtrar por projeto', async () => {
            mockRequest.query = { projetoId: 'proj-1' };
            mockPrismaFindMany.mockResolvedValue([]);

            await getPagamentos(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockPrismaFindMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        userId: 'user-123',
                        projetoId: 'proj-1',
                    }),
                })
            );
        });

        it('deve marcar pagamentos atrasados', async () => {
            const dataPassada = new Date('2020-01-01');
            const mockPagamentos = [
                {
                    id: '1',
                    userId: 'user-123',
                    dueDate: dataPassada,
                    status: 'PENDENTE',
                    projeto: {
                        number: 1,
                        title: 'Projeto 1',
                        cliente: { name: 'Cliente 1', company: null },
                    },
                },
            ];

            mockPrismaFindMany.mockResolvedValue(mockPagamentos);

            await getPagamentos(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.arrayContaining([
                    expect.objectContaining({
                        status: 'ATRASADO',
                    }),
                ])
            );
        });

        it('deve lidar com erro 500', async () => {
            mockPrismaFindMany.mockRejectedValue(new Error('Database error'));

            await getPagamentos(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Erro ao buscar pagamentos',
            });
        });
    });

    describe('getPagamento', () => {
        it('deve retornar um pagamento específico', async () => {
            mockRequest.params = { id: 'pag-1' };

            const mockPagamento = {
                id: 'pag-1',
                userId: 'user-123',
                description: 'Pagamento teste',
                projeto: {
                    id: 'proj-1',
                    title: 'Projeto 1',
                    cliente: { name: 'Cliente 1' },
                },
            };

            mockPrismaFindFirst.mockResolvedValue(mockPagamento);

            await getPagamento(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockPrismaFindFirst).toHaveBeenCalledWith({
                where: {
                    id: 'pag-1',
                    userId: 'user-123',
                },
                include: {
                    projeto: {
                        include: {
                            cliente: true,
                        },
                    },
                },
            });

            expect(mockResponse.json).toHaveBeenCalledWith(mockPagamento);
        });

        it('deve retornar 404 se pagamento não encontrado', async () => {
            mockRequest.params = { id: 'pag-nao-existe' };
            mockPrismaFindFirst.mockResolvedValue(null);

            await getPagamento(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Pagamento não encontrado',
            });
        });

        it('deve lidar com erro 500', async () => {
            mockRequest.params = { id: 'pag-1' };
            mockPrismaFindFirst.mockRejectedValue(new Error('Database error'));

            await getPagamento(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Erro ao buscar pagamento',
            });
        });
    });

    describe('createPagamento', () => {
        it('deve criar um novo pagamento', async () => {
            mockRequest.body = {
                projetoId: 'proj-1',
                description: 'Pagamento teste',
                value: '1500.00',
                dueDate: '2025-12-31',
                method: 'PIX',
                notes: 'Notas do pagamento',
            };

            const mockProjeto = {
                id: 'proj-1',
                userId: 'user-123',
                title: 'Projeto 1',
            };

            const mockPagamento = {
                id: 'pag-1',
                userId: 'user-123',
                projetoId: 'proj-1',
                description: 'Pagamento teste',
                value: 1500,
                dueDate: new Date('2025-12-31'),
                method: 'PIX',
                notes: 'Notas do pagamento',
                projeto: {
                    number: 1,
                    title: 'Projeto 1',
                },
            };

            (prisma.projeto.findFirst as jest.Mock).mockResolvedValue(mockProjeto);
            mockPrismaCreate.mockResolvedValue(mockPagamento);

            await createPagamento(mockRequest as AuthRequest, mockResponse as Response);

            expect(prisma.projeto.findFirst).toHaveBeenCalledWith({
                where: { id: 'proj-1', userId: 'user-123' },
            });

            expect(mockPrismaCreate).toHaveBeenCalledWith({
                data: {
                    userId: 'user-123',
                    projetoId: 'proj-1',
                    description: 'Pagamento teste',
                    value: 1500,
                    dueDate: expect.any(Date),
                    method: 'PIX',
                    notes: 'Notas do pagamento',
                },
                include: {
                    projeto: {
                        select: {
                            number: true,
                            title: true,
                        },
                    },
                },
            });

            expect(mockResponse.status).toHaveBeenCalledWith(201);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Pagamento criado com sucesso',
                pagamento: mockPagamento,
            });
        });

        it('deve retornar erro 400 se campos obrigatórios estão faltando', async () => {
            mockRequest.body = {
                projetoId: 'proj-1',
                // faltando outros campos
            };

            await createPagamento(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Projeto, descrição, valor e data de vencimento são obrigatórios',
            });
        });

        it('deve retornar erro 404 se projeto não encontrado', async () => {
            mockRequest.body = {
                projetoId: 'proj-nao-existe',
                description: 'Teste',
                value: '1000',
                dueDate: '2025-12-31',
            };

            (prisma.projeto.findFirst as jest.Mock).mockResolvedValue(null);

            await createPagamento(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Projeto não encontrado',
            });
        });

        it('deve lidar com erro 500', async () => {
            mockRequest.body = {
                projetoId: 'proj-1',
                description: 'Teste',
                value: '1000',
                dueDate: '2025-12-31',
            };

            (prisma.projeto.findFirst as jest.Mock).mockRejectedValue(new Error('Database error'));

            await createPagamento(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Erro ao criar pagamento',
            });
        });
    });

    describe('createParcelas', () => {
        it('deve criar múltiplas parcelas', async () => {
            mockRequest.body = {
                projetoId: 'proj-1',
                numeroParcelas: '3',
                primeiroVencimento: '2025-12-31',
            };

            const mockProjeto = {
                id: 'proj-1',
                userId: 'user-123',
                title: 'Projeto 1',
                value: { toNumber: () => 3000 },
            };

            (prisma.projeto.findFirst as jest.Mock).mockResolvedValue(mockProjeto);
            mockPrismaCreateMany.mockResolvedValue({ count: 3 });

            await createParcelas(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockPrismaCreateMany).toHaveBeenCalledWith({
                data: expect.arrayContaining([
                    expect.objectContaining({
                        userId: 'user-123',
                        projetoId: 'proj-1',
                        value: 1000,
                        description: expect.stringContaining('Parcela 1/3'),
                    }),
                    expect.objectContaining({
                        description: expect.stringContaining('Parcela 2/3'),
                    }),
                    expect.objectContaining({
                        description: expect.stringContaining('Parcela 3/3'),
                    }),
                ]),
            });

            expect(mockResponse.status).toHaveBeenCalledWith(201);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: '3 parcelas criadas com sucesso',
                count: 3,
            });
        });

        it('deve retornar erro 400 se campos obrigatórios estão faltando', async () => {
            mockRequest.body = {
                projetoId: 'proj-1',
                // faltando outros campos
            };

            await createParcelas(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Projeto, número de parcelas e primeiro vencimento são obrigatórios',
            });
        });

        it('deve retornar erro 404 se projeto não encontrado', async () => {
            mockRequest.body = {
                projetoId: 'proj-nao-existe',
                numeroParcelas: '3',
                primeiroVencimento: '2025-12-31',
            };

            (prisma.projeto.findFirst as jest.Mock).mockResolvedValue(null);

            await createParcelas(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Projeto não encontrado',
            });
        });

        it('deve lidar com erro 500', async () => {
            mockRequest.body = {
                projetoId: 'proj-1',
                numeroParcelas: '3',
                primeiroVencimento: '2025-12-31',
            };

            (prisma.projeto.findFirst as jest.Mock).mockRejectedValue(new Error('Database error'));

            await createParcelas(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Erro ao criar parcelas',
            });
        });
    });

    describe('updatePagamento', () => {
        it('deve atualizar um pagamento', async () => {
            mockRequest.params = { id: 'pag-1' };
            mockRequest.body = {
                description: 'Descrição atualizada',
                value: '2000',
                status: 'PAGO',
            };

            const mockPagamentoExistente = {
                id: 'pag-1',
                userId: 'user-123',
                description: 'Descrição antiga',
                value: 1000,
                paidAt: null,
            };

            const mockPagamentoAtualizado = {
                ...mockPagamentoExistente,
                description: 'Descrição atualizada',
                value: 2000,
                status: 'PAGO',
                paidAt: expect.any(Date),
            };

            mockPrismaFindFirst.mockResolvedValue(mockPagamentoExistente);
            mockPrismaUpdate.mockResolvedValue(mockPagamentoAtualizado);

            await updatePagamento(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockPrismaUpdate).toHaveBeenCalledWith({
                where: { id: 'pag-1' },
                data: expect.objectContaining({
                    description: 'Descrição atualizada',
                    value: 2000,
                    status: 'PAGO',
                    paidAt: expect.any(Date),
                }),
            });

            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Pagamento atualizado com sucesso',
                pagamento: mockPagamentoAtualizado,
            });
        });

        it('deve remover paidAt quando status não é PAGO', async () => {
            mockRequest.params = { id: 'pag-1' };
            mockRequest.body = {
                status: 'PENDENTE',
            };

            const mockPagamentoExistente = {
                id: 'pag-1',
                userId: 'user-123',
                status: 'PAGO',
                paidAt: new Date(),
            };

            mockPrismaFindFirst.mockResolvedValue(mockPagamentoExistente);
            mockPrismaUpdate.mockResolvedValue({ ...mockPagamentoExistente, status: 'PENDENTE', paidAt: null });

            await updatePagamento(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockPrismaUpdate).toHaveBeenCalledWith({
                where: { id: 'pag-1' },
                data: expect.objectContaining({
                    status: 'PENDENTE',
                    paidAt: null,
                }),
            });
        });

        it('deve retornar erro 404 se pagamento não encontrado', async () => {
            mockRequest.params = { id: 'pag-nao-existe' };
            mockRequest.body = { description: 'Teste' };

            mockPrismaFindFirst.mockResolvedValue(null);

            await updatePagamento(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Pagamento não encontrado',
            });
        });

        it('deve lidar com erro 500', async () => {
            mockRequest.params = { id: 'pag-1' };
            mockRequest.body = { description: 'Teste' };

            mockPrismaFindFirst.mockRejectedValue(new Error('Database error'));

            await updatePagamento(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Erro ao atualizar pagamento',
            });
        });
    });

    describe('marcarComoPago', () => {
        it('deve marcar pagamento como pago', async () => {
            mockRequest.params = { id: 'pag-1' };
            mockRequest.body = {
                method: 'PIX',
                notes: 'Pago via PIX',
                receipt: 'recibo.pdf',
            };

            const mockPagamentoExistente = {
                id: 'pag-1',
                userId: 'user-123',
                status: 'PENDENTE',
            };

            const mockPagamentoPago = {
                ...mockPagamentoExistente,
                status: 'PAGO',
                paidAt: expect.any(Date),
                method: 'PIX',
                notes: 'Pago via PIX',
                receipt: 'recibo.pdf',
            };

            mockPrismaFindFirst.mockResolvedValue(mockPagamentoExistente);
            mockPrismaUpdate.mockResolvedValue(mockPagamentoPago);

            await marcarComoPago(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockPrismaUpdate).toHaveBeenCalledWith({
                where: { id: 'pag-1' },
                data: {
                    status: 'PAGO',
                    paidAt: expect.any(Date),
                    method: 'PIX',
                    notes: 'Pago via PIX',
                    receipt: 'recibo.pdf',
                },
            });

            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Pagamento marcado como pago',
                pagamento: mockPagamentoPago,
            });
        });

        it('deve retornar erro 404 se pagamento não encontrado', async () => {
            mockRequest.params = { id: 'pag-nao-existe' };
            mockPrismaFindFirst.mockResolvedValue(null);

            await marcarComoPago(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Pagamento não encontrado',
            });
        });

        it('deve lidar com erro 500', async () => {
            mockRequest.params = { id: 'pag-1' };
            mockPrismaFindFirst.mockRejectedValue(new Error('Database error'));

            await marcarComoPago(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Erro ao marcar pagamento como pago',
            });
        });
    });

    describe('deletePagamento', () => {
        it('deve deletar um pagamento', async () => {
            mockRequest.params = { id: 'pag-1' };

            const mockPagamento = {
                id: 'pag-1',
                userId: 'user-123',
            };

            mockPrismaFindFirst.mockResolvedValue(mockPagamento);
            mockPrismaDelete.mockResolvedValue(mockPagamento);

            await deletePagamento(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockPrismaDelete).toHaveBeenCalledWith({
                where: { id: 'pag-1' },
            });

            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Pagamento excluído com sucesso',
            });
        });

        it('deve retornar erro 404 se pagamento não encontrado', async () => {
            mockRequest.params = { id: 'pag-nao-existe' };
            mockPrismaFindFirst.mockResolvedValue(null);

            await deletePagamento(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Pagamento não encontrado',
            });
        });

        it('deve lidar com erro 500', async () => {
            mockRequest.params = { id: 'pag-1' };
            mockPrismaFindFirst.mockRejectedValue(new Error('Database error'));

            await deletePagamento(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Erro ao excluir pagamento',
            });
        });
    });

    describe('getResumoFinanceiro', () => {
        it('deve retornar resumo financeiro completo', async () => {
            const mockAggregateRecebido = { _sum: { value: 5000 } };
            const mockAggregatePendente = { _sum: { value: 3000 } };
            const mockAggregateAtrasado = { _sum: { value: 1000 } };
            const mockPagamentosProximos = [
                {
                    id: 'pag-1',
                    description: 'Pagamento próximo',
                    dueDate: new Date('2025-12-15'),
                    projeto: {
                        number: 1,
                        title: 'Projeto 1',
                        cliente: { name: 'Cliente 1' },
                    },
                },
            ];

            mockPrismaAggregate
                .mockResolvedValueOnce(mockAggregateRecebido)
                .mockResolvedValueOnce(mockAggregatePendente)
                .mockResolvedValueOnce(mockAggregateAtrasado);

            mockPrismaFindMany.mockResolvedValue(mockPagamentosProximos);

            await getResumoFinanceiro(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockPrismaAggregate).toHaveBeenCalledTimes(3);
            expect(mockPrismaFindMany).toHaveBeenCalled();

            expect(mockResponse.json).toHaveBeenCalledWith({
                totalRecebido: 5000,
                totalPendente: 3000,
                totalAtrasado: 1000,
                pagamentosProximos: mockPagamentosProximos,
            });
        });

        it('deve retornar 0 quando não há valores', async () => {
            mockPrismaAggregate
                .mockResolvedValueOnce({ _sum: { value: null } })
                .mockResolvedValueOnce({ _sum: { value: null } })
                .mockResolvedValueOnce({ _sum: { value: null } });

            mockPrismaFindMany.mockResolvedValue([]);

            await getResumoFinanceiro(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockResponse.json).toHaveBeenCalledWith({
                totalRecebido: 0,
                totalPendente: 0,
                totalAtrasado: 0,
                pagamentosProximos: [],
            });
        });

        it('deve lidar com erro 500', async () => {
            mockPrismaAggregate.mockRejectedValue(new Error('Database error'));

            await getResumoFinanceiro(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Erro ao buscar resumo financeiro',
            });
        });
    });
});
