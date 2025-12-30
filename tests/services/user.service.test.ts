import userService from '../../src/services/app/user.service';
import {
    createActivatedUser,
    generateUniqueEmail
} from '../helpers/test.helpers';

describe('UserService', () => {

    describe('CRUD Operations', () => {
        it('devrait trouver un utilisateur par email', async () => {
            const user = await createActivatedUser();

            const result = await userService.findOne({ email: user.email });

            expect(result.error).toBe(false);
            expect(result.data).toBeTruthy();
            expect(result.data.email).toBe(user.email);
        });

        it('devrait trouver un utilisateur par ID', async () => {
            const user = await createActivatedUser();

            const result = await userService.findById(user._id);

            expect(result.error).toBe(false);
            expect(result.data).toBeTruthy();
            expect(result.data._id.toString()).toBe(user._id.toString());
        });

        it('devrait mettre à jour un utilisateur', async () => {
            const user = await createActivatedUser();

            const updateResult = await userService.update(
                { _id: user._id },
                { first_name: 'UpdatedName' }
            );

            expect(updateResult.error).toBe(false);
            expect(updateResult.modifiedCount).toBe(1);

            const updatedUser = await userService.findById(user._id);
            expect(updatedUser.data.first_name).toBe('UpdatedName');
        });

        it('devrait lister les utilisateurs avec pagination', async () => {
            // Créer plusieurs utilisateurs avec emails uniques
            await Promise.all([
                createActivatedUser({ email: generateUniqueEmail() }),
                createActivatedUser({ email: generateUniqueEmail() }),
                createActivatedUser({ email: generateUniqueEmail() })
            ]);

            const result = await userService.findWithPaginate({}, 1, 2);

            expect(result.error).toBe(false);
            expect(result.data).toBeDefined();
            expect(result.data.content).toBeDefined();
            expect(result.data.content.length).toBeGreaterThan(0);
            expect(result.data.pagination).toBeDefined();
            expect(result.data.pagination.total).toBeGreaterThanOrEqual(3);
            expect(result.data.pagination.page).toBe(1);
            expect(result.data.pagination.limit).toBe(2);
        });

        it('devrait supprimer un utilisateur (soft delete)', async () => {
            const user = await createActivatedUser();

            const result = await userService.softDelete({ _id: user._id });

            expect(result.error).toBe(false);
            expect(result.message).toContain('soft deleted');

            const deletedUser = await userService.findById(user._id);
            expect(deletedUser.data.deleted_at).not.toBeNull();
        });

        it('devrait compter les utilisateurs', async () => {
            await createActivatedUser();
            await createActivatedUser();

            const count = await userService.count({});
            expect(count).toBeGreaterThanOrEqual(2);
        });
    });
});
