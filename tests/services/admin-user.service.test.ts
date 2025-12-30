import adminUserService from '../../src/services/admin/admin-user.service';
import userService from '../../src/services/app/user.service';
import authService from '../../src/services/auth/auth.service';
import loginHistoryService from '../../src/services/auth/login-history.service';
import {
    createActivatedUser,
    generateUniqueEmail,
    generateUniqueUsername
} from '../helpers/test.helpers';

describe('AdminUserService', () => {

    describe('enrichUserWithAuth', () => {
        it('devrait enrichir un utilisateur avec ses données d\'authentification', async () => {
            const user = await createActivatedUser();
            const userDoc = await userService.findOne({ email: user.email });

            const enriched = await adminUserService.enrichUserWithAuth(userDoc?.data as any);

            expect(enriched).toBeDefined();
            expect(enriched.role).toBeDefined();
            expect(enriched.is_active).toBe(true);
            expect(enriched.confirmed_at).not.toBeNull();
            expect(enriched.active_sessions).toBeDefined();
        });
    });

    describe('enrichUsersWithAuth', () => {
        it('devrait enrichir plusieurs utilisateurs', async () => {
            await Promise.all([
                createActivatedUser({ email: generateUniqueEmail() }),
                createActivatedUser({ email: generateUniqueEmail() }),
                createActivatedUser({ email: generateUniqueEmail() })
            ]);

            const users = await userService.find({ deleted_at: null });
            const enriched = await adminUserService.enrichUsersWithAuth(users?.data as any);

            expect(enriched.length).toBeGreaterThanOrEqual(3);
            enriched.forEach((user: any) => {
                expect(user.role).toBeDefined();
                expect(user.is_active).toBeDefined();
            });
        });
    });

    describe('getUserWithDetails', () => {
        it('devrait récupérer un utilisateur avec tous ses détails', async () => {
            const user = await createActivatedUser();
            const result = await adminUserService.getUserWithDetails(user._id);

            expect(result.error).toBe(false);
            expect(result.data).toBeDefined();
            expect(result?.data?.email).toBe(user.email);
            expect(result?.data?.role).toBeDefined();
            expect(result?.data?.login_history).toBeDefined();
            expect(result?.data?.password_changes_count).toBeGreaterThanOrEqual(0);
        });

        it('devrait retourner une erreur si l\'utilisateur n\'existe pas', async () => {
            const fakeId = '507f1f77bcf86cd799439011';
            const result = await adminUserService.getUserWithDetails(fakeId);

            expect(result.error).toBe(true);
            expect(result.message).toBe('User not found');
        });
    });

    describe('listUsersWithFilters', () => {
        it('devrait lister les utilisateurs avec pagination', async () => {
            await Promise.all([
                createActivatedUser({ email: generateUniqueEmail() }),
                createActivatedUser({ email: generateUniqueEmail() }),
                createActivatedUser({ email: generateUniqueEmail() })
            ]);

            const result = await adminUserService.listUsersWithFilters({}, 1, 2);

            expect(result.error).toBe(false);
            expect(result.data.content).toBeDefined();
            expect(result.data.content.length).toBeLessThanOrEqual(2);
            expect(result.data.pagination).toBeDefined();
        });
    });

    describe('filterUsersByStatus', () => {
        it('devrait filtrer les utilisateurs actifs', async () => {
            const users = [
                { is_active: true, email: 'active@test.com' },
                { is_active: false, email: 'inactive@test.com' },
                { is_active: true, email: 'active2@test.com' }
            ];

            const filtered = adminUserService.filterUsersByStatus(users as any, 'active');

            expect(filtered.length).toBe(2);
            expect(filtered.every((u: any) => u.is_active)).toBe(true);
        });

        it('devrait filtrer les utilisateurs inactifs', async () => {
            const users = [
                { is_active: true, email: 'active@test.com' },
                { is_active: false, email: 'inactive@test.com' }
            ];

            const filtered = adminUserService.filterUsersByStatus(users as any, 'inactive');

            expect(filtered.length).toBe(1);
            expect(filtered[0].is_active).toBe(false);
        });
    });

    describe('filterUsersByRole', () => {
        it('devrait filtrer les utilisateurs par rôle', async () => {
            const users = [
                { role: 'ADMIN', email: 'admin@test.com' },
                { role: 'USER', email: 'user@test.com' },
                { role: 'ADMIN', email: 'admin2@test.com' }
            ];

            const filtered = adminUserService.filterUsersByRole(users as any, 'admin');

            expect(filtered.length).toBe(2);
            expect(filtered.every((u: any) => u.role === 'ADMIN')).toBe(true);
        });
    });

    describe('createUserWithAuth', () => {
        it('devrait créer un utilisateur avec authentification', async () => {
            const userData = {
                first_name: 'John',
                last_name: 'Doe',
                username: generateUniqueUsername(),
                email: generateUniqueEmail(),
                password: 'Test@1234',
                role: 'USER'
            };

            const result = await adminUserService.createUserWithAuth(userData);

            expect(result.error).toBe(false);
            expect(result.data.id).toBeDefined();
            expect(result.data.email).toBe(userData.email);
            expect(result.data.role).toBe('USER');

            // Vérifier que l'utilisateur existe
            const user = await userService.findById(result.data.id);
            expect(user.error).toBe(false);
            expect(user?.data?.email).toBe(userData.email);

            // Vérifier que l'auth existe
            const auth = await authService.findOne({ user: result.data.id });
            expect(auth.error).toBe(false);
            expect(auth?.data?.role).toBe('USER');
            expect(auth?.data?.confirmed_at).not.toBeNull();
        });

        it('devrait échouer si l\'email existe déjà', async () => {
            const user = await createActivatedUser();

            const userData = {
                first_name: 'Jane',
                last_name: 'Doe',
                username: generateUniqueUsername(),
                email: user.email,
                password: 'Test@1234',
                role: 'USER'
            };

            const result = await adminUserService.createUserWithAuth(userData);

            expect(result.error).toBe(true);
            expect(result.message).toBe('Email or username already exists');
        });
    });

    describe('updateUserSafely', () => {
        it('devrait mettre à jour un utilisateur', async () => {
            const user = await createActivatedUser();

            const result = await adminUserService.updateUserSafely(user._id, {
                first_name: 'UpdatedName',
                last_name: 'UpdatedLastName'
            });

            expect(result.error).toBe(false);
            expect(result.modifiedCount).toBeGreaterThan(0);

            const updated = await userService.findById(user._id);
            expect(updated.data.first_name).toBe('UpdatedName');
            expect(updated.data.last_name).toBe('UpdatedLastName');
        });

        it('devrait échouer si le username est déjà pris', async () => {
            const user1 = await createActivatedUser();
            const user2 = await createActivatedUser();

            const result = await adminUserService.updateUserSafely(user1._id, {
                username: user2.username
            });

            expect(result.error).toBe(true);
            expect(result.message).toBe('Username already taken');
        });

        it('devrait échouer si aucune donnée n\'est fournie', async () => {
            const user = await createActivatedUser();

            const result = await adminUserService.updateUserSafely(user._id, {});

            expect(result.error).toBe(true);
            expect(result.message).toBe('No data provided for update');
        });
    });

    describe('resetUserPassword', () => {
        it('devrait réinitialiser le mot de passe d\'un utilisateur', async () => {
            const user = await createActivatedUser();

            const result = await adminUserService.resetUserPassword(user._id, 'NewPass@123');

            expect(result.error).toBe(false);

            // Vérifier que l'historique de connexion est vide
            const auth = await authService.findOne({ user: user._id });
            expect(auth.data.login_history.length).toBe(0);

            // Vérifier que le mot de passe a été ajouté à l'historique
            expect(auth.data.passwords.length).toBeGreaterThan(0);
        });
    });

    describe('deactivateUserSafely', () => {
        it('devrait désactiver un utilisateur', async () => {
            const user = await createActivatedUser();
            const admin = await createActivatedUser({ role: 'ADMIN' });

            const result = await adminUserService.deactivateUserSafely(user._id, admin._id);

            expect(result.error).toBe(false);
            expect(result.data).toBeDefined();

            const deactivated = await userService.findById(user._id);
            expect(deactivated.data.deleted_at).not.toBeNull();
        });

        it('devrait empêcher un admin de se désactiver lui-même', async () => {
            const admin = await createActivatedUser({ role: 'ADMIN' });

            const result = await adminUserService.deactivateUserSafely(admin._id, admin._id);

            expect(result.error).toBe(true);
            expect(result.message).toBe('Cannot deactivate your own account');
            expect(result.statusCode).toBe(403);
        });

        it('devrait retourner une erreur si l\'utilisateur n\'existe pas', async () => {
            const admin = await createActivatedUser({ role: 'ADMIN' });
            const fakeId = '507f1f77bcf86cd799439011';

            const result = await adminUserService.deactivateUserSafely(fakeId, admin._id);

            expect(result.error).toBe(true);
            expect(result.statusCode).toBe(404);
        });
    });

    describe('getUserStatistics', () => {
        it('devrait récupérer les statistiques des utilisateurs', async () => {
            await Promise.all([
                createActivatedUser({ email: generateUniqueEmail() }),
                createActivatedUser({ email: generateUniqueEmail() }),
                createActivatedUser({ email: generateUniqueEmail() })
            ]);

            const result = await adminUserService.getUserStatistics();

            expect(result.error).toBe(false);
            expect(result.data).toBeDefined();
            expect(result.data.total_users).toBeGreaterThanOrEqual(3);
            expect(result.data.active_users).toBeDefined();
            expect(result.data.pending_users).toBeDefined();
            expect(result.data.roles_distribution).toBeDefined();
            expect(result.data.growth_rate).toBeDefined();
        });
    });

    describe('advancedSearch', () => {
        it('devrait rechercher des utilisateurs par query', async () => {
            await createActivatedUser({
                first_name: 'SearchTest',
                email: generateUniqueEmail()
            });

            const result = await adminUserService.advancedSearch({
                query: 'SearchTest',
                page: 1,
                limit: 10
            });

            expect(result.error).toBe(false);
            expect(result.data.content.length).toBeGreaterThan(0);
            expect(result.data.content[0].first_name).toContain('SearchTest');
        });

        it('devrait rechercher des utilisateurs par rôle', async () => {
            await createActivatedUser({
                email: generateUniqueEmail(),
                role: 'ADMIN'
            });

            const result = await adminUserService.advancedSearch({
                role: 'ADMIN',
                page: 1,
                limit: 10
            });

            expect(result.error).toBe(false);
            expect(result.data.content.length).toBeGreaterThan(0);
            expect(result.data.content.every((u: any) => u.role === 'ADMIN')).toBe(true);
        });

        it('devrait rechercher des utilisateurs par statut', async () => {
            await createActivatedUser({ email: generateUniqueEmail() });

            const result = await adminUserService.advancedSearch({
                status: 'active',
                page: 1,
                limit: 10
            });

            expect(result.error).toBe(false);
            expect(result.data.content.every((u: any) => u.is_active)).toBe(true);
        });

        it('devrait supporter la pagination', async () => {
            await Promise.all([
                createActivatedUser({ email: generateUniqueEmail() }),
                createActivatedUser({ email: generateUniqueEmail() }),
                createActivatedUser({ email: generateUniqueEmail() })
            ]);

            const result = await adminUserService.advancedSearch({
                page: 1,
                limit: 2
            });

            expect(result.error).toBe(false);
            expect(result.data.content.length).toBeLessThanOrEqual(2);
            expect(result.data.pagination.total).toBeGreaterThanOrEqual(3);
            expect(result.data.pagination.totalPages).toBeGreaterThan(0);
        });
    });

    describe('getRecentActivity', () => {
        it('devrait récupérer l\'activité récente', async () => {
            // Créer et connecter des utilisateurs pour générer de l'activité
            const user = await createActivatedUser();

            // Get auth document
            const auth = await authService.findOne({ user: user._id });

            // Simuler une connexion en ajoutant un historique
            await loginHistoryService.createLoginHistory({
                auth: auth.data!._id as string,
                user: user._id as string,
                ip: '127.0.0.1',
                token: 'test-token',
                refresh_token: 'test-refresh',
                locations: { country: 'Test', city: 'Test' }
            });

            const result = await adminUserService.getRecentActivity(10);

            expect(result.error).toBe(false);
            expect(result.data).toBeDefined();
            expect(Array.isArray(result.data)).toBe(true);
        });
    });

    describe('convertToCSV', () => {
        it('devrait convertir des données en CSV', () => {
            const data = [
                { id: '1', name: 'John', email: 'john@test.com' },
                { id: '2', name: 'Jane', email: 'jane@test.com' }
            ];

            const csv = adminUserService.convertToCSV(data);

            expect(csv).toContain('id,name,email');
            expect(csv).toContain('John');
            expect(csv).toContain('jane@test.com');
        });

        it('devrait retourner une chaîne vide pour un tableau vide', () => {
            const csv = adminUserService.convertToCSV([]);
            expect(csv).toBe('');
        });
    });
});
