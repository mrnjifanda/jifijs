import {
    Document,
    Model,
    FilterQuery,
    PipelineStage,
    ClientSession
} from 'mongoose';
import { bcrypt, jwt, SECRET_TOKEN, configs, mongoose } from '../../configs/app.config';
import mailService from './mail.service';
import logger from '../helpers/logger.helper';
import cacheService from '../helpers/cache.helper';
import {
    QueryOptionsExtended,
    TransactionCallback
} from '../../src/types';

/**
 * Query result interface
 */
interface QueryResult<T> {
    error: boolean;
    data?: T;
    message?: string;
    name?: string;
}

/**
 * Count result interface
 */
interface UpdateResult {
    error: boolean;
    matchedCount?: number;
    modifiedCount?: number;
    message?: string;
    name?: string;
    errors?: any;
}

/**
 * Delete result interface
 */
interface DeleteResult {
    error: boolean;
    deletedCount?: number;
    message?: string;
    name?: string;
}

/**
 * Create result interface
 */
interface CreateResult<T> {
    error: boolean;
    data?: T;
    message?: string;
    name?: string;
    errors?: any;
}

/**
 * CreateMany result interface
 */
interface CreateManyResult<T> {
    error: boolean;
    data?: T[];
    insertedCount?: number;
    message?: string;
    name?: string;
    writeErrors?: Array<{ index: number; message: string }>;
    errors?: any;
}

/**
 * Pagination result with metadata
 */
interface PaginationResponse<T> {
    error: boolean;
    data?: {
        content: T[];
        pagination: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
            hasNextPage: boolean;
            hasPrevPage: boolean;
        };
    };
    message?: string;
    name?: string;
}

/**
 * Bulk write result interface
 */
interface BulkWriteResult {
    error: boolean;
    result?: {
        insertedCount: number;
        matchedCount: number;
        modifiedCount: number;
        deletedCount: number;
        upsertedCount: number;
    };
    message?: string;
    name?: string;
}

/**
 * Bulk create options
 */
interface BulkCreateOptions {
    upsert?: boolean;
    matchField?: string;
    ordered?: boolean;
}

/**
 * JWT payload type
 */
interface JWTPayload {
    [key: string]: any;
}

/**
 * BaseService - Generic service class for CRUD operations with Mongoose models.
 *
 * @template T - The document type extending Mongoose Document
 */
class BaseService<T extends Document> {
    protected model: Model<T>;

    /**
     * Base service class constructor.
     * Prevents direct instantiation of BaseService.
     *
     * @param {Model<T>} model - The Mongoose model to use for CRUD operations.
     * @throws {Error} If attempting to instantiate BaseService directly.
     */
    constructor(model: Model<T>) {
        if (this.constructor === BaseService) {
            throw new Error("BaseService cannot be instantiated directly. Please extend this class.");
        }

        if (!model) {
            throw new Error("Model is required for BaseService");
        }

        this.model = model;
    }

    /**
     * Returns an instance of the email sending service.
     *
     * @returns Instance of mail service.
     */
    mail(): typeof mailService {
        return mailService;
    }

    /**
     * Hashes a value (typically a password) using bcrypt.
     *
     * @param {string} value - The plain value to hash.
     * @returns {Promise<string|false>} The generated hash, or `false` if an error occurs.
     */
    async hash(value: string): Promise<string | false> {
        try {
            if (!value || typeof value !== 'string') {
                throw new Error('Value must be a non-empty string');
            }

            const salt = await bcrypt.genSalt(10);
            return await bcrypt.hash(value, salt);
        } catch (error) {
            logger.error('Hash error:', error);
            return false;
        }
    }

    /**
     * Compares a plain value with a bcrypt hash.
     *
     * @param {string} value - The plain value to compare.
     * @param {string} hash - The stored hash.
     * @returns {Promise<boolean>} `true` if match, `false` otherwise or on error.
     */
    async hashCompare(value: string, hash: string): Promise<boolean> {
        try {
            if (!value || !hash) {
                return false;
            }

            return await bcrypt.compare(value, hash);
        } catch (error) {
            logger.error(error);
            return false;
        }
    }

