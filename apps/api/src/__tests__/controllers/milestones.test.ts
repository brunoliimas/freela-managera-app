import { Response } from 'express';
import { AuthRequest } from '../../middlewares/auth.middleware';

jest.mock('../../config/logger', () => ({
    __esModule: true,
    default: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

jest.mock('../../services/notificacao.service', () => ({
    NotificacaoService: {
        notificarMilestoneConcluido: jest.fn().mockResolvedValue(undefined),
    },
}));

const mockProjetoFindFirst = jest.fn();
const mockMilestoneFindMany = jest.fn();
const mockMilestoneFindFirst = jest.fn();
const mockMilestoneCreate = jest.fn();
const mockMilestoneUpdate = jest.fn();
const mockMilestoneDelete = jest.fn();
const mockProjetoUpdate = jest.fn();

const mockTxMilestoneUpdate = jest.fn();
const mockTxMilestoneFindMany = jest.fn();
const mockTxProjetoUpdate = jest.fn();

const mockPrismaInstance = {
    projeto: {
        findFirst: mockProjetoFindFirst,
        update: mockProjetoUpdate,
    },
    milestone: {
        findMany: mockMilestoneFindMany,
        findFirst: mockMilestoneFindFirst,
        create: mockMilestoneCreate,
        update: mockMilestoneUpdate,
        delete: mockMilestoneDelete,
    },
};

jest.mock('../../config/database', () => ({
    __esModule: true,
    default: {
        ...mockPrismaInstance,
        $transaction: jest.fn((fn) => fn({
            milestone: {
                update: mockTxMilestoneUpdate,
                findMany: mockTxMilestoneFindMany,
            },
            projeto: {
                update: mockTxProjetoUpdate,
            },
        })),
    },
}));

import { getMilestones, createMilestone, updateMilestone, deleteMilestone } from '../../controllers/milestones.controller';

describe('Milestones Controller', () => {
    let mockRequest: Partial<AuthRequest>;
    let mockResponse: Partial<Response>;
    const userId = 'user-123';
    const projetoId = 'projeto-123';
    const milestoneId = 'milestone-123';

    beforeEach(() => {
        mockRequest = {
            userId,
            params: { projetoId },
            body: {},
        };

        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };

        jest.clearAllMocks();
    });

    describe('getMilestones', () => {
        it('deve retornar lista de milestones do projeto', async () => {
            const mockMilestones = [
                { id: '1', title: 'Milestone 1', order: 1 },
                { id: '2', title: 'Milestone 2', order: 2 },
            ];
            mockProjetoFindFirst.mockResolvedValue({ id: projetoId, userId });
            mockMilestoneFindMany.mockResolvedValue(mockMilestones);

            await getMilestones(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockResponse.json).toHaveBeenCalledWith(mockMilestones);
        });

        it('deve retornar 404 se projeto não encontrado', async () => {
            mockProjetoFindFirst.mockResolvedValue(null);

            await getMilestones(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Projeto não encontrado' });
        });

        it('deve retornar erro 500 em caso de falha', async () => {
            mockProjetoFindFirst.mockRejectedValue(new Error('Database error'));

            await getMilestones(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Erro ao buscar milestones' });
        });
    });

    describe('createMilestone', () => {
        it('deve criar milestone com sucesso', async () => {
            mockRequest.body = { title: 'Novo Milestone', description: 'Descrição' };
            mockProjetoFindFirst.mockResolvedValue({ id: projetoId, userId });
            mockMilestoneFindFirst.mockResolvedValue({ order: 2 });
            const newMilestone = { id: milestoneId, title: 'Novo Milestone', order: 3 };
            mockMilestoneCreate.mockResolvedValue(newMilestone);

            await createMilestone(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(201);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Milestone criado com sucesso',
                milestone: newMilestone,
            });
        });

        it('deve criar primeiro milestone com order 1', async () => {
            mockRequest.body = { title: 'Primeiro Milestone' };
            mockProjetoFindFirst.mockResolvedValue({ id: projetoId, userId });
            mockMilestoneFindFirst.mockResolvedValue(null);
            mockMilestoneCreate.mockResolvedValue({ id: milestoneId, title: 'Primeiro Milestone', order: 1 });

            await createMilestone(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockMilestoneCreate).toHaveBeenCalledWith({
                data: expect.objectContaining({ order: 1 }),
            });
        });

        it('deve retornar 400 se título não fornecido', async () => {
            mockRequest.body = {};

            await createMilestone(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Título é obrigatório' });
        });

        it('deve retornar 404 se projeto não encontrado', async () => {
            mockRequest.body = { title: 'Milestone' };
            mockProjetoFindFirst.mockResolvedValue(null);

            await createMilestone(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Projeto não encontrado' });
        });

        it('deve retornar erro 500 em caso de falha', async () => {
            mockRequest.body = { title: 'Milestone' };
            mockProjetoFindFirst.mockRejectedValue(new Error('Database error'));

            await createMilestone(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Erro ao criar milestone' });
        });
    });

    describe('updateMilestone', () => {
        beforeEach(() => {
            mockRequest.params = { projetoId, id: milestoneId };
        });

        it('deve atualizar milestone com sucesso', async () => {
            mockRequest.body = { title: 'Título Atualizado' };
            mockMilestoneFindFirst.mockResolvedValue({ id: milestoneId, projetoId, completed: false });
            mockTxMilestoneUpdate.mockResolvedValue({ id: milestoneId, title: 'Título Atualizado' });
            mockTxMilestoneFindMany.mockResolvedValue([{ completed: false }, { completed: true }]);
            mockTxProjetoUpdate.mockResolvedValue({});

            await updateMilestone(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Milestone atualizado com sucesso',
                milestone: { id: milestoneId, title: 'Título Atualizado' },
            });
        });

        it('deve marcar milestone como concluído e definir completedAt', async () => {
            mockRequest.body = { completed: true };
            mockMilestoneFindFirst.mockResolvedValue({ id: milestoneId, projetoId, completed: false, completedAt: null });
            mockTxMilestoneUpdate.mockResolvedValue({ id: milestoneId, completed: true, completedAt: new Date() });
            mockTxMilestoneFindMany.mockResolvedValue([{ completed: true }]);
            mockTxProjetoUpdate.mockResolvedValue({});

            await updateMilestone(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockTxMilestoneUpdate).toHaveBeenCalledWith({
                where: { id: milestoneId },
                data: expect.objectContaining({ completed: true, completedAt: expect.any(Date) }),
            });
        });

        it('deve desmarcar milestone e limpar completedAt', async () => {
            mockRequest.body = { completed: false };
            mockMilestoneFindFirst.mockResolvedValue({ id: milestoneId, projetoId, completed: true, completedAt: new Date() });
            mockTxMilestoneUpdate.mockResolvedValue({ id: milestoneId, completed: false, completedAt: null });
            mockTxMilestoneFindMany.mockResolvedValue([{ completed: false }]);
            mockTxProjetoUpdate.mockResolvedValue({});

            await updateMilestone(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockTxMilestoneUpdate).toHaveBeenCalledWith({
                where: { id: milestoneId },
                data: expect.objectContaining({ completed: false, completedAt: null }),
            });
        });

        it('deve retornar 404 se milestone não encontrado', async () => {
            mockRequest.body = { title: 'Teste' };
            mockMilestoneFindFirst.mockResolvedValue(null);

            await updateMilestone(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Milestone não encontrado' });
        });

        it('deve retornar erro 500 em caso de falha', async () => {
            mockRequest.body = { title: 'Teste' };
            mockMilestoneFindFirst.mockRejectedValue(new Error('Database error'));

            await updateMilestone(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Erro ao atualizar milestone' });
        });
    });

    describe('deleteMilestone', () => {
        beforeEach(() => {
            mockRequest.params = { projetoId, id: milestoneId };
        });

        it('deve excluir milestone com sucesso', async () => {
            mockMilestoneFindFirst.mockResolvedValue({ id: milestoneId, projetoId });
            mockMilestoneDelete.mockResolvedValue({});

            await deleteMilestone(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Milestone excluído com sucesso' });
        });

        it('deve retornar 404 se milestone não encontrado', async () => {
            mockMilestoneFindFirst.mockResolvedValue(null);

            await deleteMilestone(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Milestone não encontrado' });
        });

        it('deve retornar erro 500 em caso de falha', async () => {
            mockMilestoneFindFirst.mockRejectedValue(new Error('Database error'));

            await deleteMilestone(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Erro ao excluir milestone' });
        });
    });
});
