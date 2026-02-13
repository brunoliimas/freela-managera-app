import { Response } from 'express';
import { AuthRequest } from '../../middlewares/auth.middleware';

jest.mock('../../config/logger', () => ({
    __esModule: true,
    default: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

jest.mock('../../config/env', () => ({
    env: {
        JWT_SECRET: 'test-secret-key-with-minimum-32-characters-for-testing',
        JWT_EXPIRES_IN: 86400,
        APP_NAME: 'FreelanceManager',
    },
}));

const mockPrismaUserFindUnique = jest.fn();
const mockPrismaUserUpdate = jest.fn();

jest.mock('../../config/database', () => ({
    __esModule: true,
    default: {
        user: {
            findUnique: mockPrismaUserFindUnique,
            update: mockPrismaUserUpdate,
        },
    },
}));

const mockGenerateSecret = jest.fn();
const mockVerifySync = jest.fn();
const mockGenerateURI = jest.fn();

jest.mock('otplib', () => ({
    generateSecret: mockGenerateSecret,
    verifySync: mockVerifySync,
    generateURI: mockGenerateURI,
}));

const mockQRCodeToDataURL = jest.fn();

jest.mock('qrcode', () => ({
    __esModule: true,
    default: {
        toDataURL: mockQRCodeToDataURL,
    },
}));

const mockBcryptCompare = jest.fn();
const mockBcryptHash = jest.fn();

jest.mock('bcryptjs', () => ({
    compare: mockBcryptCompare,
    hash: mockBcryptHash,
}));

const mockGenerateToken = jest.fn();
const mockVerifyTempToken = jest.fn();

jest.mock('../../utils/jwt', () => ({
    generateToken: mockGenerateToken,
    generateTempToken: jest.fn(),
    verifyToken: jest.fn(),
    verifyTempToken: mockVerifyTempToken,
}));

const mockSetTokenCookie = jest.fn();

jest.mock('../../utils/cookie', () => ({
    setTokenCookie: mockSetTokenCookie,
}));

import { setup2FA, enable2FA, verify2FA, verifyRecoveryCode, disable2FA } from '../../controllers/two-factor.controller';

describe('Two-Factor Controller', () => {
    let mockRequest: Partial<AuthRequest>;
    let mockResponse: Partial<Response>;
    const userId = 'user-123';

    beforeEach(() => {
        mockRequest = {
            userId,
            body: {},
            params: {},
        };

        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };

        jest.clearAllMocks();
    });

    describe('setup2FA', () => {
        it('deve retornar QR code e secret', async () => {
            mockPrismaUserFindUnique.mockResolvedValue({
                email: 'test@email.com',
                twoFactorEnabled: false,
            });
            mockGenerateSecret.mockReturnValue('JBSWY3DPEHPK3PXP');
            mockGenerateURI.mockReturnValue('otpauth://totp/FreelanceManager:test@email.com?secret=JBSWY3DPEHPK3PXP');
            mockQRCodeToDataURL.mockResolvedValue('data:image/png;base64,QRdata');

            await setup2FA(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockResponse.json).toHaveBeenCalledWith({
                secret: 'JBSWY3DPEHPK3PXP',
                qrCodeDataUrl: 'data:image/png;base64,QRdata',
                otpauthUrl: expect.stringContaining('otpauth://'),
            });
        });

        it('deve retornar erro se 2FA já habilitado', async () => {
            mockPrismaUserFindUnique.mockResolvedValue({
                email: 'test@email.com',
                twoFactorEnabled: true,
            });

            await setup2FA(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: '2FA já está habilitado',
            });
        });

        it('deve retornar 404 se usuário não encontrado', async () => {
            mockPrismaUserFindUnique.mockResolvedValue(null);

            await setup2FA(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Usuário não encontrado',
            });
        });

        it('deve lidar com erro interno', async () => {
            mockPrismaUserFindUnique.mockRejectedValue(new Error('DB error'));

            await setup2FA(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Erro ao configurar 2FA',
            });
        });
    });

    describe('enable2FA', () => {
        it('deve habilitar 2FA com código válido e retornar recovery codes', async () => {
            mockRequest.body = { secret: 'JBSWY3DPEHPK3PXP', token: '123456' };
            mockVerifySync.mockReturnValue({ valid: true });
            mockBcryptHash.mockResolvedValue('hashedCode');
            mockPrismaUserUpdate.mockResolvedValue({ id: userId });

            await enable2FA(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockVerifySync).toHaveBeenCalledWith({
                token: '123456',
                secret: 'JBSWY3DPEHPK3PXP',
            });
            expect(mockPrismaUserUpdate).toHaveBeenCalledWith({
                where: { id: userId },
                data: {
                    twoFactorEnabled: true,
                    twoFactorSecret: 'JBSWY3DPEHPK3PXP',
                    twoFactorRecoveryCodes: expect.any(Array),
                },
            });
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: '2FA habilitado com sucesso',
                recoveryCodes: expect.any(Array),
            });
        });

        it('deve retornar erro com código inválido', async () => {
            mockRequest.body = { secret: 'JBSWY3DPEHPK3PXP', token: '000000' };
            mockVerifySync.mockReturnValue({ valid: false });

            await enable2FA(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Código inválido. Tente novamente.',
            });
        });

        it('deve lidar com erro interno', async () => {
            mockRequest.body = { secret: 'JBSWY3DPEHPK3PXP', token: '123456' };
            mockVerifySync.mockReturnValue({ valid: true });
            mockBcryptHash.mockRejectedValue(new Error('Hash error'));

            await enable2FA(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
        });
    });

    describe('verify2FA', () => {
        it('deve verificar TOTP e retornar user com cookie', async () => {
            mockRequest.body = { tempToken: 'temp-jwt', token: '123456' };
            mockVerifyTempToken.mockReturnValue({ userId, pending2FA: true });

            mockPrismaUserFindUnique
                .mockResolvedValueOnce({ twoFactorSecret: 'secret', twoFactorEnabled: true })
                .mockResolvedValueOnce({
                    id: userId,
                    email: 'test@email.com',
                    name: 'Test',
                    password: 'hash',
                    twoFactorSecret: 'secret',
                    twoFactorRecoveryCodes: [],
                    twoFactorEnabled: true,
                });

            mockVerifySync.mockReturnValue({ valid: true });
            mockGenerateToken.mockReturnValue('full-jwt-token');

            await verify2FA(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockVerifyTempToken).toHaveBeenCalledWith('temp-jwt');
            expect(mockGenerateToken).toHaveBeenCalledWith({
                userId,
                email: 'test@email.com',
                twoFactorVerified: true,
            });
            expect(mockSetTokenCookie).toHaveBeenCalled();
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Verificação 2FA realizada com sucesso',
                    user: expect.objectContaining({ id: userId }),
                })
            );
        });

        it('deve retornar 400 com código TOTP inválido', async () => {
            mockRequest.body = { tempToken: 'temp-jwt', token: '000000' };
            mockVerifyTempToken.mockReturnValue({ userId, pending2FA: true });

            mockPrismaUserFindUnique.mockResolvedValue({
                twoFactorSecret: 'secret',
                twoFactorEnabled: true,
            });

            mockVerifySync.mockReturnValue({ valid: false });

            await verify2FA(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Código inválido' });
        });

        it('deve retornar erro com tempToken inválido', async () => {
            mockRequest.body = { tempToken: 'invalid', token: '123456' };
            mockVerifyTempToken.mockImplementation(() => {
                throw new Error('Token temporário inválido ou expirado');
            });

            await verify2FA(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
        });
    });

    describe('verifyRecoveryCode', () => {
        it('deve verificar recovery code e retornar user', async () => {
            mockRequest.body = { tempToken: 'temp-jwt', recoveryCode: 'abc12345' };
            mockVerifyTempToken.mockReturnValue({ userId, pending2FA: true });

            mockPrismaUserFindUnique
                .mockResolvedValueOnce({
                    twoFactorRecoveryCodes: ['hashedCode1', 'hashedCode2'],
                    twoFactorEnabled: true,
                })
                .mockResolvedValueOnce({
                    id: userId,
                    email: 'test@email.com',
                    name: 'Test',
                    password: 'hash',
                    twoFactorSecret: 'secret',
                    twoFactorRecoveryCodes: ['hashedCode2'],
                    twoFactorEnabled: true,
                });

            mockBcryptCompare.mockResolvedValueOnce(true);
            mockPrismaUserUpdate.mockResolvedValue({});
            mockGenerateToken.mockReturnValue('full-jwt-token');

            await verifyRecoveryCode(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockSetTokenCookie).toHaveBeenCalled();
            expect(mockResponse.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Verificação por código de recuperação realizada',
                    user: expect.objectContaining({ id: userId }),
                })
            );
        });

        it('deve retornar 400 com recovery code inválido', async () => {
            mockRequest.body = { tempToken: 'temp-jwt', recoveryCode: 'invalid' };
            mockVerifyTempToken.mockReturnValue({ userId, pending2FA: true });

            mockPrismaUserFindUnique.mockResolvedValue({
                twoFactorRecoveryCodes: ['hashedCode1'],
                twoFactorEnabled: true,
            });

            mockBcryptCompare.mockResolvedValue(false);

            await verifyRecoveryCode(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Código de recuperação inválido',
            });
        });
    });

    describe('disable2FA', () => {
        it('deve desabilitar 2FA com senha correta', async () => {
            mockRequest.body = { password: 'mypassword' };
            mockPrismaUserFindUnique.mockResolvedValue({ password: 'hashedPassword' });
            mockBcryptCompare.mockResolvedValue(true);
            mockPrismaUserUpdate.mockResolvedValue({});

            await disable2FA(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockBcryptCompare).toHaveBeenCalledWith('mypassword', 'hashedPassword');
            expect(mockPrismaUserUpdate).toHaveBeenCalledWith({
                where: { id: userId },
                data: {
                    twoFactorEnabled: false,
                    twoFactorSecret: null,
                    twoFactorRecoveryCodes: [],
                },
            });
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: '2FA desabilitado com sucesso',
            });
        });

        it('deve retornar erro com senha incorreta', async () => {
            mockRequest.body = { password: 'wrong' };
            mockPrismaUserFindUnique.mockResolvedValue({ password: 'hashedPassword' });
            mockBcryptCompare.mockResolvedValue(false);

            await disable2FA(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Senha incorreta',
            });
        });

        it('deve retornar 404 se usuário não encontrado', async () => {
            mockRequest.body = { password: 'test' };
            mockPrismaUserFindUnique.mockResolvedValue(null);

            await disable2FA(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Usuário não encontrado',
            });
        });

        it('deve lidar com erro interno', async () => {
            mockRequest.body = { password: 'test' };
            mockPrismaUserFindUnique.mockRejectedValue(new Error('DB error'));

            await disable2FA(mockRequest as AuthRequest, mockResponse as Response);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Erro ao desabilitar 2FA',
            });
        });
    });
});
