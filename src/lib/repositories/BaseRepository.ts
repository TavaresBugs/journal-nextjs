import { SupabaseClient } from '@supabase/supabase-js';
import { Result } from './types';
import { AppError, ErrorCode, toAppError } from '@/lib/errors';
import { Logger } from '@/lib/logging/Logger';

export abstract class BaseRepository<T> {
  protected supabase: SupabaseClient;
  protected tableName: string;
  protected logger: Logger;

  constructor(supabase: SupabaseClient, tableName: string) {
    this.supabase = supabase;
    this.tableName = tableName;
    this.logger = new Logger(`${tableName}Repository`);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected async query<R>(fn: () => PromiseLike<{ data: R | null; error: any }>): Promise<Result<R, AppError>> {
    try {
      const { data, error } = await fn();

      if (error) {
        this.logger.error('Query failed', { error });

        let errorCode = ErrorCode.DB_QUERY_FAILED;
        if (error.code === 'PGRST116') errorCode = ErrorCode.DB_NOT_FOUND;
        if (error.code === '23505') errorCode = ErrorCode.DB_CONSTRAINT_VIOLATION;

        return {
          data: null,
          error: new AppError(error.message || 'Database error', errorCode, 500, { originalError: error })
        };
      }

      // Supabase returns null data for some queries even on success (e.g. maybeSingle) if not found
      // We need to handle this based on the specific query expectation, but generally:
      if (data === null) {
          // If the query was meant to find something and didn't (and didn't error), it might be a not found case
          // But for now let's just return null data as success
      }

      return { data: data as R, error: null };

    } catch (err) {
      this.logger.error('Unexpected error in repository', { error: err });
      return {
        data: null,
        error: toAppError(err, 'Unexpected repository error')
      };
    }
  }

  // Basic CRUD

  async getById(id: string): Promise<Result<T, AppError>> {
    return this.query<T>(() =>
      this.supabase
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .single()
    );
  }

  async getByIds(ids: string[]): Promise<Result<T[], AppError>> {
    return this.query<T[]>(() =>
      this.supabase
        .from(this.tableName)
        .select('*')
        .in('id', ids)
    );
  }

  async create(data: Partial<T>): Promise<Result<T, AppError>> {
     return this.query<T>(() =>
      this.supabase
        .from(this.tableName)
        .insert(data)
        .select()
        .single()
    );
  }

  async update(id: string, data: Partial<T>): Promise<Result<T, AppError>> {
    return this.query<T>(() =>
      this.supabase
        .from(this.tableName)
        .update(data)
        .eq('id', id)
        .select()
        .single()
    );
  }

  async delete(id: string): Promise<Result<boolean, AppError>> {
     const res = await this.query<null>(() =>
      this.supabase
        .from(this.tableName)
        .delete()
        .eq('id', id)
    );

    if (res.error) return { data: null, error: res.error };
    return { data: true, error: null };
  }
}
