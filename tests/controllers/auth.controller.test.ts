import request from 'supertest';
import { app } from '../../main';
import { createActivatedUser, createTestUser, generateUniqueEmail } from '../helpers/test.helpers';
import authService from '../../src/services/auth/auth.service';

describe('AuthController', () => {

    describe('POST /auth/register', () => {
        it('devrait enregistrer un nouvel utilisateur', async () => {
            const userData = {
                first_name: 'Test',
                last_name: 'User',
                email: generateUniqueEmail(),
                password: 'Password@123'
            };

            const response = await request(app)
                .post('/auth/register')
                .set('x-api-key', process.env.X_API_KEY || 'test-api-key')
                .send(userData);

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.data.user.email).toBe(userData.email);
        });

        it('devrait échouer si l\'email est déjà utilisé', async () => {
            const user = await createActivatedUser();
            const userData = {
                first_name: 'Test',
                last_name: 'User',
                email: user.email,
                password: 'Password@123'
            };

            const response = await request(app)
                .post('/auth/register')
                .set('x-api-key', process.env.X_API_KEY || 'test-api-key')
                .send(userData);

            expect(response.status).toBe(400);
        });
    });

    describe('POST /auth/activate-account', () => {
        it('devrait activer le compte avec un code valide', async () => {
            const { user, otp } = await createTestUser();

            const response = await request(app)
                .post('/auth/activate-account')
                .set('x-api-key', process.env.X_API_KEY || 'test-api-key')
                .send({ email: user?.email, code: otp });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

        it('devrait échouer avec un code invalide', async () => {
            const { user } = await createTestUser();

            const response = await request(app)
                .post('/auth/activate-account')
                .set('x-api-key', process.env.X_API_KEY || 'test-api-key')
                .send({ email: user?.email, code: '000000' });

            expect(response.status).toBe(404);
        });
    });

    describe('POST /auth/login', () => {
        it('devrait connecter un utilisateur avec des identifiants valides', async () => {
            const user = await createActivatedUser({ password: 'Password@123' });

            const response = await request(app)
                .post('/auth/login')
                .set('x-api-key', process.env.X_API_KEY || 'test-api-key')
                .send({ email: user.email, password: 'Password@123' });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('token');
            expect(response.body.data).toHaveProperty('refresh_token');
        });

        it('devrait échouer avec un mot de passe incorrect', async () => {
            const user = await createActivatedUser({ password: 'Password@123' });

            const response = await request(app)
                .post('/auth/login')
                .set('x-api-key', process.env.X_API_KEY || 'test-api-key')
                .send({ email: user.email, password: 'WrongPassword' });

            expect(response.status).toBe(401);
        });
    });

    describe('POST /auth/refresh-token', () => {
        it('devrait rafraîchir le token avec un refresh token valide', async () => {
            const user = await createActivatedUser({ password: 'Password@123' });

            const loginResponse = await request(app)
                .post('/auth/login')
                .set('x-api-key', process.env.X_API_KEY || 'test-api-key')
                .send({ email: user.email, password: 'Password@123' });

            const refreshToken = loginResponse.body.data.refresh_token;

            const response = await request(app)
                .post('/auth/refresh-token')
                .set('x-api-key', process.env.X_API_KEY || 'test-api-key')
                .send({ email: user.email, code: refreshToken });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).not.toBe(loginResponse.body.data.token);
        });
    });

    describe('POST /auth/forgot-password', () => {
        it('devrait envoyer un code de réinitialisation de mot de passe', async () => {
            const user = await createActivatedUser();

            const response = await request(app)
                .post('/auth/forgot-password')
                .set('x-api-key', process.env.X_API_KEY || 'test-api-key')
                .send({ email: user.email });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });
    });

    describe('POST /auth/verify-otp', () => {
        it('devrait vérifier un OTP valide', async () => {
            const user = await createActivatedUser();
            await authService.forgotPassword(user?.email as string);
            const authData = await authService.findOne({ user: user._id });
            const otp = authData?.data?.reset_password_token;

            const response = await request(app)
                .post('/auth/verify-otp')
                .set('x-api-key', process.env.X_API_KEY || 'test-api-key')
                .send({ email: user.email, otp });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });
    });

    describe('POST /auth/reset-password', () => {
        it('devrait réinitialiser le mot de passe', async () => {
            const user = await createActivatedUser();
            await authService.forgotPassword(user?.email as string);
            const authData = await authService.findOne({ user: user._id });
            const token = authData?.data?.reset_password_token;

            const response = await request(app)
                .post('/auth/reset-password')
                .set('x-api-key', process.env.X_API_KEY || 'test-api-key')
                .send({
                    token,
                    email: user.email,
                    password: 'NewPassword@123'
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });
    });

    describe('POST /auth/it-not-me', () => {
        it('devrait sécuriser le compte', async () => {
            const user = await createActivatedUser();

            const response = await request(app)
                .post('/auth/it-not-me')
                .set('x-api-key', process.env.X_API_KEY || 'test-api-key')
                .send({ email: user.email });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });
    });
});
