/**
 * Prisma Account Repository
 *
 * Type-safe implementation of AccountRepository using Prisma ORM.
 * Handles trading accounts with balance management.
 *
 * @example
 * import { prismaAccountRepo } from '@/lib/database/repositories';
 * const accounts = await prismaAccountRepo.getByUserId('user-uuid');
 */

import { prisma } from "@/lib/database";
import { accounts as PrismaAccount } from "@/generated/prisma";
import { Result } from "../types";
import { AppError, ErrorCode } from "@/lib/errors";
import { Logger } from "@/lib/logging/Logger";
import { Account } from "@/types";

/**
 * Maps Prisma account to domain type
 */
function mapAccountFromPrisma(account: PrismaAccount): Account {
  return {
    id: account.id,
    userId: account.user_id || "",
    name: account.name,
    currency: account.currency,
    initialBalance: Number(account.initial_balance),
    currentBalance: Number(account.current_balance),
    leverage: account.leverage,
    maxDrawdown: Number(account.max_drawdown),
    createdAt: account.created_at?.toISOString() || new Date().toISOString(),
    updatedAt: account.updated_at?.toISOString() || new Date().toISOString(),
  };
}

class PrismaAccountRepository {
  private logger = new Logger("PrismaAccountRepository");

  /**
   * Fetches all accounts for a user.
   */
  async getByUserId(userId: string): Promise<Result<Account[], AppError>> {
    this.logger.info("Fetching accounts by user", { userId });

    try {
      const accounts = await prisma.accounts.findMany({
        where: { user_id: userId },
        orderBy: { created_at: "desc" },
      });

      return { data: accounts.map(mapAccountFromPrisma), error: null };
    } catch (error) {
      this.logger.error("Failed to fetch accounts", { error, userId });
      return {
        data: null,
        error: new AppError("Failed to fetch accounts", ErrorCode.DB_QUERY_FAILED, 500),
      };
    }
  }

  /**
   * Fetches a single account by ID with ownership verification.
   */
  async getById(accountId: string, userId?: string): Promise<Result<Account, AppError>> {
    this.logger.info("Fetching account by ID", { accountId, userId });

    try {
      const account = await prisma.accounts.findUnique({
        where: { id: accountId },
      });

      if (!account) {
        return {
          data: null,
          error: new AppError("Account not found", ErrorCode.DB_NOT_FOUND, 404),
        };
      }

      if (userId && account.user_id !== userId) {
        return {
          data: null,
          error: new AppError("Unauthorized", ErrorCode.AUTH_FORBIDDEN, 403),
        };
      }

      return { data: mapAccountFromPrisma(account), error: null };
    } catch (error) {
      this.logger.error("Failed to fetch account", { error, accountId });
      return {
        data: null,
        error: new AppError("Failed to fetch account", ErrorCode.DB_QUERY_FAILED, 500),
      };
    }
  }

  /**
   * Creates a new account.
   */
  async create(account: Partial<Account>): Promise<Result<Account, AppError>> {
    this.logger.info("Creating account", { name: account.name });

    try {
      const created = await prisma.accounts.create({
        data: {
          users: account.userId ? { connect: { id: account.userId } } : undefined,
          name: account.name!,
          currency: account.currency || "USD",
          initial_balance: account.initialBalance || 0,
          current_balance: account.currentBalance || account.initialBalance || 0,
          leverage: account.leverage || "1:100",
          max_drawdown: account.maxDrawdown || 10,
        },
      });

      return { data: mapAccountFromPrisma(created), error: null };
    } catch (error) {
      this.logger.error("Failed to create account", { error });
      return {
        data: null,
        error: new AppError("Failed to create account", ErrorCode.DB_QUERY_FAILED, 500),
      };
    }
  }

  /**
   * Updates an account with ownership verification.
   */
  async update(
    accountId: string,
    userId: string,
    data: Partial<Account>
  ): Promise<Result<Account, AppError>> {
    this.logger.info("Updating account", { accountId, userId });

    try {
      // Verify ownership
      const existing = await prisma.accounts.findUnique({
        where: { id: accountId },
        select: { user_id: true },
      });

      if (!existing || existing.user_id !== userId) {
        return {
          data: null,
          error: new AppError("Account not found or unauthorized", ErrorCode.AUTH_FORBIDDEN, 403),
        };
      }

      const updated = await prisma.accounts.update({
        where: { id: accountId },
        data: {
          name: data.name,
          currency: data.currency,
          initial_balance: data.initialBalance,
          current_balance: data.currentBalance,
          leverage: data.leverage,
          max_drawdown: data.maxDrawdown,
          updated_at: new Date(),
        },
      });

      return { data: mapAccountFromPrisma(updated), error: null };
    } catch (error) {
      this.logger.error("Failed to update account", { error });
      return {
        data: null,
        error: new AppError("Failed to update account", ErrorCode.DB_QUERY_FAILED, 500),
      };
    }
  }

  /**
   * Deletes an account with ownership verification.
   */
  async delete(accountId: string, userId: string): Promise<Result<boolean, AppError>> {
    this.logger.info("Deleting account", { accountId, userId });

    try {
      const deleted = await prisma.accounts.deleteMany({
        where: { id: accountId, user_id: userId },
      });

      if (deleted.count === 0) {
        return {
          data: null,
          error: new AppError("Account not found or unauthorized", ErrorCode.DB_NOT_FOUND, 404),
        };
      }

      return { data: true, error: null };
    } catch (error) {
      this.logger.error("Failed to delete account", { error });
      return {
        data: null,
        error: new AppError("Failed to delete account", ErrorCode.DB_QUERY_FAILED, 500),
      };
    }
  }

  /**
   * Updates account balance.
   */
  async updateBalance(accountId: string, newBalance: number): Promise<Result<Account, AppError>> {
    this.logger.info("Updating account balance", { accountId, newBalance });

    try {
      const updated = await prisma.accounts.update({
        where: { id: accountId },
        data: {
          current_balance: newBalance,
          updated_at: new Date(),
        },
      });

      return { data: mapAccountFromPrisma(updated), error: null };
    } catch (error) {
      this.logger.error("Failed to update balance", { error });
      return {
        data: null,
        error: new AppError("Failed to update balance", ErrorCode.DB_QUERY_FAILED, 500),
      };
    }
  }

  /**
   * Gets account count for a user.
   */
  async getCount(userId: string): Promise<Result<number, AppError>> {
    try {
      const count = await prisma.accounts.count({
        where: { user_id: userId },
      });

      return { data: count, error: null };
    } catch (error) {
      this.logger.error("Failed to count accounts", { error });
      return {
        data: null,
        error: new AppError("Failed to count accounts", ErrorCode.DB_QUERY_FAILED, 500),
      };
    }
  }
}

// Export singleton instance
export const prismaAccountRepo = new PrismaAccountRepository();
export { PrismaAccountRepository };
