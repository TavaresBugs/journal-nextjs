import { SupabaseClient } from "@supabase/supabase-js";
import { BaseRepository } from "./BaseRepository";
import { Result, QueryOptions } from "@/lib/database/types";
import { AppError, ErrorCode } from "@/lib/errors";
import type { DBAccount } from "@/types/database";
import type { Account } from "@/types";

/**
 * AccountRepository - Repository for trading accounts.
 *
 * Handles CRUD operations for user accounts with balance management.
 *
 * @example
 * const repo = new AccountRepository(supabase);
 * const accounts = await repo.getByUserId('user-uuid');
 */
export class AccountRepository extends BaseRepository<DBAccount> {
  constructor(supabase: SupabaseClient) {
    super(supabase, "accounts");
  }

  // ============================================
  // MAPPERS
  // ============================================

  /**
   * Maps a DB account to the app domain type.
   */
  private mapFromDB(db: DBAccount): Account {
    return {
      id: db.id,
      userId: db.user_id,
      name: db.name,
      currency: db.currency,
      initialBalance: Number(db.initial_balance),
      currentBalance: Number(db.current_balance),
      leverage: db.leverage,
      maxDrawdown: Number(db.max_drawdown),
      createdAt: db.created_at,
      updatedAt: db.updated_at,
    };
  }

