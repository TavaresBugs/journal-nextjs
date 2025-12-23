/**
 * Prisma Routine Repository
 *
 * Type-safe implementation of RoutineRepository using Prisma ORM.
 * Handles daily routine entries.
 *
 * @example
 * import { prismaRoutineRepo } from '@/lib/database/repositories';
 * const routines = await prismaRoutineRepo.getByAccountId('account-uuid');
 */

import { prisma } from "@/lib/database";
import { daily_routines as PrismaDailyRoutine } from "@/generated/prisma";
import { Result } from "../types";
import { AppError, ErrorCode } from "@/lib/errors";
import { Logger } from "@/lib/logging/Logger";
import { DailyRoutine } from "@/types";

/**
 * Maps Prisma daily routine to domain type
 */
function mapRoutineFromPrisma(routine: PrismaDailyRoutine): DailyRoutine {
  return {
    id: routine.id,
    userId: routine.user_id || "",
    accountId: routine.account_id,
    date:
      routine.date instanceof Date
        ? routine.date.toISOString().split("T")[0]
        : String(routine.date),
    aerobic: routine.aerobic || false,
    diet: routine.diet || false,
    reading: routine.reading || false,
    meditation: routine.meditation || false,
    preMarket: routine.pre_market || false,
    prayer: routine.prayer || false,
    createdAt: routine.created_at?.toISOString() || new Date().toISOString(),
    updatedAt: routine.updated_at?.toISOString() || new Date().toISOString(),
  };
}

class PrismaRoutineRepository {
  private logger = new Logger("PrismaRoutineRepository");

  /**
   * Fetches all daily routines for an account.
   */
  async getByAccountId(accountId: string): Promise<Result<DailyRoutine[], AppError>> {
    this.logger.info("Fetching daily routines by account", { accountId });

    try {
      const routines = await prisma.daily_routines.findMany({
        where: { account_id: accountId },
        orderBy: { date: "desc" },
      });

      return {
        data: routines.map(mapRoutineFromPrisma),
        error: null,
      };
    } catch (error) {
      this.logger.error("Failed to fetch daily routines", { error, accountId });
      return {
        data: null,
        error: new AppError("Failed to fetch daily routines", ErrorCode.DB_QUERY_FAILED, 500),
      };
    }
  }

  /**
   * Fetches a single daily routine by account and date.
   */
  async getByDate(accountId: string, date: string): Promise<Result<DailyRoutine | null, AppError>> {
    this.logger.info("Fetching daily routine by date", { accountId, date });

    try {
      const routine = await prisma.daily_routines.findUnique({
        where: {
          account_id_date: {
            account_id: accountId,
            date: new Date(date),
          },
        },
      });

      return {
        data: routine ? mapRoutineFromPrisma(routine) : null,
        error: null,
      };
    } catch (error) {
      this.logger.error("Failed to fetch daily routine", { error, accountId, date });
      return {
        data: null,
        error: new AppError("Failed to fetch daily routine", ErrorCode.DB_QUERY_FAILED, 500),
      };
    }
  }

  /**
   * Creates or updates a daily routine.
   */
  async save(routine: Partial<DailyRoutine>): Promise<Result<DailyRoutine, AppError>> {
    this.logger.info("Saving daily routine", { id: routine.id, date: routine.date });

    try {
      if (!routine.accountId || !routine.date) {
        return {
          data: null,
          error: new AppError("Account ID and Date are required", ErrorCode.VALIDATION_ERROR, 400),
        };
      }

      const saved = await prisma.daily_routines.upsert({
        where: {
          account_id_date: {
            account_id: routine.accountId,
            date: new Date(routine.date),
          },
        },
        create: {
          accounts: { connect: { id: routine.accountId } },
          users: routine.userId ? { connect: { id: routine.userId } } : undefined,
          date: new Date(routine.date),
          aerobic: routine.aerobic,
          diet: routine.diet,
          reading: routine.reading,
          meditation: routine.meditation,
          pre_market: routine.preMarket,
          prayer: routine.prayer,
        },
        update: {
          aerobic: routine.aerobic,
          diet: routine.diet,
          reading: routine.reading,
          meditation: routine.meditation,
          pre_market: routine.preMarket,
          prayer: routine.prayer,
          updated_at: new Date(),
        },
      });

      return { data: mapRoutineFromPrisma(saved), error: null };
    } catch (error) {
      this.logger.error("Failed to save daily routine", { error });
      return {
        data: null,
        error: new AppError("Failed to save daily routine", ErrorCode.DB_QUERY_FAILED, 500),
      };
    }
  }

  /**
   * Deletes a daily routine.
   */
  async delete(id: string, userId: string): Promise<Result<boolean, AppError>> {
    this.logger.info("Deleting daily routine", { id, userId });

    try {
      const deleted = await prisma.daily_routines.deleteMany({
        where: { id, user_id: userId },
      });

      if (deleted.count === 0) {
        return {
          data: null,
          error: new AppError("Routine not found or unauthorized", ErrorCode.DB_NOT_FOUND, 404),
        };
      }

      return { data: true, error: null };
    } catch (error) {
      this.logger.error("Failed to delete daily routine", { error });
      return {
        data: null,
        error: new AppError("Failed to delete daily routine", ErrorCode.DB_QUERY_FAILED, 500),
      };
    }
  }
}

// Export singleton instance
export const prismaRoutineRepo = new PrismaRoutineRepository();
export { PrismaRoutineRepository };