    /**
     * Generates a signed JWT token.
     *
     * @param {object} data - Data to encode in the token.
     * @param {string} [expiresIn='1h'] - Token expiration (accepted by `jsonwebtoken`).
     * @returns {string|false} The signed JWT token or false on error.
     */
    token(data: JWTPayload, expiresIn: string = '1h'): string | false {
        try {
            if (!data || typeof data !== 'object') {
                throw new Error('Data must be an object');
            }

            return jwt.sign(data, SECRET_TOKEN as string, { expiresIn } as jwt.SignOptions);
        } catch (error) {
            logger.error('Token generation error:', error);
            return false;
        }
    }

    /**
     * Verifies and decodes a JWT token.
     *
     * @param {string} token - The JWT token to verify.
     * @returns {object|false} Decoded payload if valid, `false` if invalid or expired.
     */
    tokenVerify(token: string): JWTPayload | false {
        try {
            if (!token || typeof token !== 'string') {
                return false;
            }

            return jwt.verify(token, SECRET_TOKEN) as JWTPayload;
        } catch (error: any) {
            logger.error('Token verification error:', { error: error.message, name: error.name });
            return false;
        }
    }

    /**
     * Returns the model to use for operations.
     * Falls back to instance model if none provided.
     *
     * @param {Model<T>|null} [model=null] - Optional model to use.
     * @returns {Model<T>} The selected model.
     */
    public getModel(model: Model<T> | null = null): Model<T> {
        return model ?? this.model;
    }

    /**
     * Converts a field selection string into a MongoDB projection object.
     *
     * @param {string} select_string - Comma-separated field names (e.g., "name,email").
     * @param {string} [separator=','] - Separator used in the string.
     * @returns {Object} MongoDB projection object (e.g., { name: 1, email: 1 }).
     */
    querySelect(select_string: string, separator: string = ','): Record<string, 0 | 1> {
        if (!select_string || typeof select_string !== 'string') {
            return {};
        }

        select_string = select_string.replace(/\s/g, '');
        const selects_query = select_string.split(separator);
        const selects: Record<string, 0 | 1> = {};

        selects_query.forEach(select => {
            if (select) {
                if (select.startsWith('-')) {
                    selects[select.slice(1)] = 0;
                } else {
                    selects[select] = 1;
                }
            }
        });

        return selects;
    }

    /**
     * Apply common query modifiers (select, populate, sort, lean)
     * @private
     * @param {any} query - Mongoose query object
     * @param {QueryOptionsExtended} options - Query options
     * @returns {any} Modified query
     */
    private _applyQueryOptions(query: any, options: QueryOptionsExtended = {}): any {
        const { select, populate, sort, lean } = options;

        if (select) {
            query = query.select(this.querySelect(select as string));
        }

        if (populate) {
            if (Array.isArray(populate)) {
                populate.forEach(pop => {
                    query = query.populate(pop);
                });
            } else {
                query = query.populate(populate);
            }
        }

        if (sort) {
            query = query.sort(sort);
        }

        if (lean !== undefined) {
            query = query.lean(lean);
        }

        return query;
    }

    /**
     * Executes a generic find operation using the specified Mongoose method.
     *
     * @param {string} method - Mongoose method name ('find', 'findOne', etc.).
     * @param {FilterQuery<T>} filter - MongoDB filter criteria.
     * @param {QueryOptionsExtended} [query={}] - Additional query options.
     * @param {Model<T>|null} [model=null] - Specific model to use.
     * @returns {Promise<QueryResult<any>>}
     */
    private async _executeQuery(
        method: string,
        filter: FilterQuery<T>,
        query: QueryOptionsExtended = {},
        model: Model<T> | null = null
    ): Promise<QueryResult<any>> {
        try {
            let mongooseQuery = (this.getModel(model) as any)[method](filter);
            mongooseQuery = this._applyQueryOptions(mongooseQuery, query);

            const data = await mongooseQuery.exec();

            return { error: false, data };
        } catch (err: any) {
            logger.error(`Error in ${method}:`, err);
            return {
                error: true,
                message: err.message,
                name: err.name
            };
        }
    }

    /**
     * Finds multiple documents matching the filter.
     *
     * @param {FilterQuery<T>} filter - MongoDB filter criteria.
     * @param {QueryOptionsExtended} [query={}] - Additional query options (select, populate, sort, lean).
     * @param {Model<T>|null} [model=null] - Specific model to use.
     * @returns {Promise<QueryResult<T[]>>}
     */
    async find(
        filter: FilterQuery<T>,
        query: QueryOptionsExtended = {},
        model: Model<T> | null = null
    ): Promise<QueryResult<T[]>> {
        return this._executeQuery('find', filter, query, model);
    }

