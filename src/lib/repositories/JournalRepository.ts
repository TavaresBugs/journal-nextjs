import { SupabaseClient } from "@supabase/supabase-js";
import { BaseRepository } from "./BaseRepository";
import { Result, QueryOptions } from "./types";
import { AppError, ErrorCode } from "@/lib/errors";
import type { DBJournalEntry, DBJournalImage } from "@/types/database";
import type { JournalEntry } from "@/types";

/**
 * JournalRepository - Repository for journal entries.
 *
 * Handles CRUD operations for journal entries with image management.
 * Uses the N:N `journal_entry_trades` junction table for trade relationships.
 *
 * @example
 * const repo = new JournalRepository(supabase);
 * const entries = await repo.getByAccountId('account-uuid');
 */
export class JournalRepository extends BaseRepository<DBJournalEntry> {
  constructor(supabase: SupabaseClient) {
    super(supabase, "journal_entries");
  }

  // ============================================
  // MAPPERS
  // ============================================

  /**
   * Maps a DB journal entry to the app domain type.
   */
  private mapFromDB(db: DBJournalEntry): JournalEntry {
    return {
      id: db.id,
      userId: db.user_id,
      accountId: db.account_id,
      date: db.date,
      title: db.title || "",
      asset: db.asset,
      emotion: db.emotion,
      analysis: db.analysis,
      notes: db.notes,
      images:
        db.journal_images?.map((img) => ({
          id: img.id,
          userId: img.user_id,
          journalEntryId: img.journal_entry_id,
          url: img.url,
          path: img.path,
          timeframe: img.timeframe,
          displayOrder: img.display_order,
          createdAt: img.created_at,
        })) || [],
      tradeIds: db.journal_entry_trades?.map((jt) => jt.trade_id).filter(Boolean) || [],
      createdAt: db.created_at,
      updatedAt: db.updated_at,
    };
  }

