/**
 * Prisma Playbook Repository
 *
 * Type-safe implementation of PlaybookRepository using Prisma ORM.
 * Handles trading strategies/playbooks with rule groups.
 *
 * @example
 * import { prismaPlaybookRepo } from '@/lib/database/repositories';
 * const playbooks = await prismaPlaybookRepo.getByUserId('user-uuid');
 */

import { prisma } from "@/lib/database";
import { playbooks as PrismaPlaybook } from "@/generated/prisma";
import { Result } from "../types";
import { AppError, ErrorCode } from "@/lib/errors";
import { Logger } from "@/lib/logging/Logger";
import { Playbook, RuleGroup } from "@/types";

/**
 * Maps Prisma playbook to domain type
 */
function mapPlaybookFromPrisma(playbook: PrismaPlaybook): Playbook {
  return {
    id: playbook.id,
    userId: playbook.user_id,
    accountId: playbook.account_id || undefined,
    name: playbook.name,
    description: playbook.description || undefined,
    icon: playbook.icon || "📈",
    color: playbook.color || "#3B82F6",
    ruleGroups: (playbook.rule_groups as unknown as RuleGroup[]) || [],
    createdAt: playbook.created_at?.toISOString() || new Date().toISOString(),
    updatedAt: playbook.updated_at?.toISOString() || new Date().toISOString(),
  };
}

class PrismaPlaybookRepository {
  private logger = new Logger("PrismaPlaybookRepository");

  /**
   * Fetches all playbooks for a user.
   */
  async getByUserId(userId: string): Promise<Result<Playbook[], AppError>> {
    this.logger.info("Fetching playbooks by user", { userId });

    try {
      const playbooks = await prisma.playbooks.findMany({
        where: { user_id: userId },
        orderBy: { created_at: "desc" },
      });

      return { data: playbooks.map(mapPlaybookFromPrisma), error: null };
    } catch (error) {
      this.logger.error("Failed to fetch playbooks", { error, userId });
      return {
        data: null,
        error: new AppError("Failed to fetch playbooks", ErrorCode.DB_QUERY_FAILED, 500),
      };
    }
  }

  /**
   * Fetches playbooks for an account.
   */
  async getByAccountId(accountId: string): Promise<Result<Playbook[], AppError>> {
    this.logger.info("Fetching playbooks by account", { accountId });

    try {
      const playbooks = await prisma.playbooks.findMany({
        where: { account_id: accountId },
        orderBy: { name: "asc" },
      });

      return { data: playbooks.map(mapPlaybookFromPrisma), error: null };
    } catch (error) {
      this.logger.error("Failed to fetch playbooks", { error, accountId });
      return {
        data: null,
        error: new AppError("Failed to fetch playbooks", ErrorCode.DB_QUERY_FAILED, 500),
      };
    }
  }

  /**
   * Fetches a single playbook by ID.
   */
  async getById(id: string, userId?: string): Promise<Result<Playbook, AppError>> {
    this.logger.info("Fetching playbook by ID", { id, userId });

    try {
      const playbook = await prisma.playbooks.findUnique({
        where: { id },
      });

      if (!playbook) {
        return {
          data: null,
          error: new AppError("Playbook not found", ErrorCode.DB_NOT_FOUND, 404),
        };
      }

      if (userId && playbook.user_id !== userId) {
        return {
          data: null,
          error: new AppError("Unauthorized", ErrorCode.AUTH_FORBIDDEN, 403),
        };
      }

      return { data: mapPlaybookFromPrisma(playbook), error: null };
    } catch (error) {
      this.logger.error("Failed to fetch playbook", { error, id });
      return {
        data: null,
        error: new AppError("Failed to fetch playbook", ErrorCode.DB_QUERY_FAILED, 500),
      };
    }
  }

  /**
   * Creates a new playbook.
   */
  async create(playbook: Partial<Playbook>): Promise<Result<Playbook, AppError>> {
    this.logger.info("Creating playbook", { name: playbook.name });

    try {
      const created = await prisma.playbooks.create({
        data: {
          users: { connect: { id: playbook.userId } },
          accounts: playbook.accountId ? { connect: { id: playbook.accountId } } : undefined,
          name: playbook.name!,
          description: playbook.description,
          icon: playbook.icon || "📈",
          color: playbook.color || "#3B82F6",
          rule_groups: (playbook.ruleGroups || []) as unknown as object,
        },
      });

      return { data: mapPlaybookFromPrisma(created), error: null };
    } catch (error) {
      this.logger.error("Failed to create playbook", { error });
      return {
        data: null,
        error: new AppError("Failed to create playbook", ErrorCode.DB_QUERY_FAILED, 500),
      };
    }
  }

  /**
   * Updates a playbook with ownership verification.
   */
  async update(
    id: string,
    userId: string,
    data: Partial<Playbook>
  ): Promise<Result<Playbook, AppError>> {
    this.logger.info("Updating playbook", { id, userId });

    try {
      // Verify ownership
      const existing = await prisma.playbooks.findUnique({
        where: { id },
        select: { user_id: true },
      });

      if (!existing || existing.user_id !== userId) {
        return {
          data: null,
          error: new AppError("Playbook not found or unauthorized", ErrorCode.AUTH_FORBIDDEN, 403),
        };
      }

      const updated = await prisma.playbooks.update({
        where: { id },
        data: {
          name: data.name,
          description: data.description,
          icon: data.icon,
          color: data.color,
          rule_groups: data.ruleGroups as unknown as object | undefined,
          updated_at: new Date(),
        },
      });

      return { data: mapPlaybookFromPrisma(updated), error: null };
    } catch (error) {
      this.logger.error("Failed to update playbook", { error });
      return {
        data: null,
        error: new AppError("Failed to update playbook", ErrorCode.DB_QUERY_FAILED, 500),
      };
    }
  }

  /**
   * Deletes a playbook with ownership verification.
   */
  async delete(id: string, userId: string): Promise<Result<boolean, AppError>> {
    this.logger.info("Deleting playbook", { id, userId });

    try {
      const deleted = await prisma.playbooks.deleteMany({
        where: { id, user_id: userId },
      });

      if (deleted.count === 0) {
        return {
          data: null,
          error: new AppError("Playbook not found or unauthorized", ErrorCode.DB_NOT_FOUND, 404),
        };
      }

      return { data: true, error: null };
    } catch (error) {
      this.logger.error("Failed to delete playbook", { error });
      return {
        data: null,
        error: new AppError("Failed to delete playbook", ErrorCode.DB_QUERY_FAILED, 500),
      };
    }
  }

  /**
   * Gets playbook count for a user.
   */
  async getCount(userId: string): Promise<Result<number, AppError>> {
    try {
      const count = await prisma.playbooks.count({
        where: { user_id: userId },
      });

      return { data: count, error: null };
    } catch (error) {
      this.logger.error("Failed to count playbooks", { error });
      return {
        data: null,
        error: new AppError("Failed to count playbooks", ErrorCode.DB_QUERY_FAILED, 500),
      };
    }
  }
}

// Export singleton instance
export const prismaPlaybookRepo = new PrismaPlaybookRepository();
export { PrismaPlaybookRepository };