    /**
     * Finds a single document matching the filter.
     *
     * @param {FilterQuery<T>} filter - MongoDB filter criteria.
     * @param {QueryOptionsExtended} [query={}] - Additional query options (select, populate, lean).
     * @param {Model<T>|null} [model=null] - Specific model to use.
     * @returns {Promise<QueryResult<T | null>>}
     */
    async findOne(
        filter: FilterQuery<T>,
        query: QueryOptionsExtended = {},
        model: Model<T> | null = null
    ): Promise<QueryResult<T | null>> {
        return this._executeQuery('findOne', filter, query, model);
    }

    /**
     * Finds a document by its ID.
     *
     * @param {string} id - Document ID.
     * @param {QueryOptionsExtended} [query={}] - Additional query options (select, populate, lean).
     * @param {Model<T>|null} [model=null] - Specific model to use.
     * @returns {Promise<QueryResult<T | null>>}
     */
    async findById(
        id: string,
        query: QueryOptionsExtended = {},
        model: Model<T> | null = null
    ): Promise<QueryResult<T | null>> {
        try {
            if (!id) {
                return { error: true, message: 'ID is required', name: 'ValidationError' };
            }

            if (!mongoose.Types.ObjectId.isValid(id)) {
                return { error: true, message: 'Invalid ID format', name: 'ValidationError' };
            }

            let mongooseQuery = this.getModel(model).findById(id);
            mongooseQuery = this._applyQueryOptions(mongooseQuery, query);

            const data = await mongooseQuery.exec();

            return {
                error: false,
                data
            };
        } catch (err: any) {
            logger.error('Error in findById:', err);
            return {
                error: true,
                message: err.message,
                name: err.name
            };
        }
    }

    /**
     * Finds documents with pagination support.
     *
     * @param {FilterQuery<T>} filters - MongoDB filter criteria.
     * @param {number} [page=1] - Page number (1-indexed).
     * @param {number} [limit=20] - Number of items per page.
     * @param {QueryOptionsExtended} [query={}] - Additional query options (select, populate, sort, lean).
     * @param {Model<T>|null} [model=null] - Specific model to use.
     * @returns {Promise<PaginationResponse<T>>}
     */
    async findWithPaginate(
        filters: FilterQuery<T>,
        page: number = 1,
        limit: number = 20,
        query: QueryOptionsExtended = {},
        model: Model<T> | null = null
    ): Promise<PaginationResponse<T>> {
        try {
            page = Math.max(1, parseInt(page.toString()) || 1);
            limit = Math.max(1, Math.min(100, parseInt(limit.toString()) || 20));

            const skip = (page - 1) * limit;
            const [countResult, dataResult] = await Promise.all([
                this.count(filters, model),
                (async () => {
                    let mongooseQuery = this.getModel(model)
                        .find(filters)
                        .skip(skip)
                        .limit(limit);

                    mongooseQuery = this._applyQueryOptions(mongooseQuery, query);
                    return await mongooseQuery.exec();
                })()
            ]);

            const total = countResult;
            const totalPages = Math.ceil(total / limit);

            return {
                error: false,
                data: {
                    content: dataResult as T[],
                    pagination: {
                        total,
                        page,
                        limit,
                        totalPages,
                        hasNextPage: page < totalPages,
                        hasPrevPage: page > 1
                    }
                },
            };
        } catch (err: any) {
            logger.error('Error in findWithPaginate:', err);
            return {
                error: true,
                message: err.message,
                name: err.name
            };
        }
    }

    /**
     * Creates a new document.
     *
     * @param {Partial<T>} data - Document data to create.
     * @param {Model<T>|null} [model=null] - Specific model to use.
     * @param {ClientSession|null} [session=null] - Transaction session.
     * @returns {Promise<CreateResult<T>>}
     */
    async create(
        data: Partial<T>,
        model: Model<T> | null = null,
        session: ClientSession | null = null
    ): Promise<CreateResult<T>> {
        try {
            if (!data || typeof data !== 'object') {
                return {
                    error: true,
                    message: 'Data must be a valid object',
                    name: 'ValidationError'
                };
            }

            const options = session ? { session } : {};
            const result = await this.getModel(model).create([data], options);
            return {
                error: false,
                data: Array.isArray(result) ? result[0] : result
            }
        } catch (err: any) {
            logger.error('Error in create:', err);
            return {
                error: true,
                message: err.message,
                name: err.name,
                errors: err.errors
            };
        }
    }