  /**
   * Maps an app domain account to DB format.
   */
  private mapToDB(account: Account): DBAccount {
    return {
      id: account.id,
      user_id: account.userId,
      name: account.name,
      currency: account.currency,
      initial_balance: account.initialBalance,
      current_balance: account.currentBalance,
      leverage: account.leverage,
      max_drawdown: account.maxDrawdown,
      created_at: account.createdAt || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  // ============================================
  // QUERY METHODS
  // ============================================

  /**
   * Fetches all accounts for a user.
   *
   * @param userId - The user ID to filter by
   * @param options - Query options (limit, offset, orderBy)
   * @returns Promise with Result containing array of accounts
   */
  async getByUserId(userId: string, options?: QueryOptions): Promise<Result<Account[], AppError>> {
    const result = await this.query<DBAccount[]>(() => {
      let query = this.supabase
        .from(this.tableName)
        .select("*")
        .eq("user_id", userId)
        .order(options?.orderBy || "created_at", {
          ascending: options?.ascending ?? false,
        });

      if (options?.limit) query = query.limit(options.limit);

      return query;
    });

    if (result.error) return { data: null, error: result.error };

    return {
      data: (result.data || []).map((db) => this.mapFromDB(db)),
      error: null,
    };
  }

  /**
   * Fetches a single account by ID.
   *
   * @param id - The account ID
   * @returns Promise with Result containing the account
   */
  async getByIdDomain(id: string): Promise<Result<Account, AppError>> {
    const result = await this.query<DBAccount>(() =>
      this.supabase.from(this.tableName).select("*").eq("id", id).single()
    );

    if (result.error) return { data: null, error: result.error };
    if (!result.data) {
      return {
        data: null,
        error: new AppError("Account not found", ErrorCode.DB_NOT_FOUND, 404),
      };
    }

    return { data: this.mapFromDB(result.data), error: null };
  }

  /**
   * Fetches an account by ID with ownership verification.
   *
   * @param id - The account ID
   * @param userId - The user ID for ownership check
   * @returns Promise with Result containing the account
   */
  async getByIdWithAuth(id: string, userId: string): Promise<Result<Account, AppError>> {
    const result = await this.query<DBAccount>(() =>
      this.supabase.from(this.tableName).select("*").eq("id", id).eq("user_id", userId).single()
    );

    if (result.error) return { data: null, error: result.error };
    if (!result.data) {
      return {
        data: null,
        error: new AppError("Account not found or not authorized", ErrorCode.AUTH_FORBIDDEN, 403),
      };
    }

    return { data: this.mapFromDB(result.data), error: null };
  }

  // ============================================
  // MUTATION METHODS
  // ============================================

  /**
   * Creates or updates an account.
   *
   * @param account - The account data
   * @returns Promise with Result containing the saved account
   */
  async saveDomain(account: Account): Promise<Result<Account, AppError>> {
    const dbData = this.mapToDB(account);

    const result = await this.query<DBAccount>(() =>
      this.supabase.from(this.tableName).upsert(dbData, { onConflict: "id" }).select().single()
    );

    if (result.error) return { data: null, error: result.error };
    if (!result.data) {
      return {
        data: null,
        error: new AppError("Failed to save account", ErrorCode.DB_QUERY_FAILED, 500),
      };
    }

    return { data: this.mapFromDB(result.data), error: null };
  }

  /**
   * Creates a new account.
   *
   * @param account - The account data (without id)
   * @returns Promise with Result containing the created account
   */
  async createDomain(
    account: Omit<Account, "id" | "createdAt" | "updatedAt">
  ): Promise<Result<Account, AppError>> {
    const dbData = {
      user_id: account.userId,
      name: account.name,
      currency: account.currency,
      initial_balance: account.initialBalance,
      current_balance: account.currentBalance,
      leverage: account.leverage,
      max_drawdown: account.maxDrawdown,
    };

    const result = await this.query<DBAccount>(() =>
      this.supabase.from(this.tableName).insert(dbData).select().single()
    );

    if (result.error) return { data: null, error: result.error };
    if (!result.data) {
      return {
        data: null,
        error: new AppError("Failed to create account", ErrorCode.DB_QUERY_FAILED, 500),
      };
    }

    return { data: this.mapFromDB(result.data), error: null };
  }

  /**
   * Deletes an account with ownership verification.
   *
   * @param id - The account ID to delete
   * @param userId - User ID for ownership verification
   * @returns Promise with Result containing boolean success
   */
  async deleteDomain(id: string, userId: string): Promise<Result<boolean, AppError>> {
    // First verify ownership
    const account = await this.query<DBAccount>(() =>
      this.supabase.from(this.tableName).select("id, user_id").eq("id", id).single()
    );

    if (account.error) return { data: null, error: account.error };
    if (!account.data) {
      return {
        data: null,
        error: new AppError("Account not found", ErrorCode.DB_NOT_FOUND, 404),
      };
    }
    if (account.data.user_id !== userId) {
      return {
        data: null,
        error: new AppError("Not authorized to delete this account", ErrorCode.AUTH_FORBIDDEN, 403),
      };
    }

    // Delete the account (cascade will handle related records)
    const deleteResult = await this.delete(id);
    return deleteResult;
  }

  // ============================================
  // BALANCE METHODS
  // ============================================

  /**
   * Updates the current balance for an account.
   *
   * @param id - The account ID
   * @param newBalance - The new balance value
   * @returns Promise with Result containing the updated account
   */
  async updateBalance(id: string, newBalance: number): Promise<Result<Account, AppError>> {
    const result = await this.query<DBAccount>(() =>
      this.supabase
        .from(this.tableName)
        .update({ current_balance: newBalance, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single()
    );

    if (result.error) return { data: null, error: result.error };
    if (!result.data) {
      return {
        data: null,
        error: new AppError("Failed to update balance", ErrorCode.DB_QUERY_FAILED, 500),
      };
    }

    return { data: this.mapFromDB(result.data), error: null };
  }

  /**
   * Adjusts the current balance by a delta amount.
   *
   * @param id - The account ID
   * @param delta - The amount to add (positive) or subtract (negative)
   * @returns Promise with Result containing the updated account
   */
  async adjustBalance(id: string, delta: number): Promise<Result<Account, AppError>> {
    // Get current balance
    const current = await this.getByIdDomain(id);
    if (current.error) return current;
    if (!current.data) {
      return {
        data: null,
        error: new AppError("Account not found", ErrorCode.DB_NOT_FOUND, 404),
      };
    }

    const newBalance = current.data.currentBalance + delta;
    return this.updateBalance(id, newBalance);
  }

  /**
   * Updates max drawdown for an account.
   *
   * @param id - The account ID
   * @param maxDrawdown - The new max drawdown value
   * @returns Promise with Result containing the updated account
   */
  async updateMaxDrawdown(id: string, maxDrawdown: number): Promise<Result<Account, AppError>> {
    const result = await this.query<DBAccount>(() =>
      this.supabase
        .from(this.tableName)
        .update({ max_drawdown: maxDrawdown, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single()
    );

    if (result.error) return { data: null, error: result.error };
    if (!result.data) {
      return {
        data: null,
        error: new AppError("Failed to update max drawdown", ErrorCode.DB_QUERY_FAILED, 500),
      };
    }

    return { data: this.mapFromDB(result.data), error: null };
  }
}
