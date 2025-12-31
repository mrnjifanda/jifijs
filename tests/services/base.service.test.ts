import { describe, it, expect, beforeEach } from '@jest/globals';
import BaseService from '../../utils/bases/base.service';
import User from '../../src/models/auth/user.model';
import { IUser } from '../../src/types';
import { generateUniqueEmail, generateUniqueUsername } from '../helpers/test.helpers';

describe('BaseService - CRUD Operations', () => {
    let userService: BaseService<IUser>;

    beforeEach(async () => {
        // Utilise le setup global de tests/setup.ts
        // Les collections sont automatiquement nettoyées entre chaque test
        if (!userService) {
            userService = new BaseService(User);
        }
    });

    beforeEach(async () => {
        // Clean up before each test
        await User.deleteMany({});
    });

    describe('create()', () => {
        it('devrait créer un nouveau document', async () => {
            const userData = {
                email: generateUniqueEmail(),
                username: generateUniqueUsername(),
                first_name: 'Test',
                last_name: 'User',
                password: 'hashedPassword123'
            };

            const result = await userService.create(userData as any);

            expect(result.error).toBe(false);
            expect(result.data).toBeDefined();
            expect(result.data!.email).toBe(userData.email);
            expect(result.data!._id).toBeDefined();
        });

        it('devrait échouer avec des données invalides', async () => {
            const result = await userService.create({} as any);

            expect(result.error).toBe(true);
            expect(result.message).toBeDefined();
        });

        it('devrait échouer avec des données null', async () => {
            const result = await userService.create(null as any);

            expect(result.error).toBe(true);
            expect(result.message).toContain('valid object');
        });
    });

    describe('find()', () => {
        beforeEach(async () => {
            // Créer des utilisateurs de test
            await userService.create({
                email: 'user1@test.com',
                username: 'user1',
                first_name: 'John',
                last_name: 'Doe',
                password: 'hash1'
            } as any);

            await userService.create({
                email: 'user2@test.com',
                username: 'user2',
                first_name: 'Jane',
                last_name: 'Smith',
                password: 'hash2'
            } as any);
        });

        it('devrait trouver tous les documents', async () => {
            const result = await userService.find({});

            expect(result.error).toBe(false);
            expect(result.data).toBeDefined();
            expect(result.data!.length).toBeGreaterThanOrEqual(2);
        });

        it('devrait filtrer les documents', async () => {
            const result = await userService.find({ first_name: 'John' });

            expect(result.error).toBe(false);
            expect(result.data!.length).toBe(1);
            expect(result.data![0].first_name).toBe('John');
        });

        it('devrait sélectionner des champs spécifiques', async () => {
            const result = await userService.find({}, { select: 'email,first_name' });

            expect(result.error).toBe(false);
            expect(result.data![0]).toHaveProperty('email');
            expect(result.data![0]).toHaveProperty('first_name');
        });

        it('devrait trier les résultats', async () => {
            const result = await userService.find({}, { sort: { first_name: 1 } });

            expect(result.error).toBe(false);
            expect(result.data![0].first_name).toBe('Jane');
            expect(result.data![1].first_name).toBe('John');
        });

        it('devrait utiliser lean pour de meilleures performances', async () => {
            const result = await userService.find({}, { lean: true });

            expect(result.error).toBe(false);
            expect(result.data).toBeDefined();
            // Lean objects n'ont pas de méthodes Mongoose
            expect(typeof result.data![0].save).toBe('undefined');
        });
    });

    describe('findOne()', () => {
        beforeEach(async () => {
            await userService.create({
                email: 'findone@test.com',
                username: 'findoneuser',
                first_name: 'FindOne',
                last_name: 'Test',
                password: 'hash'
            } as any);
        });

        it('devrait trouver un document par filtre', async () => {
            const result = await userService.findOne({ email: 'findone@test.com' });

            expect(result.error).toBe(false);
            expect(result.data).toBeDefined();
            expect(result.data!.email).toBe('findone@test.com');
        });

        it('devrait retourner null si non trouvé', async () => {
            const result = await userService.findOne({ email: 'nonexistent@test.com' });

            expect(result.error).toBe(false);
            expect(result.data).toBeNull();
        });
    });

    describe('findById()', () => {
        let userId: string;

        beforeEach(async () => {
            const result = await userService.create({
                email: 'byid@test.com',
                username: 'byiduser',
                first_name: 'ById',
                last_name: 'Test',
                password: 'hash'
            } as any);
            userId = result.data!._id.toString();
        });

        it('devrait trouver un document par ID', async () => {
            const result = await userService.findById(userId);

            expect(result.error).toBe(false);
            expect(result.data).toBeDefined();
            expect(result.data!._id.toString()).toBe(userId);
        });

        it('devrait échouer avec un ID invalide', async () => {
            const result = await userService.findById('invalid_id');

            expect(result.error).toBe(true);
            expect(result.message).toContain('Invalid ID format');
        });

        it('devrait retourner null avec un ID valide mais inexistant', async () => {
            const result = await userService.findById('507f1f77bcf86cd799439011');

            expect(result.error).toBe(false);
            expect(result.data).toBeNull();
        });
    });

    describe('findWithPaginate()', () => {
        beforeEach(async () => {
            // Créer 25 utilisateurs
            const promises = [];
            for (let i = 1; i <= 25; i++) {
                promises.push(userService.create({
                    email: `user${i}@test.com`,
                    username: `user${i}`,
                    first_name: `User${i}`,
                    last_name: 'Test',
                    password: 'hash'
                } as any));
            }
            await Promise.all(promises);
        });

        it('devrait paginer les résultats', async () => {
            const result = await userService.findWithPaginate({}, 1, 10);

            expect(result.error).toBe(false);
            expect(result.data).toBeDefined();
            expect(result.data!.content.length).toBe(10);
            expect(result.data!.pagination.total).toBe(25);
            expect(result.data!.pagination.page).toBe(1);
            expect(result.data!.pagination.limit).toBe(10);
            expect(result.data!.pagination.totalPages).toBe(3);
            expect(result.data!.pagination.hasNextPage).toBe(true);
            expect(result.data!.pagination.hasPrevPage).toBe(false);
        });

        it('devrait gérer la page 2', async () => {
            const result = await userService.findWithPaginate({}, 2, 10);

            expect(result.error).toBe(false);
            expect(result.data!.content.length).toBe(10);
            expect(result.data!.pagination.page).toBe(2);
            expect(result.data!.pagination.hasNextPage).toBe(true);
            expect(result.data!.pagination.hasPrevPage).toBe(true);
        });

        it('devrait gérer la dernière page', async () => {
            const result = await userService.findWithPaginate({}, 3, 10);

            expect(result.error).toBe(false);
            expect(result.data!.content.length).toBe(5); // Reste 5 éléments
            expect(result.data!.pagination.page).toBe(3);
            expect(result.data!.pagination.hasNextPage).toBe(false);
            expect(result.data!.pagination.hasPrevPage).toBe(true);
        });

        it('devrait filtrer avec pagination', async () => {
            const result = await userService.findWithPaginate(
                { first_name: /User1/ },
                1,
                5
            );

            expect(result.error).toBe(false);
            expect(result.data!.content.length).toBeGreaterThan(0);
            result.data!.content.forEach(user => {
                expect(user.first_name).toMatch(/User1/);
            });
        });
    });

    describe('update()', () => {
        let userId: string;

        beforeEach(async () => {
            const result = await userService.create({
                email: 'update@test.com',
                username: 'updateuser',
                first_name: 'Update',
                last_name: 'Test',
                password: 'hash'
            } as any);
            userId = result.data!._id.toString();
        });

        it('devrait mettre à jour un document', async () => {
            const updateResult = await userService.update(
                { _id: userId },
                { first_name: 'Updated' } as any
            );

            expect(updateResult.error).toBe(false);
            expect(updateResult.modifiedCount).toBe(1);

            const findResult = await userService.findById(userId);
            expect(findResult.data!.first_name).toBe('Updated');
        });

        it('devrait retourner 0 si aucun document trouvé', async () => {
            const result = await userService.update(
                { email: 'nonexistent@test.com' },
                { first_name: 'Updated' } as any
            );

            expect(result.error).toBe(false);
            expect(result.modifiedCount).toBe(0);
        });
    });

    describe('updateMany()', () => {
        beforeEach(async () => {
            await userService.create({
                email: 'many1@test.com',
                username: 'many1',
                first_name: 'Many',
                last_name: 'Test1',
                password: 'hash'
            } as any);

            await userService.create({
                email: 'many2@test.com',
                username: 'many2',
                first_name: 'Many',
                last_name: 'Test2',
                password: 'hash'
            } as any);
        });

        it('devrait mettre à jour plusieurs documents', async () => {
            const result = await userService.updateMany(
                { first_name: 'Many' },
                { last_name: 'Updated' } as any
            );

            expect(result.error).toBe(false);
            expect(result.modifiedCount).toBe(2);

            const findResult = await userService.find({ first_name: 'Many' });
            findResult.data!.forEach(user => {
                expect(user.last_name).toBe('Updated');
            });
        });
    });

    describe('delete()', () => {
        let userId: string;

        beforeEach(async () => {
            const result = await userService.create({
                email: 'delete@test.com',
                username: 'deleteuser',
                first_name: 'Delete',
                last_name: 'Test',
                password: 'hash'
            } as any);
            userId = result.data!._id.toString();
        });

        it('devrait supprimer un document', async () => {
            const deleteResult = await userService.delete({ _id: userId });

            expect(deleteResult.error).toBe(false);
            expect(deleteResult.deletedCount).toBe(1);

            const findResult = await userService.findById(userId);
            expect(findResult.data).toBeNull();
        });

        it('devrait retourner 0 si aucun document trouvé', async () => {
            const result = await userService.delete({ email: 'nonexistent@test.com' });

            expect(result.error).toBe(false);
            expect(result.deletedCount).toBe(0);
        });
    });

    describe('deleteMany()', () => {
        beforeEach(async () => {
            await userService.create({
                email: 'delmany1@test.com',
                username: 'delmany1',
                first_name: 'DelMany',
                last_name: 'Test1',
                password: 'hash'
            } as any);

            await userService.create({
                email: 'delmany2@test.com',
                username: 'delmany2',
                first_name: 'DelMany',
                last_name: 'Test2',
                password: 'hash'
            } as any);
        });

        it('devrait supprimer plusieurs documents', async () => {
            const result = await userService.deleteMany({ first_name: 'DelMany' });

            expect(result.error).toBe(false);
            expect(result.deletedCount).toBe(2);

            const findResult = await userService.find({ first_name: 'DelMany' });
            expect(findResult.data!.length).toBe(0);
        });
    });

    describe('count()', () => {
        beforeEach(async () => {
            await userService.create({
                email: 'count1@test.com',
                username: 'count1',
                first_name: 'Count',
                last_name: 'Test',
                password: 'hash'
            } as any);

            await userService.create({
                email: 'count2@test.com',
                username: 'count2',
                first_name: 'Count',
                last_name: 'Test',
                password: 'hash'
            } as any);
        });

        it('devrait compter tous les documents', async () => {
            const count = await userService.count({});

            expect(count).toBeGreaterThanOrEqual(2);
        });

        it('devrait compter avec filtre', async () => {
            const count = await userService.count({ first_name: 'Count' });

            expect(count).toBe(2);
        });
    });

    describe('exists()', () => {
        beforeEach(async () => {
            await userService.create({
                email: 'exists@test.com',
                username: 'existsuser',
                first_name: 'Exists',
                last_name: 'Test',
                password: 'hash'
            } as any);
        });

        it('devrait retourner true si existe', async () => {
            const exists = await userService.exists({ email: 'exists@test.com' });

            expect(exists).toBe(true);
        });

        it('devrait retourner false si n\'existe pas', async () => {
            const exists = await userService.exists({ email: 'nonexistent@test.com' });

            expect(exists).toBe(false);
        });
    });

    describe('querySelect()', () => {
        it('devrait convertir une sélection de champs', () => {
            const select = userService.querySelect('email,first_name,last_name');

            expect(select).toEqual({
                email: 1,
                first_name: 1,
                last_name: 1
            });
        });

        it('devrait gérer l\'exclusion de champs', () => {
            const select = userService.querySelect('-password,-__v');

            expect(select).toEqual({
                password: 0,
                __v: 0
            });
        });

        it('devrait retourner un objet vide avec string vide', () => {
            const select = userService.querySelect('');

            expect(select).toEqual({});
        });
    });

    describe('createMany()', () => {
        it('devrait créer plusieurs documents', async () => {
            const users = [
                {
                    email: 'bulk1@test.com',
                    username: 'bulk1',
                    first_name: 'Bulk1',
                    last_name: 'Test',
                    password: 'hash'
                },
                {
                    email: 'bulk2@test.com',
                    username: 'bulk2',
                    first_name: 'Bulk2',
                    last_name: 'Test',
                    password: 'hash'
                }
            ];

            const result = await userService.createMany(users as any);

            expect(result.error).toBe(false);
            expect(result.insertedCount).toBe(2);
            expect(result.data).toBeDefined();
            expect(result.data!.length).toBe(2);
        });

        it('devrait échouer avec un tableau vide', async () => {
            const result = await userService.createMany([]);

            expect(result.error).toBe(true);
            expect(result.message).toContain('cannot be empty');
        });
    });

    describe('findOneAndUpdate()', () => {
        let userId: string;

        beforeEach(async () => {
            const result = await userService.create({
                email: 'findupdate@test.com',
                username: 'findupdateuser',
                first_name: 'FindUpdate',
                last_name: 'Test',
                password: 'hash'
            } as any);
            userId = result.data!._id.toString();
        });

        it('devrait trouver et mettre à jour', async () => {
            const result = await userService.findOneAndUpdate(
                { _id: userId },
                { first_name: 'UpdatedName' } as any
            );

            expect(result.error).toBe(false);
            expect(result.data).toBeDefined();
            expect(result.data!.first_name).toBe('UpdatedName');
        });

        it('devrait retourner le nouveau document par défaut', async () => {
            const result = await userService.findOneAndUpdate(
                { _id: userId },
                { first_name: 'NewName' } as any,
                { new: true }
            );

            expect(result.error).toBe(false);
            expect(result.data!.first_name).toBe('NewName');
        });
    });
});
