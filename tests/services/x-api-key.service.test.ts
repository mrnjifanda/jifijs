import xApiKeyService from '../../src/services/admin/x-api-key.service';
import { createActivatedUser } from '../helpers/test.helpers';
import { XApiKeyStatus } from '../../src/types';
import crypto from 'crypto';

describe('XApiKeyService', () => {

    describe('CRUD Operations', () => {
        it('devrait créer une nouvelle clé API', async () => {
            const user = await createActivatedUser();
            const apiKey = crypto.randomBytes(32).toString('hex');

            const result = await xApiKeyService.create({
                user: user._id,
                keys: apiKey,
                status: XApiKeyStatus.ACTIVE
            });

            expect(result.error).toBe(false);
            expect(result.data).toBeDefined();
            expect(result.data.keys).toBe(apiKey);
            expect(result.data.user.toString()).toBe(user._id.toString());
            expect(result.data.status).toBe(XApiKeyStatus.ACTIVE);
        });

        it('devrait créer une clé API avec statut inactif par défaut', async () => {
            const user = await createActivatedUser();
            const apiKey = crypto.randomBytes(32).toString('hex');

            const result = await xApiKeyService.create({
                user: user._id,
                keys: apiKey
            });

            expect(result.error).toBe(false);
            expect(result.data.status).toBe(XApiKeyStatus.INACTIVE);
        });

        it('devrait trouver une clé API par clé', async () => {
            const user = await createActivatedUser();
            const apiKey = crypto.randomBytes(32).toString('hex');

            await xApiKeyService.create({
                user: user._id,
                keys: apiKey,
                status: XApiKeyStatus.ACTIVE
            });

            const result = await xApiKeyService.findOne({ keys: apiKey });

            expect(result.error).toBe(false);
            expect(result.data).toBeDefined();
            expect(result.data.keys).toBe(apiKey);
        });

        it('devrait trouver toutes les clés API d\'un utilisateur', async () => {
            const user = await createActivatedUser();
            const apiKey1 = crypto.randomBytes(32).toString('hex');
            const apiKey2 = crypto.randomBytes(32).toString('hex');

            await xApiKeyService.create({
                user: user._id,
                keys: apiKey1,
                status: XApiKeyStatus.ACTIVE
            });

            await xApiKeyService.create({
                user: user._id,
                keys: apiKey2,
                status: XApiKeyStatus.INACTIVE
            });

            const result = await xApiKeyService.find({ user: user._id });

            expect(result.error).toBe(false);
            expect(result.data.length).toBe(2);
        });

        it('devrait mettre à jour le statut d\'une clé API', async () => {
            const user = await createActivatedUser();
            const apiKey = crypto.randomBytes(32).toString('hex');

            const created = await xApiKeyService.create({
                user: user._id,
                keys: apiKey,
                status: XApiKeyStatus.ACTIVE
            });

            const updateResult = await xApiKeyService.update(
                { _id: created.data._id },
                { status: XApiKeyStatus.INACTIVE }
            );

            expect(updateResult.error).toBe(false);
            expect(updateResult.modifiedCount).toBe(1);

            const updated = await xApiKeyService.findById(created.data._id);
            expect(updated.data.status).toBe(XApiKeyStatus.INACTIVE);
        });

        it('devrait supprimer une clé API', async () => {
            const user = await createActivatedUser();
            const apiKey = crypto.randomBytes(32).toString('hex');

            const created = await xApiKeyService.create({
                user: user._id,
                keys: apiKey,
                status: XApiKeyStatus.ACTIVE
            });

            const deleteResult = await xApiKeyService.delete({ _id: created.data._id });

            expect(deleteResult.error).toBe(false);

            const deleted = await xApiKeyService.findById(created.data._id);
            expect(deleted.error).toBe(true);
            expect(deleted.message).toContain('not found');
        });

        it('devrait lister les clés API avec pagination', async () => {
            const user = await createActivatedUser();

            // Créer plusieurs clés API
            for (let i = 0; i < 5; i++) {
                await xApiKeyService.create({
                    user: user._id,
                    keys: crypto.randomBytes(32).toString('hex'),
                    status: i % 2 === 0 ? XApiKeyStatus.ACTIVE : XApiKeyStatus.INACTIVE
                });
            }

            const result = await xApiKeyService.findWithPaginate(
                { user: user._id },
                1,
                3
            );

            expect(result.error).toBe(false);
            expect(result.data.content).toBeDefined();
            expect(result.data.content.length).toBeLessThanOrEqual(3);
            expect(result.data.pagination).toBeDefined();
            expect(result.data.pagination.total).toBe(5);
        });

        it('devrait compter les clés API actives', async () => {
            const user = await createActivatedUser();

            await xApiKeyService.create({
                user: user._id,
                keys: crypto.randomBytes(32).toString('hex'),
                status: XApiKeyStatus.ACTIVE
            });

            await xApiKeyService.create({
                user: user._id,
                keys: crypto.randomBytes(32).toString('hex'),
                status: XApiKeyStatus.INACTIVE
            });

            const count = await xApiKeyService.count({
                user: user._id,
                status: XApiKeyStatus.ACTIVE
            });

            expect(count).toBe(1);
        });

        it('devrait filtrer les clés API par statut', async () => {
            const user = await createActivatedUser();

            await xApiKeyService.create({
                user: user._id,
                keys: crypto.randomBytes(32).toString('hex'),
                status: XApiKeyStatus.ACTIVE
            });

            await xApiKeyService.create({
                user: user._id,
                keys: crypto.randomBytes(32).toString('hex'),
                status: XApiKeyStatus.ACTIVE
            });

            await xApiKeyService.create({
                user: user._id,
                keys: crypto.randomBytes(32).toString('hex'),
                status: XApiKeyStatus.INACTIVE
            });

            const activeKeys = await xApiKeyService.find({
                user: user._id,
                status: XApiKeyStatus.ACTIVE
            });

            expect(activeKeys.error).toBe(false);
            expect(activeKeys.data.length).toBe(2);
            expect(activeKeys.data.every((key: any) => key.status === XApiKeyStatus.ACTIVE)).toBe(true);
        });
    });

    describe('Validation', () => {
        it('devrait échouer à créer une clé API sans utilisateur', async () => {
            const apiKey = crypto.randomBytes(32).toString('hex');

            const result = await xApiKeyService.create({
                keys: apiKey,
                status: XApiKeyStatus.ACTIVE
            } as any);

            expect(result.error).toBe(true);
        });

        it('devrait échouer à créer une clé API sans clé', async () => {
            const user = await createActivatedUser();

            const result = await xApiKeyService.create({
                user: user._id,
                status: XApiKeyStatus.ACTIVE
            } as any);

            expect(result.error).toBe(true);
        });

        it('devrait accepter uniquement les statuts valides', async () => {
            const user = await createActivatedUser();
            const apiKey = crypto.randomBytes(32).toString('hex');

            const result = await xApiKeyService.create({
                user: user._id,
                keys: apiKey,
                status: 'INVALID_STATUS' as any
            });

            expect(result.error).toBe(true);
        });
    });
});
