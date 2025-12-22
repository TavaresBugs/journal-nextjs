/**
 * Prisma Trade Repository
 *
 * Type-safe implementation of TradeRepository using Prisma ORM.
 * Provides full TypeScript support with autocompletion for all trade fields.
 *
 * @example
 * import { prismaTradeRepo } from '@/lib/repositories/prisma';
 * const trades = await prismaTradeRepo.getByAccountId('account-uuid', 'user-uuid');
 */

import { prisma } from "@/lib/prisma";
import { trades as PrismaTrade, Prisma } from "@/generated/prisma";
import { Result } from "../types";
import { AppError, ErrorCode } from "@/lib/errors";
import { Logger } from "@/lib/logging/Logger";
import { Trade } from "@/types";

/**
 * Maps Prisma trade to domain Trade type
 */
function mapPrismaToTrade(prismaTrade: PrismaTrade): Trade {
  return {
    id: prismaTrade.id,
    accountId: prismaTrade.account_id,
    userId: prismaTrade.user_id || "",
    symbol: prismaTrade.symbol,
    type: prismaTrade.type as "Long" | "Short",
    entryPrice: Number(prismaTrade.entry_price),
    exitPrice: prismaTrade.exit_price ? Number(prismaTrade.exit_price) : undefined,
    stopLoss: prismaTrade.stop_loss ? Number(prismaTrade.stop_loss) : 0,
    takeProfit: prismaTrade.take_profit ? Number(prismaTrade.take_profit) : 0,
    lot: Number(prismaTrade.lot),
    pnl: prismaTrade.pnl ? Number(prismaTrade.pnl) : undefined,
    commission: prismaTrade.commission ? Number(prismaTrade.commission) : undefined,
    swap: prismaTrade.swap ? Number(prismaTrade.swap) : undefined,
    entryDate:
      prismaTrade.entry_date instanceof Date
        ? prismaTrade.entry_date.toISOString().split("T")[0]
        : String(prismaTrade.entry_date),
    entryTime: prismaTrade.entry_time || undefined,
    exitDate: prismaTrade.exit_date
      ? prismaTrade.exit_date instanceof Date
        ? prismaTrade.exit_date.toISOString().split("T")[0]
        : String(prismaTrade.exit_date)
      : undefined,
    exitTime: prismaTrade.exit_time || undefined,
    tfAnalise: prismaTrade.tf_analise || undefined,
    tfEntrada: prismaTrade.tf_entrada || undefined,
    strategy: prismaTrade.strategy || undefined,
    strategyIcon: prismaTrade.strategy_icon || undefined,
    setup: prismaTrade.setup || undefined,
    pdArray: prismaTrade.pd_array as Trade["pdArray"],
    tags: prismaTrade.tags || undefined,
    notes: prismaTrade.notes || undefined,
    outcome: prismaTrade.outcome as Trade["outcome"],
    session: prismaTrade.session || undefined,
    htfAligned: prismaTrade.htf_aligned || undefined,
    rMultiple: prismaTrade.r_multiple ? Number(prismaTrade.r_multiple) : undefined,
    marketCondition: prismaTrade.market_condition as Trade["marketCondition"],
    market_condition_v2: prismaTrade.market_condition_v2 as Trade["market_condition_v2"],
    planAdherence: prismaTrade.plan_adherence as Trade["planAdherence"],
    planAdherenceRating: prismaTrade.plan_adherence_rating || undefined,
    entry_quality: prismaTrade.entry_quality as Trade["entry_quality"],
    createdAt: prismaTrade.created_at?.toISOString() || new Date().toISOString(),
    updatedAt: prismaTrade.updated_at?.toISOString() || new Date().toISOString(),
  };
}

/**
 * Maps domain Trade to Prisma create input
 */
