import { Response } from 'express';
import { AuthRequest } from '../../middlewares/auth.middleware';

jest.mock('../../config/logger', () => ({
    __esModule: true,
    default: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

const mockQueryRaw = jest.fn();
const mockProjetoGroupBy = jest.fn();
const mockProjetoFindMany = jest.fn();
const mockProjetoAggregate = jest.fn();
const mockClienteFindMany = jest.fn();
const mockSolicitacaoCount = jest.fn();
const mockOrcamentoCount = jest.fn();
const mockProjetoCount = jest.fn();
const mockPagamentoAggregate = jest.fn();

jest.mock('../../config/database', () => ({
    __esModule: true,
    default: {
        $queryRaw: mockQueryRaw,
        projeto: {
            groupBy: mockProjetoGroupBy,
            findMany: mockProjetoFindMany,
            aggregate: mockProjetoAggregate,
            count: mockProjetoCount,
        },
        cliente: {
            findMany: mockClienteFindMany,
        },
        solicitacao: {
            count: mockSolicitacaoCount,
        },
        orcamento: {
            count: mockOrcamentoCount,
        },
        pagamento: {
            aggregate: mockPagamentoAggregate,
        },
    },
}));

import { getRelatorioFinanceiro, getComparacaoAnual } from '../../controllers/relatorios.controller';

describe('Relatorios Controller', () => {
    let mockRequest: Partial<AuthRequest>;
    let mockResponse: Partial<Response>;
    const userId = 'user-123';

    beforeEach(() => {
        mockRequest = {
            userId,
            query: {},
        };

        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };

        jest.clearAllMocks();
    });

    describe('getRelatorioFinanceiro', () => {
        const setupMocks = () => {
            mockQueryRaw.mockResolvedValue([{ mes: 1, total: 5000 }, { mes: 3, total: 8000 }]);
            mockProjetoGroupBy.mockResolvedValue([
                { status: 'EM_ANDAMENTO', _count: { id: 3 } },
                { status: 'CONCLUIDO', _count: { id: 5 } },
            ]);
            mockClienteFindMany.mockResolvedValue([
                { id: 'c1', name: 'Cliente 1', company: 'Empresa 1', projetos: [{ value: { toNumber: () => 10000 } }] },
                { id: 'c2', name: 'Cliente 2', company: null, projetos: [{ value: { toNumber: () => 5000 } }] },
            ]);
            mockSolicitacaoCount.mockResolvedValue(10);
            mockOrcamentoCount.mockResolvedValue(8);
            mockProjetoCount.mockResolvedValue(6);
            mockProjetoFindMany.mockResolvedValue([
                { startDate: new Date('2024-01-01'), completedAt: new Date('2024-01-15') },
                { startDate: new Date('2024-02-01'), completedAt: new Date('2024-02-21') },
            ]);
            mockPagamentoAggregate
                .mockResolvedValueOnce({ _sum: { value: { toNumber: () => 50000 } } }) // totalRecebido
                .mockResolvedValueOnce({ _sum: { value: { toNumber: () => 20000 } } }); // totalAReceber
            mockProjetoAggregate.mockResolvedValue({ _avg: { value: { toNumber: () => 15000 } } });
        };

        it('deve retornar relatório financeiro completo', async () => {
            setupMocks();

            await getRelatorioFinanceiro(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockResponse.json).toHaveBeenCalled();
            const result = (mockResponse.json as jest.Mock).mock.calls[0][0];
            expect(result.ano).toBeDefined();
            expect(result.faturamentoMensal).toHaveLength(12);
            expect(result.faturamentoMensal[0].mes).toBe(1);
            expect(result.projetosPorStatus).toHaveLength(2);
            expect(result.topClientes).toHaveLength(2);
            expect(result.taxaConversao.solicitacoes).toBe(10);
            expect(result.resumo.totalRecebido).toBe(50000);
        });

        it('deve filtrar por ano quando fornecido', async () => {
            mockRequest.query = { ano: '2023' };
            setupMocks();

            await getRelatorioFinanceiro(mockRequest as AuthRequest, mockResponse as Response);

            const result = (mockResponse.json as jest.Mock).mock.calls[0][0];
            expect(result.ano).toBe(2023);
        });

        it('deve retornar zeros quando não há dados', async () => {
            mockQueryRaw.mockResolvedValue([]);
            mockProjetoGroupBy.mockResolvedValue([]);
            mockClienteFindMany.mockResolvedValue([]);
            mockSolicitacaoCount.mockResolvedValue(0);
            mockOrcamentoCount.mockResolvedValue(0);
            mockProjetoCount.mockResolvedValue(0);
            mockProjetoFindMany.mockResolvedValue([]);
            mockPagamentoAggregate.mockResolvedValue({ _sum: { value: null } });
            mockProjetoAggregate.mockResolvedValue({ _avg: { value: null } });

            await getRelatorioFinanceiro(mockRequest as AuthRequest, mockResponse as Response);

            const result = (mockResponse.json as jest.Mock).mock.calls[0][0];
            expect(result.faturamentoMensal.every((m: { valor: number }) => m.valor === 0)).toBe(true);
            expect(result.topClientes).toHaveLength(0);
            expect(result.taxaConversao.solicitacaoParaOrcamento).toBe('0');
            expect(result.resumo.totalRecebido).toBe(0);
        });

        it('deve retornar erro 500 em caso de falha', async () => {
            mockQueryRaw.mockRejectedValue(new Error('Database error'));

            await getRelatorioFinanceiro(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Erro ao gerar relatório',
            });
        });
    });

    describe('getComparacaoAnual', () => {
        it('deve retornar comparação entre anos', async () => {
            mockPagamentoAggregate
                .mockResolvedValueOnce({ _sum: { value: { toNumber: () => 100000 } }, _count: 20 })
                .mockResolvedValueOnce({ _sum: { value: { toNumber: () => 80000 } }, _count: 15 });

            await getComparacaoAnual(mockRequest as AuthRequest, mockResponse as Response);

            const result = (mockResponse.json as jest.Mock).mock.calls[0][0];
            expect(result.anoAtual.faturamento).toBe(100000);
            expect(result.anoAnterior.faturamento).toBe(80000);
            expect(result.crescimento).toBe(25);
        });

        it('deve retornar crescimento 0 quando ano anterior é zero', async () => {
            mockPagamentoAggregate
                .mockResolvedValueOnce({ _sum: { value: { toNumber: () => 50000 } }, _count: 10 })
                .mockResolvedValueOnce({ _sum: { value: null }, _count: 0 });

            await getComparacaoAnual(mockRequest as AuthRequest, mockResponse as Response);

            const result = (mockResponse.json as jest.Mock).mock.calls[0][0];
            expect(result.crescimento).toBe(0);
        });

        it('deve retornar erro 500 em caso de falha', async () => {
            mockPagamentoAggregate.mockRejectedValue(new Error('Database error'));

            await getComparacaoAnual(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Erro ao gerar comparação',
            });
        });
    });
});
