import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer: MongoMemoryServer;

mongoose.set('strictQuery', false);

jest.mock('../utils/helpers/logger.helper', () => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
}));

jest.mock('../utils/bases/mail.service', () => ({
    sendWithQueue: jest.fn().mockResolvedValue(true),
    send: jest.fn().mockResolvedValue(true)
}));

beforeAll(async () => {
    try {
        mongoServer = await MongoMemoryServer.create();
        const mongoUri = mongoServer.getUri();

        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
        }

        await mongoose.connect(mongoUri);

        console.log('✅ Connected to MongoDB Memory Server');
    } catch (error) {
        console.error('❌ MongoDB Memory Server connection error:', error);
        throw error;
    }
});

afterEach(async () => {
    try {
        if (mongoose.connection.readyState === 1) {
            const collections = mongoose.connection.collections;
            for (const key in collections) {
                await collections[key].deleteMany({});
            }
        }
    } catch (error) {
        console.error('Error cleaning up collections:', error);
    }
});

afterAll(async () => {
    try {
        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
        }
        if (mongoServer) {
            await mongoServer.stop();
        }
        console.log('✅ Disconnected from MongoDB Memory Server');
    } catch (error) {
        console.error('Error disconnecting:', error);
    }
});

process.on('unhandledRejection', (error) => {
    console.error('Unhandled Rejection in tests:', error);
});
