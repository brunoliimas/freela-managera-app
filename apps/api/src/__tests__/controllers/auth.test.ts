import { Request, Response } from 'express';

// ✅ Mocks mais explícitos
const mockBcryptHash = jest.fn();
const mockBcryptCompare = jest.fn();
const mockGenerateToken = jest.fn();
const mockPrismaUserFindUnique = jest.fn();
const mockPrismaUserFindFirst = jest.fn();
const mockPrismaUserCreate = jest.fn();
const mockPrismaUserUpdate = jest.fn();

// Mock do Prisma
jest.mock('../../config/database', () => ({
    __esModule: true,
    default: {
        user: {
            findUnique: mockPrismaUserFindUnique,
            findFirst: mockPrismaUserFindFirst,
            create: mockPrismaUserCreate,
            update: mockPrismaUserUpdate,
        },
    },
}));

// Mock do bcryptjs (não bcrypt!)
jest.mock('bcryptjs', () => ({
    hash: (...args: any[]) => mockBcryptHash(...args),
    compare: (...args: any[]) => mockBcryptCompare(...args),
}));

// Mock do JWT utils
jest.mock('../../utils/jwt', () => ({
    generateToken: (...args: any[]) => mockGenerateToken(...args),
}));

// Mock do cookie utils
const mockSetTokenCookie = jest.fn();
const mockClearTokenCookie = jest.fn();
jest.mock('../../utils/cookie', () => ({
    setTokenCookie: (...args: any[]) => mockSetTokenCookie(...args),
    clearTokenCookie: (...args: any[]) => mockClearTokenCookie(...args),
}));

// Mock do email
const mockSendEmail = jest.fn();
jest.mock('../../config/email', () => ({
    sendEmail: (...args: any[]) => mockSendEmail(...args),
}));

// Mock dos templates de email
const mockTemplateRecuperacaoSenha = jest.fn().mockReturnValue('<html>reset</html>');
jest.mock('../../templates/email-templates', () => ({
    templateRecuperacaoSenha: (...args: any[]) => mockTemplateRecuperacaoSenha(...args),
}));

// Importar depois dos mocks
import { register, login, logout, forgotPassword, resetPassword, getProfile, updateProfile } from '../../controllers/auth.controller';

