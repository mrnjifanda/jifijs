import { describe, it, expect, beforeEach } from '@jest/globals';
import loginHistoryService from '../../src/services/auth/login-history.service';
import LoginHistory from '../../src/models/auth/login-history.model';
import { createActivatedUser } from '../helpers/test.helpers';
import authService from '../../src/services/auth/auth.service';

describe('LoginHistoryService', () => {
    beforeEach(async () => {
        // Clean up before each test
        await LoginHistory.deleteMany({});
    });

    describe('createLoginHistory()', () => {
        it('devrait créer un nouvel historique de connexion', async () => {
            const user = await createActivatedUser();
            const auth = await authService.findOne({ user: user._id } as any);

            const loginData = {
                auth: auth.data!._id.toString(),
                user: user._id.toString(),
                ip: '192.168.1.1',
                token: 'access_token_12345',
                refresh_token: 'refresh_token_67890',
                devices: {
                    browser: { name: 'Chrome', version: '90.0' },
                    os: { name: 'Windows', version: '10' },
                    platform: 'Desktop',
                },
                locations: {
                    country: 'US',
                    city: 'New York',
                    timezone: 'America/New_York',
                },
                user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
            };

            const result = await loginHistoryService.createLoginHistory(loginData);

            expect(result.error).toBe(false);
            expect(result.data).toBeDefined();
            expect(result.data.user.toString()).toBe(user._id.toString());
            expect(result.data.ip).toBe('192.168.1.1');
            expect(result.data.token).toBe('access_token_12345');
            expect(result.data.refresh_token).toBe('refresh_token_67890');
        });

        it('devrait créer un historique sans devices et locations', async () => {
            const user = await createActivatedUser();
            const auth = await authService.findOne({ user: user._id } as any);

            const loginData = {
                auth: auth.data!._id.toString(),
                user: user._id.toString(),
                ip: '127.0.0.1',
                token: 'token_abc',
                refresh_token: 'refresh_xyz',
            };

            const result = await loginHistoryService.createLoginHistory(loginData);

            expect(result.error).toBe(false);
            expect(result.data).toBeDefined();
            expect(result.data.ip).toBe('127.0.0.1');
        });

        it('devrait définir login_at automatiquement', async () => {
            const user = await createActivatedUser();
            const auth = await authService.findOne({ user: user._id } as any);

            const loginData = {
                auth: auth.data!._id.toString(),
                user: user._id.toString(),
                ip: '10.0.0.1',
                token: 'token_123',
                refresh_token: 'refresh_456',
            };

            const before = new Date();
            const result = await loginHistoryService.createLoginHistory(loginData);
            const after = new Date();

            expect(result.error).toBe(false);
            expect(result.data.login_at).toBeDefined();
            expect(new Date(result.data.login_at).getTime()).toBeGreaterThanOrEqual(before.getTime());
            expect(new Date(result.data.login_at).getTime()).toBeLessThanOrEqual(after.getTime());
        });

        it('devrait gérer les erreurs de création', async () => {
            const loginData = {
                auth: 'invalid_auth_id',
                user: 'invalid_user_id',
                ip: '192.168.1.1',
                token: 'token',
                refresh_token: 'refresh',
            };

            const result = await loginHistoryService.createLoginHistory(loginData);

            expect(result.error).toBe(true);
            expect(result.message).toBeDefined();
        });
    });

    describe('getByUser()', () => {
        it('devrait récupérer l\'historique de connexion par utilisateur', async () => {
            const user = await createActivatedUser();
            const auth = await authService.findOne({ user: user._id } as any);

            // Créer plusieurs entrées d'historique
            await loginHistoryService.createLoginHistory({
                auth: auth.data!._id.toString(),
                user: user._id.toString(),
                ip: '192.168.1.1',
                token: 'token1',
                refresh_token: 'refresh1',
            });

            await loginHistoryService.createLoginHistory({
                auth: auth.data!._id.toString(),
                user: user._id.toString(),
                ip: '192.168.1.2',
                token: 'token2',
                refresh_token: 'refresh2',
            });

            const result = await loginHistoryService.getByUser(user._id.toString());

            expect(result.error).toBe(false);
            expect(result.data).toBeDefined();
            expect(result.data.length).toBe(2);
        });

        it('devrait limiter le nombre de résultats', async () => {
            const user = await createActivatedUser();
            const auth = await authService.findOne({ user: user._id } as any);

            // Créer 5 entrées
            for (let i = 0; i < 5; i++) {
                await loginHistoryService.createLoginHistory({
                    auth: auth.data!._id.toString(),
                    user: user._id.toString(),
                    ip: `192.168.1.${i}`,
                    token: `token${i}`,
                    refresh_token: `refresh${i}`,
                });
            }

            const result = await loginHistoryService.getByUser(user._id.toString(), 3);

            expect(result.error).toBe(false);
            expect(result.data.length).toBe(3);
        });

        it('devrait trier par login_at décroissant (plus récent en premier)', async () => {
            const user = await createActivatedUser();
            const auth = await authService.findOne({ user: user._id } as any);

            // Créer avec délai pour avoir des timestamps différents
            await loginHistoryService.createLoginHistory({
                auth: auth.data!._id.toString(),
                user: user._id.toString(),
                ip: '192.168.1.1',
                token: 'token1',
                refresh_token: 'refresh1',
            });

            await new Promise(resolve => setTimeout(resolve, 10));

            await loginHistoryService.createLoginHistory({
                auth: auth.data!._id.toString(),
                user: user._id.toString(),
                ip: '192.168.1.2',
                token: 'token2',
                refresh_token: 'refresh2',
            });

            const result = await loginHistoryService.getByUser(user._id.toString());

            expect(result.error).toBe(false);
            expect(result.data.length).toBe(2);
            // Vérifier que le login_at du premier est plus récent que le second
            expect(new Date(result.data[0].login_at).getTime()).toBeGreaterThanOrEqual(
                new Date(result.data[1].login_at).getTime()
            );
        });

        it('devrait retourner un tableau vide pour un utilisateur sans historique', async () => {
            const user = await createActivatedUser();
            const result = await loginHistoryService.getByUser(user._id.toString());

            expect(result.error).toBe(false);
            expect(result.data).toBeDefined();
            expect(result.data.length).toBe(0);
        });
    });

    describe('getByAuth()', () => {
        it('devrait récupérer l\'historique par auth ID', async () => {
            const user = await createActivatedUser();
            const auth = await authService.findOne({ user: user._id } as any);

            await loginHistoryService.createLoginHistory({
                auth: auth.data!._id.toString(),
                user: user._id.toString(),
                ip: '192.168.1.1',
                token: 'token1',
                refresh_token: 'refresh1',
            });

            const result = await loginHistoryService.getByAuth(auth.data!._id.toString());

            expect(result.error).toBe(false);
            expect(result.data).toBeDefined();
            expect(result.data.length).toBeGreaterThan(0);
        });

        it('devrait limiter les résultats avec le paramètre limit', async () => {
            const user = await createActivatedUser();
            const auth = await authService.findOne({ user: user._id } as any);

            for (let i = 0; i < 5; i++) {
                await loginHistoryService.createLoginHistory({
                    auth: auth.data!._id.toString(),
                    user: user._id.toString(),
                    ip: `10.0.0.${i}`,
                    token: `token${i}`,
                    refresh_token: `refresh${i}`,
                });
            }

            const result = await loginHistoryService.getByAuth(auth.data!._id.toString(), 2);

            expect(result.error).toBe(false);
            expect(result.data.length).toBe(2);
        });
    });

    describe('findByRefreshToken()', () => {
        it('devrait trouver un historique par refresh token', async () => {
            const user = await createActivatedUser();
            const auth = await authService.findOne({ user: user._id } as any);

            const refreshToken = 'unique_refresh_token_12345';

            await loginHistoryService.createLoginHistory({
                auth: auth.data!._id.toString(),
                user: user._id.toString(),
                ip: '192.168.1.1',
                token: 'access_token',
                refresh_token: refreshToken,
            });

            const result = await loginHistoryService.findByRefreshToken(refreshToken);

            expect(result.error).toBe(false);
            expect(result.data).toBeDefined();
            expect(result.data.refresh_token).toBe(refreshToken);
        });

        it('devrait retourner null si le refresh token n\'existe pas', async () => {
            const result = await loginHistoryService.findByRefreshToken('nonexistent_token');

            expect(result.error).toBe(false);
            expect(result.data).toBeNull();
        });
    });

    describe('updateToken()', () => {
        it('devrait mettre à jour le token d\'accès', async () => {
            const user = await createActivatedUser();
            const auth = await authService.findOne({ user: user._id } as any);

            const refreshToken = 'refresh_token_to_update';
            const oldToken = 'old_access_token';
            const newToken = 'new_access_token';

            await loginHistoryService.createLoginHistory({
                auth: auth.data!._id.toString(),
                user: user._id.toString(),
                ip: '192.168.1.1',
                token: oldToken,
                refresh_token: refreshToken,
            });

            const updateResult = await loginHistoryService.updateToken(refreshToken, newToken);

            expect(updateResult.error).toBe(false);

            // Vérifier que le token a été mis à jour
            const history = await loginHistoryService.findByRefreshToken(refreshToken);
            expect(history.data.token).toBe(newToken);
        });

        it('devrait retourner 0 modified si le refresh token n\'existe pas', async () => {
            const result = await loginHistoryService.updateToken('nonexistent_refresh', 'new_token');

            expect(result.error).toBe(false);
            expect(result.modifiedCount).toBe(0);
        });
    });

    describe('deleteAllByUser()', () => {
        it('devrait supprimer tous les historiques d\'un utilisateur', async () => {
            const user = await createActivatedUser();
            const auth = await authService.findOne({ user: user._id } as any);

            // Créer plusieurs historiques
            for (let i = 0; i < 3; i++) {
                await loginHistoryService.createLoginHistory({
                    auth: auth.data!._id.toString(),
                    user: user._id.toString(),
                    ip: `192.168.1.${i}`,
                    token: `token${i}`,
                    refresh_token: `refresh${i}`,
                });
            }

            const deleteResult = await loginHistoryService.deleteAllByUser(user._id.toString());

            expect(deleteResult.error).toBe(false);
            expect(deleteResult.deletedCount).toBe(3);

            // Vérifier que l'historique est vide
            const history = await loginHistoryService.getByUser(user._id.toString());
            expect(history.data.length).toBe(0);
        });

        it('devrait retourner 0 si aucun historique à supprimer', async () => {
            const user = await createActivatedUser();
            const result = await loginHistoryService.deleteAllByUser(user._id.toString());

            expect(result.error).toBe(false);
            expect(result.deletedCount).toBe(0);
        });
    });

    describe('deleteByRefreshToken()', () => {
        it('devrait supprimer un historique par refresh token', async () => {
            const user = await createActivatedUser();
            const auth = await authService.findOne({ user: user._id } as any);

            const refreshToken = 'refresh_to_delete';

            await loginHistoryService.createLoginHistory({
                auth: auth.data!._id.toString(),
                user: user._id.toString(),
                ip: '192.168.1.1',
                token: 'token',
                refresh_token: refreshToken,
            });

            const deleteResult = await loginHistoryService.deleteByRefreshToken(refreshToken);

            expect(deleteResult.error).toBe(false);
            expect(deleteResult.deletedCount).toBe(1);

            // Vérifier que l'historique a été supprimé
            const history = await loginHistoryService.findByRefreshToken(refreshToken);
            expect(history.data).toBeNull();
        });

        it('devrait retourner 0 si le refresh token n\'existe pas', async () => {
            const result = await loginHistoryService.deleteByRefreshToken('nonexistent_token');

            expect(result.error).toBe(false);
            expect(result.deletedCount).toBe(0);
        });
    });

    describe('getLoginStats()', () => {
        it('devrait calculer les statistiques de connexion', async () => {
            const user = await createActivatedUser();
            const auth = await authService.findOne({ user: user._id } as any);

            // Créer plusieurs connexions depuis différentes IPs
            await loginHistoryService.createLoginHistory({
                auth: auth.data!._id.toString(),
                user: user._id.toString(),
                ip: '192.168.1.1',
                token: 'token1',
                refresh_token: 'refresh1',
            });

            await new Promise(resolve => setTimeout(resolve, 10));

            await loginHistoryService.createLoginHistory({
                auth: auth.data!._id.toString(),
                user: user._id.toString(),
                ip: '192.168.1.2',
                token: 'token2',
                refresh_token: 'refresh2',
            });

            await new Promise(resolve => setTimeout(resolve, 10));

            await loginHistoryService.createLoginHistory({
                auth: auth.data!._id.toString(),
                user: user._id.toString(),
                ip: '192.168.1.1', // Même IP que la première
                token: 'token3',
                refresh_token: 'refresh3',
            });

            const stats = await loginHistoryService.getLoginStats(user._id.toString());

            expect(stats.error).toBe(false);
            expect(stats.data).toBeDefined();
            expect(stats.data.total_logins).toBe(3);
            expect(stats.data.unique_ip_count).toBe(2); // Deux IPs différentes
            expect(stats.data.last_login).toBeDefined();
            expect(stats.data.first_login).toBeDefined();
        });

        it('devrait retourner des stats vides pour un utilisateur sans historique', async () => {
            const user = await createActivatedUser();
            const stats = await loginHistoryService.getLoginStats(user._id.toString());

            expect(stats.error).toBe(false);
            expect(stats.data.total_logins).toBe(0);
            expect(stats.data.unique_ip_count).toBe(0);
            expect(stats.data.last_login).toBeNull();
            expect(stats.data.first_login).toBeNull();
        });

        it('devrait calculer correctement first_login et last_login', async () => {
            const user = await createActivatedUser();
            const auth = await authService.findOne({ user: user._id } as any);

            const firstLoginTime = new Date();
            await loginHistoryService.createLoginHistory({
                auth: auth.data!._id.toString(),
                user: user._id.toString(),
                ip: '192.168.1.1',
                token: 'token1',
                refresh_token: 'refresh1',
            });

            await new Promise(resolve => setTimeout(resolve, 50));

            const lastLoginTime = new Date();
            await loginHistoryService.createLoginHistory({
                auth: auth.data!._id.toString(),
                user: user._id.toString(),
                ip: '192.168.1.2',
                token: 'token2',
                refresh_token: 'refresh2',
            });

            const stats = await loginHistoryService.getLoginStats(user._id.toString());

            expect(stats.error).toBe(false);
            expect(new Date(stats.data.first_login).getTime()).toBeGreaterThanOrEqual(
                firstLoginTime.getTime() - 1000
            );
            expect(new Date(stats.data.last_login).getTime()).toBeGreaterThanOrEqual(
                lastLoginTime.getTime() - 1000
            );
        });
    });

    describe('cleanup()', () => {
        it('devrait supprimer les anciens historiques', async () => {
            const user = await createActivatedUser();
            const auth = await authService.findOne({ user: user._id } as any);

            // Créer un historique récent
            await loginHistoryService.createLoginHistory({
                auth: auth.data!._id.toString(),
                user: user._id.toString(),
                ip: '192.168.1.1',
                token: 'token1',
                refresh_token: 'refresh1',
            });

            // Créer un historique ancien (simulé en manipulant la date)
            const oldHistory = await loginHistoryService.createLoginHistory({
                auth: auth.data!._id.toString(),
                user: user._id.toString(),
                ip: '192.168.1.2',
                token: 'token2',
                refresh_token: 'refresh2',
            });

            // Modifier manuellement la date pour simuler un ancien enregistrement
            const oldDate = new Date();
            oldDate.setDate(oldDate.getDate() - 100); // 100 jours dans le passé

            await LoginHistory.updateOne(
                { _id: oldHistory.data!._id },
                { $set: { login_at: oldDate } }
            );

            // Nettoyer les historiques de plus de 90 jours
            const cleanupResult = await loginHistoryService.cleanup(90);

            expect(cleanupResult.error).toBe(false);
            expect(cleanupResult.deletedCount).toBe(1);

            // Vérifier qu'il reste seulement l'historique récent
            const remaining = await loginHistoryService.getByUser(user._id.toString());
            expect(remaining.data.length).toBe(1);
            expect(remaining.data[0].ip).toBe('192.168.1.1');
        });

        it('devrait accepter un nombre de jours personnalisé', async () => {
            const user = await createActivatedUser();
            const auth = await authService.findOne({ user: user._id } as any);

            const history = await loginHistoryService.createLoginHistory({
                auth: auth.data!._id.toString(),
                user: user._id.toString(),
                ip: '192.168.1.1',
                token: 'token',
                refresh_token: 'refresh',
            });

            // Modifier la date pour être à 40 jours dans le passé
            const oldDate = new Date();
            oldDate.setDate(oldDate.getDate() - 40);

            await LoginHistory.updateOne(
                { _id: history.data!._id },
                { $set: { login_at: oldDate } }
            );

            // Nettoyer avec 30 jours - devrait supprimer
            const cleanupResult = await loginHistoryService.cleanup(30);

            expect(cleanupResult.error).toBe(false);
            expect(cleanupResult.deletedCount).toBe(1);
        });

        it('devrait retourner 0 si rien à nettoyer', async () => {
            const result = await loginHistoryService.cleanup(90);

            expect(result.error).toBe(false);
            expect(result.deletedCount).toBe(0);
        });
    });

    describe('Scénarios d\'intégration', () => {
        it('devrait gérer un cycle complet de connexion', async () => {
            const user = await createActivatedUser();
            const auth = await authService.findOne({ user: user._id } as any);

            // 1. Créer un historique de connexion
            const loginData = {
                auth: auth.data!._id.toString(),
                user: user._id.toString(),
                ip: '192.168.1.100',
                token: 'initial_token',
                refresh_token: 'refresh_token_123',
                devices: {
                    browser: { name: 'Firefox', version: '88.0' },
                    os: { name: 'Linux', version: 'Ubuntu 20.04' },
                    platform: 'Desktop',
                },
            };

            const createResult = await loginHistoryService.createLoginHistory(loginData);
            expect(createResult.error).toBe(false);

            // 2. Récupérer l'historique par utilisateur
            const userHistory = await loginHistoryService.getByUser(user._id.toString());
            expect(userHistory.data.length).toBe(1);

            // 3. Mettre à jour le token (refresh)
            const updateResult = await loginHistoryService.updateToken(
                'refresh_token_123',
                'new_access_token'
            );
            expect(updateResult.error).toBe(false);

            // 4. Vérifier le nouveau token
            const updatedHistory = await loginHistoryService.findByRefreshToken('refresh_token_123');
            expect(updatedHistory.data.token).toBe('new_access_token');

            // 5. Obtenir les stats
            const stats = await loginHistoryService.getLoginStats(user._id.toString());
            expect(stats.data.total_logins).toBe(1);

            // 6. Déconnexion (supprimer l'historique)
            const deleteResult = await loginHistoryService.deleteByRefreshToken('refresh_token_123');
            expect(deleteResult.deletedCount).toBe(1);

            // 7. Vérifier que l'historique est vide
            const finalHistory = await loginHistoryService.getByUser(user._id.toString());
            expect(finalHistory.data.length).toBe(0);
        });

        it('devrait gérer plusieurs connexions depuis différents appareils', async () => {
            const user = await createActivatedUser();
            const auth = await authService.findOne({ user: user._id } as any);

            // Connexion depuis mobile
            await loginHistoryService.createLoginHistory({
                auth: auth.data!._id.toString(),
                user: user._id.toString(),
                ip: '192.168.1.50',
                token: 'mobile_token',
                refresh_token: 'mobile_refresh',
                devices: {
                    browser: { name: 'Safari', version: '14.0' },
                    os: { name: 'iOS', version: '14.0' },
                    platform: 'iPhone',
                },
            });

            // Connexion depuis desktop
            await loginHistoryService.createLoginHistory({
                auth: auth.data!._id.toString(),
                user: user._id.toString(),
                ip: '192.168.1.100',
                token: 'desktop_token',
                refresh_token: 'desktop_refresh',
                devices: {
                    browser: { name: 'Chrome', version: '90.0' },
                    os: { name: 'Windows', version: '10' },
                    platform: 'Desktop',
                },
            });

            // Vérifier qu'il y a 2 sessions actives
            const history = await loginHistoryService.getByUser(user._id.toString());
            expect(history.data.length).toBe(2);

            // Déconnexion d'un seul appareil
            await loginHistoryService.deleteByRefreshToken('mobile_refresh');

            // Vérifier qu'il reste 1 session
            const remainingHistory = await loginHistoryService.getByUser(user._id.toString());
            expect(remainingHistory.data.length).toBe(1);
            expect(remainingHistory.data[0].refresh_token).toBe('desktop_refresh');

            // Déconnexion de tous les appareils
            await loginHistoryService.deleteAllByUser(user._id.toString());

            const finalHistory = await loginHistoryService.getByUser(user._id.toString());
            expect(finalHistory.data.length).toBe(0);
        });
    });
});