    /**
     * Creates multiple documents in a single operation (bulk insert).
     *
     * @param {Array<Partial<T>>} dataArray - Array of documents to insert.
     * @param {BulkCreateOptions} [options={}] - Additional options.
     * @param {Model<T>|null} [model=null] - Specific model to use.
     * @returns {Promise<CreateManyResult<T>>}
     *
     * @example
     * await service.createMany([
     *   { name: 'User 1', email: 'user1@example.com' },
     *   { name: 'User 2', email: 'user2@example.com' }
     * ]);
     */
    async createMany(
        dataArray: Array<Partial<T>>,
        options: BulkCreateOptions = {},
        model: Model<T> | null = null
    ): Promise<CreateManyResult<T>> {
        try {
            if (!Array.isArray(dataArray)) {
                return {
                    error: true,
                    message: 'Data must be an array',
                    name: 'ValidationError'
                };
            }

            if (dataArray.length === 0) {
                return {
                    error: true,
                    message: 'Data array cannot be empty',
                    name: 'ValidationError'
                };
            }

            const invalidItems = dataArray.filter(item => !item || typeof item !== 'object');
            if (invalidItems.length > 0) {
                return {
                    error: true,
                    message: 'All items must be valid objects',
                    name: 'ValidationError'
                };
            }

            const defaultOptions = {
                ordered: true,
                ...options
            };

            const result = await this.getModel(model).insertMany(
                dataArray as any[],
                defaultOptions
            );

            return {
                error: false,
                data: result as unknown as T[],
                insertedCount: result.length
            };
        } catch (err: any) {
            logger.error('Error in createMany:', err);
            const errorResponse: CreateManyResult<T> = {
                error: true,
                message: err.message,
                name: err.name
            };

            if (err.writeErrors) {
                errorResponse.writeErrors = err.writeErrors.map((e: any) => ({
                    index: e.index,
                    message: e.errmsg
                }));
            }

            if (err.errors) {
                errorResponse.errors = err.errors;
            }

            return errorResponse;
        }
    }

    /**
     * Updates document(s) matching the filter.
     *
     * @param {FilterQuery<T>} filter - MongoDB filter to identify document(s).
     * @param {Partial<T>} data - Data to update.
     * @param {Model<T>|null} [model=null] - Specific model to use.
     * @param {ClientSession|null} [session=null] - Transaction session.
     * @returns {Promise<UpdateResult>}
     */
    async update(
        filter: FilterQuery<T>,
        data: Partial<T>,
        model: Model<T> | null = null,
        session: ClientSession | null = null
    ): Promise<UpdateResult> {
        try {
            if (!filter || typeof filter !== 'object') {
                return {
                    error: true,
                    message: 'Filter must be a valid object',
                    name: 'ValidationError'
                };
            }

            if (!data || typeof data !== 'object') {
                return {
                    error: true,
                    message: 'Data must be a valid object',
                    name: 'ValidationError'
                };
            }

            const options: any = { runValidators: true };
            if (session) options.session = session;

            const result = await this.getModel(model).updateOne(
                filter,
                { $set: data } as any,
                options
            );

            return {
                error: false,
                matchedCount: result.matchedCount,
                modifiedCount: result.modifiedCount
            };
        } catch (err: any) {
            logger.error('Error in update:', err);
            return {
                error: true,
                message: err.message,
                name: err.name,
                errors: err.errors
            };
        }
    }

