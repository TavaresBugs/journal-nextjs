import { SupabaseClient } from "@supabase/supabase-js";
import { BaseRepository } from "./BaseRepository";
import { Result, QueryOptions } from "./types";
import { AppError, ErrorCode } from "@/lib/errors";
import type { Playbook, RuleGroup } from "@/types";

/**
 * DB types for Playbook (snake_case)
 */
interface DBPlaybook {
  id: string;
  user_id: string;
  account_id?: string;
  name: string;
  description?: string;
  icon: string;
  color: string;
  rule_groups: RuleGroup[];
  created_at: string;
  updated_at: string;
}

/**
 * PlaybookRepository - Repository for trading playbooks.
 *
 * Handles CRUD operations for playbooks with rule groups management.
 *
 * @example
 * const repo = new PlaybookRepository(supabase);
 * const playbooks = await repo.getByUserId('user-uuid');
 */
export class PlaybookRepository extends BaseRepository<DBPlaybook> {
  constructor(supabase: SupabaseClient) {
    super(supabase, "playbooks");
  }

  // ============================================
  // MAPPERS
  // ============================================

  /**
   * Maps a DB playbook to the app domain type.
   */
  private mapFromDB(db: DBPlaybook): Playbook {
    return {
      id: db.id,
      userId: db.user_id,
      accountId: db.account_id,
      name: db.name,
      description: db.description,
      icon: db.icon,
      color: db.color,
      ruleGroups: db.rule_groups || [],
      createdAt: db.created_at,
      updatedAt: db.updated_at,
    };
  }

