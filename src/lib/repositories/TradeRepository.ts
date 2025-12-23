import { SupabaseClient } from "@supabase/supabase-js";
import { BaseRepository } from "./BaseRepository";
import { Result, QueryOptions } from "@/lib/database/types";
import { TRADE_FRAGMENTS } from "@/lib/supabase/fragments";
import { DBTrade } from "@/types/database";
import { Trade } from "@/types";
import { mapTradeFromDB, mapTradeToDB } from "@/services/trades/mappers";
import { AppError, ErrorCode } from "@/lib/errors";

/**
 * Trade Repository with N:N junction table support.
 *
 * Uses `journal_entry_trades` junction table for relationships.
 * DEPRECATED: Do NOT use `journal_entries.trade_id` directly.
 *
 * @example
 * const repo = new TradeRepository(supabase);
 * const trades = await repo.getByJournalId('journal-uuid');
 */
export class TradeRepository extends BaseRepository<DBTrade> {
  private readonly SLOW_QUERY_THRESHOLD_MS = 1000;

  constructor(supabase: SupabaseClient) {
    super(supabase, "trades");
  }

  // ============================================
  // PRIVATE HELPERS
  // ============================================

  private mapResult(result: Result<DBTrade, AppError>): Result<Trade, AppError> {
    if (result.error) return { data: null, error: result.error };
    return { data: mapTradeFromDB(result.data!), error: null };
  }

  private mapListResult(result: Result<DBTrade[], AppError>): Result<Trade[], AppError> {
    if (result.error) return { data: null, error: result.error };
    return { data: result.data!.map(mapTradeFromDB), error: null };
  }

  private logSlowQuery(method: string, durationMs: number, metadata?: Record<string, unknown>) {
    if (durationMs > this.SLOW_QUERY_THRESHOLD_MS) {
      this.logger.warn(`Slow query detected in ${method}`, {
        durationMs,
        threshold: this.SLOW_QUERY_THRESHOLD_MS,
        ...metadata,
      });
    }
  }

  // ============================================
  // PUBLIC METHODS
  // ============================================

  /**
   * Fetches trades associated with a journal entry via N:N junction table.
   * Uses `journal_entry_trades` to find related trades.
   *
   * @param journalId - The journal entry ID to find trades for
   * @param options - Query options (detailed, limit, offset, orderBy, ascending)
   * @returns Promise with Result containing array of trades
   *
   * @example
   * // Get basic trade info for a journal
   * const result = await repo.getByJournalId('journal-uuid');
   *
   * // Get detailed trade info with pagination
   * const result = await repo.getByJournalId('journal-uuid', {
   *   detailed: true,
   *   limit: 10,
   *   offset: 0,
   *   orderBy: 'entry_date',
   *   ascending: false
   * });
   */
  async getByJournalId(
    journalId: string,
    options?: QueryOptions
  ): Promise<Result<Trade[], AppError>> {
    const startTime = performance.now();
    const fragment = options?.detailed ? TRADE_FRAGMENTS.detailed : TRADE_FRAGMENTS.basic;
    const orderBy = options?.orderBy || "created_at";
    const ascending = options?.ascending ?? false;

    this.logger.info("Fetching trades by journal ID via junction table", { journalId, options });

    try {
      // Query FROM trades with JOIN to junction table (better performance)
      let query = this.supabase
        .from("trades")
        .select(`${fragment}, journal_entry_trades!inner(journal_entry_id)`)
        .eq("journal_entry_trades.journal_entry_id", journalId)
        .order(orderBy, { ascending });

      // Apply pagination
      if (options?.limit) {
        query = query.limit(options.limit);
      }
      if (options?.offset && options?.limit) {
        query = query.range(options.offset, options.offset + options.limit - 1);
      }

      const { data, error } = await query;

      const durationMs = performance.now() - startTime;
      this.logSlowQuery("getByJournalId", durationMs, { journalId, resultCount: data?.length });

      if (error) {
        this.logger.error("Failed to fetch trades by journal ID", { error, journalId });
        return {
          data: null,
          error: new AppError(error.message, ErrorCode.DB_QUERY_FAILED, 500),
        };
      }

      // Map directly - data is already array of trades
      const trades = (data as unknown as DBTrade[])?.map(mapTradeFromDB) || [];

      this.logger.info("Trades fetched successfully", {
        journalId,
        count: trades.length,
        durationMs: Math.round(durationMs),
      });

      return { data: trades, error: null };
    } catch (err) {
      this.logger.error("Unexpected error in getByJournalId", { error: err, journalId });
      return {
        data: null,
        error: new AppError("Failed to fetch trades", ErrorCode.UNKNOWN_ERROR, 500),
      };
    }
  }

