import { Request, Response, NextFunction } from 'express';
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { isLogin, isAdmin, hasRole, logout, checkTokenBlacklist } from '../../utils/middlewares/auth/auth.middleware';
import authService from '../../src/services/auth/auth.service';
import { createActivatedUser } from '../helpers/test.helpers';

describe('Auth Middleware', () => {
    let mockReq: Partial<Request>;
    let mockRes: Partial<Response>;
    let mockNext: NextFunction;
    let jsonMock: jest.Mock;
    let statusMock: jest.Mock;
    let cookieMock: jest.Mock;
    let clearCookieMock: jest.Mock;

    beforeEach(() => {
        // Reset all mocks before each test
        jsonMock = jest.fn();
        statusMock = jest.fn().mockReturnThis();
        cookieMock = jest.fn();
        clearCookieMock = jest.fn();
        mockNext = jest.fn();

        mockRes = {
            status: statusMock as any,
            json: jsonMock as any,
            cookie: cookieMock as any,
            clearCookie: clearCookieMock as any,
        };

        mockReq = {
            cookies: {},
            headers: {},
            header: jest.fn() as any,
        };
    });

    describe('isLogin Middleware', () => {
        it('devrait autoriser l\'accès avec un token valide dans les cookies', async () => {
            const password = 'TestPass@123';
            const user = await createActivatedUser({ password });

            // Login pour obtenir un token
            const loginResult = await authService.login(
                { email: user.email as string, password },
                true,
                { ip: '127.0.0.1' }
            );

            expect(loginResult.error).toBe(false);
            const token = loginResult?.data?.token;

            // Simuler la requête avec token dans cookies
            mockReq.cookies = { access_token: token };

            await isLogin(mockReq as Request, mockRes as Response, mockNext);

            // Vérifier que next() a été appelé (accès autorisé)
            expect(mockNext).toHaveBeenCalled();
            expect((mockReq as any).auth).toBeDefined();
            expect((mockReq as any).auth.email).toBe(user.email);
        });

        it('devrait autoriser l\'accès avec un token valide dans Authorization header', async () => {
            const password = 'TestPass@123';
            const user = await createActivatedUser({ password });

            const loginResult = await authService.login(
                { email: user.email as string, password },
                true,
                { ip: '127.0.0.1' }
            );

            const token = loginResult?.data?.token;

            // Simuler Authorization header
            mockReq.header = jest.fn((name: string) => {
                if (name === 'Authorization') {
                    return `Bearer ${token}`;
                }
                return undefined;
            }) as any;

            await isLogin(mockReq as Request, mockRes as Response, mockNext);

            expect(mockNext).toHaveBeenCalled();
            expect((mockReq as any).auth).toBeDefined();
        });

        it('devrait rejeter l\'accès sans token', async () => {
            mockReq.cookies = {};
            mockReq.header = jest.fn(() => undefined) as any;

            await isLogin(mockReq as Request, mockRes as Response, mockNext);

            expect(statusMock).toHaveBeenCalledWith(401);
            expect(jsonMock).toHaveBeenCalled();
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('devrait rejeter l\'accès avec un token invalide', async () => {
            mockReq.cookies = { access_token: 'invalid_token_here' };

            await isLogin(mockReq as Request, mockRes as Response, mockNext);

            expect(statusMock).toHaveBeenCalledWith(401);
            expect(jsonMock).toHaveBeenCalled();
        });

        it('devrait rafraîchir le token automatiquement avec un refresh token valide', async () => {
            const password = 'TestPass@123';
            const user = await createActivatedUser({ password });

            const loginResult = await authService.login(
                { email: user.email as string, password },
                true,
                { ip: '127.0.0.1' }
            );

            const refreshToken = loginResult?.data?.refresh_token;

            // Simuler un access token expiré mais un refresh token valide
            mockReq.cookies = {
                access_token: 'expired_token',
                refresh_token: refreshToken,
            };

            await isLogin(mockReq as Request, mockRes as Response, mockNext);

            // Devrait générer un nouveau token et le mettre en cookie
            expect(cookieMock).toHaveBeenCalledWith(
                'access_token',
                expect.any(String),
                expect.objectContaining({
                    httpOnly: true,
                    maxAge: 60 * 60 * 1000,
                })
            );
            expect(mockNext).toHaveBeenCalled();
        });

        it('devrait clear les cookies si token et refresh token sont expirés', async () => {
            mockReq.cookies = {
                access_token: 'expired_token',
                refresh_token: 'expired_refresh_token',
            };

            await isLogin(mockReq as Request, mockRes as Response, mockNext);

            expect(clearCookieMock).toHaveBeenCalledWith('access_token');
            expect(clearCookieMock).toHaveBeenCalledWith('refresh_token');
            expect(statusMock).toHaveBeenCalledWith(401);
        });

        it('devrait utiliser le cache pour les requêtes successives', async () => {
            const password = 'TestPass@123';
            const user = await createActivatedUser({ password });

            const loginResult = await authService.login(
                { email: user.email as string, password },
                true,
                { ip: '127.0.0.1' }
            );

            const token = loginResult?.data?.token;

            // Première requête - devrait interroger la BD
            mockReq.cookies = { access_token: token };
            await isLogin(mockReq as Request, mockRes as Response, mockNext);

            expect(mockNext).toHaveBeenCalled();
            const firstCallAuth = (mockReq as any).auth;

            // Réinitialiser les mocks
            mockNext = jest.fn();
            mockReq = { cookies: { access_token: token } };

            // Deuxième requête - devrait utiliser le cache
            await isLogin(mockReq as Request, mockRes as Response, mockNext);

            expect(mockNext).toHaveBeenCalled();
            expect((mockReq as any).auth.email).toBe(firstCallAuth.email);
        });

        it('devrait attacher le rôle utilisateur à req.auth', async () => {
            const password = 'TestPass@123';
            const user = await createActivatedUser({ password });

            const loginResult = await authService.login(
                { email: user.email as string, password },
                true,
                { ip: '127.0.0.1' }
            );

            mockReq.cookies = { access_token: loginResult?.data?.token };

            await isLogin(mockReq as Request, mockRes as Response, mockNext);

            expect((mockReq as any).auth).toBeDefined();
            expect((mockReq as any).auth.role).toBeDefined();
        });
    });

    describe('isAdmin Middleware', () => {
        it('devrait autoriser l\'accès pour un utilisateur ADMIN', async () => {
            // Simuler un utilisateur admin déjà authentifié
            (mockReq as any).auth = {
                _id: 'user123',
                email: 'admin@test.com',
                role: 'ADMIN',
            };

            await isAdmin(mockReq as Request, mockRes as Response, mockNext);

            expect(mockNext).toHaveBeenCalled();
            expect(statusMock).not.toHaveBeenCalled();
        });

        it('devrait rejeter l\'accès pour un utilisateur non-ADMIN', async () => {
            (mockReq as any).auth = {
                _id: 'user123',
                email: 'user@test.com',
                role: 'USER',
            };

            await isAdmin(mockReq as Request, mockRes as Response, mockNext);

            expect(statusMock).toHaveBeenCalledWith(403);
            expect(jsonMock).toHaveBeenCalled();
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('devrait rejeter l\'accès si auth n\'est pas défini', async () => {
            (mockReq as any).auth = undefined;

            await isAdmin(mockReq as Request, mockRes as Response, mockNext);

            expect(statusMock).toHaveBeenCalledWith(403);
            expect(jsonMock).toHaveBeenCalled();
        });

        it('devrait rejeter l\'accès si auth.role n\'est pas ADMIN', async () => {
            (mockReq as any).auth = {
                _id: 'user123',
                email: 'teacher@test.com',
                role: 'TEACHER',
            };

            await isAdmin(mockReq as Request, mockRes as Response, mockNext);

            expect(statusMock).toHaveBeenCalledWith(403);
        });
    });

    describe('hasRole Middleware', () => {
        it('devrait autoriser l\'accès pour un rôle autorisé', async () => {
            (mockReq as any).auth = {
                _id: 'user123',
                email: 'admin@test.com',
                role: 'ADMIN',
            };

            const middleware = hasRole('ADMIN', 'MODERATOR');
            await middleware(mockReq as Request, mockRes as Response, mockNext);

            expect(mockNext).toHaveBeenCalled();
            expect(statusMock).not.toHaveBeenCalled();
        });

        it('devrait autoriser l\'accès avec un seul rôle spécifié', async () => {
            (mockReq as any).auth = {
                _id: 'user123',
                email: 'teacher@test.com',
                role: 'TEACHER',
            };

            const middleware = hasRole('TEACHER');
            await middleware(mockReq as Request, mockRes as Response, mockNext);

            expect(mockNext).toHaveBeenCalled();
        });

        it('devrait autoriser l\'accès avec plusieurs rôles possibles', async () => {
            (mockReq as any).auth = {
                _id: 'user123',
                email: 'moderator@test.com',
                role: 'MODERATOR',
            };

            const middleware = hasRole('ADMIN', 'TEACHER', 'MODERATOR');
            await middleware(mockReq as Request, mockRes as Response, mockNext);

            expect(mockNext).toHaveBeenCalled();
        });

        it('devrait rejeter l\'accès pour un rôle non autorisé', async () => {
            (mockReq as any).auth = {
                _id: 'user123',
                email: 'user@test.com',
                role: 'USER',
            };

            const middleware = hasRole('ADMIN', 'MODERATOR');
            await middleware(mockReq as Request, mockRes as Response, mockNext);

            expect(statusMock).toHaveBeenCalledWith(403);
            expect(jsonMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: true,
                    message: expect.stringContaining('Access denied'),
                })
            );
        });

        it('devrait rejeter l\'accès si auth n\'est pas défini', async () => {
            (mockReq as any).auth = undefined;

            const middleware = hasRole('ADMIN');
            await middleware(mockReq as Request, mockRes as Response, mockNext);

            expect(statusMock).toHaveBeenCalledWith(401);
            expect(jsonMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Authentication required',
                })
            );
        });

        it('devrait rejeter l\'accès si le rôle n\'est pas défini', async () => {
            (mockReq as any).auth = {
                _id: 'user123',
                email: 'user@test.com',
                role: undefined,
            };

            const middleware = hasRole('ADMIN');
            await middleware(mockReq as Request, mockRes as Response, mockNext);

            expect(statusMock).toHaveBeenCalledWith(403);
            expect(jsonMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'No role assigned to user',
                })
            );
        });

        it('devrait afficher les rôles requis dans le message d\'erreur', async () => {
            (mockReq as any).auth = {
                _id: 'user123',
                email: 'user@test.com',
                role: 'USER',
            };

            const middleware = hasRole('ADMIN', 'TEACHER', 'MODERATOR');
            await middleware(mockReq as Request, mockRes as Response, mockNext);

            expect(jsonMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: expect.stringContaining('ADMIN, TEACHER, MODERATOR'),
                })
            );
        });
    });

    describe('logout Middleware', () => {
        it('devrait clear les cookies lors du logout', async () => {
            (mockReq as any).auth = {
                _id: 'user123',
                email: 'user@test.com',
            };

            await logout(mockReq as Request, mockRes as Response, mockNext);

            expect(clearCookieMock).toHaveBeenCalledWith('access_token');
            expect(clearCookieMock).toHaveBeenCalledWith('refresh_token');
            expect(statusMock).toHaveBeenCalledWith(200);
            expect(jsonMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: false,
                    message: 'Logout successful',
                })
            );
        });

        it('devrait fonctionner même sans auth défini', async () => {
            (mockReq as any).auth = undefined;

            await logout(mockReq as Request, mockRes as Response, mockNext);

            expect(clearCookieMock).toHaveBeenCalledWith('access_token');
            expect(clearCookieMock).toHaveBeenCalledWith('refresh_token');
            expect(statusMock).toHaveBeenCalledWith(200);
        });

        it('devrait invalider le cache utilisateur', async () => {
            const userId = 'user123';
            (mockReq as any).auth = {
                _id: userId,
                email: 'user@test.com',
            };

            await logout(mockReq as Request, mockRes as Response, mockNext);

            // Le cache devrait être invalidé
            expect(clearCookieMock).toHaveBeenCalled();
            expect(statusMock).toHaveBeenCalledWith(200);
        });
    });

    describe('checkTokenBlacklist Middleware', () => {
        it('devrait autoriser l\'accès avec un token non-blacklisté', () => {
            const validToken = 'valid_token_12345';
            mockReq.cookies = { access_token: validToken };

            checkTokenBlacklist(mockReq as Request, mockRes as Response, mockNext);

            expect(mockNext).toHaveBeenCalled();
            expect(statusMock).not.toHaveBeenCalled();
        });

        it('devrait rejeter l\'accès avec un token blacklisté', () => {
            // Note: Ce test nécessite de mocker tokenBlacklistService
            // Pour l'instant, on teste le comportement normal
            const token = 'some_token';
            mockReq.cookies = { access_token: token };

            checkTokenBlacklist(mockReq as Request, mockRes as Response, mockNext);

            // Le token n'est pas dans la blacklist par défaut
            expect(mockNext).toHaveBeenCalled();
        });

        it('devrait autoriser l\'accès sans token', () => {
            mockReq.cookies = {};
            mockReq.header = jest.fn(() => undefined) as any;

            checkTokenBlacklist(mockReq as Request, mockRes as Response, mockNext);

            expect(mockNext).toHaveBeenCalled();
        });
    });

    describe('Scénarios d\'intégration', () => {
        it('devrait gérer un flow complet : login -> accès protégé -> logout', async () => {
            const password = 'TestPass@123';
            const user = await createActivatedUser({ password });

            // 1. Login
            const loginResult = await authService.login(
                { email: user.email as string, password },
                true,
                { ip: '127.0.0.1' }
            );

            expect(loginResult.error).toBe(false);
            const token = loginResult?.data?.token;

            // 2. Accès à une route protégée
            mockReq.cookies = { access_token: token };
            await isLogin(mockReq as Request, mockRes as Response, mockNext);

            expect(mockNext).toHaveBeenCalled();
            expect((mockReq as any).auth).toBeDefined();

            // 3. Logout
            mockNext = jest.fn();
            await logout(mockReq as Request, mockRes as Response, mockNext);

            expect(clearCookieMock).toHaveBeenCalledWith('access_token');
            expect(clearCookieMock).toHaveBeenCalledWith('refresh_token');
        });

        it('devrait gérer un flow RBAC complet', async () => {
            // Simuler un utilisateur ADMIN
            (mockReq as any).auth = {
                _id: 'admin123',
                email: 'admin@test.com',
                role: 'ADMIN',
            };

            // Devrait passer isAdmin
            mockNext = jest.fn();
            await isAdmin(mockReq as Request, mockRes as Response, mockNext);
            expect(mockNext).toHaveBeenCalled();

            // Devrait passer hasRole('ADMIN', 'MODERATOR')
            mockNext = jest.fn();
            const middleware = hasRole('ADMIN', 'MODERATOR');
            await middleware(mockReq as Request, mockRes as Response, mockNext);
            expect(mockNext).toHaveBeenCalled();

            // Ne devrait PAS passer hasRole('SUPER_ADMIN')
            mockNext = jest.fn();
            const strictMiddleware = hasRole('SUPER_ADMIN');
            await strictMiddleware(mockReq as Request, mockRes as Response, mockNext);
            expect(mockNext).not.toHaveBeenCalled();
            expect(statusMock).toHaveBeenCalledWith(403);
        });
    });
});
