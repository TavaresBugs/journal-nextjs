/**
 * Prisma Account Repository
 *
 * Type-safe implementation of AccountRepository using Prisma ORM.
 * Handles trading accounts with balance management.
 * Extends BaseRepository for common logging and error handling.
 *
 * @example
 * import { prismaAccountRepo } from '@/lib/database/repositories';
 * const accounts = await prismaAccountRepo.getByUserId('user-uuid');
 */

import { prisma } from "@/lib/database";
import { accounts as PrismaAccount } from "@/generated/prisma";
import { Result } from "../types";
import { AppError } from "@/lib/errors";
import { BaseRepository } from "./BaseRepository";
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

class PrismaAccountRepository extends BaseRepository {
  protected readonly repositoryName = "PrismaAccountRepository";

  /**
   * Fetches all accounts for a user.
   */
  async getByUserId(userId: string): Promise<Result<Account[], AppError>> {
    return this.withQuery(
      "getByUserId",
      async () => {
        const accounts = await prisma.accounts.findMany({
          where: { user_id: userId },
          orderBy: { created_at: "desc" },
        });
        return accounts.map(mapAccountFromPrisma);
      },
      { userId }
    );
  }

  /**
   * Fetches a single account by ID with ownership verification.
   */
  async getById(accountId: string, userId: string): Promise<Result<Account, AppError>> {
    return this.withQuery(
      "getById",
      async () => {
        const account = await prisma.accounts.findFirst({
          where: { id: accountId, user_id: userId },
        });

        if (!account) {
          throw this.notFoundError("Account");
        }

        return mapAccountFromPrisma(account);
      },
      { accountId, userId }
    );
  }

  /**
   * Creates a new account.
   */
  async create(account: Partial<Account>): Promise<Result<Account, AppError>> {
    return this.withQuery(
      "create",
      async () => {
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
        return mapAccountFromPrisma(created);
      },
      { name: account.name }
    );
  }

  /**
   * Updates an account with ownership verification.
   */
  async update(
    accountId: string,
    userId: string,
    data: Partial<Account>
  ): Promise<Result<Account, AppError>> {
    return this.withQuery(
      "update",
      async () => {
        // Verify ownership
        const existing = await prisma.accounts.findUnique({
          where: { id: accountId },
          select: { user_id: true },
        });

        if (!existing || existing.user_id !== userId) {
          throw this.unauthorizedError();
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

        return mapAccountFromPrisma(updated);
      },
      { accountId, userId }
    );
  }

  /**
   * Deletes an account with ownership verification.
   */
  async delete(accountId: string, userId: string): Promise<Result<boolean, AppError>> {
    return this.withQuery(
      "delete",
      async () => {
        const deleted = await prisma.accounts.deleteMany({
          where: { id: accountId, user_id: userId },
        });

        if (deleted.count === 0) {
          throw this.notFoundError("Account");
        }

        return true;
      },
      { accountId, userId }
    );
  }

  /**
   * Updates account balance with ownership verification.
   */
  async updateBalance(
    accountId: string,
    userId: string,
    newBalance: number
  ): Promise<Result<Account, AppError>> {
    return this.withQuery(
      "updateBalance",
      async () => {
        const existing = await prisma.accounts.findFirst({
          where: { id: accountId, user_id: userId },
          select: { id: true },
        });

        if (!existing) {
          throw this.unauthorizedError();
        }

        const updated = await prisma.accounts.update({
          where: { id: accountId },
          data: {
            current_balance: newBalance,
            updated_at: new Date(),
          },
        });

        return mapAccountFromPrisma(updated);
      },
      { accountId, userId, newBalance }
    );
  }

  /**
   * Gets account count for a user.
   */
  async getCount(userId: string): Promise<Result<number, AppError>> {
    return this.withQuery(
      "getCount",
      async () => {
        return prisma.accounts.count({
          where: { user_id: userId },
        });
      },
      { userId }
    );
  }
}

// Export singleton instance
export const prismaAccountRepo = new PrismaAccountRepository();
export { PrismaAccountRepository };