  /**
   * Maps an app domain journal entry to DB format.
   */
  private mapToDB(
    entry: JournalEntry
  ): Omit<DBJournalEntry, "journal_images" | "journal_entry_trades"> {
    return {
      id: entry.id,
      user_id: entry.userId,
      account_id: entry.accountId,
      date: entry.date,
      title: entry.title,
      asset: entry.asset,
      emotion: entry.emotion,
      analysis: entry.analysis,
      notes: entry.notes,
      created_at: entry.createdAt || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  // ============================================
  // QUERY METHODS
  // ============================================

  /**
   * Fetches all journal entries for an account.
   *
   * @param accountId - The account ID to filter by
   * @param options - Query options (limit, offset, orderBy)
   * @returns Promise with Result containing array of journal entries
   */
  async getByAccountId(
    accountId: string,
    options?: QueryOptions
  ): Promise<Result<JournalEntry[], AppError>> {
    const result = await this.query<DBJournalEntry[]>(() => {
      let query = this.supabase
        .from(this.tableName)
        .select(
          `
          *,
          journal_images(*),
          journal_entry_trades(trade_id)
        `
        )
        .eq("account_id", accountId)
        .order(options?.orderBy || "date", {
          ascending: options?.ascending ?? false,
        });

      if (options?.limit) query = query.limit(options.limit);
      if (options?.offset)
        query = query.range(options.offset, options.offset + (options.limit || 50) - 1);

      return query;
    });

    if (result.error) return { data: null, error: result.error };

    return {
      data: (result.data || []).map((db) => this.mapFromDB(db)),
      error: null,
    };
  }

  /**
   * Fetches a single journal entry by ID with images and trades.
   *
   * @param id - The journal entry ID
   * @returns Promise with Result containing the journal entry
   */
  async getByIdDomain(id: string): Promise<Result<JournalEntry, AppError>> {
    const result = await this.query<DBJournalEntry>(() =>
      this.supabase
        .from(this.tableName)
        .select(
          `
          *,
          journal_images(*),
          journal_entry_trades(trade_id)
        `
        )
        .eq("id", id)
        .single()
    );

    if (result.error) return { data: null, error: result.error };
    if (!result.data) {
      return {
        data: null,
        error: new AppError("Journal entry not found", ErrorCode.DB_NOT_FOUND, 404),
      };
    }

    return { data: this.mapFromDB(result.data), error: null };
  }

  /**
   * Fetches journal entries by date range.
   *
   * @param accountId - The account ID
   * @param startDate - Start date (YYYY-MM-DD)
   * @param endDate - End date (YYYY-MM-DD)
   * @returns Promise with Result containing array of journal entries
   */
  async getByDateRange(
    accountId: string,
    startDate: string,
    endDate: string
  ): Promise<Result<JournalEntry[], AppError>> {
    const result = await this.query<DBJournalEntry[]>(() =>
      this.supabase
        .from(this.tableName)
        .select(
          `
          *,
          journal_images(*),
          journal_entry_trades(trade_id)
        `
        )
        .eq("account_id", accountId)
        .gte("date", startDate)
        .lte("date", endDate)
        .order("date", { ascending: false })
    );

    if (result.error) return { data: null, error: result.error };

    return {
      data: (result.data || []).map((db) => this.mapFromDB(db)),
      error: null,
    };
  }

  /**
   * Searches journal entries by text content.
   *
   * @param accountId - The account ID
   * @param searchQuery - Text to search in title, notes, and analysis
   * @returns Promise with Result containing matching entries
   */
  async search(accountId: string, searchQuery: string): Promise<Result<JournalEntry[], AppError>> {
    const result = await this.query<DBJournalEntry[]>(() =>
      this.supabase
        .from(this.tableName)
        .select(
          `
          *,
          journal_images(*),
          journal_entry_trades(trade_id)
        `
        )
        .eq("account_id", accountId)
        .or(
          `title.ilike.%${searchQuery}%,notes.ilike.%${searchQuery}%,analysis.ilike.%${searchQuery}%`
        )
        .order("date", { ascending: false })
        .limit(50)
    );

    if (result.error) return { data: null, error: result.error };

    return {
      data: (result.data || []).map((db) => this.mapFromDB(db)),
      error: null,
    };
  }

  // ============================================
  // MUTATION METHODS
  // ============================================

  /**
   * Creates or updates a journal entry.
   *
   * @param entry - The journal entry data
   * @returns Promise with Result containing the saved entry
   */
  async saveDomain(entry: JournalEntry): Promise<Result<JournalEntry, AppError>> {
    const dbData = this.mapToDB(entry);

    const result = await this.query<DBJournalEntry>(() =>
      this.supabase
        .from(this.tableName)
        .upsert(dbData, { onConflict: "id" })
        .select(
          `
          *,
          journal_images(*),
          journal_entry_trades(trade_id)
        `
        )
        .single()
    );

    if (result.error) return { data: null, error: result.error };
    if (!result.data) {
      return {
        data: null,
        error: new AppError("Failed to save journal entry", ErrorCode.DB_QUERY_FAILED, 500),
      };
    }

    return { data: this.mapFromDB(result.data), error: null };
  }

  /**
   * Deletes a journal entry and its associated images.
   *
   * @param id - The journal entry ID to delete
   * @param userId - User ID for ownership verification
   * @returns Promise with Result containing boolean success
   */
  async deleteDomain(id: string, userId: string): Promise<Result<boolean, AppError>> {
    // First verify ownership
    const entry = await this.query<DBJournalEntry>(() =>
      this.supabase.from(this.tableName).select("id, user_id").eq("id", id).single()
    );

    if (entry.error) return { data: null, error: entry.error };
    if (!entry.data) {
      return {
        data: null,
        error: new AppError("Journal entry not found", ErrorCode.DB_NOT_FOUND, 404),
      };
    }
    if (entry.data.user_id !== userId) {
      return {
        data: null,
        error: new AppError("Not authorized to delete this entry", ErrorCode.AUTH_FORBIDDEN, 403),
      };
    }

    // Delete associated images from storage (would need storage access)
    // For now, cascade delete handles the DB records

    // Delete the entry (cascade will handle images and junction table)
    const deleteResult = await this.delete(id);
    return deleteResult;
  }

  // ============================================
  // IMAGE METHODS
  // ============================================

  /**
   * Adds an image to a journal entry.
   *
   * @param journalId - The journal entry ID
   * @param image - Image data
   * @returns Promise with Result containing the created image record
   */
  async addImage(
    journalId: string,
    image: Omit<DBJournalImage, "id" | "created_at">
  ): Promise<Result<DBJournalImage, AppError>> {
    return this.query<DBJournalImage>(() =>
      this.supabase.from("journal_images").insert(image).select().single()
    );
  }

  /**
   * Removes an image from a journal entry.
   *
   * @param imageId - The image ID to delete
   * @returns Promise with Result containing boolean success
   */
  async removeImage(imageId: string): Promise<Result<boolean, AppError>> {
    const result = await this.query<null>(() =>
      this.supabase.from("journal_images").delete().eq("id", imageId)
    );

    if (result.error) return { data: null, error: result.error };
    return { data: true, error: null };
  }

  // ============================================
  // TRADE ASSOCIATION METHODS
  // ============================================

  /**
   * Associates a trade with a journal entry.
   *
   * @param journalId - The journal entry ID
   * @param tradeId - The trade ID to associate
   * @returns Promise with Result containing boolean success
   */
  async linkTrade(journalId: string, tradeId: string): Promise<Result<boolean, AppError>> {
    const result = await this.query<null>(() =>
      this.supabase
        .from("journal_entry_trades")
        .insert({ journal_entry_id: journalId, trade_id: tradeId })
    );

    if (result.error) return { data: null, error: result.error };
    return { data: true, error: null };
  }

  /**
   * Removes a trade association from a journal entry.
   *
   * @param journalId - The journal entry ID
   * @param tradeId - The trade ID to unlink
   * @returns Promise with Result containing boolean success
   */
  async unlinkTrade(journalId: string, tradeId: string): Promise<Result<boolean, AppError>> {
    const result = await this.query<null>(() =>
      this.supabase
        .from("journal_entry_trades")
        .delete()
        .eq("journal_entry_id", journalId)
        .eq("trade_id", tradeId)
    );

    if (result.error) return { data: null, error: result.error };
    return { data: true, error: null };
  }
}