describe('Auth Controller', () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;

    beforeEach(() => {
        mockRequest = {
            body: {},
        };

        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };

        // Limpar todos os mocks
        jest.clearAllMocks();
        mockBcryptHash.mockClear();
        mockBcryptCompare.mockClear();
        mockGenerateToken.mockClear();
        mockPrismaUserFindUnique.mockClear();
        mockPrismaUserCreate.mockClear();
        mockPrismaUserUpdate.mockClear();
        mockSetTokenCookie.mockClear();
        mockClearTokenCookie.mockClear();
        mockSendEmail.mockClear();
        mockTemplateRecuperacaoSenha.mockClear();
        mockPrismaUserFindFirst.mockClear();
    });

    describe('register', () => {
        it('deve registrar um novo usuário com sucesso', async () => {
            // Arrange
            mockRequest.body = {
                email: 'test@test.com',
                name: 'Test User',
                password: 'senha123',
            };

            // Mock: usuário não existe
            mockPrismaUserFindUnique.mockResolvedValue(null);

            // Mock: bcrypt hash
            mockBcryptHash.mockResolvedValue('hashedPassword');

            // Mock: criar usuário
            const mockUser = {
                id: '1',
                email: 'test@test.com',
                name: 'Test User',
                password: 'hashedPassword',
                avatar: null,
                phone: null,
                cpf: null,
                cnpj: null,
                company: null,
                bio: null,
                plan: 'FREE',
                stripeCustomerId: null,
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            mockPrismaUserCreate.mockResolvedValue(mockUser);

            // Mock: JWT token
            mockGenerateToken.mockReturnValue('fake-jwt-token');

            // Act
            await register(mockRequest as Request, mockResponse as Response);

            // Assert
            expect(mockPrismaUserFindUnique).toHaveBeenCalledWith({
                where: { email: 'test@test.com' },
            });

            expect(mockBcryptHash).toHaveBeenCalledWith('senha123', 10);

            expect(mockPrismaUserCreate).toHaveBeenCalledWith({
                data: {
                    email: 'test@test.com',
                    name: 'Test User',
                    password: 'hashedPassword',
                    phone: undefined,
                    company: undefined,
                },
                select: expect.objectContaining({
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                    company: true,
                    plan: true,
                    createdAt: true,
                }),
            });

            expect(mockSetTokenCookie).toHaveBeenCalledWith(mockResponse, 'fake-jwt-token');
            expect(mockResponse.status).toHaveBeenCalledWith(201);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Usuário criado com sucesso',
                user: expect.objectContaining({
                    id: '1',
                    email: 'test@test.com',
                    name: 'Test User',
                }),
            });
        });

        it('deve retornar erro se email já existe', async () => {
            mockRequest.body = {
                email: 'existing@test.com',
                name: 'Test',
                password: 'senha123',
            };

            mockPrismaUserFindUnique.mockResolvedValue({
                id: '1',
                email: 'existing@test.com',
            });

            await register(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Email já cadastrado',
            });

            expect(mockPrismaUserCreate).not.toHaveBeenCalled();
        });

        it('deve retornar erro se dados estão faltando', async () => {
            mockRequest.body = {
                email: 'test@test.com',
            };

            await register(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Nome, email e senha são obrigatórios',
            });
        });
    });

    describe('login', () => {
        it('deve fazer login com credenciais válidas', async () => {
            mockRequest.body = {
                email: 'test@test.com',
                password: 'senha123',
            };

            const mockUser = {
                id: '1',
                email: 'test@test.com',
                name: 'Test User',
                password: 'hashedPassword',
            };

            mockPrismaUserFindUnique.mockResolvedValue(mockUser);
            mockBcryptCompare.mockResolvedValue(true);
            mockGenerateToken.mockReturnValue('fake-jwt-token');

            await login(mockRequest as Request, mockResponse as Response);

            expect(mockBcryptCompare).toHaveBeenCalledWith('senha123', 'hashedPassword');
            expect(mockSetTokenCookie).toHaveBeenCalledWith(mockResponse, 'fake-jwt-token');
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Login realizado com sucesso',
                user: expect.objectContaining({
                    id: '1',
                    email: 'test@test.com',
                    name: 'Test User',
                }),
            });
        });

        it('deve retornar erro com senha incorreta', async () => {
            mockRequest.body = {
                email: 'test@test.com',
                password: 'senhaErrada',
            };

            const mockUser = {
                id: '1',
                email: 'test@test.com',
                password: 'hashedPassword',
            };

            mockPrismaUserFindUnique.mockResolvedValue(mockUser);
            mockBcryptCompare.mockResolvedValue(false);

            await login(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(401);
            // ✅ Corrigido: "incorretos" não "inválidos"
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Email ou senha incorretos',
            });
        });

        it('deve retornar erro se usuário não existe', async () => {
            mockRequest.body = {
                email: 'naoexiste@test.com',
                password: 'senha123',
            };

            mockPrismaUserFindUnique.mockResolvedValue(null);

            await login(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(401);
            // ✅ Corrigido: "incorretos" não "inválidos"
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Email ou senha incorretos',
            });
        });

        it('deve retornar erro se email ou senha não fornecidos', async () => {
            mockRequest.body = {
                email: 'test@test.com',
                // Faltando password
            };

            await login(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Email e senha são obrigatórios',
            });
        });

        it('deve lidar com erro 500 ao fazer login', async () => {
            mockRequest.body = {
                email: 'test@test.com',
                password: 'senha123',
            };

            // Simular erro no banco
            mockPrismaUserFindUnique.mockRejectedValue(new Error('Database error'));

            await login(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Erro ao fazer login',
            });
        });
    });

    describe('register - testes adicionais', () => {
        it('deve registrar usuário com campos opcionais (phone e company)', async () => {
            mockRequest.body = {
                email: 'test@test.com',
                name: 'Test User',
                password: 'senha123',
                phone: '11999999999',
                company: 'Test Company',
            };

            mockPrismaUserFindUnique.mockResolvedValue(null);
            mockBcryptHash.mockResolvedValue('hashedPassword');

            const mockUser = {
                id: '1',
                email: 'test@test.com',
                name: 'Test User',
                phone: '11999999999',
                company: 'Test Company',
                plan: 'FREE',
                createdAt: new Date(),
            };
            mockPrismaUserCreate.mockResolvedValue(mockUser);
            mockGenerateToken.mockReturnValue('fake-jwt-token');

            await register(mockRequest as Request, mockResponse as Response);

            expect(mockPrismaUserCreate).toHaveBeenCalledWith({
                data: {
                    email: 'test@test.com',
                    name: 'Test User',
                    password: 'hashedPassword',
                    phone: '11999999999',
                    company: 'Test Company',
                },
                select: expect.any(Object),
            });

            expect(mockResponse.status).toHaveBeenCalledWith(201);
        });

        it('deve lidar com erro 500 ao registrar', async () => {
            mockRequest.body = {
                email: 'test@test.com',
                name: 'Test User',
                password: 'senha123',
            };

            mockPrismaUserFindUnique.mockResolvedValue(null);
            mockBcryptHash.mockRejectedValue(new Error('Bcrypt error'));

            await register(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Erro ao criar usuário',
            });
        });

        it('deve validar senha vazia', async () => {
            mockRequest.body = {
                email: 'test@test.com',
                name: 'Test User',
                password: '',
            };

            await register(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Nome, email e senha são obrigatórios',
            });
        });
    });

    describe('logout', () => {
        it('deve limpar o cookie e retornar sucesso', () => {
            logout(mockRequest as Request, mockResponse as Response);

            expect(mockClearTokenCookie).toHaveBeenCalledWith(mockResponse);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Logout realizado com sucesso',
            });
        });
    });

    describe('getProfile', () => {
        it('deve retornar perfil do usuário autenticado', async () => {
            const userId = 'user-123';
            mockRequest = {
                userId,
            } as any;

            const mockUser = {
                id: userId,
                name: 'Test User',
                email: 'test@test.com',
                phone: '11999999999',
                company: 'Test Company',
                bio: 'Test bio',
                avatar: 'avatar.jpg',
                plan: 'FREE',
                createdAt: new Date(),
            };

            mockPrismaUserFindUnique.mockResolvedValue(mockUser);

            await getProfile(mockRequest as Request, mockResponse as Response);

            expect(mockPrismaUserFindUnique).toHaveBeenCalledWith({
                where: { id: userId },
                select: expect.objectContaining({
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                    company: true,
                    bio: true,
                    avatar: true,
                    plan: true,
                    createdAt: true,
                }),
            });

            expect(mockResponse.json).toHaveBeenCalledWith(mockUser);
        });

        it('deve retornar erro 404 se usuário não encontrado', async () => {
            const userId = 'user-not-found';
            mockRequest = {
                userId,
            } as any;

            mockPrismaUserFindUnique.mockResolvedValue(null);

            await getProfile(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Usuário não encontrado',
            });
        });

        it('deve lidar com erro 500 ao buscar perfil', async () => {
            const userId = 'user-123';
            mockRequest = {
                userId,
            } as any;

            mockPrismaUserFindUnique.mockRejectedValue(new Error('Database error'));

            await getProfile(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Erro ao buscar perfil',
            });
        });
    });

    describe('updateProfile', () => {
        it('deve atualizar perfil do usuário', async () => {
            const userId = 'user-123';
            mockRequest = {
                userId,
                body: {
                    name: 'Updated Name',
                    phone: '11988888888',
                    company: 'Updated Company',
                    bio: 'Updated bio',
                },
            } as any;

            const mockUpdatedUser = {
                id: userId,
                name: 'Updated Name',
                email: 'test@test.com',
                phone: '11988888888',
                company: 'Updated Company',
                bio: 'Updated bio',
                avatar: 'avatar.jpg',
                plan: 'FREE',
                createdAt: new Date(),
            };

            mockPrismaUserUpdate.mockResolvedValue(mockUpdatedUser);

            await updateProfile(mockRequest as Request, mockResponse as Response);

            expect(mockPrismaUserUpdate).toHaveBeenCalledWith({
                where: { id: userId },
                data: {
                    name: 'Updated Name',
                    phone: '11988888888',
                    company: 'Updated Company',
                    bio: 'Updated bio',
                },
                select: expect.objectContaining({
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                    company: true,
                    bio: true,
                    avatar: true,
                    plan: true,
                    createdAt: true,
                }),
            });

            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Perfil atualizado com sucesso',
                user: mockUpdatedUser,
            });
        });

        it('deve atualizar apenas campos fornecidos', async () => {
            const userId = 'user-123';
            mockRequest = {
                userId,
                body: {
                    name: 'Only Name Updated',
                },
            } as any;

            const mockUpdatedUser = {
                id: userId,
                name: 'Only Name Updated',
                email: 'test@test.com',
                phone: null,
                company: null,
                bio: null,
                avatar: null,
                plan: 'FREE',
                createdAt: new Date(),
            };

            mockPrismaUserUpdate.mockResolvedValue(mockUpdatedUser);

            await updateProfile(mockRequest as Request, mockResponse as Response);

            expect(mockPrismaUserUpdate).toHaveBeenCalledWith({
                where: { id: userId },
                data: {
                    name: 'Only Name Updated',
                    phone: undefined,
                    company: undefined,
                    bio: undefined,
                },
                select: expect.any(Object),
            });
        });

        it('deve lidar com erro 500 ao atualizar perfil', async () => {
            const userId = 'user-123';
            mockRequest = {
                userId,
                body: {
                    name: 'Test',
                },
            } as any;

            mockPrismaUserUpdate.mockRejectedValue(new Error('Database error'));

            await updateProfile(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Erro ao atualizar perfil',
            });
        });
    });

    describe('forgotPassword', () => {
        it('deve enviar email de recuperação para email cadastrado', async () => {
            mockRequest.body = { email: 'test@test.com' };

            const mockUser = {
                id: 'user-123',
                email: 'test@test.com',
                name: 'Test User',
            };

            mockPrismaUserFindUnique.mockResolvedValue(mockUser);
            mockPrismaUserUpdate.mockResolvedValue(mockUser);
            mockSendEmail.mockResolvedValue({ success: true });

            await forgotPassword(mockRequest as Request, mockResponse as Response);

            expect(mockPrismaUserFindUnique).toHaveBeenCalledWith({
                where: { email: 'test@test.com' },
            });
            expect(mockPrismaUserUpdate).toHaveBeenCalledWith({
                where: { id: 'user-123' },
                data: expect.objectContaining({
                    resetPasswordToken: expect.any(String),
                    resetPasswordExpires: expect.any(Date),
                }),
            });
            expect(mockTemplateRecuperacaoSenha).toHaveBeenCalledWith(
                expect.objectContaining({
                    nome: 'Test User',
                    resetUrl: expect.stringContaining('/reset-password?token='),
                }),
            );
            expect(mockSendEmail).toHaveBeenCalledWith(
                expect.objectContaining({
                    to: 'test@test.com',
                    subject: 'Recuperação de Senha - FreelanceManager',
                }),
            );
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Se o email estiver cadastrado, você receberá um link para redefinir sua senha.',
            });
        });

        it('deve retornar 200 mesmo se email não existe (segurança)', async () => {
            mockRequest.body = { email: 'naoexiste@test.com' };
            mockPrismaUserFindUnique.mockResolvedValue(null);

            await forgotPassword(mockRequest as Request, mockResponse as Response);

            expect(mockSendEmail).not.toHaveBeenCalled();
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Se o email estiver cadastrado, você receberá um link para redefinir sua senha.',
            });
        });

        it('deve retornar erro 400 se email não fornecido', async () => {
            mockRequest.body = {};

            await forgotPassword(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Email é obrigatório',
            });
        });

        it('deve lidar com erro 500', async () => {
            mockRequest.body = { email: 'test@test.com' };
            mockPrismaUserFindUnique.mockRejectedValue(new Error('Database error'));

            await forgotPassword(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Erro ao processar solicitação de recuperação de senha',
            });
        });
    });

    describe('resetPassword', () => {
        it('deve redefinir senha com token válido', async () => {
            mockRequest.body = {
                token: 'valid-reset-token',
                password: 'novaSenha123',
            };

            const mockUser = {
                id: 'user-123',
                email: 'test@test.com',
            };

            mockPrismaUserFindFirst.mockResolvedValue(mockUser);
            mockBcryptHash.mockResolvedValue('newHashedPassword');
            mockPrismaUserUpdate.mockResolvedValue(mockUser);

            await resetPassword(mockRequest as Request, mockResponse as Response);

            expect(mockPrismaUserFindFirst).toHaveBeenCalledWith({
                where: {
                    resetPasswordToken: expect.any(String),
                    resetPasswordExpires: { gt: expect.any(Date) },
                },
            });
            expect(mockBcryptHash).toHaveBeenCalledWith('novaSenha123', 10);
            expect(mockPrismaUserUpdate).toHaveBeenCalledWith({
                where: { id: 'user-123' },
                data: {
                    password: 'newHashedPassword',
                    resetPasswordToken: null,
                    resetPasswordExpires: null,
                },
            });
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Senha redefinida com sucesso. Faça login com sua nova senha.',
            });
        });

        it('deve retornar erro 400 para token inválido ou expirado', async () => {
            mockRequest.body = {
                token: 'invalid-token',
                password: 'novaSenha123',
            };

            mockPrismaUserFindFirst.mockResolvedValue(null);

            await resetPassword(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Token inválido ou expirado. Solicite uma nova recuperação de senha.',
            });
        });

        it('deve retornar erro 400 se token ou senha não fornecidos', async () => {
            mockRequest.body = { token: 'some-token' };

            await resetPassword(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Token e nova senha são obrigatórios',
            });
        });

        it('deve retornar erro 400 se senha for curta demais', async () => {
            mockRequest.body = {
                token: 'some-token',
                password: '123',
            };

            await resetPassword(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'A senha deve ter no mínimo 6 caracteres',
            });
        });

        it('deve lidar com erro 500', async () => {
            mockRequest.body = {
                token: 'valid-token',
                password: 'novaSenha123',
            };

            mockPrismaUserFindFirst.mockRejectedValue(new Error('Database error'));

            await resetPassword(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Erro ao redefinir senha',
            });
        });
    });
});