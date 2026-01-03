/**
 * Prisma Routine Repository
 *
 * Type-safe implementation of RoutineRepository using Prisma ORM.
 * Handles daily routine entries.
 * Extends BaseRepository for common logging and error handling.
 */

import { prisma } from "@/lib/database";
import { daily_routines as PrismaDailyRoutine } from "@/generated/prisma";
import { Result } from "../types";
import { AppError, ErrorCode } from "@/lib/errors";
import { BaseRepository } from "./BaseRepository";
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

class PrismaRoutineRepository extends BaseRepository {
  protected readonly repositoryName = "PrismaRoutineRepository";

  /**
   * Fetches all daily routines for an account.
   */
  async getByAccountId(accountId: string): Promise<Result<DailyRoutine[], AppError>> {
    return this.withQuery(
      "getByAccountId",
      async () => {
        const routines = await prisma.daily_routines.findMany({
          where: { account_id: accountId },
          orderBy: { date: "desc" },
        });
        return routines.map(mapRoutineFromPrisma);
      },
      { accountId }
    );
  }

  /**
   * Fetches a single daily routine by account and date.
   */
  async getByDate(accountId: string, date: string): Promise<Result<DailyRoutine | null, AppError>> {
    return this.withQuery(
      "getByDate",
      async () => {
        const routine = await prisma.daily_routines.findUnique({
          where: {
            account_id_date: {
              account_id: accountId,
              date: new Date(date),
            },
          },
        });
        return routine ? mapRoutineFromPrisma(routine) : null;
      },
      { accountId, date }
    );
  }

  /**
   * Creates or updates a daily routine.
   */
  async save(routine: Partial<DailyRoutine>): Promise<Result<DailyRoutine, AppError>> {
    return this.withQuery(
      "save",
      async () => {
        if (!routine.accountId || !routine.date) {
          throw new AppError("Account ID and Date are required", ErrorCode.VALIDATION_ERROR, 400);
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

        return mapRoutineFromPrisma(saved);
      },
      { id: routine.id, date: routine.date }
    );
  }

  /**
   * Deletes a daily routine.
   */
  async delete(id: string, userId: string): Promise<Result<boolean, AppError>> {
    return this.withQuery(
      "delete",
      async () => {
        const deleted = await prisma.daily_routines.deleteMany({
          where: { id, user_id: userId },
        });

        if (deleted.count === 0) {
          throw this.notFoundError("Routine");
        }

        return true;
      },
      { id, userId }
    );
  }
}

// Export singleton instance
export const prismaRoutineRepo = new PrismaRoutineRepository();
export { PrismaRoutineRepository };