    /**
     * Updates multiple documents matching the filter.
     *
     * @param {FilterQuery<T>} filter - MongoDB filter to identify documents.
     * @param {Partial<T>} data - Data to update.
     * @param {Model<T>|null} [model=null] - Specific model to use.
     * @returns {Promise<UpdateResult>}
     */
    async updateMany(
        filter: FilterQuery<T>,
        data: Partial<T>,
        model: Model<T> | null = null
    ): Promise<UpdateResult> {
        try {
            if (!filter || typeof filter !== 'object') {
                return {
                    error: true,
                    message: 'Filter must be a valid object',
                    name: 'ValidationError'
                };
            }

            if (!data || typeof data !== 'object') {
                return {
                    error: true,
                    message: 'Data must be a valid object',
                    name: 'ValidationError'
                };
            }

            const result = await this.getModel(model).updateMany(
                filter,
                { $set: data } as any,
                { runValidators: true }
            );

            return {
                error: false,
                matchedCount: result.matchedCount,
                modifiedCount: result.modifiedCount
            };
        } catch (err: any) {
            logger.error('Error in updateMany:', err);
            return {
                error: true,
                message: err.message,
                name: err.name,
                errors: err.errors
            };
        }
    }

    /**
     * Finds a document and updates it, returning the updated document.
     *
     * @param {FilterQuery<T>} filter - MongoDB filter to identify the document.
     * @param {Partial<T>} data - Data to update.
     * @param {object} [options={}] - Additional options.
     * @param {Model<T>|null} [model=null] - Specific model to use.
     * @returns {Promise<QueryResult<T | null>>}
     */
    async findOneAndUpdate(
        filter: FilterQuery<T>,
        data: Partial<T>,
        options: { new?: boolean; upsert?: boolean } = {},
        model: Model<T> | null = null
    ): Promise<QueryResult<T | null>> {
        try {
            const defaultOptions = {
                new: true,
                runValidators: true,
                ...options
            };

            const result = await this.getModel(model).findOneAndUpdate(
                filter,
                { $set: data } as any,
                defaultOptions
            );

            return {
                error: false,
                data: result
            };
        } catch (err: any) {
            logger.error('Error in findOneAndUpdate:', err);
            return {
                error: true,
                message: err.message,
                name: err.name
            };
        }
    }

    /**
     * Performs a soft delete by setting the `deleted_at` field to the current date.
     *
     * @param {FilterQuery<T>} filter - MongoDB filter to identify the document.
     * @param {Model<T>|null} [model=null] - Specific model to use.
     * @param {ClientSession|null} [session=null] - Transaction session.
     * @returns {Promise<UpdateResult & { message: string }>}
     */
    async softDelete(
        filter: FilterQuery<T>,
        model: Model<T> | null = null,
        session: ClientSession | null = null
    ): Promise<UpdateResult & { message: string }> {
        try {
            if (!filter || typeof filter !== 'object') {
                return {
                    error: true,
                    message: 'Invalid filter parameter',
                    name: 'ValidationError'
                };
            }

            const deleteData = { deleted_at: new Date() } as unknown as Partial<T>;
            const result = await this.update(filter, deleteData, model, session);
            return {
                ...result,
                message: result.error ? result.message! : "Item successfully soft deleted"
            };
        } catch (error: any) {
            logger.error(error);
            return {
                error: true,
                message: error.message,
                name: error.name
            };
        }
    }

    /**
     * Permanently deletes document(s) matching the filter.
     *
     * @param {FilterQuery<T>} filter - MongoDB filter to identify document(s).
     * @param {Model<T>|null} [model=null] - Specific model to use.
     * @param {ClientSession|null} [session=null] - Transaction session.
     * @returns {Promise<DeleteResult>}
     */
    async delete(
        filter: FilterQuery<T>,
        model: Model<T> | null = null,
        session: ClientSession | null = null
    ): Promise<DeleteResult> {
        try {
            if (!filter || typeof filter !== 'object') {
                return {
                    error: true,
                    message: 'Filter must be a valid object',
                    name: 'ValidationError'
                };
            }

            const options = session ? { session } : {};
            const result = await this.getModel(model).deleteOne(filter, options);

            return {
                error: false,
                deletedCount: result.deletedCount,
                message: result.deletedCount > 0 ? `${result.deletedCount} item(s) deleted` : 'No item found to delete'
            };
        } catch (err: any) {
            logger.error('Error in delete:', err);
            return {
                error: true,
                message: err.message,
                name: err.name
            };
        }
    }