  /**
   * Fetches a single trade by ID with optional ownership verification.
   * If userId is provided, verifies the trade belongs to that user via journal ownership.
   *
   * @param tradeId - The trade ID to fetch
   * @param userId - Optional user ID for ownership check
   * @returns Promise with Result containing trade or null if not found/unauthorized
   *
   * @example
   * // Get trade without auth check (for internal use)
   * const result = await repo.getByIdDomain('trade-uuid');
   *
   * // Get trade with ownership verification
   * const result = await repo.getByIdDomain('trade-uuid', 'user-uuid');
   */
  async getByIdDomain(tradeId: string, userId?: string): Promise<Result<Trade, AppError>> {
    const startTime = performance.now();

    this.logger.info("Fetching trade by ID", { tradeId, withAuthCheck: !!userId });

    const result = await this.query<DBTrade>(() =>
      this.supabase.from(this.tableName).select(TRADE_FRAGMENTS.detailed).eq("id", tradeId).single()
    );

    const durationMs = performance.now() - startTime;
    this.logSlowQuery("getById", durationMs, { tradeId });

    if (result.error) return { data: null, error: result.error };
    if (!result.data) {
      return {
        data: null,
        error: new AppError("Trade not found", ErrorCode.DB_NOT_FOUND, 404),
      };
    }

    // Ownership check if userId provided
    if (userId && result.data.user_id !== userId) {
      this.logger.warn("Unauthorized trade access attempt", {
        tradeId,
        userId,
        ownerId: result.data.user_id,
      });
      return {
        data: null,
        error: new AppError("Unauthorized", ErrorCode.AUTH_FORBIDDEN, 403),
      };
    }

    return this.mapResult(result);
  }

  /**
   * Fetches a trade by ID with STRICT ownership verification.
   * Throws an error if trade not found or user is not authorized.
   *
   * @param tradeId - The trade ID to fetch
   * @param userId - User ID for mandatory ownership check
   * @returns Promise with Result containing trade (never null on success)
   * @throws AppError with code AUTH_FORBIDDEN if not authorized
   *
   * @example
   * try {
   *   const result = await repo.getByIdWithAuth('trade-uuid', 'user-uuid');
   *   if (result.data) {
   *     console.log('Trade:', result.data);
   *   }
   * } catch (error) {
   *   // Handle 403 Forbidden
   * }
   */
  async getByIdWithAuth(tradeId: string, userId: string): Promise<Result<Trade, AppError>> {
    this.logger.info("Fetching trade with strict auth", { tradeId, userId });

    const result = await this.getByIdDomain(tradeId, userId);

    if (result.error) {
      if (
        result.error.code === ErrorCode.DB_NOT_FOUND ||
        result.error.code === ErrorCode.AUTH_FORBIDDEN
      ) {
        this.logger.warn("Trade access denied", { tradeId, userId, errorCode: result.error.code });
        return {
          data: null,
          error: new AppError(
            "Trade not found or you do not have permission to access it",
            ErrorCode.AUTH_FORBIDDEN,
            403
          ),
        };
      }
      return result;
    }

    return result;
  }