  /**
   * Maps an app domain playbook to DB format.
   */
  private mapToDB(playbook: Playbook): DBPlaybook {
    return {
      id: playbook.id,
      user_id: playbook.userId,
      account_id: playbook.accountId,
      name: playbook.name,
      description: playbook.description,
      icon: playbook.icon,
      color: playbook.color,
      rule_groups: playbook.ruleGroups,
      created_at: playbook.createdAt || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  // ============================================
  // QUERY METHODS
  // ============================================

  /**
   * Fetches all playbooks for a user.
   *
   * @param userId - The user ID to filter by
   * @param options - Query options (limit, offset, orderBy)
   * @returns Promise with Result containing array of playbooks
   */
  async getByUserId(userId: string, options?: QueryOptions): Promise<Result<Playbook[], AppError>> {
    const result = await this.query<DBPlaybook[]>(() => {
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
   * Fetches playbooks by account ID (if account-specific).
   *
   * @param accountId - The account ID to filter by
   * @returns Promise with Result containing array of playbooks
   */
  async getByAccountId(accountId: string): Promise<Result<Playbook[], AppError>> {
    const result = await this.query<DBPlaybook[]>(() =>
      this.supabase
        .from(this.tableName)
        .select("*")
        .eq("account_id", accountId)
        .order("created_at", { ascending: false })
    );

    if (result.error) return { data: null, error: result.error };

    return {
      data: (result.data || []).map((db) => this.mapFromDB(db)),
      error: null,
    };
  }

  /**
   * Fetches a single playbook by ID.
   *
   * @param id - The playbook ID
   * @returns Promise with Result containing the playbook
   */
  async getByIdDomain(id: string): Promise<Result<Playbook, AppError>> {
    const result = await this.query<DBPlaybook>(() =>
      this.supabase.from(this.tableName).select("*").eq("id", id).single()
    );

    if (result.error) return { data: null, error: result.error };
    if (!result.data) {
      return {
        data: null,
        error: new AppError("Playbook not found", ErrorCode.DB_NOT_FOUND, 404),
      };
    }

    return { data: this.mapFromDB(result.data), error: null };
  }

  /**
   * Fetches a playbook by name for a specific user.
   *
   * @param userId - The user ID
   * @param name - The playbook name
   * @returns Promise with Result containing the playbook or null
   */
  async getByName(userId: string, name: string): Promise<Result<Playbook | null, AppError>> {
    const result = await this.query<DBPlaybook>(() =>
      this.supabase
        .from(this.tableName)
        .select("*")
        .eq("user_id", userId)
        .eq("name", name)
        .maybeSingle()
    );

    if (result.error) return { data: null, error: result.error };
    if (!result.data) return { data: null, error: null };

    return { data: this.mapFromDB(result.data), error: null };
  }

  // ============================================
  // MUTATION METHODS
  // ============================================

  /**
   * Creates or updates a playbook.
   *
   * @param playbook - The playbook data
   * @returns Promise with Result containing the saved playbook
   */
  async saveDomain(playbook: Playbook): Promise<Result<Playbook, AppError>> {
    const dbData = this.mapToDB(playbook);

    const result = await this.query<DBPlaybook>(() =>
      this.supabase.from(this.tableName).upsert(dbData, { onConflict: "id" }).select().single()
    );

    if (result.error) return { data: null, error: result.error };
    if (!result.data) {
      return {
        data: null,
        error: new AppError("Failed to save playbook", ErrorCode.DB_QUERY_FAILED, 500),
      };
    }

    return { data: this.mapFromDB(result.data), error: null };
  }

  /**
   * Creates a new playbook.
   *
   * @param playbook - The playbook data (without id)
   * @returns Promise with Result containing the created playbook
   */
  async createDomain(
    playbook: Omit<Playbook, "id" | "createdAt" | "updatedAt">
  ): Promise<Result<Playbook, AppError>> {
    const dbData = {
      user_id: playbook.userId,
      account_id: playbook.accountId,
      name: playbook.name,
      description: playbook.description,
      icon: playbook.icon,
      color: playbook.color,
      rule_groups: playbook.ruleGroups,
    };

    const result = await this.query<DBPlaybook>(() =>
      this.supabase.from(this.tableName).insert(dbData).select().single()
    );

    if (result.error) return { data: null, error: result.error };
    if (!result.data) {
      return {
        data: null,
        error: new AppError("Failed to create playbook", ErrorCode.DB_QUERY_FAILED, 500),
      };
    }

    return { data: this.mapFromDB(result.data), error: null };
  }

  /**
   * Deletes a playbook with ownership verification.
   *
   * @param id - The playbook ID to delete
   * @param userId - User ID for ownership verification
   * @returns Promise with Result containing boolean success
   */
  async deleteDomain(id: string, userId: string): Promise<Result<boolean, AppError>> {
    // First verify ownership
    const playbook = await this.query<DBPlaybook>(() =>
      this.supabase.from(this.tableName).select("id, user_id").eq("id", id).single()
    );

    if (playbook.error) return { data: null, error: playbook.error };
    if (!playbook.data) {
      return {
        data: null,
        error: new AppError("Playbook not found", ErrorCode.DB_NOT_FOUND, 404),
      };
    }
    if (playbook.data.user_id !== userId) {
      return {
        data: null,
        error: new AppError(
          "Not authorized to delete this playbook",
          ErrorCode.AUTH_FORBIDDEN,
          403
        ),
      };
    }

    // Delete the playbook
    const deleteResult = await this.delete(id);
    return deleteResult;
  }

  // ============================================
  // RULE GROUP METHODS
  // ============================================

  /**
   * Updates the rule groups for a playbook.
   *
   * @param id - The playbook ID
   * @param ruleGroups - The new rule groups
   * @returns Promise with Result containing the updated playbook
   */
  async updateRuleGroups(id: string, ruleGroups: RuleGroup[]): Promise<Result<Playbook, AppError>> {
    const result = await this.query<DBPlaybook>(() =>
      this.supabase
        .from(this.tableName)
        .update({ rule_groups: ruleGroups, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single()
    );

    if (result.error) return { data: null, error: result.error };
    if (!result.data) {
      return {
        data: null,
        error: new AppError("Failed to update rule groups", ErrorCode.DB_QUERY_FAILED, 500),
      };
    }

    return { data: this.mapFromDB(result.data), error: null };
  }

  /**
   * Adds a rule group to a playbook.
   *
   * @param id - The playbook ID
   * @param ruleGroup - The rule group to add
   * @returns Promise with Result containing the updated playbook
   */
  async addRuleGroup(id: string, ruleGroup: RuleGroup): Promise<Result<Playbook, AppError>> {
    // Get current playbook
    const current = await this.getByIdDomain(id);
    if (current.error) return current;
    if (!current.data) {
      return {
        data: null,
        error: new AppError("Playbook not found", ErrorCode.DB_NOT_FOUND, 404),
      };
    }

    // Add new rule group
    const updatedRuleGroups = [...current.data.ruleGroups, ruleGroup];
    return this.updateRuleGroups(id, updatedRuleGroups);
  }

  /**
   * Removes a rule group from a playbook.
   *
   * @param id - The playbook ID
   * @param ruleGroupId - The rule group ID to remove
   * @returns Promise with Result containing the updated playbook
   */
  async removeRuleGroup(id: string, ruleGroupId: string): Promise<Result<Playbook, AppError>> {
    // Get current playbook
    const current = await this.getByIdDomain(id);
    if (current.error) return current;
    if (!current.data) {
      return {
        data: null,
        error: new AppError("Playbook not found", ErrorCode.DB_NOT_FOUND, 404),
      };
    }

    // Remove rule group
    const updatedRuleGroups = current.data.ruleGroups.filter((rg) => rg.id !== ruleGroupId);
    return this.updateRuleGroups(id, updatedRuleGroups);
  }
}