    /**
     * Permanently deletes multiple documents matching the filter.
     *
     * @param {FilterQuery<T>} filter - MongoDB filter to identify documents.
     * @param {Model<T>|null} [model=null] - Specific model to use.
     * @returns {Promise<DeleteResult>}
     */
    async deleteMany(
        filter: FilterQuery<T>,
        model: Model<T> | null = null
    ): Promise<DeleteResult> {
        try {
            if (!filter || typeof filter !== 'object') {
                return {
                    error: true,
                    message: 'Filter must be a valid object',
                    name: 'ValidationError'
                };
            }

            const result = await this.getModel(model).deleteMany(filter);

            return {
                error: false,
                deletedCount: result.deletedCount,
                message: `${result.deletedCount} item(s) successfully deleted`
            };
        } catch (err: any) {
            logger.error('Error in deleteMany:', err);
            return {
                error: true,
                message: err.message,
                name: err.name
            };
        }
    }

    /**
     * Counts documents matching the filter.
     *
     * @param {FilterQuery<T>} filter - MongoDB filter criteria.
     * @param {Model<T>|null} [model=null] - Specific model to use.
     * @returns {Promise<number>} Number of matching documents.
     */
    async count(filter: FilterQuery<T>, model: Model<T> | null = null): Promise<number> {
        try {
            logger.debug('filter', filter);
            logger.debug('model', model);
            return await this.getModel(model).countDocuments(filter);
        } catch (err: any) {
            logger.error('Error in count:', err);
            return 0;
        }
    }

    /**
     * Checks if any document matches the filter.
     *
     * @param {FilterQuery<T>} filter - MongoDB filter.
     * @param {Model<T>|null} [model=null] - Specific model to use.
     * @returns {Promise<boolean>} True if at least one document exists.
     */
    async exists(filter: FilterQuery<T>, model: Model<T> | null = null): Promise<boolean> {
        try {
            const count = await this.count(filter, model);
            return count > 0;
        } catch (err: any) {
            logger.error('Error in exists:', err);
            return false;
        }
    }

    /**
     * Performs aggregation on the collection.
     *
     * @param {PipelineStage[]} pipeline - Aggregation pipeline stages.
     * @param {Model<T>|null} [model=null] - Specific model to use.
     * @returns {Promise<QueryResult<any[]>>}
     */
    async aggregate(
        pipeline: PipelineStage[],
        model: Model<T> | null = null
    ): Promise<QueryResult<any[]>> {
        try {
            if (!Array.isArray(pipeline)) {
                return {
                    error: true,
                    message: 'Pipeline must be an array',
                    name: 'ValidationError'
                };
            }

            const data = await this.getModel(model).aggregate(pipeline);

            return {
                error: false,
                data
            };
        } catch (err: any) {
            logger.error('Error in aggregate:', err);
            return {
                error: true,
                message: err.message,
                name: err.name
            };
        }
    }

    /**
     * Executes multiple operations in a transaction (requires MongoDB replica set).
     *
     * @param {TransactionCallback<any>} callback - Async function receiving session as parameter.
     * @param {Model<T>|null} [model=null] - Specific model to use.
     * @param {ClientSession|null} [existingSession=null] - Existing session to use.
     * @returns {Promise<QueryResult<any>>}
     *
     * @example
     * await service.transaction(async (session) => {
     *   await service.create({ name: 'Test' }, null, session);
     *   await service.update({ _id: id }, { status: 'active' }, null, session);
     *   await service.delete({ _id: oldId }, null, session);
     * });
     */
    async transaction<R = any>(
        callback: TransactionCallback<R>,
        model: Model<T> | null = null,
        existingSession: ClientSession | null = null
    ): Promise<QueryResult<R>> {
        const session = existingSession || await this.getModel(model).db.startSession();
        const shouldManageSession = !existingSession;

        if (shouldManageSession) session.startTransaction();

        try {
            const result = await callback(session);
            if (shouldManageSession) await session.commitTransaction();

            return { error: false, data: result };
        } catch (err: any) {
            if (shouldManageSession) await session.abortTransaction();
            logger.error('Transaction error:', err);

            return {
                error: true,
                message: err.message,
                name: err.name
            };
        } finally {
            if (shouldManageSession) session.endSession();
        }
    }

