import { Response } from 'express';
import { AuthRequest } from '../../middlewares/auth.middleware';

jest.mock('../../config/logger', () => ({
    __esModule: true,
    default: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

const mockPrismaClienteCount = jest.fn();
const mockPrismaSolicitacaoCount = jest.fn();
const mockPrismaSolicitacaoFindMany = jest.fn();
const mockPrismaOrcamentoCount = jest.fn();
const mockPrismaOrcamentoFindMany = jest.fn();
const mockPrismaOrcamentoAggregate = jest.fn();
const mockPrismaProjetoCount = jest.fn();
const mockPrismaProjetoFindMany = jest.fn();
const mockPrismaProjetoAggregate = jest.fn();

jest.mock('../../config/database', () => ({
    __esModule: true,
    default: {
        cliente: {
            count: mockPrismaClienteCount,
        },
        solicitacao: {
            count: mockPrismaSolicitacaoCount,
            findMany: mockPrismaSolicitacaoFindMany,
        },
        orcamento: {
            count: mockPrismaOrcamentoCount,
            findMany: mockPrismaOrcamentoFindMany,
            aggregate: mockPrismaOrcamentoAggregate,
        },
        projeto: {
            count: mockPrismaProjetoCount,
            findMany: mockPrismaProjetoFindMany,
            aggregate: mockPrismaProjetoAggregate,
        },
    },
}));

import { getDashboard } from '../../controllers/dashboard.controller';

describe('Dashboard Controller', () => {
    let mockRequest: Partial<AuthRequest>;
    let mockResponse: Partial<Response>;
    const userId = 'user-123';

    beforeEach(() => {
        mockRequest = {
            userId,
        };

        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };

        jest.clearAllMocks();
    });

    describe('getDashboard', () => {
        it('deve retornar estatísticas completas do dashboard', async () => {
            // Mock counts
            mockPrismaClienteCount.mockResolvedValueOnce(10); // total
            mockPrismaClienteCount.mockResolvedValueOnce(8); // ativos
            mockPrismaSolicitacaoCount.mockResolvedValueOnce(15); // total
            mockPrismaSolicitacaoCount.mockResolvedValueOnce(3); // novas
            mockPrismaOrcamentoCount.mockResolvedValueOnce(20); // total
            mockPrismaOrcamentoCount.mockResolvedValueOnce(5); // enviados
            mockPrismaOrcamentoCount.mockResolvedValueOnce(10); // aprovados
            mockPrismaProjetoCount.mockResolvedValueOnce(12); // total
            mockPrismaProjetoCount.mockResolvedValueOnce(4); // em andamento
            mockPrismaProjetoCount.mockResolvedValueOnce(6); // concluidos

            // Mock findMany (recentes)
            mockPrismaSolicitacaoFindMany.mockResolvedValue([{ id: 's1', title: 'Solicitacao 1' }]);
            mockPrismaOrcamentoFindMany.mockResolvedValue([{ id: 'o1', title: 'Orcamento 1' }]);
            mockPrismaProjetoFindMany.mockResolvedValue([{ id: 'p1', title: 'Projeto 1' }]);

            // Mock aggregates
            mockPrismaOrcamentoAggregate.mockResolvedValue({ _sum: { value: 50000 } });
            mockPrismaProjetoAggregate.mockResolvedValueOnce({ _sum: { value: 100000 } }); // total
            mockPrismaProjetoAggregate.mockResolvedValueOnce({ _sum: { value: 40000 } }); // andamento
            mockPrismaProjetoAggregate.mockResolvedValueOnce({ _sum: { value: 60000 } }); // concluidos

            await getDashboard(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockResponse.json).toHaveBeenCalledWith({
                stats: {
                    clientes: { total: 10, ativos: 8 },
                    solicitacoes: { total: 15, novas: 3 },
                    orcamentos: { total: 20, enviados: 5, aprovados: 10, valorTotal: 50000 },
                    projetos: {
                        total: 12,
                        emAndamento: 4,
                        concluidos: 6,
                        valorTotal: 100000,
                        valorAndamento: 40000,
                        valorConcluidos: 60000,
                    },
                },
                recentes: {
                    solicitacoes: [{ id: 's1', title: 'Solicitacao 1' }],
                    orcamentos: [{ id: 'o1', title: 'Orcamento 1' }],
                    projetos: [{ id: 'p1', title: 'Projeto 1' }],
                },
            });
        });

        it('deve retornar zeros quando não há dados', async () => {
            // Mock counts - all zeros
            mockPrismaClienteCount.mockResolvedValue(0);
            mockPrismaSolicitacaoCount.mockResolvedValue(0);
            mockPrismaOrcamentoCount.mockResolvedValue(0);
            mockPrismaProjetoCount.mockResolvedValue(0);

            // Mock findMany - empty arrays
            mockPrismaSolicitacaoFindMany.mockResolvedValue([]);
            mockPrismaOrcamentoFindMany.mockResolvedValue([]);
            mockPrismaProjetoFindMany.mockResolvedValue([]);

            // Mock aggregates - null sums
            mockPrismaOrcamentoAggregate.mockResolvedValue({ _sum: { value: null } });
            mockPrismaProjetoAggregate.mockResolvedValue({ _sum: { value: null } });

            await getDashboard(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockResponse.json).toHaveBeenCalledWith({
                stats: {
                    clientes: { total: 0, ativos: 0 },
                    solicitacoes: { total: 0, novas: 0 },
                    orcamentos: { total: 0, enviados: 0, aprovados: 0, valorTotal: 0 },
                    projetos: {
                        total: 0,
                        emAndamento: 0,
                        concluidos: 0,
                        valorTotal: 0,
                        valorAndamento: 0,
                        valorConcluidos: 0,
                    },
                },
                recentes: {
                    solicitacoes: [],
                    orcamentos: [],
                    projetos: [],
                },
            });
        });

        it('deve retornar erro 500 em caso de falha', async () => {
            mockPrismaClienteCount.mockRejectedValue(new Error('Database error'));

            await getDashboard(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Erro ao carregar dashboard',
            });
        });
    });
});