function mapTradeToPrisma(trade: Partial<Trade>): Prisma.tradesCreateInput {
  return {
    id: trade.id,
    accounts: { connect: { id: trade.accountId } },
    users: trade.userId ? { connect: { id: trade.userId } } : undefined,
    symbol: trade.symbol!,
    type: trade.type!,
    entry_price: trade.entryPrice!,
    exit_price: trade.exitPrice,
    stop_loss: trade.stopLoss,
    take_profit: trade.takeProfit,
    lot: trade.lot || 1,
    pnl: trade.pnl,
    commission: trade.commission,
    swap: trade.swap,
    entry_date: trade.entryDate!,
    entry_time: trade.entryTime,
    exit_date: trade.exitDate,
    exit_time: trade.exitTime,
    tf_analise: trade.tfAnalise,
    tf_entrada: trade.tfEntrada,
    strategy: trade.strategy,
    strategy_icon: trade.strategyIcon,
    setup: trade.setup,
    pd_array: trade.pdArray,
    tags: trade.tags,
    notes: trade.notes,
    outcome: trade.outcome,
    session: trade.session,
    htf_aligned: trade.htfAligned,
    r_multiple: trade.rMultiple,
    market_condition_v2: trade.market_condition_v2,
    plan_adherence: trade.planAdherence,
    plan_adherence_rating: trade.planAdherenceRating,
    entry_quality: trade.entry_quality,
  };
}

class PrismaTradeRepository {
  private logger = new Logger("PrismaTradeRepository");
  private readonly SLOW_QUERY_THRESHOLD_MS = 1000;

  private logSlowQuery(method: string, durationMs: number, metadata?: Record<string, unknown>) {
    if (durationMs > this.SLOW_QUERY_THRESHOLD_MS) {
      this.logger.warn(`Slow query detected in ${method}`, {
        durationMs,
        threshold: this.SLOW_QUERY_THRESHOLD_MS,
        ...metadata,
      });
    }
  }

  /**
   * Fetches trades by account ID with type-safe queries.
   */
  async getByAccountId(
    accountId: string,
    userId: string,
    options?: { limit?: number; offset?: number }
  ): Promise<Result<Trade[], AppError>> {
    const startTime = performance.now();
    this.logger.info("Fetching trades by account ID", { accountId, userId });

    try {
      const trades = await prisma.trades.findMany({
        where: {
          account_id: accountId,
          user_id: userId,
        },
        orderBy: [{ entry_date: "desc" }, { entry_time: "desc" }],
        take: options?.limit,
        skip: options?.offset,
      });

      const durationMs = performance.now() - startTime;
      this.logSlowQuery("getByAccountId", durationMs, { accountId, count: trades.length });

      return { data: trades.map(mapPrismaToTrade), error: null };
    } catch (error) {
      this.logger.error("Failed to fetch trades by account", { error, accountId });
      return {
        data: null,
        error: new AppError("Failed to fetch trades", ErrorCode.DB_QUERY_FAILED, 500),
      };
    }
  }

  /**
   * Fetches a single trade by ID with ownership verification.
   */
  async getById(tradeId: string, userId?: string): Promise<Result<Trade, AppError>> {
    const startTime = performance.now();
    this.logger.info("Fetching trade by ID", { tradeId, userId });

    try {
      const trade = await prisma.trades.findUnique({
        where: { id: tradeId },
      });

      const durationMs = performance.now() - startTime;
      this.logSlowQuery("getById", durationMs, { tradeId });

      if (!trade) {
        return {
          data: null,
          error: new AppError("Trade not found", ErrorCode.DB_NOT_FOUND, 404),
        };
      }

      // Ownership check
      if (userId && trade.user_id !== userId) {
        this.logger.warn("Unauthorized trade access attempt", { tradeId, userId });
        return {
          data: null,
          error: new AppError("Unauthorized", ErrorCode.AUTH_FORBIDDEN, 403),
        };
      }

      return { data: mapPrismaToTrade(trade), error: null };
    } catch (error) {
      this.logger.error("Failed to fetch trade", { error, tradeId });
      return {
        data: null,
        error: new AppError("Failed to fetch trade", ErrorCode.DB_QUERY_FAILED, 500),
      };
    }
  }

