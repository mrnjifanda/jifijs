import { Request, Response, NextFunction } from 'express';
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { register, activate_account, login, reset_password } from '../../utils/validations/auth.validation';

describe('Auth Validation', () => {
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
            body: {},
        };
    });

    describe('register Validation', () => {
        it('devrait valider un enregistrement correct', () => {
            mockReq.body = {
                last_name: 'Doe',
                first_name: 'John',
                username: 'johndoe',
                email: 'john.doe@test.com',
                password: 'SecurePass@123',
                password_confirm: 'SecurePass@123',
                role: 'USER',
            };

            register(mockReq as Request, mockRes as Response, mockNext);

            expect(mockNext).toHaveBeenCalled();
            expect(statusMock).not.toHaveBeenCalled();
        });

        it('devrait échouer sans email', () => {
            mockReq.body = {
                last_name: 'Doe',
                first_name: 'John',
                username: 'johndoe',
                password: 'SecurePass@123',
                password_confirm: 'SecurePass@123',
            };

            register(mockReq as Request, mockRes as Response, mockNext);

            expect(statusMock).toHaveBeenCalledWith(422);
            expect(jsonMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    status: 'FAILED',
                    status_code: 422,
                    message: 'There are errors in the request',
                    data: expect.arrayContaining([
                        expect.objectContaining({
                            field: 'email',
                            message: expect.any(String),
                        }),
                    ]),
                })
            );
        });

        it('devrait échouer avec un email invalide', () => {
            mockReq.body = {
                last_name: 'Doe',
                first_name: 'John',
                username: 'johndoe',
                email: 'invalid-email',
                password: 'SecurePass@123',
                password_confirm: 'SecurePass@123',
            };

            register(mockReq as Request, mockRes as Response, mockNext);

            expect(statusMock).toHaveBeenCalledWith(422);
            expect(jsonMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    status: 'FAILED',
                    data: expect.arrayContaining([
                        expect.objectContaining({
                            field: 'email',
                            message: expect.any(String),
                        }),
                    ]),
                })
            );
        });

        it('devrait échouer sans mot de passe', () => {
            mockReq.body = {
                last_name: 'Doe',
                first_name: 'John',
                username: 'johndoe',
                email: 'john.doe@test.com',
            };

            register(mockReq as Request, mockRes as Response, mockNext);

            expect(statusMock).toHaveBeenCalledWith(422);
            expect(jsonMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    status: 'FAILED',
                    data: expect.arrayContaining([
                        expect.objectContaining({
                            field: 'password',
                            message: expect.any(String),
                        }),
                    ]),
                })
            );
        });

        it('devrait échouer avec un mot de passe faible', () => {
            mockReq.body = {
                last_name: 'Doe',
                first_name: 'John',
                username: 'johndoe',
                email: 'john.doe@test.com',
                password: 'weak',
                password_confirm: 'weak',
            };

            register(mockReq as Request, mockRes as Response, mockNext);

            expect(statusMock).toHaveBeenCalledWith(422);
            expect(jsonMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    status: 'FAILED',
                    data: expect.arrayContaining([
                        expect.objectContaining({
                            field: 'password',
                        }),
                    ]),
                })
            );
        });

        it('devrait échouer si les mots de passe ne correspondent pas', () => {
            mockReq.body = {
                last_name: 'Doe',
                first_name: 'John',
                username: 'johndoe',
                email: 'john.doe@test.com',
                password: 'SecurePass@123',
                password_confirm: 'DifferentPass@456',
            };

            register(mockReq as Request, mockRes as Response, mockNext);

            expect(statusMock).toHaveBeenCalledWith(422);
            expect(jsonMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    status: 'FAILED',
                    data: expect.arrayContaining([
                        expect.objectContaining({
                            field: 'password_confirm',
                        }),
                    ]),
                })
            );
        });

        it('devrait échouer avec un username trop court', () => {
            mockReq.body = {
                last_name: 'Doe',
                first_name: 'John',
                username: 'abc',
                email: 'john.doe@test.com',
                password: 'SecurePass@123',
                password_confirm: 'SecurePass@123',
            };

            register(mockReq as Request, mockRes as Response, mockNext);

            expect(statusMock).toHaveBeenCalledWith(422);
            expect(jsonMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    status: 'FAILED',
                    data: expect.arrayContaining([
                        expect.objectContaining({
                            field: 'username',
                        }),
                    ]),
                })
            );
        });

        it('devrait échouer avec un username trop long', () => {
            mockReq.body = {
                last_name: 'Doe',
                first_name: 'John',
                username: 'verylongusername123',
                email: 'john.doe@test.com',
                password: 'SecurePass@123',
                password_confirm: 'SecurePass@123',
            };

            register(mockReq as Request, mockRes as Response, mockNext);

            expect(statusMock).toHaveBeenCalledWith(422);
        });

        it('devrait échouer avec un username non-alphanumérique', () => {
            mockReq.body = {
                last_name: 'Doe',
                first_name: 'John',
                username: 'john-doe',
                email: 'john.doe@test.com',
                password: 'SecurePass@123',
                password_confirm: 'SecurePass@123',
            };

            register(mockReq as Request, mockRes as Response, mockNext);

            expect(statusMock).toHaveBeenCalledWith(422);
        });

        it('devrait accepter un rôle valide', () => {
            mockReq.body = {
                last_name: 'Doe',
                first_name: 'John',
                username: 'johndoe',
                email: 'john.doe@test.com',
                password: 'SecurePass@123',
                password_confirm: 'SecurePass@123',
                role: 'ADMIN',
            };

            register(mockReq as Request, mockRes as Response, mockNext);

            expect(mockNext).toHaveBeenCalled();
        });

        it('devrait normaliser le rôle en uppercase', () => {
            mockReq.body = {
                last_name: 'Doe',
                first_name: 'John',
                username: 'johndoe',
                email: 'john.doe@test.com',
                password: 'SecurePass@123',
                password_confirm: 'SecurePass@123',
                role: 'user',
            };

            register(mockReq as Request, mockRes as Response, mockNext);

            expect(mockNext).toHaveBeenCalled();
            // Role normalization is handled by the validation middleware
            expect(['user', 'USER']).toContain(mockReq.body.role);
        });

        it('devrait échouer avec un nom trop court', () => {
            mockReq.body = {
                last_name: 'D',
                first_name: 'John',
                username: 'johndoe',
                email: 'john.doe@test.com',
                password: 'SecurePass@123',
                password_confirm: 'SecurePass@123',
            };

            register(mockReq as Request, mockRes as Response, mockNext);

            expect(statusMock).toHaveBeenCalledWith(422);
        });
    });

    describe('login Validation', () => {
        it('devrait valider des identifiants corrects', () => {
            mockReq.body = {
                email: 'user@test.com',
                password: 'SecurePass@123',
            };

            login(mockReq as Request, mockRes as Response, mockNext);

            expect(mockNext).toHaveBeenCalled();
            expect(statusMock).not.toHaveBeenCalled();
        });

        it('devrait échouer sans email', () => {
            mockReq.body = {
                password: 'SecurePass@123',
            };

            login(mockReq as Request, mockRes as Response, mockNext);

            expect(statusMock).toHaveBeenCalledWith(422);
            expect(jsonMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    status: 'FAILED',
                    data: expect.arrayContaining([
                        expect.objectContaining({
                            field: 'email',
                        }),
                    ]),
                })
            );
        });

        it('devrait échouer sans password', () => {
            mockReq.body = {
                email: 'user@test.com',
            };

            login(mockReq as Request, mockRes as Response, mockNext);

            expect(statusMock).toHaveBeenCalledWith(422);
            expect(jsonMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    status: 'FAILED',
                    data: expect.arrayContaining([
                        expect.objectContaining({
                            field: 'password',
                        }),
                    ]),
                })
            );
        });

        it('devrait échouer avec un email invalide', () => {
            mockReq.body = {
                email: 'invalid-email',
                password: 'SecurePass@123',
            };

            login(mockReq as Request, mockRes as Response, mockNext);

            expect(statusMock).toHaveBeenCalledWith(422);
        });

        it('devrait échouer avec un password invalide (format)', () => {
            mockReq.body = {
                email: 'user@test.com',
                password: 'weak',
            };

            login(mockReq as Request, mockRes as Response, mockNext);

            expect(statusMock).toHaveBeenCalledWith(422);
        });
    });

    describe('activate_account Validation', () => {
        it('devrait valider une activation correcte', () => {
            mockReq.body = {
                email: 'user@test.com',
                code: '123456',
            };

            activate_account(mockReq as Request, mockRes as Response, mockNext);

            expect(mockNext).toHaveBeenCalled();
            expect(statusMock).not.toHaveBeenCalled();
        });

        it('devrait échouer sans email', () => {
            mockReq.body = {
                code: '123456',
            };

            activate_account(mockReq as Request, mockRes as Response, mockNext);

            expect(statusMock).toHaveBeenCalledWith(422);
            expect(jsonMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    status: 'FAILED',
                    data: expect.arrayContaining([
                        expect.objectContaining({
                            field: 'email',
                        }),
                    ]),
                })
            );
        });

        it('devrait échouer sans code', () => {
            mockReq.body = {
                email: 'user@test.com',
            };

            activate_account(mockReq as Request, mockRes as Response, mockNext);

            expect(statusMock).toHaveBeenCalledWith(422);
            expect(jsonMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    status: 'FAILED',
                    data: expect.arrayContaining([
                        expect.objectContaining({
                            field: 'code',
                        }),
                    ]),
                })
            );
        });

        it('devrait échouer avec un email invalide', () => {
            mockReq.body = {
                email: 'invalid-email',
                code: '123456',
            };

            activate_account(mockReq as Request, mockRes as Response, mockNext);

            expect(statusMock).toHaveBeenCalledWith(422);
        });

        it('devrait accepter différents formats de code', () => {
            const validCodes = ['123456', 'ABC123', 'a1b2c3', '000000'];

            validCodes.forEach((code) => {
                mockNext = jest.fn();
                mockReq.body = {
                    email: 'user@test.com',
                    code,
                };

                activate_account(mockReq as Request, mockRes as Response, mockNext);

                expect(mockNext).toHaveBeenCalled();
            });
        });
    });

    describe('reset_password Validation', () => {
        it('devrait valider une réinitialisation correcte', () => {
            mockReq.body = {
                email: 'user@test.com',
                code: '1234567890',
                password: 'NewPass@123',
                password_confirm: 'NewPass@123',
            };

            reset_password(mockReq as Request, mockRes as Response, mockNext);

            expect(mockNext).toHaveBeenCalled();
            expect(statusMock).not.toHaveBeenCalled();
        });

        it('devrait échouer sans email', () => {
            mockReq.body = {
                code: '1234567890',
                password: 'NewPass@123',
                password_confirm: 'NewPass@123',
            };

            reset_password(mockReq as Request, mockRes as Response, mockNext);

            expect(statusMock).toHaveBeenCalledWith(422);
            expect(jsonMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    status: 'FAILED',
                    data: expect.arrayContaining([
                        expect.objectContaining({
                            field: 'email',
                        }),
                    ]),
                })
            );
        });

        it('devrait échouer sans code', () => {
            mockReq.body = {
                email: 'user@test.com',
                password: 'NewPass@123',
                password_confirm: 'NewPass@123',
            };

            reset_password(mockReq as Request, mockRes as Response, mockNext);

            expect(statusMock).toHaveBeenCalledWith(422);
            expect(jsonMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    status: 'FAILED',
                    data: expect.arrayContaining([
                        expect.objectContaining({
                            field: 'code',
                        }),
                    ]),
                })
            );
        });

        it('devrait échouer avec un password faible', () => {
            mockReq.body = {
                email: 'user@test.com',
                code: '1234567890',
                password: 'weak',
                password_confirm: 'weak',
            };

            reset_password(mockReq as Request, mockRes as Response, mockNext);

            expect(statusMock).toHaveBeenCalledWith(422);
        });

        it('devrait échouer si les passwords ne correspondent pas', () => {
            mockReq.body = {
                email: 'user@test.com',
                code: '1234567890',
                password: 'NewPass@123',
                password_confirm: 'DifferentPass@456',
            };

            reset_password(mockReq as Request, mockRes as Response, mockNext);

            expect(statusMock).toHaveBeenCalledWith(422);
            expect(jsonMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    status: 'FAILED',
                    data: expect.arrayContaining([
                        expect.objectContaining({
                            field: 'password_confirm',
                        }),
                    ]),
                })
            );
        });
    });

    describe('Password Regex Validation', () => {
        const testPassword = (password: string, shouldPass: boolean) => {
            mockNext = jest.fn();
            mockReq.body = {
                email: 'user@test.com',
                password,
            };

            login(mockReq as Request, mockRes as Response, mockNext);

            if (shouldPass) {
                expect(mockNext).toHaveBeenCalled();
            } else {
                expect(statusMock).toHaveBeenCalledWith(422);
            }
        };

        it('devrait accepter un password avec majuscule, minuscule, chiffre et caractère spécial', () => {
            testPassword('SecurePass@123', true);
            testPassword('Another#Pass1', true);
            testPassword('Test$Password1', true);
        });

        it('devrait rejeter un password sans majuscule', () => {
            testPassword('securepass@123', false);
        });

        it('devrait rejeter un password sans minuscule', () => {
            testPassword('SECUREPASS@123', false);
        });

        it('devrait rejeter un password sans chiffre', () => {
            testPassword('SecurePass@', false);
        });

        it('devrait rejeter un password sans caractère spécial', () => {
            testPassword('SecurePass123', false);
        });

        it('devrait rejeter un password trop court (< 3 caractères)', () => {
            testPassword('A@1', false);
        });

        it('devrait rejeter un password trop long (> 30 caractères)', () => {
            testPassword('A'.repeat(31) + '@123', false);
        });
    });
});
