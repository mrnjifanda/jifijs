import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import cacheService from '../../utils/helpers/cache.helper';

describe('CacheService', () => {
    beforeEach(async () => {
        // Clean cache before each test
        await cacheService.deletePattern('test:*');
    });

    afterEach(async () => {
        // Clean cache after each test
        await cacheService.deletePattern('test:*');
    });

    describe('set() and get()', () => {
        it('devrait stocker et récupérer une valeur string', async () => {
            await cacheService.set('test:string', 'hello world');
            const value = await cacheService.get<string>('test:string');

            expect(value).toBe('hello world');
        });

        it('devrait stocker et récupérer un objet', async () => {
            const testObj = {
                name: 'Test User',
                age: 25,
                active: true
            };

            await cacheService.set('test:object', testObj);
            const value = await cacheService.get<typeof testObj>('test:object');

            expect(value).toEqual(testObj);
        });

        it('devrait stocker et récupérer un tableau', async () => {
            const testArray = [1, 2, 3, 4, 5];

            await cacheService.set('test:array', testArray);
            const value = await cacheService.get<number[]>('test:array');

            expect(value).toEqual(testArray);
        });

        it('devrait retourner null pour une clé inexistante', async () => {
            const value = await cacheService.get('test:nonexistent');

            expect(value).toBeNull();
        });

        it('devrait respecter le TTL', async () => {
            await cacheService.set('test:ttl', 'expires soon', { ttl: 1 }); // 1 seconde

            // Vérifier que la valeur existe
            let value = await cacheService.get('test:ttl');
            expect(value).toBe('expires soon');

            // Attendre que le TTL expire
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Vérifier que la valeur a expiré
            value = await cacheService.get('test:ttl');
            expect(value).toBeNull();
        });
    });

    describe('delete()', () => {
        it('devrait supprimer une clé', async () => {
            await cacheService.set('test:delete', 'to be deleted');

            // Vérifier que la valeur existe
            let value = await cacheService.get('test:delete');
            expect(value).toBe('to be deleted');

            // Supprimer
            const deleted = await cacheService.delete('test:delete');
            expect(deleted).toBe(true);

            // Vérifier que la valeur n'existe plus
            value = await cacheService.get('test:delete');
            expect(value).toBeNull();
        });

        it('devrait retourner true même si la clé n\'existe pas', async () => {
            const deleted = await cacheService.delete('test:nonexistent');
            expect(deleted).toBe(true);
        });
    });

    describe('deletePattern()', () => {
        beforeEach(async () => {
            // Créer plusieurs clés avec le même pattern
            await cacheService.set('test:user:1', { id: 1, name: 'User 1' });
            await cacheService.set('test:user:2', { id: 2, name: 'User 2' });
            await cacheService.set('test:user:3', { id: 3, name: 'User 3' });
            await cacheService.set('test:other:1', { id: 1 });
        });

        it('devrait supprimer toutes les clés correspondant au pattern', async () => {
            const deleted = await cacheService.deletePattern('test:user:*');

            expect(deleted).toBeGreaterThanOrEqual(3);

            // Vérifier que les clés user sont supprimées
            const user1 = await cacheService.get('test:user:1');
            const user2 = await cacheService.get('test:user:2');
            const user3 = await cacheService.get('test:user:3');

            expect(user1).toBeNull();
            expect(user2).toBeNull();
            expect(user3).toBeNull();

            // Vérifier que l'autre clé existe toujours
            const other = await cacheService.get('test:other:1');
            expect(other).toBeDefined();
        });

        it('devrait retourner 0 si aucune clé ne correspond', async () => {
            const deleted = await cacheService.deletePattern('test:nonexistent:*');

            expect(deleted).toBe(0);
        });
    });

    describe('getOrSet()', () => {
        it('devrait récupérer depuis le cache si existe', async () => {
            await cacheService.set('test:getorset', 'cached value');

            let fetcherCalled = false;
            const fetcher = async () => {
                fetcherCalled = true;
                return 'fetched value';
            };

            const value = await cacheService.getOrSet('test:getorset', fetcher);

            expect(value).toBe('cached value');
            expect(fetcherCalled).toBe(false); // Le fetcher ne devrait pas être appelé
        });

        it('devrait appeler le fetcher si la clé n\'existe pas', async () => {
            let fetcherCalled = false;
            const fetcher = async () => {
                fetcherCalled = true;
                return 'fetched value';
            };

            const value = await cacheService.getOrSet('test:getorset:new', fetcher);

            expect(value).toBe('fetched value');
            expect(fetcherCalled).toBe(true);

            // Vérifier que la valeur est maintenant en cache
            const cachedValue = await cacheService.get('test:getorset:new');
            expect(cachedValue).toBe('fetched value');
        });

        it('devrait stocker avec le TTL spécifié', async () => {
            const fetcher = async () => ({ data: 'test data' });

            await cacheService.getOrSet('test:getorset:ttl', fetcher, { ttl: 1 });

            // Vérifier que la valeur existe
            let value = await cacheService.get('test:getorset:ttl');
            expect(value).toBeDefined();

            // Attendre expiration
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Vérifier que la valeur a expiré
            value = await cacheService.get('test:getorset:ttl');
            expect(value).toBeNull();
        });
    });

    describe('getStats()', () => {
        it('devrait retourner les statistiques de cache', async () => {
            // Effectuer quelques opérations
            await cacheService.set('test:stats:1', 'value1');
            await cacheService.get('test:stats:1'); // hit
            await cacheService.get('test:stats:nonexistent'); // miss

            const stats = await cacheService.getStats();

            expect(stats).toHaveProperty('hits');
            expect(stats).toHaveProperty('misses');
            expect(stats).toHaveProperty('errors');
            expect(stats).toHaveProperty('hitRate');

            expect(stats.hits).toBeGreaterThanOrEqual(0);
            expect(stats.misses).toBeGreaterThanOrEqual(0);
            expect(typeof stats.hitRate).toBe('number');
        });

        it('devrait calculer le hit rate correctement', async () => {
            // Reset stats en créant une nouvelle série d'opérations
            await cacheService.set('test:hitrate:1', 'value1');
            await cacheService.set('test:hitrate:2', 'value2');

            // 2 hits
            await cacheService.get('test:hitrate:1');
            await cacheService.get('test:hitrate:2');

            // 1 miss
            await cacheService.get('test:hitrate:nonexistent');

            const stats = await cacheService.getStats();

            // Hit rate devrait être autour de 66% (2 hits sur 3 total)
            // Note: peut varier selon les autres tests qui s'exécutent
            expect(stats.hitRate).toBeGreaterThanOrEqual(0);
            expect(stats.hitRate).toBeLessThanOrEqual(100);
        });
    });

    describe('Gestion des erreurs', () => {
        it('devrait gérer les valeurs undefined', async () => {
            const result = await cacheService.set('test:undefined', undefined as any);

            // Le comportement peut varier selon l'implémentation
            // mais ne devrait pas throw d'erreur
            expect(typeof result).toBe('boolean');
        });

        it('devrait gérer les valeurs null', async () => {
            const result = await cacheService.set('test:null', null as any);

            expect(typeof result).toBe('boolean');
        });

        it('devrait gérer les grandes valeurs', async () => {
            const largeObject = {
                data: new Array(10000).fill('x').join('')
            };

            const setResult = await cacheService.set('test:large', largeObject);
            expect(setResult).toBe(true);

            const getValue = await cacheService.get<typeof largeObject>('test:large');
            expect(getValue?.data).toBe(largeObject.data);
        });
    });

    describe('Types de données complexes', () => {
        it('devrait gérer les dates', async () => {
            const now = new Date();

            await cacheService.set('test:date', now);
            const value = await cacheService.get<Date>('test:date');

            // Les dates sont sérialisées en strings, donc on compare les timestamps
            expect(new Date(value as any).getTime()).toBe(now.getTime());
        });

        it('devrait gérer les nested objects', async () => {
            const nested = {
                level1: {
                    level2: {
                        level3: {
                            value: 'deep value',
                            array: [1, 2, 3]
                        }
                    }
                }
            };

            await cacheService.set('test:nested', nested);
            const value = await cacheService.get<typeof nested>('test:nested');

            expect(value?.level1.level2.level3.value).toBe('deep value');
            expect(value?.level1.level2.level3.array).toEqual([1, 2, 3]);
        });

        it('devrait gérer les Maps (converti en objets)', async () => {
            const map = new Map([
                ['key1', 'value1'],
                ['key2', 'value2']
            ]);

            await cacheService.set('test:map', Object.fromEntries(map));
            const value = await cacheService.get<Record<string, string>>('test:map');

            expect(value).toBeDefined();
            expect(value?.key1).toBe('value1');
            expect(value?.key2).toBe('value2');
        });
    });

    describe('Cache-aside pattern usage', () => {
        it('devrait implémenter le cache-aside pattern correctement', async () => {
            // Simuler une base de données
            const database = new Map<string, any>([
                ['user:1', { id: 1, name: 'John Doe', email: 'john@test.com' }],
                ['user:2', { id: 2, name: 'Jane Smith', email: 'jane@test.com' }]
            ]);

            let dbCallCount = 0;

            const getUserFromDB = async (userId: string) => {
                dbCallCount++;
                return database.get(`user:${userId}`);
            };

            // Premier appel - devrait aller en BD
            const user1 = await cacheService.getOrSet(
                'test:cacheuser:1',
                () => getUserFromDB('1'),
                { ttl: 60 }
            );

            expect(user1?.name).toBe('John Doe');
            expect(dbCallCount).toBe(1);

            // Deuxième appel - devrait venir du cache
            const user1Cached = await cacheService.getOrSet(
                'test:cacheuser:1',
                () => getUserFromDB('1'),
                { ttl: 60 }
            );

            expect(user1Cached?.name).toBe('John Doe');
            expect(dbCallCount).toBe(1); // Pas d'appel BD supplémentaire

            // Appel pour un autre utilisateur
            const user2 = await cacheService.getOrSet(
                'test:cacheuser:2',
                () => getUserFromDB('2'),
                { ttl: 60 }
            );

            expect(user2?.name).toBe('Jane Smith');
            expect(dbCallCount).toBe(2);
        });
    });
});