  /**
   * Fetches trades associated with a journal entry via junction table.
   */
  async getByJournalId(
    journalId: string,
    options?: { limit?: number; offset?: number }
  ): Promise<Result<Trade[], AppError>> {
    const startTime = performance.now();
    this.logger.info("Fetching trades by journal ID", { journalId });

    try {
      const trades = await prisma.trades.findMany({
        where: {
          journal_entry_trades: {
            some: { journal_entry_id: journalId },
          },
        },
        orderBy: { created_at: "desc" },
        take: options?.limit,
        skip: options?.offset,
      });

      const durationMs = performance.now() - startTime;
      this.logSlowQuery("getByJournalId", durationMs, { journalId, count: trades.length });

      return { data: trades.map(mapPrismaToTrade), error: null };
    } catch (error) {
      this.logger.error("Failed to fetch trades by journal", { error, journalId });
      return {
        data: null,
        error: new AppError("Failed to fetch trades", ErrorCode.DB_QUERY_FAILED, 500),
      };
    }
  }

  /**
   * Creates a new trade with Prisma type-safety.
   */
  async create(trade: Partial<Trade>): Promise<Result<Trade, AppError>> {
    const startTime = performance.now();
    this.logger.info("Creating trade", { symbol: trade.symbol });

    try {
      const created = await prisma.trades.create({
        data: mapTradeToPrisma(trade),
      });

      const durationMs = performance.now() - startTime;
      this.logSlowQuery("create", durationMs, { tradeId: created.id });

      this.logger.info("Trade created successfully", { tradeId: created.id });
      return { data: mapPrismaToTrade(created), error: null };
    } catch (error) {
      this.logger.error("Failed to create trade", { error });
      return {
        data: null,
        error: new AppError("Failed to create trade", ErrorCode.DB_QUERY_FAILED, 500),
      };
    }
  }

  /**
   * Creates a trade and associates it with a journal entry.
   */
  async createWithJournal(
    trade: Partial<Trade>,
    journalId: string,
    userId: string
  ): Promise<Result<Trade, AppError>> {
    const startTime = performance.now();
    this.logger.info("Creating trade with journal association", { journalId, userId });

    try {
      // Use transaction for atomicity
      const result = await prisma.$transaction(async (tx) => {
        // Verify journal ownership
        const journal = await tx.journal_entries.findUnique({
          where: { id: journalId },
          select: { id: true, user_id: true },
        });

        if (!journal) {
          throw new AppError("Journal not found", ErrorCode.DB_NOT_FOUND, 404);
        }

        if (journal.user_id !== userId) {
          throw new AppError("Unauthorized", ErrorCode.AUTH_FORBIDDEN, 403);
        }

        // Create the trade
        const created = await tx.trades.create({
          data: mapTradeToPrisma(trade),
        });

        // Create junction table entry
        await tx.journal_entry_trades.create({
          data: {
            journal_entry_id: journalId,
            trade_id: created.id,
          },
        });

        return created;
      });

      const durationMs = performance.now() - startTime;
      this.logSlowQuery("createWithJournal", durationMs, { journalId, tradeId: result.id });

      return { data: mapPrismaToTrade(result), error: null };
    } catch (error) {
      this.logger.error("Failed to create trade with journal", { error, journalId });

      if (error instanceof AppError) {
        return { data: null, error };
      }

      return {
        data: null,
        error: new AppError("Failed to create trade", ErrorCode.DB_QUERY_FAILED, 500),
      };
    }
  }