    /**
     * Bulk write operations for better performance.
     *
     * @param {Array<any>} operations - Array of bulk operations.
     * @param {Model<T>|null} [model=null] - Specific model to use.
     * @returns {Promise<BulkWriteResult>}
     *
     * @example
     * await service.bulkWrite([
     *   { insertOne: { document: { name: 'Test' } } },
     *   { updateOne: { filter: { _id: id }, update: { $set: { status: 'active' } } } }
     * ]);
     */
    async bulkWrite(
        operations: Array<any>,
        model: Model<T> | null = null
    ): Promise<BulkWriteResult> {
        try {
            if (!Array.isArray(operations) || operations.length === 0) {
                return {
                    error: true,
                    message: 'Operations must be a non-empty array',
                    name: 'ValidationError'
                };
            }

            const result = await this.getModel(model).bulkWrite(operations);

            return {
                error: false,
                result: {
                    insertedCount: result.insertedCount,
                    matchedCount: result.matchedCount,
                    modifiedCount: result.modifiedCount,
                    deletedCount: result.deletedCount,
                    upsertedCount: result.upsertedCount
                }
            };
        } catch (err: any) {
            logger.error('Error in bulkWrite:', err);
            return {
                error: true,
                message: err.message,
                name: err.name
            };
        }
    }

    /**
     * Alternative createMany using bulkWrite for better control.
     * Useful when you need upsert or other advanced options.
     *
     * @param {Array<Partial<T>>} dataArray - Array of documents to insert.
     * @param {BulkCreateOptions} [options={}] - Additional options.
     * @param {Model<T>|null} [model=null] - Specific model to use.
     * @returns {Promise<BulkWriteResult>}
     *
     * @example
     * await service.bulkCreate([
     *   { email: 'user@example.com', name: 'User' }
     * ], { upsert: true });
     */
    async bulkCreate(
        dataArray: Array<Partial<T>>,
        options: BulkCreateOptions = {},
        model: Model<T> | null = null
    ): Promise<BulkWriteResult> {
        try {
            if (!Array.isArray(dataArray) || dataArray.length === 0) {
                return {
                    error: true,
                    message: 'Data must be a non-empty array',
                    name: 'ValidationError'
                };
            }

            const operations = dataArray.map(doc => ({
                insertOne: { document: doc }
            }));

            if (options.upsert && options.matchField) {
                const upsertOps = dataArray.map(doc => ({
                    updateOne: {
                        filter: { [options.matchField!]: (doc as any)[options.matchField!] },
                        update: { $set: doc },
                        upsert: true
                    }
                }));
                return this.bulkWrite(upsertOps, model);
            }

            return this.bulkWrite(operations, model);
        } catch (err: any) {
            logger.error('Error in bulkCreate:', err);
            return {
                error: true,
                message: err.message,
                name: err.name
            };
        }
    }

    // ============================================
    // CACHE METHODS
    // ============================================

    /**
     * Get value from cache
     * @param {string} key - Cache key
     * @returns {Promise<any>} - Cached value or null
     *
     * @example
     * const user = await service.cacheGet('user:123');
     */
    protected async cacheGet<K = any>(key: string): Promise<K | null> {
        return await cacheService.get<K>(key);
    }

    /**
     * Set value in cache
     * @param {string} key - Cache key
     * @param {any} value - Value to cache
     * @param {number} [ttl=3600] - Time to live in seconds (default: 1 hour)
     * @returns {Promise<boolean>} - Success status
     *
     * @example
     * await service.cache.set('user:123', userData, 3600);
     */
    protected async cacheSet(key: string, value: any, ttl: number = 3600): Promise<boolean> {
        return await cacheService.set(key, value, { ttl });
    }

    /**
     * Delete value from cache
     * @param {string} key - Cache key
     * @returns {Promise<boolean>} - Success status
     *
     * @example
     * await service.cache.delete('user:123');
     */
    protected async cacheDelete(key: string): Promise<boolean> {
        return await cacheService.delete(key);
    }

    /**
     * Delete multiple keys by pattern
     * @param {string} pattern - Key pattern (e.g., 'user:*')
     * @returns {Promise<number>} - Number of deleted keys
     *
     * @example
     * await service.cache.deletePattern('user:*');
     */
    protected async cacheDeletePattern(pattern: string): Promise<number> {
        return await cacheService.deletePattern(pattern);
    }

