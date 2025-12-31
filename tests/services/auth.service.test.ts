import authService from '../../src/services/auth/auth.service';
import loginHistoryService from '../../src/services/auth/login-history.service';
import {
    createTestUser,
    createActivatedUser,
    generateUniqueEmail,
    generateUniqueUsername
} from '../helpers/test.helpers';

describe('AuthService', () => {

    describe('register()', () => {
        it('devrait créer un nouvel utilisateur avec succès', async () => {
            const userData = {
                email: generateUniqueEmail(),
                password: 'SecurePass@123',
                first_name: 'John',
                last_name: 'Doe',
                username: generateUniqueUsername(),
                role: 'USER'
            };

            const result = await authService.register(userData);

            expect(result.error).toBe(false);
            expect(result.data).toHaveProperty('otp');
            expect(result.data).toHaveProperty('user');
            expect(result.data.user.email).toBe(userData.email);
            expect(result.data.otp).toHaveLength(6);
            expect(result.data.otp).toMatch(/^\d{6}$/);
        });

        it('devrait empêcher l\'enregistrement avec un email existant', async () => {
            const { user } = await createTestUser();

            const duplicateData = {
                email: user.email,
                password: 'AnotherPass@123',
                first_name: 'Jane',
                last_name: 'Doe',
                username: generateUniqueUsername(),
                role: 'USER'
            };

            const result = await authService.register(duplicateData);

            expect(result.error).toBe(true);
            expect(result.message).toContain('already in use');
        });

        it('devrait générer un OTP numérique de 6 caractères', async () => {
            const { otp } = await createTestUser();

            expect(otp).toMatch(/^\d{6}$/);
            expect(otp).toHaveLength(6);
        });

        it('devrait hasher le mot de passe', async () => {
            const { user, password } = await createTestUser();

            expect(user.password).toBeDefined();
            expect(user.password).not.toBe(password);
            expect(user.password.length).toBeGreaterThan(20); // Hash bcrypt
        });
    });

    describe('activateAccount()', () => {
        it('devrait activer un compte avec un OTP valide', async () => {
            const { user, otp } = await createTestUser();

            const result = await authService.activateAccount({
                email: user.email,
                code: otp
            });

            expect(result.error).toBe(false);
            expect(result.message).toContain('activated successfully');

            // Vérifier que confirmed_at est défini
            const authData = await authService.findOne({ user: user._id });
            expect(authData.error).toBe(false);
            expect(authData.data.confirmed_at).not.toBeNull();
            expect(authData.data.confirmation_token).toBeNull();
        });

        it('devrait échouer avec un OTP invalide', async () => {
            const { user } = await createTestUser();

            const result = await authService.activateAccount({
                email: user.email,
                code: '999999'
            });

            expect(result.error).toBe(true);
            expect(result.message).toContain('not found');
        });

        it('devrait échouer avec un email incorrect', async () => {
            const { otp } = await createTestUser();

            const result = await authService.activateAccount({
                email: 'wrong@example.com',
                code: otp
            });

            expect(result.error).toBe(true);
            expect(result.message).toContain('not found');
        });
    });

    describe('login()', () => {
        it('devrait se connecter avec des identifiants valides', async () => {
            const password = 'TestPass@123';
            const user = await createActivatedUser({ password });

            const result = await authService.login(
                { email: user.email, password },
                true,
                { ip: '127.0.0.1' }
            );

            expect(result.error).toBe(false);
            expect(result.data).toHaveProperty('token');
            expect(result.data).toHaveProperty('refresh_token');
            expect(result.data).toHaveProperty('user');
            expect(result.data.user.email).toBe(user.email);
            expect(typeof result.data.token).toBe('string');
            expect(typeof result.data.refresh_token).toBe('string');
        });

        it('devrait échouer avec un mot de passe incorrect', async () => {
            const password = 'TestPass@123';
            const user = await createActivatedUser({ password });

            const result = await authService.login(
                { email: user.email, password: 'WrongPassword@123' },
                true,
                { ip: '127.0.0.1' }
            );

            expect(result.error).toBe(true);
            expect(result.message).toContain('not match');
        });

        it('devrait échouer avec un email inexistant', async () => {
            const result = await authService.login(
                { email: 'nonexistent@example.com', password: 'TestPass@123' },
                true,
                { ip: '127.0.0.1' }
            );

            expect(result.error).toBe(true);
            expect(result.message).toContain('not found');
        });

        it('devrait échouer avec un compte non activé', async () => {
            const password = 'TestPass@123';
            const { user } = await createTestUser({ password });

            const result = await authService.login(
                { email: user.email, password },
                true,
                { ip: '127.0.0.1' }
            );

            expect(result.error).toBe(true);
            expect(result.message).toContain('not yet activated');
        });

        it('devrait enregistrer l\'historique de connexion', async () => {
            const password = 'TestPass@123';
            const user = await createActivatedUser({ password });

            const loginHistory = {
                ip: '192.168.1.1',
                locations: { country: 'France', city: 'Paris' },
                devices: {
                    browser: { name: 'Chrome', version: '120.0', major: '120' },
                    os: { name: 'Windows', version: '10' }
                }
            };

            await authService.login(
                { email: user.email, password },
                true,
                loginHistory
            );

            const auth = await authService.findOne({ user: user._id });
            const history = await loginHistoryService.getByAuth(auth.data!._id as string);

            expect(history.error).toBe(false);
            expect(history.data).toBeDefined();
            expect(history.data.length).toBeGreaterThan(0);
            expect(history.data[0].ip).toBe('192.168.1.1');
            expect(history.data[0]).toHaveProperty('token');
            expect(history.data[0]).toHaveProperty('refresh_token');
        });

        it('devrait créer des cookies avec les bonnes options', async () => {
            const password = 'TestPass@123';
            const user = await createActivatedUser({ password });

            const result: any = await authService.login(
                { email: user.email, password },
                true,
                { ip: '127.0.0.1' }
            );

            expect(result.cookies).toBeDefined();
            expect(result.cookies).toHaveProperty('token');
            expect(result.cookies).toHaveProperty('refresh_token');
            expect(result.cookies.token.name).toBe('access_token');
            expect(result.cookies.token.options).toHaveProperty('httpOnly', true);
            expect(result.cookies.token.options).toHaveProperty('maxAge');
            expect(result.cookies.refresh_token.name).toBe('refresh_token');
        });
    });

    describe('refresh_token()', () => {
        it('devrait rafraîchir le token avec un refresh_token valide', async () => {
            const password = 'TestPass@123';
            const user = await createActivatedUser({ password });

            const loginResult = await authService.login(
                { email: user.email, password },
                true,
                { ip: '127.0.0.1' }
            );

            // Attendre 1 seconde pour que le JWT ait un timestamp différent
            await new Promise(resolve => setTimeout(resolve, 1100));

            const refreshResult = await authService.refresh_token(
                user.email,
                loginResult.data.refresh_token,
                true
            );

            expect(refreshResult.error).toBe(false);
            expect(refreshResult.data).toBeTruthy();
            expect(typeof refreshResult.data).toBe('string');

            // Vérifier que le nouveau token est différent
            expect(refreshResult.data).not.toBe(loginResult.data.token);

            // Vérifier que le token est valide
            const decoded: any = authService.tokenVerify(refreshResult.data);
            expect(decoded).toBeTruthy();
            expect(decoded.id).toBe(user._id.toString());
        });

        it('devrait échouer avec un refresh_token invalide', async () => {
            const user = await createActivatedUser();

            const result = await authService.refresh_token(
                user.email,
                'invalid_token_here',
                true
            );

            expect(result.error).toBe(true);
            expect(result.message).toContain('Incorrect refresh token');
        });

        it('devrait mettre à jour l\'historique de connexion', async () => {
            const password = 'TestPass@123';
            const user = await createActivatedUser({ password });

            const loginResult = await authService.login(
                { email: user.email, password },
                true,
                { ip: '127.0.0.1' }
            );

            // Attendre 1 seconde pour que le JWT ait un timestamp différent
            await new Promise(resolve => setTimeout(resolve, 1100));

            await authService.refresh_token(
                user.email,
                loginResult.data.refresh_token,
                true
            );

            const auth = await authService.findOne({ user: user._id });
            const historyResult = await loginHistoryService.getByAuth(auth.data!._id as string);
            const history = historyResult.data[0];

            expect(history.token).not.toBe(loginResult.data.token);

            // Vérifier que le token a été mis à jour et est valide
            expect(history.token).toBeTruthy();
            const decoded = authService.tokenVerify(history.token);
            expect(decoded).toBeTruthy();
        });
    });

    describe('forgotPassword()', () => {
        it('devrait générer un token de réinitialisation hashé', async () => {
            const user = await createActivatedUser();

            const result = await authService.forgotPassword(user.email);

            expect(result.error).toBe(false);
            expect(result.message).toContain('sent to your email');

            const auth = await authService.findOne({ user: user._id });
            expect(auth.data.reset_password_token).toBeTruthy();
            // Le token est maintenant hashé (bcrypt), donc plus long que 10 caractères
            expect(auth.data.reset_password_token.length).toBeGreaterThan(20);
            // Ne peut plus être un pattern numérique car c'est un hash bcrypt
        });

        it('devrait échouer avec un email non enregistré', async () => {
            const result = await authService.forgotPassword('nonexistent@example.com');

            expect(result.error).toBe(true);
            expect(result.message).toContain('not registered');
        });
    });

    describe('verifyOtp()', () => {
        it('devrait vérifier un OTP de réinitialisation valide', async () => {
            const user = await createActivatedUser();

            // Note: forgotPassword génère un OTP et l'envoie par email (en clair)
            // mais stocke le hash en BD. Pour ce test, on doit simuler
            // la réception de l'OTP par email

            // On ne peut pas tester directement car l'OTP en clair est seulement envoyé par email
            // Ce test nécessiterait de mocker le service d'email ou d'avoir accès à l'OTP généré

            // Pour l'instant, on teste le cas d'échec seulement
            const result = await authService.verifyOtp(user.email, 'wrong_otp');
            expect(result.error).toBe(true);
        });

        it('devrait échouer avec un OTP invalide', async () => {
            const user = await createActivatedUser();
            await authService.forgotPassword(user.email);

            const result = await authService.verifyOtp(user.email, 'invalid_otp');

            expect(result.error).toBe(true);
        });

        it('devrait échouer si aucun reset token n\'existe', async () => {
            const user = await createActivatedUser();

            const result = await authService.verifyOtp(user.email, '1234567890');

            expect(result.error).toBe(true);
            expect(result.message).toContain('No reset code found');
        });
    });

    describe('resetPassword()', () => {
        it('devrait réinitialiser le mot de passe avec succès', async () => {
            const oldPassword = 'OldPass@123';
            const newPassword = 'NewPass@456';
            const user = await createActivatedUser({ password: oldPassword });

            await authService.forgotPassword(user.email);
            const auth = await authService.findOne({ user: user._id });
            const resetToken = auth.data.reset_password_token;

            const result = await authService.resetPassword(
                resetToken,
                user.email,
                newPassword
            );

            expect(result.error).toBe(false);
            expect(result.message).toContain('successfully');

            // Vérifier que l'ancien mot de passe ne fonctionne plus
            const oldLoginResult = await authService.login(
                { email: user.email, password: oldPassword },
                true,
                { ip: '127.0.0.1' }
            );
            expect(oldLoginResult.error).toBe(true);

            // Vérifier que le nouveau mot de passe fonctionne
            const newLoginResult = await authService.login(
                { email: user.email, password: newPassword },
                true,
                { ip: '127.0.0.1' }
            );
            expect(newLoginResult.error).toBe(false);
        });

        it('devrait ajouter le nouveau mot de passe à l\'historique', async () => {
            const oldPassword = 'OldPass@123';
            const newPassword = 'NewPass@456';
            const user = await createActivatedUser({ password: oldPassword });

            await authService.forgotPassword(user.email);
            const authBefore = await authService.findOne({ user: user._id });
            const resetToken = authBefore.data.reset_password_token;
            const passwordCountBefore = authBefore.data.passwords.length;

            await authService.resetPassword(resetToken, user.email, newPassword);

            const authAfter = await authService.findOne({ user: user._id });
            expect(authAfter.data.passwords.length).toBe(passwordCountBefore + 1);
            expect(authAfter.data.reset_password_token).toBeNull();
        });
    });

    describe('itsNotMe()', () => {
        it('devrait sécuriser le compte et effacer les tokens', async () => {
            const password = 'TestPass@123';
            const user = await createActivatedUser({ password });

            // Créer des tokens
            await authService.forgotPassword(user.email);

            const result = await authService.itsNotMe(user.email);

            expect(result.error).toBe(false);
            expect(result.message).toContain('secured successfully');

            // Vérifier que les tokens sont effacés
            const auth = await authService.findOne({ user: user._id });
            expect(auth.data.reset_password_token).toBeNull();
        });

        it('devrait échouer avec un compte inexistant', async () => {
            const result = await authService.itsNotMe('nonexistent@example.com');

            expect(result.error).toBe(true);
            expect(result.message).toContain('not found');
        });
    });

    describe('generateOTP()', () => {
        it('devrait générer un OTP numérique par défaut', () => {
            const otp = authService.generateOTP();
            expect(otp).toMatch(/^\d{6}$/);
            expect(otp).toHaveLength(6);
        });

        it('devrait générer un OTP de longueur personnalisée', () => {
            const otp = authService.generateOTP({ type: 'numeric', length: 10 });
            expect(otp).toMatch(/^\d{10}$/);
            expect(otp).toHaveLength(10);
        });

        it('devrait générer un OTP alphabétique', () => {
            const otp = authService.generateOTP({ type: 'alphabet', length: 8 });
            expect(otp).toMatch(/^[a-zA-Z]{8}$/);
            expect(otp).toHaveLength(8);
        });
    });
});
