import { Request, Response, NextFunction } from 'express';
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { setLanguage, getLanguage, setRequestDetails, xApiKey, securityMiddleware } from '../../utils/middlewares/app.middleware';
import xApiKeyService from '../../src/services/admin/x-api-key.service';

// Mock dependencies
jest.mock('../../src/services/admin/x-api-key.service');
jest.mock('../../configs/app.config', () => ({
    response: {
        forbidden: jest.fn((res: any, _next: any, message: string) => {
            res.status(403).json({ error: true, message });
        }),
        failed: jest.fn((res: any, _next: any, message: string) => {
            res.status(400).json({ error: true, message });
        }),
    },
    configs: {
        getXApiKey: jest.fn(() => 'master-api-key-12345'),
        use: jest.fn((feature: string) => {
            if (feature === 'queue') return false; // Disable queue in tests
            return false;
        }),
    },
    SUPPORTED_LANGUAGES: ['en', 'fr', 'es', 'de'],
}));

describe('App Middleware', () => {
    let mockReq: Partial<Request>;
    let mockRes: Partial<Response>;
    let mockNext: NextFunction;
    let jsonMock: jest.Mock;
    let statusMock: jest.Mock;

    beforeEach(() => {
        jsonMock = jest.fn();
        statusMock = jest.fn().mockReturnThis();
        mockNext = jest.fn();

        mockRes = {
            status: statusMock as any,
            json: jsonMock as any,
        };

        mockReq = {
            query: {},
            headers: {},
            body: {},
            get: jest.fn() as any,
            header: jest.fn() as any,
        };

        // Reset all mocks
        jest.clearAllMocks();
    });

    describe('setLanguage Middleware', () => {
        it('devrait utiliser la langue du query parameter si fournie', () => {
            mockReq.query = { lang: 'fr' };
            mockReq.get = jest.fn((header: string) => {
                if (header === 'Accept-Language') return 'en-US';
                return undefined;
            }) as any;

            setLanguage(mockReq as Request, mockRes as Response, mockNext);

            expect((mockReq as any).language).toBe('fr');
            expect(mockNext).toHaveBeenCalled();
        });

        it('devrait utiliser la langue du header Accept-Language si query non fourni', () => {
            mockReq.query = {};
            mockReq.get = jest.fn((header: string) => {
                if (header === 'Accept-Language') return 'es-MX,es;q=0.9';
                return undefined;
            }) as any;

            setLanguage(mockReq as Request, mockRes as Response, mockNext);

            expect((mockReq as any).language).toBe('es');
            expect(mockNext).toHaveBeenCalled();
        });

        it('devrait utiliser la langue par défaut si aucune langue fournie', () => {
            mockReq.query = {};
            mockReq.get = jest.fn(() => undefined) as any;

            setLanguage(mockReq as Request, mockRes as Response, mockNext);

            expect((mockReq as any).language).toBe('en');
            expect(mockNext).toHaveBeenCalled();
        });

        it('devrait normaliser la langue en lowercase', () => {
            mockReq.query = { lang: 'FR' };

            setLanguage(mockReq as Request, mockRes as Response, mockNext);

            expect((mockReq as any).language).toBe('fr');
        });

        it('devrait utiliser la langue par défaut pour une langue non supportée', () => {
            mockReq.query = { lang: 'zh' }; // Chinois non supporté

            setLanguage(mockReq as Request, mockRes as Response, mockNext);

            expect((mockReq as any).language).toBe('en');
        });

        it('devrait gérer les langues avec trim', () => {
            mockReq.query = { lang: '  fr  ' };

            setLanguage(mockReq as Request, mockRes as Response, mockNext);

            expect((mockReq as any).language).toBe('fr');
        });

        it('devrait rejeter les langues trop courtes', () => {
            mockReq.query = { lang: 'f' };

            setLanguage(mockReq as Request, mockRes as Response, mockNext);

            expect((mockReq as any).language).toBe('en');
        });

        it('devrait rejeter les langues trop longues', () => {
            mockReq.query = { lang: 'verylonglanguagecode' };

            setLanguage(mockReq as Request, mockRes as Response, mockNext);

            expect((mockReq as any).language).toBe('en');
        });

        it('devrait gérer Accept-Language avec région', () => {
            mockReq.query = {};
            mockReq.get = jest.fn((header: string) => {
                if (header === 'Accept-Language') return 'de-DE,de;q=0.9,en;q=0.8';
                return undefined;
            }) as any;

            setLanguage(mockReq as Request, mockRes as Response, mockNext);

            expect((mockReq as any).language).toBe('de');
        });

        it('devrait gérer les valeurs non-string', () => {
            mockReq.query = { lang: 123 as any };

            setLanguage(mockReq as Request, mockRes as Response, mockNext);

            expect((mockReq as any).language).toBe('en');
        });
    });

    describe('getLanguage Helper', () => {
        it('devrait extraire la langue correctement', () => {
            mockReq.query = { lang: 'fr' };
            const language = getLanguage(mockReq as Request);

            expect(language).toBe('fr');
        });

        it('devrait prioriser query sur header', () => {
            mockReq.query = { lang: 'fr' };
            mockReq.get = jest.fn((header: string) => {
                if (header === 'Accept-Language') return 'es-MX';
                return undefined;
            }) as any;

            const language = getLanguage(mockReq as Request);

            expect(language).toBe('fr');
        });

        it('devrait fallback au défaut si langue invalide', () => {
            mockReq.query = { lang: null as any };
            mockReq.get = jest.fn(() => undefined) as any;

            const language = getLanguage(mockReq as Request);

            expect(language).toBe('en');
        });
    });

    describe('setRequestDetails Middleware', () => {
        it('devrait définir les détails de connexion avec IP et user-agent', async () => {
            (mockReq as any).clientIp = '8.8.8.8';
            mockReq.headers = {
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            };

            await setRequestDetails(mockReq as Request, mockRes as Response, mockNext);

            expect((mockReq as any).login_history).toBeDefined();
            expect((mockReq as any).login_history.ip).toBe('8.8.8.8');
            expect((mockReq as any).login_history.token).toBe('');
            expect(mockNext).toHaveBeenCalled();
        });

        it('devrait gérer un IP local', async () => {
            (mockReq as any).clientIp = '127.0.0.1';
            mockReq.headers = {
                'user-agent': 'Mozilla/5.0',
            };

            await setRequestDetails(mockReq as Request, mockRes as Response, mockNext);

            expect((mockReq as any).login_history).toBeDefined();
            expect((mockReq as any).login_history.ip).toBe('127.0.0.1');
            expect(mockNext).toHaveBeenCalled();
        });

        it('devrait gérer l\'absence de user-agent', async () => {
            (mockReq as any).clientIp = '192.168.1.1';
            mockReq.headers = {};

            await setRequestDetails(mockReq as Request, mockRes as Response, mockNext);

            expect((mockReq as any).login_history).toBeDefined();
            expect((mockReq as any).login_history.ip).toBe('192.168.1.1');
            expect(mockNext).toHaveBeenCalled();
        });

        it('devrait gérer les erreurs gracieusement', async () => {
            (mockReq as any).clientIp = 'invalid-ip';
            mockReq.headers = {
                'user-agent': 'test-agent',
            };

            await setRequestDetails(mockReq as Request, mockRes as Response, mockNext);

            // Devrait quand même définir login_history avec des valeurs de base
            expect((mockReq as any).login_history).toBeDefined();
            expect((mockReq as any).login_history.ip).toBe('invalid-ip');
            expect(mockNext).toHaveBeenCalled();
        });

        it('devrait parser différents user-agents', async () => {
            const userAgents = [
                'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
                'Mozilla/5.0 (Linux; Android 10)',
                'curl/7.64.1',
            ];

            for (const ua of userAgents) {
                (mockReq as any).clientIp = '8.8.8.8';
                mockReq.headers = { 'user-agent': ua };

                await setRequestDetails(mockReq as Request, mockRes as Response, mockNext);

                expect((mockReq as any).login_history).toBeDefined();
                expect((mockReq as any).login_history.devices).toBeDefined();
            }
        });
    });

    describe('xApiKey Middleware', () => {
        it('devrait autoriser l\'accès avec la clé master', async () => {
            mockReq.header = jest.fn((name: string) => {
                if (name === 'x-api-key') return 'master-api-key-12345';
                return undefined;
            }) as any;

            await xApiKey(mockReq as Request, mockRes as Response, mockNext);

            expect(mockNext).toHaveBeenCalled();
            expect(statusMock).not.toHaveBeenCalled();
        });

        it('devrait autoriser l\'accès avec une clé valide de la base de données', async () => {
            const validKey = 'valid-db-key-67890';
            mockReq.header = jest.fn((name: string) => {
                if (name === 'x-api-key') return validKey;
                return undefined;
            }) as any;

            // Mock xApiKeyService.findOne
            (xApiKeyService.findOne as jest.Mock<any>).mockResolvedValue({
                error: false,
                data: { keys: validKey },
            });

            await xApiKey(mockReq as Request, mockRes as Response, mockNext);

            expect(xApiKeyService.findOne).toHaveBeenCalledWith(
                { keys: validKey, status: 'ACTIVE', deleted_at: null },
                { select: 'keys, -_id' }
            );
            expect(mockNext).toHaveBeenCalled();
        });

        it('devrait rejeter l\'accès sans clé', async () => {
            mockReq.header = jest.fn(() => undefined) as any;

            await xApiKey(mockReq as Request, mockRes as Response, mockNext);

            expect(statusMock).toHaveBeenCalledWith(403);
            expect(jsonMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: true,
                    message: 'Invalid KEY. Please check your key and try again.',
                })
            );
        });

        it('devrait rejeter l\'accès avec une clé invalide', async () => {
            mockReq.header = jest.fn((name: string) => {
                if (name === 'x-api-key') return 'invalid-key';
                return undefined;
            }) as any;

            (xApiKeyService.findOne as jest.Mock<any>).mockResolvedValue({
                error: true,
                data: null,
            });

            await xApiKey(mockReq as Request, mockRes as Response, mockNext);

            expect(statusMock).toHaveBeenCalledWith(403);
            expect(jsonMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Invalid KEY. Please check your key and try again.',
                })
            );
        });

        it('devrait rejeter l\'accès avec une clé inactive', async () => {
            mockReq.header = jest.fn((name: string) => {
                if (name === 'x-api-key') return 'inactive-key';
                return undefined;
            }) as any;

            (xApiKeyService.findOne as jest.Mock<any>).mockResolvedValue({
                error: false,
                data: null, // Aucune clé active trouvée
            });

            await xApiKey(mockReq as Request, mockRes as Response, mockNext);

            expect(statusMock).toHaveBeenCalledWith(403);
        });

        it('devrait gérer les erreurs de base de données', async () => {
            mockReq.header = jest.fn((name: string) => {
                if (name === 'x-api-key') return 'test-key';
                return undefined;
            }) as any;

            (xApiKeyService.findOne as jest.Mock<any>).mockRejectedValue(new Error('Database error'));

            await xApiKey(mockReq as Request, mockRes as Response, mockNext);

            expect(statusMock).toHaveBeenCalledWith(403);
            expect(jsonMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Invalid KEY. Please check your key and try again.',
                })
            );
        });
    });

    describe('securityMiddleware', () => {
        it('devrait autoriser les requêtes normales', () => {
            mockReq.body = {
                email: 'test@example.com',
                password: 'SecurePass@123',
                name: 'John Doe',
            };
            mockReq.query = { page: '1', limit: '10' };

            securityMiddleware(mockReq as Request, mockRes as Response, mockNext);

            expect(mockNext).toHaveBeenCalled();
            expect(statusMock).not.toHaveBeenCalled();
        });

        it('devrait détecter les tentatives NoSQL injection dans le body', () => {
            mockReq.body = {
                email: 'test@example.com',
                password: { $ne: null },
            };
            mockReq.query = {};
            (mockReq as any).ip = '127.0.0.1';
            (mockReq as any).originalUrl = '/api/login';
            mockReq.get = jest.fn((header: string) => {
                if (header === 'User-Agent') return 'Test Agent';
                return undefined;
            }) as any;

            securityMiddleware(mockReq as Request, mockRes as Response, mockNext);

            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: true,
                    message: 'Invalid request format',
                })
            );
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('devrait détecter $where dans le body', () => {
            mockReq.body = {
                filter: { $where: 'this.password === "test"' },
            };
            mockReq.query = {};

            securityMiddleware(mockReq as Request, mockRes as Response, mockNext);

            expect(statusMock).toHaveBeenCalledWith(400);
        });

        it('devrait détecter $regex dans le body', () => {
            mockReq.body = {
                username: { $regex: '.*' },
            };
            mockReq.query = {};

            securityMiddleware(mockReq as Request, mockRes as Response, mockNext);

            expect(statusMock).toHaveBeenCalledWith(400);
        });

        it('devrait détecter les tentatives SQL injection dans le query', () => {
            mockReq.body = {};
            mockReq.query = { id: '1 UNION SELECT * FROM users' };

            securityMiddleware(mockReq as Request, mockRes as Response, mockNext);

            expect(statusMock).toHaveBeenCalledWith(400);
        });

        it('devrait détecter DROP TABLE', () => {
            mockReq.body = {};
            mockReq.query = { action: 'DROP TABLE users' };

            securityMiddleware(mockReq as Request, mockRes as Response, mockNext);

            expect(statusMock).toHaveBeenCalledWith(400);
        });

        it('devrait détecter les tentatives XSS avec <script>', () => {
            mockReq.body = {
                comment: '<script>alert("XSS")</script>',
            };
            mockReq.query = {};

            securityMiddleware(mockReq as Request, mockRes as Response, mockNext);

            expect(statusMock).toHaveBeenCalledWith(400);
        });

        it('devrait détecter javascript: dans les URLs', () => {
            mockReq.body = {
                redirect: 'javascript:alert(1)',
            };
            mockReq.query = {};

            securityMiddleware(mockReq as Request, mockRes as Response, mockNext);

            expect(statusMock).toHaveBeenCalledWith(400);
        });

        it('devrait détecter data: URLs', () => {
            mockReq.body = {
                image: 'data:text/html,<script>alert(1)</script>',
            };
            mockReq.query = {};

            securityMiddleware(mockReq as Request, mockRes as Response, mockNext);

            expect(statusMock).toHaveBeenCalledWith(400);
        });

        it('devrait autoriser les données sûres avec des mots similaires', () => {
            mockReq.body = {
                description: 'This is a regular expression tutorial',
                title: 'Where to find help',
            };
            mockReq.query = {};

            securityMiddleware(mockReq as Request, mockRes as Response, mockNext);

            expect(mockNext).toHaveBeenCalled();
            expect(statusMock).not.toHaveBeenCalled();
        });

        it('devrait gérer les objets vides', () => {
            mockReq.body = {};
            mockReq.query = {};

            securityMiddleware(mockReq as Request, mockRes as Response, mockNext);

            expect(mockNext).toHaveBeenCalled();
        });

        it('devrait gérer les nested objects malveillants', () => {
            mockReq.body = {
                user: {
                    filter: {
                        password: { $ne: null },
                    },
                },
            };
            mockReq.query = {};

            securityMiddleware(mockReq as Request, mockRes as Response, mockNext);

            expect(statusMock).toHaveBeenCalledWith(400);
        });

        it('devrait logger les tentatives suspectes', () => {
            const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

            mockReq.body = { attack: '<script>alert(1)</script>' };
            mockReq.query = {};
            (mockReq as any).ip = '192.168.1.100';
            (mockReq as any).originalUrl = '/api/test';
            mockReq.get = jest.fn((header: string) => {
                if (header === 'User-Agent') return 'Malicious Bot';
                return undefined;
            }) as any;

            securityMiddleware(mockReq as Request, mockRes as Response, mockNext);

            expect(consoleWarnSpy).toHaveBeenCalledWith(
                'Suspicious request detected:',
                expect.objectContaining({
                    ip: '192.168.1.100',
                    url: '/api/test',
                })
            );

            consoleWarnSpy.mockRestore();
        });
    });

    describe('Scénarios d\'intégration', () => {
        it('devrait combiner setLanguage et setRequestDetails', async () => {
            mockReq.query = { lang: 'fr' };
            (mockReq as any).clientIp = '8.8.8.8';
            mockReq.headers = {
                'user-agent': 'Mozilla/5.0',
            };

            // Appliquer setLanguage
            setLanguage(mockReq as Request, mockRes as Response, mockNext);
            expect((mockReq as any).language).toBe('fr');

            // Appliquer setRequestDetails
            mockNext = jest.fn();
            await setRequestDetails(mockReq as Request, mockRes as Response, mockNext);
            expect((mockReq as any).login_history).toBeDefined();

            expect(mockNext).toHaveBeenCalled();
        });

        it('devrait valider l\'API key puis vérifier la sécurité', async () => {
            mockReq.header = jest.fn((name: string) => {
                if (name === 'x-api-key') return 'master-api-key-12345';
                return undefined;
            }) as any;
            mockReq.body = { email: 'test@example.com' };
            mockReq.query = {};

            // Valider API key
            await xApiKey(mockReq as Request, mockRes as Response, mockNext);
            expect(mockNext).toHaveBeenCalled();

            // Vérifier sécurité
            mockNext = jest.fn();
            securityMiddleware(mockReq as Request, mockRes as Response, mockNext);
            expect(mockNext).toHaveBeenCalled();
        });

        it('devrait bloquer une requête avec API key valide mais contenu malveillant', async () => {
            mockReq.header = jest.fn((name: string) => {
                if (name === 'x-api-key') return 'master-api-key-12345';
                return undefined;
            }) as any;
            mockReq.body = { query: 'DROP TABLE users' };
            mockReq.query = {};

            // API key passe
            await xApiKey(mockReq as Request, mockRes as Response, mockNext);
            expect(mockNext).toHaveBeenCalled();

            // Sécurité bloque
            mockNext = jest.fn();
            statusMock = jest.fn().mockReturnThis();
            mockRes.status = statusMock as any;

            securityMiddleware(mockReq as Request, mockRes as Response, mockNext);
            expect(statusMock).toHaveBeenCalledWith(400);
            expect(mockNext).not.toHaveBeenCalled();
        });
    });
});
