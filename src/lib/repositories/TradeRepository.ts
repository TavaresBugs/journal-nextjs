import { SupabaseClient } from '@supabase/supabase-js';
import { BaseRepository } from './BaseRepository';
import { Result, QueryOptions } from './types';
import { TRADE_FRAGMENTS } from '@/lib/supabase/fragments';
import { DBTrade } from '@/types/database';
import { Trade } from '@/types';
import { mapTradeFromDB, mapTradeToDB } from '@/services/trades/mappers';
import { AppError, ErrorCode } from '@/lib/errors';

export class TradeRepository extends BaseRepository<DBTrade> {
  constructor(supabase: SupabaseClient) {
    super(supabase, 'trades');
  }

  // Helper to map result to Domain Type
  private mapResult(result: Result<DBTrade, AppError>): Result<Trade, AppError> {
    if (result.error) return { data: null, error: result.error };
    return { data: mapTradeFromDB(result.data!), error: null };
  }

  private mapListResult(result: Result<DBTrade[], AppError>): Result<Trade[], AppError> {
    if (result.error) return { data: null, error: result.error };
    return { data: result.data!.map(mapTradeFromDB), error: null };
  }

  async getByAccountId(accountId: string, options?: QueryOptions): Promise<Result<Trade[], AppError>> {
    const fragment = options?.detailed ? TRADE_FRAGMENTS.detailed : TRADE_FRAGMENTS.basic;

    return this.mapListResult(await this.query<DBTrade[]>(() =>
      this.supabase
        .from(this.tableName)
        .select(fragment)
        .eq('account_id', accountId)
        .order('entry_date', { ascending: false })
        .order('entry_time', { ascending: false })
        .returns<DBTrade[]>() as any
    ));
  }

  async getByJournalId(journalId: string, options?: QueryOptions): Promise<Result<Trade[], AppError>> {
      return this.query<Trade[]>(async () => {
          const fragment = options?.detailed ? TRADE_FRAGMENTS.detailed : TRADE_FRAGMENTS.basic;
          // Use junction table to find trades
          // Note: using explicit select string with nested relation syntax
          const { data, error } = await this.supabase
            .from('journal_entry_trades')
            .select(`
                trade:trades!inner(${fragment})
            `)
            .eq('journal_entry_id', journalId);

            if (error) {
                return { data: null, error };
            }

            // Map the nested structure back to flat array
            const trades = data?.map((row: any) => mapTradeFromDB(row.trade)) || [];
            return { data: trades, error: null };
      });
  }

  async getByIdDomain(id: string, userId?: string): Promise<Result<Trade, AppError>> {
      if (userId) {
          // Defense in depth: Verify ownership explicitly if userId is provided
          const result = await this.getById(id);
          if (result.error) return { data: null, error: result.error };
          if (!result.data) return { data: null, error: new AppError('Trade not found', ErrorCode.DB_NOT_FOUND, 404) };

          if (result.data.user_id !== userId) {
              this.logger.warn('Unauthorized trade access attempt', { tradeId: id, userId });
              return { data: null, error: new AppError('Unauthorized', ErrorCode.AUTH_FORBIDDEN, 403) };
          }
          return this.mapResult(result);
      }

      return this.mapResult(await this.getById(id));
  }

  async createDomain(trade: Trade): Promise<Result<Trade, AppError>> {
      const dbTrade = mapTradeToDB(trade);

      const res = await this.query<DBTrade>(() =>
        this.supabase.from(this.tableName).upsert(dbTrade).select().single()
      );

      return this.mapResult(res);
  }

  async deleteDomain(id: string, userId: string): Promise<Result<boolean, AppError>> {
      const res = await this.query<null>(() =>
          this.supabase.from(this.tableName).delete().eq('id', id).eq('user_id', userId)
      );
      if (res.error) return { data: null, error: res.error };
      return { data: true, error: null };
  }
}
