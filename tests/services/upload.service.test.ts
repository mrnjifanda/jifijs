import uploadService from '../../src/services/admin/upload.service';
import { createActivatedUser } from '../helpers/test.helpers';

describe('UploadService', () => {

    const createMockFile = (overrides = {}) => ({
        filename: `test-${Date.now()}.jpg`,
        originalname: 'test.jpg',
        mimetype: 'image/jpeg',
        path: '/uploads/test.jpg',
        size: 1024,
        ...overrides
    });

    describe('upload()', () => {
        it('devrait uploader un fichier avec succès', async () => {
            const user = await createActivatedUser();
            const mockFile = createMockFile();

            const result = await uploadService.upload(mockFile, user._id.toString());

            expect(result.error).toBe(false);
            expect(result.data).toBeDefined();
            expect(result.data.filename).toBe(mockFile.filename);
            expect(result.data.originalname).toBe(mockFile.originalname);
            expect(result.data.mimetype).toBe(mockFile.mimetype);
            expect(result.data.size).toBe(mockFile.size);
            expect(result.data.uploader?.toString()).toBe(user._id.toString());
            expect(result.data.id).toBeDefined();
        });

        it('devrait uploader un fichier sans utilisateur', async () => {
            const mockFile = createMockFile();

            const result = await uploadService.upload(mockFile);

            expect(result.error).toBe(false);
            expect(result.data).toBeDefined();
            expect(result.data.uploader).toBeNull();
        });

        it('devrait uploader un fichier avec metadata', async () => {
            const user = await createActivatedUser();
            const mockFile = createMockFile();
            const metadata = {
                category: 'profile',
                description: 'Profile picture'
            };

            const result = await uploadService.upload(mockFile, user._id.toString(), metadata);

            expect(result.error).toBe(false);
            expect(result.data.metadata).toBeDefined();
            expect(result.data.metadata.category).toBe('profile');
            expect(result.data.metadata.description).toBe('Profile picture');
        });
    });

    describe('uploadMulti()', () => {
        it('devrait uploader plusieurs fichiers', async () => {
            const user = await createActivatedUser();
            const mockFiles = [
                createMockFile({ filename: 'file1.jpg', originalname: 'file1.jpg' }),
                createMockFile({ filename: 'file2.png', originalname: 'file2.png', mimetype: 'image/png' }),
                createMockFile({ filename: 'file3.pdf', originalname: 'file3.pdf', mimetype: 'application/pdf' })
            ];

            const result = await uploadService.uploadMulti(mockFiles, user._id.toString());

            expect(result.error).toBe(false);
            expect(result.data).toBeDefined();
            expect(result.data.length).toBe(3);
            expect(result.data[0].filename).toBe('file1.jpg');
            expect(result.data[1].filename).toBe('file2.png');
            expect(result.data[2].filename).toBe('file3.pdf');
        });

        it('devrait uploader plusieurs fichiers avec metadata', async () => {
            const user = await createActivatedUser();
            const mockFiles = [
                createMockFile({ filename: 'file1.jpg' }),
                createMockFile({ filename: 'file2.jpg' })
            ];
            const metadata = { category: 'gallery' };

            const result = await uploadService.uploadMulti(mockFiles, user._id.toString(), metadata);

            expect(result.error).toBe(false);
            expect(result.data.length).toBe(2);
            expect(result.data[0].metadata.category).toBe('gallery');
            expect(result.data[1].metadata.category).toBe('gallery');
        });
    });

    describe('getStats()', () => {
        it('devrait retourner les statistiques des uploads', async () => {
            const user = await createActivatedUser();

            // Uploader plusieurs fichiers
            await uploadService.upload(
                createMockFile({ mimetype: 'image/jpeg', size: 1024 }),
                user._id.toString()
            );
            await uploadService.upload(
                createMockFile({ mimetype: 'image/jpeg', size: 2048 }),
                user._id.toString()
            );
            await uploadService.upload(
                createMockFile({ mimetype: 'application/pdf', size: 512 }),
                user._id.toString()
            );

            const stats = await uploadService.getStats();

            expect(stats.error).toBe(false);
            expect(stats.data).toBeDefined();
            expect(stats.data.total_files).toBe(3);
            expect(stats.data.total_size).toBe(3584);
            expect(stats.data.mimetype_stats).toBeDefined();
            expect(stats.data.mimetype_stats['image/jpeg']).toBe(2);
            expect(stats.data.mimetype_stats['application/pdf']).toBe(1);
        });

        it('devrait filtrer les statistiques par uploader', async () => {
            const user1 = await createActivatedUser();
            const user2 = await createActivatedUser();

            await uploadService.upload(createMockFile(), user1._id.toString());
            await uploadService.upload(createMockFile(), user1._id.toString());
            await uploadService.upload(createMockFile(), user2._id.toString());

            const stats = await uploadService.getStats({
                uploader: user1._id.toString()
            });

            expect(stats.error).toBe(false);
            expect(stats.data.total_files).toBe(2);
        });

        it('devrait filtrer les statistiques par mimetype', async () => {
            const user = await createActivatedUser();

            await uploadService.upload(
                createMockFile({ mimetype: 'image/jpeg' }),
                user._id.toString()
            );
            await uploadService.upload(
                createMockFile({ mimetype: 'image/png' }),
                user._id.toString()
            );
            await uploadService.upload(
                createMockFile({ mimetype: 'image/jpeg' }),
                user._id.toString()
            );

            const stats = await uploadService.getStats({
                mimetype: 'image/jpeg'
            });

            expect(stats.error).toBe(false);
            expect(stats.data.total_files).toBe(2);
        });
    });

    describe('deleteFile()', () => {
        it('devrait supprimer un fichier par ID', async () => {
            const user = await createActivatedUser();
            const uploaded = await uploadService.upload(
                createMockFile(),
                user._id.toString()
            );

            const result = await uploadService.deleteFile({ id: uploaded.data.id });

            expect(result.error).toBe(false);
            expect(result.data).toBeDefined();
            expect(result.data.status).toBe('deleted');
        });

        it('devrait supprimer un fichier par filename', async () => {
            const user = await createActivatedUser();
            const mockFile = createMockFile({ filename: 'unique-file.jpg' });
            await uploadService.upload(mockFile, user._id.toString());

            const result = await uploadService.deleteFile({ filename: 'unique-file.jpg' });

            expect(result.error).toBe(false);
            expect(result.data).toBeDefined();
            expect(result.data.status).toBe('deleted');
        });

        it('devrait échouer si le fichier n\'existe pas', async () => {
            const result = await uploadService.deleteFile({ id: 'non-existent-id' });

            expect(result.error).toBe(true);
            expect(result.message).toBe('File not found');
        });

        it('devrait échouer sans ID ni filename', async () => {
            const result = await uploadService.deleteFile({});

            expect(result.error).toBe(true);
            expect(result.message).toContain('provide id or filename');
        });
    });

    describe('getFileInfo()', () => {
        it('devrait récupérer les infos d\'un fichier par ID', async () => {
            const user = await createActivatedUser();
            const uploaded = await uploadService.upload(
                createMockFile(),
                user._id.toString()
            );

            const result = await uploadService.getFileInfo({ id: uploaded.data.id });

            expect(result.error).toBe(false);
            expect(result.data).toBeDefined();
            expect(result.data.id).toBe(uploaded.data.id);
            expect(result.data.filename).toBe(uploaded.data.filename);
        });

        it('devrait récupérer les infos d\'un fichier par filename', async () => {
            const user = await createActivatedUser();
            const mockFile = createMockFile({ filename: 'info-test.jpg' });
            await uploadService.upload(mockFile, user._id.toString());

            const result = await uploadService.getFileInfo({ filename: 'info-test.jpg' });

            expect(result.error).toBe(false);
            expect(result.data).toBeDefined();
            expect(result.data.filename).toBe('info-test.jpg');
        });

        it('devrait échouer si le fichier n\'existe pas', async () => {
            const result = await uploadService.getFileInfo({ id: 'non-existent-id' });

            expect(result.error).toBe(true);
            expect(result.message).toBe('File not found');
        });

        it('devrait échouer sans ID ni filename', async () => {
            const result = await uploadService.getFileInfo({});

            expect(result.error).toBe(true);
            expect(result.message).toContain('provide id or filename');
        });
    });

    describe('Base Service Operations', () => {
        it('devrait lister les fichiers avec pagination', async () => {
            const user = await createActivatedUser();

            // Créer plusieurs fichiers
            for (let i = 0; i < 5; i++) {
                await uploadService.upload(
                    createMockFile({ filename: `file-${i}.jpg` }),
                    user._id.toString()
                );
            }

            const result = await uploadService.findWithPaginate(
                { uploader: user._id },
                1,
                3
            );

            expect(result.error).toBe(false);
            expect(result.data.content).toBeDefined();
            expect(result.data.content.length).toBeLessThanOrEqual(3);
            expect(result.data.pagination.total).toBe(5);
        });

        it('devrait compter les fichiers', async () => {
            const user = await createActivatedUser();

            await uploadService.upload(createMockFile(), user._id.toString());
            await uploadService.upload(createMockFile(), user._id.toString());

            const count = await uploadService.count({ uploader: user._id });
            expect(count).toBe(2);
        });
    });
});