  /**
   * Updates a trade with ownership verification.
   */
  async update(
    tradeId: string,
    userId: string,
    data: Partial<Trade>
  ): Promise<Result<Trade, AppError>> {
    const startTime = performance.now();
    this.logger.info("Updating trade", { tradeId, userId });

    try {
      // Verify ownership first
      const existing = await prisma.trades.findUnique({
        where: { id: tradeId },
        select: { user_id: true },
      });

      if (!existing) {
        return {
          data: null,
          error: new AppError("Trade not found", ErrorCode.DB_NOT_FOUND, 404),
        };
      }

      if (existing.user_id !== userId) {
        return {
          data: null,
          error: new AppError("Unauthorized", ErrorCode.AUTH_FORBIDDEN, 403),
        };
      }

      const updated = await prisma.trades.update({
        where: { id: tradeId },
        data: {
          symbol: data.symbol,
          type: data.type,
          entry_price: data.entryPrice,
          exit_price: data.exitPrice,
          stop_loss: data.stopLoss,
          take_profit: data.takeProfit,
          lot: data.lot,
          pnl: data.pnl,
          outcome: data.outcome,
          notes: data.notes,
          strategy: data.strategy,
          setup: data.setup,
          updated_at: new Date(),
        },
      });

      const durationMs = performance.now() - startTime;
      this.logSlowQuery("update", durationMs, { tradeId });

      return { data: mapPrismaToTrade(updated), error: null };
    } catch (error) {
      this.logger.error("Failed to update trade", { error, tradeId });
      return {
        data: null,
        error: new AppError("Failed to update trade", ErrorCode.DB_QUERY_FAILED, 500),
      };
    }
  }

  /**
   * Deletes a trade with ownership verification.
   */
  async delete(tradeId: string, userId: string): Promise<Result<boolean, AppError>> {
    this.logger.info("Deleting trade", { tradeId, userId });

    try {
      // Delete only if user owns the trade
      const deleted = await prisma.trades.deleteMany({
        where: {
          id: tradeId,
          user_id: userId,
        },
      });

      if (deleted.count === 0) {
        return {
          data: null,
          error: new AppError("Trade not found or unauthorized", ErrorCode.DB_NOT_FOUND, 404),
        };
      }

      this.logger.info("Trade deleted successfully", { tradeId });
      return { data: true, error: null };
    } catch (error) {
      this.logger.error("Failed to delete trade", { error, tradeId });
      return {
        data: null,
        error: new AppError("Failed to delete trade", ErrorCode.DB_QUERY_FAILED, 500),
      };
    }
  }

  /**
   * Gets trade count for dashboard metrics.
   */
  async getCount(accountId: string, userId: string): Promise<Result<number, AppError>> {
    try {
      const count = await prisma.trades.count({
        where: {
          account_id: accountId,
          user_id: userId,
        },
      });

      return { data: count, error: null };
    } catch (error) {
      this.logger.error("Failed to count trades", { error, accountId });
      return {
        data: null,
        error: new AppError("Failed to count trades", ErrorCode.DB_QUERY_FAILED, 500),
      };
    }
  }

  /**
   * Gets aggregated trade metrics for dashboard.
   */
  async getDashboardMetrics(
    accountId: string,
    userId: string
  ): Promise<
    Result<
      {
        totalTrades: number;
        wins: number;
        losses: number;
        winRate: number;
        totalPnl: number;
      },
      AppError
    >
  > {
    try {
      const [total, wins, losses, pnlSum] = await Promise.all([
        prisma.trades.count({
          where: { account_id: accountId, user_id: userId },
        }),
        prisma.trades.count({
          where: { account_id: accountId, user_id: userId, outcome: "win" },
        }),
        prisma.trades.count({
          where: { account_id: accountId, user_id: userId, outcome: "loss" },
        }),
        prisma.trades.aggregate({
          where: { account_id: accountId, user_id: userId },
          _sum: { pnl: true },
        }),
      ]);

      return {
        data: {
          totalTrades: total,
          wins,
          losses,
          winRate: total > 0 ? (wins / total) * 100 : 0,
          totalPnl: Number(pnlSum._sum.pnl || 0),
        },
        error: null,
      };
    } catch (error) {
      this.logger.error("Failed to get dashboard metrics", { error, accountId });
      return {
        data: null,
        error: new AppError("Failed to get metrics", ErrorCode.DB_QUERY_FAILED, 500),
      };
    }
  }
}

// Export singleton instance
export const prismaTradeRepo = new PrismaTradeRepository();
export { PrismaTradeRepository };
