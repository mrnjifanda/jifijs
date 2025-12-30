import { Document, FilterQuery, UpdateQuery, QueryOptions, ClientSession } from 'mongoose';

/**
 * Standard service response structure
 */
export interface ServiceResponse<T = any> {
  error: boolean;
  message?: string;
  data?: T;
  name?: string;
  statusCode?: number;
}

/**
 * Success service response
 */
export interface ServiceSuccess<T = any> {
  error: false;
  data: T;
  message?: string;
}

/**
 * Error service response
 */
export interface ServiceError {
  error: true;
  message: string;
  name?: string;
  statusCode?: number;
  data?: any;
}

/**
 * Query options for database operations
 */
export interface QueryOptionsExtended extends QueryOptions {
  select?: string | string[];
  populate?: PopulateOption | PopulateOption[];
  sort?: string | { [key: string]: 1 | -1 | 'asc' | 'desc' };
  lean?: boolean;
  limit?: number;
  skip?: number;
}

/**
 * Population options
 */
export interface PopulateOption {
  path: string;
  select?: string;
  model?: string;
  match?: any;
  populate?: PopulateOption | PopulateOption[];
}

/**
 * Pagination options
 */
export interface PaginationOptions {
  page?: number;
  limit?: number;
  sort?: string | { [key: string]: 1 | -1 | 'asc' | 'desc' };
  select?: string | string[];
  populate?: PopulateOption | PopulateOption[];
  lean?: boolean;
}

/**
 * Pagination result
 */
export interface PaginationResult<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    nextPage: number | null;
    prevPage: number | null;
  };
}

/**
 * Bulk write operation
 */
export interface BulkWriteOperation<T> {
  insertOne?: { document: T };
  updateOne?: { filter: FilterQuery<T>; update: UpdateQuery<T>; upsert?: boolean };
  updateMany?: { filter: FilterQuery<T>; update: UpdateQuery<T>; upsert?: boolean };
  deleteOne?: { filter: FilterQuery<T> };
  deleteMany?: { filter: FilterQuery<T> };
  replaceOne?: { filter: FilterQuery<T>; replacement: T; upsert?: boolean };
}

/**
 * Base document interface with common fields
 */
export interface BaseDocument extends Document {
  created_at: Date;
  updated_at: Date | null;
  deleted_at: string | null;
}

/**
 * Transaction callback function
 */
export type TransactionCallback<T> = (session: ClientSession) => Promise<T>;

/**
 * Field selection type
 */
export type FieldSelection = string | string[] | Record<string, 0 | 1>;

/**
 * Sort order type
 */
export type SortOrder = string | { [key: string]: 1 | -1 | 'asc' | 'desc' };