    /**
     * Get or set value (cache-aside pattern)
     * Fetches from cache if available, otherwise executes fetcher and caches result
     * @param {string} key - Cache key
     * @param {Function} fetcher - Function to fetch value if not in cache
     * @param {number} [ttl=3600] - Time to live in seconds (default: 1 hour)
     * @returns {Promise<any>} - Cached or fetched value
     *
     * @example
     * const user = await service.cacheGetOrSet(
     *   'user:123',
     *   async () => await User.findById('123'),
     *   3600
     * );
     */
    protected async cacheGetOrSet<K = any>(
        key: string,
        fetcher: () => Promise<K>,
        ttl: number = 3600
    ): Promise<K | null> {
        return await cacheService.getOrSet<K>(key, fetcher, { ttl });
    }

    /**
     * Find by ID with caching
     * Automatically caches results with key pattern: {collection}:{id}
     * @param {string} id - Document ID
     * @param {QueryOptionsExtended} [query={}] - Query options
     * @param {Model<T>|null} [model=null] - Specific model to use
     * @param {number} [ttl=3600] - Cache TTL in seconds (default: 1 hour)
     * @returns {Promise<QueryResult<T>>}
     *
     * @example
     * const result = await service.findByIdCached('123', {}, null, 3600);
     */
    async findByIdCached(
        id: string,
        query: QueryOptionsExtended = {},
        model: Model<T> | null = null,
        ttl: number = 3600
    ): Promise<QueryResult<T | null>> {
        const targetModel = this.getModel(model);
        const cacheKey = `${targetModel.collection.name}:${id}`;

        const result = await this.cacheGetOrSet<QueryResult<T | null>>(
            cacheKey,
            async () => await this.findById(id, query, model),
            ttl
        );

        return result || { error: true, message: 'Not found' };
    }

    /**
     * Invalidate cache for a specific document by ID
     * @param {string} id - Document ID
     * @param {Model<T>|null} [model=null] - Specific model to use
     * @returns {Promise<boolean>} - Success status
     *
     * @example
     * await service.invalidateCache('123');
     */
    async invalidateCache(id: string, model: Model<T> | null = null): Promise<boolean> {
        const targetModel = this.getModel(model);
        const cacheKey = `${targetModel.collection.name}:${id}`;
        return await this.cacheDelete(cacheKey);
    }

    /**
     * Invalidate all cache entries for this model
     * @param {Model<T>|null} [model=null] - Specific model to use
     * @returns {Promise<number>} - Number of deleted cache entries
     *
     * @example
     * await service.invalidateAllCache();
     */
    async invalidateAllCache(model: Model<T> | null = null): Promise<number> {
        const targetModel = this.getModel(model);
        const pattern = `${targetModel.collection.name}:*`;
        return await this.cacheDeletePattern(pattern);
    }

    /**
     * @deprecated Since version 2.0.0. Use findWithPaginate() instead.
     * This method will be removed in version 3.0.0.
     *
     * Alias for findWithPaginate() - more intuitive name.
     * Finds documents with pagination support.
     *
     * @param {FilterQuery<T>} filters - MongoDB filter criteria.
     * @param {number} [page=1] - Page number (1-indexed).
     * @param {number} [limit=20] - Number of items per page.
     * @param {QueryOptionsExtended} [query={}] - Additional query options (select, populate, sort, lean).
     * @param {Model<T>|null} [model=null] - Specific model to use.
     * @returns {Promise<PaginationResponse<T>>}
     *
     * @example
     * // ❌ Deprecated
     * await service.paginate({ status: 'active' }, 1, 20);
     *
     * // ✅ Use instead
     * await service.findWithPaginate({ status: 'active' }, 1, 20);
     */
    async paginate(
        filters: FilterQuery<T>,
        page: number = 1,
        limit: number = 20,
        query: QueryOptionsExtended = {},
        model: Model<T> | null = null
    ): Promise<PaginationResponse<T>> {
        if (!configs.isProduction()) {
            const stack = new Error().stack;
            const caller = stack?.split('\n')[2]?.trim() || 'unknown';
            logger.warn(
                `⚠️  DEPRECATED: paginate() is deprecated and will be removed in v3.0.0. ` +
                `Use findWithPaginate() instead.\n` +
                `Called from: ${caller}`
            );
        }

        return this.findWithPaginate(filters, page, limit, query, model);
    }
}

export default BaseService;
