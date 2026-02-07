import { Response } from 'express';
import { AuthRequest } from '../../middlewares/auth.middleware';

jest.mock('../../config/logger', () => ({
    __esModule: true,
    default: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

jest.mock('../../services/notificacao.service', () => ({
    NotificacaoService: {
        notificarNovoArquivo: jest.fn().mockResolvedValue(undefined),
    },
}));

jest.mock('fs', () => ({
    unlinkSync: jest.fn(),
    existsSync: jest.fn(),
}));

const mockProjetoFindFirst = jest.fn();
const mockArquivoCreate = jest.fn();
const mockArquivoFindMany = jest.fn();
const mockArquivoFindFirst = jest.fn();
const mockArquivoDelete = jest.fn();

jest.mock('../../config/database', () => ({
    __esModule: true,
    default: {
        projeto: {
            findFirst: mockProjetoFindFirst,
        },
        arquivo: {
            create: mockArquivoCreate,
            findMany: mockArquivoFindMany,
            findFirst: mockArquivoFindFirst,
            delete: mockArquivoDelete,
        },
    },
}));

import fs from 'fs';
import { uploadArquivo, getArquivos, getArquivo, downloadArquivo, deleteArquivo } from '../../controllers/arquivos.controller';

describe('Arquivos Controller', () => {
    let mockRequest: Partial<AuthRequest>;
    let mockResponse: Partial<Response>;
    const userId = 'user-123';
    const projetoId = 'projeto-123';
    const arquivoId = 'arquivo-123';

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
            download: jest.fn(),
        };

        jest.clearAllMocks();
    });

    describe('uploadArquivo', () => {
        it('deve fazer upload com sucesso', async () => {
            mockRequest.body = { projetoId };
            mockRequest.file = {
                path: '/tmp/file.pdf',
                originalname: 'documento.pdf',
                filename: 'abc123.pdf',
                size: 1024,
                mimetype: 'application/pdf',
            } as Express.Multer.File;
            mockProjetoFindFirst.mockResolvedValue({ id: projetoId, userId });
            const arquivo = { id: arquivoId, name: 'documento.pdf', url: '/uploads/abc123.pdf' };
            mockArquivoCreate.mockResolvedValue(arquivo);

            await uploadArquivo(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(201);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Arquivo enviado com sucesso',
                arquivo,
            });
        });

        it('deve retornar 400 se nenhum arquivo enviado', async () => {
            mockRequest.body = { projetoId };
            mockRequest.file = undefined;

            await uploadArquivo(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Nenhum arquivo enviado' });
        });

        it('deve retornar 400 e deletar arquivo se projetoId não fornecido', async () => {
            mockRequest.body = {};
            mockRequest.file = { path: '/tmp/file.pdf' } as Express.Multer.File;

            await uploadArquivo(mockRequest as AuthRequest, mockResponse as Response);

            expect(fs.unlinkSync).toHaveBeenCalledWith('/tmp/file.pdf');
            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Projeto é obrigatório' });
        });

        it('deve retornar 404 e deletar arquivo se projeto não encontrado', async () => {
            mockRequest.body = { projetoId };
            mockRequest.file = { path: '/tmp/file.pdf' } as Express.Multer.File;
            mockProjetoFindFirst.mockResolvedValue(null);

            await uploadArquivo(mockRequest as AuthRequest, mockResponse as Response);

            expect(fs.unlinkSync).toHaveBeenCalledWith('/tmp/file.pdf');
            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Projeto não encontrado' });
        });

        it('deve retornar erro 500 e deletar arquivo em caso de falha', async () => {
            mockRequest.body = { projetoId };
            mockRequest.file = { path: '/tmp/file.pdf' } as Express.Multer.File;
            mockProjetoFindFirst.mockRejectedValue(new Error('Database error'));

            await uploadArquivo(mockRequest as AuthRequest, mockResponse as Response);

            expect(fs.unlinkSync).toHaveBeenCalledWith('/tmp/file.pdf');
            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Erro ao enviar arquivo' });
        });
    });

    describe('getArquivos', () => {
        it('deve retornar lista de arquivos', async () => {
            const arquivos = [{ id: arquivoId, name: 'doc.pdf' }];
            mockArquivoFindMany.mockResolvedValue(arquivos);

            await getArquivos(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockResponse.json).toHaveBeenCalledWith(arquivos);
        });

        it('deve filtrar por projetoId', async () => {
            mockRequest.query = { projetoId };
            mockArquivoFindMany.mockResolvedValue([]);

            await getArquivos(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockArquivoFindMany).toHaveBeenCalledWith(expect.objectContaining({
                where: expect.objectContaining({ projetoId }),
            }));
        });

        it('deve retornar erro 500 em caso de falha', async () => {
            mockArquivoFindMany.mockRejectedValue(new Error('Database error'));

            await getArquivos(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Erro ao buscar arquivos' });
        });
    });

    describe('getArquivo', () => {
        beforeEach(() => {
            mockRequest.params = { id: arquivoId };
        });

        it('deve retornar arquivo específico', async () => {
            const arquivo = { id: arquivoId, name: 'doc.pdf', projeto: {} };
            mockArquivoFindFirst.mockResolvedValue(arquivo);

            await getArquivo(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockResponse.json).toHaveBeenCalledWith(arquivo);
        });

        it('deve retornar 404 se não encontrado', async () => {
            mockArquivoFindFirst.mockResolvedValue(null);

            await getArquivo(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Arquivo não encontrado' });
        });

        it('deve retornar erro 500 em caso de falha', async () => {
            mockArquivoFindFirst.mockRejectedValue(new Error('Database error'));

            await getArquivo(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Erro ao buscar arquivo' });
        });
    });

    describe('downloadArquivo', () => {
        beforeEach(() => {
            mockRequest.params = { id: arquivoId };
        });

        it('deve fazer download com sucesso', async () => {
            const arquivo = { id: arquivoId, name: 'documento.pdf', url: '/uploads/abc123.pdf' };
            mockArquivoFindFirst.mockResolvedValue(arquivo);
            (fs.existsSync as jest.Mock).mockReturnValue(true);

            await downloadArquivo(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockResponse.download).toHaveBeenCalled();
        });

        it('deve retornar 404 se arquivo não encontrado no banco', async () => {
            mockArquivoFindFirst.mockResolvedValue(null);

            await downloadArquivo(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Arquivo não encontrado' });
        });

        it('deve retornar 404 se arquivo não existe no disco', async () => {
            const arquivo = { id: arquivoId, name: 'documento.pdf', url: '/uploads/abc123.pdf' };
            mockArquivoFindFirst.mockResolvedValue(arquivo);
            (fs.existsSync as jest.Mock).mockReturnValue(false);

            await downloadArquivo(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Arquivo não encontrado no servidor' });
        });

        it('deve retornar erro 500 em caso de falha', async () => {
            mockArquivoFindFirst.mockRejectedValue(new Error('Database error'));

            await downloadArquivo(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Erro ao fazer download do arquivo' });
        });
    });

    describe('deleteArquivo', () => {
        beforeEach(() => {
            mockRequest.params = { id: arquivoId };
        });

        it('deve excluir arquivo com sucesso', async () => {
            const arquivo = { id: arquivoId, url: '/uploads/abc123.pdf' };
            mockArquivoFindFirst.mockResolvedValue(arquivo);
            mockArquivoDelete.mockResolvedValue({});
            (fs.existsSync as jest.Mock).mockReturnValue(true);

            await deleteArquivo(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockArquivoDelete).toHaveBeenCalledWith({ where: { id: arquivoId } });
            expect(fs.unlinkSync).toHaveBeenCalled();
            expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Arquivo excluído com sucesso' });
        });

        it('deve excluir do banco mesmo se arquivo não existe no disco', async () => {
            const arquivo = { id: arquivoId, url: '/uploads/abc123.pdf' };
            mockArquivoFindFirst.mockResolvedValue(arquivo);
            mockArquivoDelete.mockResolvedValue({});
            (fs.existsSync as jest.Mock).mockReturnValue(false);

            await deleteArquivo(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockArquivoDelete).toHaveBeenCalled();
            expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Arquivo excluído com sucesso' });
        });

        it('deve retornar 404 se não encontrado', async () => {
            mockArquivoFindFirst.mockResolvedValue(null);

            await deleteArquivo(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Arquivo não encontrado' });
        });

        it('deve retornar erro 500 em caso de falha', async () => {
            mockArquivoFindFirst.mockRejectedValue(new Error('Database error'));

            await deleteArquivo(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Erro ao excluir arquivo' });
        });
    });
});