  /**
   * Creates a new trade AND associates it with a journal entry via junction table.
   * Performs ownership verification on the journal before creating.
   *
   * IMPORTANT: Uses journal_entry_trades junction table for the relationship.
   * Does NOT use the deprecated journal_entries.trade_id column.
   *
   * @param trade - Trade data to create
   * @param journalId - Journal entry ID to associate the trade with
   * @param userId - User ID for ownership verification
   * @returns Promise with Result containing created trade
   *
   * @example
   * const result = await repo.createWithJournal(tradeData, 'journal-uuid', 'user-uuid');
   * if (result.data) {
   *   console.log('Created trade:', result.data.id);
   * }
   */
  async createWithJournal(
    trade: Trade,
    journalId: string,
    userId: string
  ): Promise<Result<Trade, AppError>> {
    const startTime = performance.now();

    this.logger.info("Creating trade with junction table association", { journalId, userId });

    try {
      // Step 1: Verify journal ownership
      const { data: journal, error: journalError } = await this.supabase
        .from("journal_entries")
        .select("id, user_id")
        .eq("id", journalId)
        .single();

      if (journalError || !journal) {
        this.logger.error("Journal not found for trade creation", { journalId });
        return {
          data: null,
          error: new AppError("Journal entry not found", ErrorCode.DB_NOT_FOUND, 404),
        };
      }

      if (journal.user_id !== userId) {
        this.logger.warn("Unauthorized attempt to add trade to journal", {
          journalId,
          userId,
          ownerId: journal.user_id,
        });
        return {
          data: null,
          error: new AppError(
            "Not authorized to add trades to this journal",
            ErrorCode.AUTH_FORBIDDEN,
            403
          ),
        };
      }

      // Step 2: Create the trade
      const dbTrade = mapTradeToDB(trade);
      const { data: createdTradeData, error: tradeError } = await this.supabase
        .from(this.tableName)
        .upsert(dbTrade)
        .select(TRADE_FRAGMENTS.detailed)
        .single();

      const createdTrade = createdTradeData as DBTrade | null;

      if (tradeError || !createdTrade) {
        this.logger.error("Failed to create trade", { error: tradeError });
        return {
          data: null,
          error: new AppError(
            tradeError?.message || "Failed to create trade",
            ErrorCode.DB_QUERY_FAILED,
            500
          ),
        };
      }

      // Step 3: Create junction table entry
      const { error: junctionError } = await this.supabase.from("journal_entry_trades").insert({
        journal_entry_id: journalId,
        trade_id: createdTrade.id,
      });

      if (junctionError) {
        // Rollback: Delete the trade we just created
        this.logger.error("Failed to create junction entry, rolling back trade", {
          error: junctionError,
        });
        await this.supabase.from(this.tableName).delete().eq("id", createdTrade.id);

        return {
          data: null,
          error: new AppError(
            "Failed to associate trade with journal",
            ErrorCode.DB_QUERY_FAILED,
            500
          ),
        };
      }

      const durationMs = performance.now() - startTime;
      this.logSlowQuery("create", durationMs, { journalId, tradeId: createdTrade.id });

      this.logger.info("Trade created and associated successfully", {
        tradeId: createdTrade.id,
        journalId,
        durationMs: Math.round(durationMs),
      });

      return { data: mapTradeFromDB(createdTrade as DBTrade), error: null };
    } catch (err) {
      this.logger.error("Unexpected error in create", { error: err, journalId });
      return {
        data: null,
        error: new AppError("Failed to create trade", ErrorCode.UNKNOWN_ERROR, 500),
      };
    }
  }

  /**
   * Fetches trades by account ID.
   *
   * @param accountId - The account ID to filter by
   * @param options - Query options
   * @returns Promise with Result containing array of trades
   */
  async getByAccountId(
    accountId: string,
    options?: QueryOptions
  ): Promise<Result<Trade[], AppError>> {
    const startTime = performance.now();
    const fragment = options?.detailed ? TRADE_FRAGMENTS.detailed : TRADE_FRAGMENTS.basic;

    this.logger.info("Fetching trades by account ID", { accountId, options });

    const result = await this.query<DBTrade[]>(
      () =>
        this.supabase
          .from(this.tableName)
          .select(fragment)
          .eq("account_id", accountId)
          .order("entry_date", { ascending: false })
          .order("entry_time", { ascending: false })
          .returns<DBTrade[]>() as unknown as Promise<{ data: DBTrade[] | null; error: unknown }>
    );

    const durationMs = performance.now() - startTime;
    this.logSlowQuery("getByAccountId", durationMs, {
      accountId,
      resultCount: result.data?.length,
    });

    return this.mapListResult(result);
  }

  /**
   * Deletes a trade with ownership verification.
   *
   * @param id - Trade ID to delete
   * @param userId - User ID for ownership check
   * @returns Promise with Result containing boolean success
   */
  async deleteDomain(id: string, userId: string): Promise<Result<boolean, AppError>> {
    this.logger.info("Deleting trade", { tradeId: id, userId });

    const res = await this.query<null>(() =>
      this.supabase.from(this.tableName).delete().eq("id", id).eq("user_id", userId)
    );

    if (res.error) return { data: null, error: res.error };

    this.logger.info("Trade deleted successfully", { tradeId: id });
    return { data: true, error: null };
  }

  /**
   * Creates or updates a trade (upsert) without journal association.
   * Use this for simple trade creation when journal association is handled separately.
   *
   * @param trade - Trade data to create/update
   * @returns Promise with Result containing the created trade
   */
  async createDomain(trade: Trade): Promise<Result<Trade, AppError>> {
    const startTime = performance.now();
    const dbTrade = mapTradeToDB(trade);

    this.logger.info("Creating/updating trade", { tradeId: trade.id });

    const { data, error } = await this.supabase
      .from(this.tableName)
      .upsert(dbTrade)
      .select(TRADE_FRAGMENTS.detailed)
      .single();

    const durationMs = performance.now() - startTime;
    this.logSlowQuery("createDomain", durationMs, { tradeId: trade.id });

    if (error) {
      this.logger.error("Failed to create trade", { error });
      return {
        data: null,
        error: new AppError(error.message, ErrorCode.DB_QUERY_FAILED, 500),
      };
    }

    const createdTrade = data as unknown as DBTrade;
    this.logger.info("Trade created successfully", {
      tradeId: createdTrade?.id,
      durationMs: Math.round(durationMs),
    });
    return { data: mapTradeFromDB(createdTrade), error: null };
  }
}
