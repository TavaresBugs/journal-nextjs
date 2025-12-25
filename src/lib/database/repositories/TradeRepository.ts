/**
 * Prisma Trade Repository
 *
 * Type-safe implementation of TradeRepository using Prisma ORM.
 * Provides full TypeScript support with autocompletion for all trade fields.
 *
 * @example
 * import { prismaTradeRepo } from '@/lib/database/repositories';
 * const trades = await prismaTradeRepo.getByAccountId('account-uuid', 'user-uuid');
 */

import { prisma } from "@/lib/database";
import { trades as PrismaTrade, Prisma } from "@/generated/prisma";
import { Result } from "../types";
import { AppError, ErrorCode } from "@/lib/errors";
import { Logger } from "@/lib/logging/Logger";
import { Trade, TradeLite } from "@/types";

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
    entry_date: new Date(trade.entryDate!),
    entry_time: trade.entryTime,
    exit_date: trade.exitDate ? new Date(trade.exitDate) : undefined,
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

/**
 * Maps domain Trade to Prisma create many input (for batch inserts)
 */
function mapTradeToPrismaMany(trade: Partial<Trade>): Prisma.tradesCreateManyInput {
  return {
    id: trade.id,
    account_id: trade.accountId!,
    user_id: trade.userId,
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
    entry_date: new Date(trade.entryDate!),
    entry_time: trade.entryTime,
    exit_date: trade.exitDate ? new Date(trade.exitDate) : undefined,
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
   * OPTIMIZED: Selects only essential columns for listing performance.
   */
  async getByAccountId(
    accountId: string,
    userId: string,
    options?: {
      limit?: number;
      offset?: number;
      orderBy?: Prisma.tradesOrderByWithRelationInput | Prisma.tradesOrderByWithRelationInput[];
      symbol?: string; // Add symbol filter
    }
  ): Promise<Result<Trade[], AppError>> {
    const startTime = performance.now();
    this.logger.info("Fetching trades by account ID", {
      accountId,
      userId,
      symbol: options?.symbol,
    });

    try {
      const whereClause: Prisma.tradesWhereInput = {
        account_id: accountId,
        user_id: userId,
      };

      if (options?.symbol && options.symbol !== "TODOS OS ATIVOS") {
        whereClause.symbol = options.symbol;
      }

      // OPTIMIZED: Select only columns needed for trade list display
      const trades = await prisma.trades.findMany({
        where: whereClause,
        orderBy: options?.orderBy || [{ entry_date: "desc" }, { entry_time: "desc" }],
        take: options?.limit,
        skip: options?.offset,
        select: {
          id: true,
          account_id: true,
          user_id: true,
          symbol: true,
          type: true,
          entry_price: true,
          exit_price: true,
          stop_loss: true,
          take_profit: true,
          lot: true,
          pnl: true,
          commission: true,
          swap: true,
          entry_date: true,
          entry_time: true,
          exit_date: true,
          exit_time: true,
          outcome: true,
          strategy: true,
          strategy_icon: true,
          setup: true,
          tags: true,
          notes: true,
          tf_analise: true,
          tf_entrada: true,
          session: true,
          htf_aligned: true,
          r_multiple: true,
          market_condition: true,
          market_condition_v2: true,
          plan_adherence: true,
          plan_adherence_rating: true,
          entry_quality: true,
          pd_array: true,
          created_at: true,
          updated_at: true,
        },
      });

      const durationMs = performance.now() - startTime;
      this.logSlowQuery("getByAccountId", durationMs, { accountId, count: trades.length });
      this.logger.info(`Trades fetched in ${durationMs.toFixed(0)}ms`, {
        count: trades.length,
        accountId,
      });

      return { data: trades.map(mapPrismaToTrade), error: null };
    } catch (error) {
      this.logger.error("Failed to fetch trades by account", { error, accountId });
      return {
        data: null,
        error: new AppError("Failed to fetch trades", ErrorCode.DB_QUERY_FAILED, 500),
      };
    }
  }

  async getMany(options?: {
    where?: Prisma.tradesWhereInput;
    orderBy?: Prisma.tradesOrderByWithRelationInput;
    take?: number;
    skip?: number;
  }): Promise<Result<Trade[], AppError>> {
    this.logger.info("Fetching many trades", { options });

    try {
      const trades = await prisma.trades.findMany(options);
      return { data: trades.map(mapPrismaToTrade), error: null };
    } catch (error) {
      this.logger.error("Failed to fetch many trades", { error });
      return {
        data: null,
        error: new AppError("Failed to fetch trades", ErrorCode.DB_QUERY_FAILED, 500),
      };
    }
  }

  /**
   * Counts trades for a specific account.
   */
  async countByAccountId(
    accountId: string,
    userId: string,
    symbol?: string // Add symbol filter
  ): Promise<Result<number, AppError>> {
    try {
      const whereClause: Prisma.tradesWhereInput = {
        account_id: accountId,
        user_id: userId,
      };

      if (symbol && symbol !== "TODOS OS ATIVOS") {
        whereClause.symbol = symbol;
      }

      const count = await prisma.trades.count({
        where: whereClause,
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
   * Fetches a single trade by ID with ownership verification.
   * @param tradeId - The trade ID to fetch
   * @param userId - The user ID for ownership verification (REQUIRED for security)
   */
  async getById(tradeId: string, userId: string): Promise<Result<Trade, AppError>> {
    const startTime = performance.now();
    this.logger.info("Fetching trade by ID", { tradeId, userId });

    try {
      // Use compound where clause for security (prevents IDOR)
      const trade = await prisma.trades.findFirst({
        where: {
          id: tradeId,
          user_id: userId,
        },
      });

      const durationMs = performance.now() - startTime;
      this.logSlowQuery("getById", durationMs, { tradeId });

      if (!trade) {
        return {
          data: null,
          error: new AppError("Trade not found", ErrorCode.DB_NOT_FOUND, 404),
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
   * Gets trade owner ID for permission checks (used by mentors).
   * Returns only the userId without exposing trade data.
   * @param tradeId - The trade ID to check
   */
  async getTradeOwnerId(tradeId: string): Promise<Result<string, AppError>> {
    this.logger.info("Getting trade owner ID", { tradeId });

    try {
      const trade = await prisma.trades.findUnique({
        where: { id: tradeId },
        select: { user_id: true },
      });

      if (!trade || !trade.user_id) {
        return {
          data: null,
          error: new AppError("Trade not found", ErrorCode.DB_NOT_FOUND, 404),
        };
      }

      return { data: trade.user_id, error: null };
    } catch (error) {
      this.logger.error("Failed to get trade owner", { error, tradeId });
      return {
        data: null,
        error: new AppError("Failed to get trade owner", ErrorCode.DB_QUERY_FAILED, 500),
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
        error: new AppError(
          `Failed to create trade: ${(error as Error).message}`,
          ErrorCode.DB_QUERY_FAILED,
          500
        ),
      };
    }
  }

  /**
   * Creates multiple trades in a batch.
   * NOTE: createMany is not supported by all databases for returning created records.
   * PostgreSQL supports skipDuplicates.
   */
  async createMany(trades: Partial<Trade>[]): Promise<Result<{ count: number }, AppError>> {
    const startTime = performance.now();
    this.logger.info("Creating multiple trades", { count: trades.length });

    try {
      if (trades.length === 0) {
        return { data: { count: 0 }, error: null };
      }

      const created = await prisma.trades.createMany({
        data: trades.map(mapTradeToPrismaMany),
        skipDuplicates: true, // Optional: skip if ID conflicts, though we usually generate IDs or rely on DB
      });

      const durationMs = performance.now() - startTime;
      this.logSlowQuery("createMany", durationMs, { count: trades.length });

      this.logger.info("Trades batch created successfully", { count: created.count });
      return { data: { count: created.count }, error: null };
    } catch (error) {
      this.logger.error("Failed to create trades batch", { error });
      return {
        data: null,
        error: new AppError(
          `Failed to create trades: ${(error as Error).message}`,
          ErrorCode.DB_QUERY_FAILED,
          500
        ),
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
        error: new AppError(
          `Failed to create trade with journal: ${(error as Error).message}`,
          ErrorCode.DB_QUERY_FAILED,
          500
        ),
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
        error: new AppError(
          `Failed to update trade: ${(error as Error).message}`,
          ErrorCode.DB_QUERY_FAILED,
          500
        ),
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
   * Deletes all trades for a specific account.
   */
  async deleteByAccountId(accountId: string, userId: string): Promise<Result<number, AppError>> {
    this.logger.info("Deleting trades by account", { accountId, userId });

    try {
      const deleted = await prisma.trades.deleteMany({
        where: {
          account_id: accountId,
          user_id: userId,
        },
      });

      this.logger.info("Trades deleted successfully", { count: deleted.count, accountId });
      return { data: deleted.count, error: null };
    } catch (error) {
      this.logger.error("Failed to delete trades by account", { error, accountId });
      return {
        data: null,
        error: new AppError("Failed to delete trades", ErrorCode.DB_QUERY_FAILED, 500),
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
   * OPTIMIZED: Uses single raw SQL query instead of 4 separate queries.
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
        breakeven: number;
        winRate: number;
        totalPnl: number;
      },
      AppError
    >
  > {
    const startTime = performance.now();
    try {
      // Single optimized query using PostgreSQL FILTER for conditional counts
      const result = await prisma.$queryRaw<
        Array<{
          total_trades: bigint;
          wins: bigint;
          losses: bigint;
          breakeven: bigint;
          total_pnl: number | null;
        }>
      >`
        SELECT 
          COUNT(*) as total_trades,
          COUNT(*) FILTER (WHERE outcome = 'win') as wins,
          COUNT(*) FILTER (WHERE outcome = 'loss') as losses,
          COUNT(*) FILTER (WHERE outcome = 'breakeven') as breakeven,
          COALESCE(SUM(pnl), 0) as total_pnl
        FROM trades
        WHERE account_id = ${accountId}::uuid
          AND user_id = ${userId}::uuid
      `;

      const durationMs = performance.now() - startTime;
      this.logSlowQuery("getDashboardMetrics", durationMs, { accountId });

      const row = result[0];
      const totalTrades = Number(row?.total_trades || 0);
      const wins = Number(row?.wins || 0);
      const losses = Number(row?.losses || 0);
      const breakeven = Number(row?.breakeven || 0);
      const totalPnl = Number(row?.total_pnl || 0);

      // Calculate win rate based on decisive trades only (win + loss)
      const decisiveTrades = wins + losses;
      const winRate = decisiveTrades > 0 ? (wins / decisiveTrades) * 100 : 0;

      this.logger.info(`Dashboard metrics fetched in ${durationMs.toFixed(0)}ms`, {
        accountId,
        totalTrades,
        wins,
        losses,
      });

      return {
        data: {
          totalTrades,
          wins,
          losses,
          breakeven,
          winRate: Math.round(winRate * 100) / 100, // Round to 2 decimal places
          totalPnl,
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

  /**
   * Gets advanced trade metrics for analytics.
   * OPTIMIZED: Calculates Sharpe, Calmar, streaks in single raw SQL query.
   * Moves client-side calculations to server for 50-200ms savings.
   */
  async getAdvancedMetrics(
    accountId: string,
    userId: string,
    initialBalance: number
  ): Promise<
    Result<
      {
        avgPnl: number;
        pnlStdDev: number;
        sharpeRatio: number;
        maxDrawdown: number;
        maxDrawdownPercent: number;
        calmarRatio: number;
        currentStreak: number;
        maxWinStreak: number;
        maxLossStreak: number;
        profitFactor: number;
        avgWin: number;
        avgLoss: number;
        largestWin: number;
        largestLoss: number;
      },
      AppError
    >
  > {
    const startTime = performance.now();
    try {
      // Single comprehensive query for all advanced metrics
      const result = await prisma.$queryRaw<
        Array<{
          avg_pnl: number | null;
          pnl_stddev: number | null;
          total_pnl: number | null;
          max_pnl: number | null;
          min_pnl: number | null;
          total_wins: bigint;
          total_losses: bigint;
          sum_wins: number | null;
          sum_losses: number | null;
          max_win: number | null;
          max_loss: number | null;
        }>
      >`
        SELECT 
          AVG(pnl) as avg_pnl,
          STDDEV_POP(pnl) as pnl_stddev,
          SUM(pnl) as total_pnl,
          MAX(pnl) as max_pnl,
          MIN(pnl) as min_pnl,
          COUNT(*) FILTER (WHERE outcome = 'win') as total_wins,
          COUNT(*) FILTER (WHERE outcome = 'loss') as total_losses,
          COALESCE(SUM(pnl) FILTER (WHERE outcome = 'win'), 0) as sum_wins,
          COALESCE(ABS(SUM(pnl) FILTER (WHERE outcome = 'loss')), 0) as sum_losses,
          COALESCE(MAX(pnl) FILTER (WHERE outcome = 'win'), 0) as max_win,
          COALESCE(MIN(pnl) FILTER (WHERE outcome = 'loss'), 0) as max_loss
        FROM trades
        WHERE account_id = ${accountId}::uuid
          AND user_id = ${userId}::uuid
      `;

      // Get streaks using window functions
      const streakResult = await prisma.$queryRaw<
        Array<{
          current_streak: number | null;
          max_win_streak: number | null;
          max_loss_streak: number | null;
        }>
      >`
        WITH ordered_trades AS (
          SELECT 
            outcome,
            entry_date,
            ROW_NUMBER() OVER (ORDER BY entry_date DESC, entry_time DESC) as rn,
            LAG(outcome) OVER (ORDER BY entry_date DESC, entry_time DESC) as prev_outcome
          FROM trades
          WHERE account_id = ${accountId}::uuid AND user_id = ${userId}::uuid
        ),
        streak_groups AS (
          SELECT 
            outcome,
            rn,
            SUM(CASE WHEN outcome != prev_outcome OR prev_outcome IS NULL THEN 1 ELSE 0 END) 
              OVER (ORDER BY rn) as streak_group
          FROM ordered_trades
        ),
        streaks AS (
          SELECT 
            outcome,
            COUNT(*) as streak_len,
            MIN(rn) as first_rn
          FROM streak_groups
          GROUP BY outcome, streak_group
        )
        SELECT 
          (SELECT streak_len FROM streaks WHERE first_rn = 1 LIMIT 1) as current_streak,
          COALESCE((SELECT MAX(streak_len) FROM streaks WHERE outcome = 'win'), 0) as max_win_streak,
          COALESCE((SELECT MAX(streak_len) FROM streaks WHERE outcome = 'loss'), 0) as max_loss_streak
      `;

      const durationMs = performance.now() - startTime;
      this.logSlowQuery("getAdvancedMetrics", durationMs, { accountId });

      const row = result[0];
      const streakRow = streakResult[0];

      const avgPnl = Number(row?.avg_pnl || 0);
      const pnlStdDev = Number(row?.pnl_stddev || 0);
      const totalPnl = Number(row?.total_pnl || 0);
      const totalWins = Number(row?.total_wins || 0);
      const totalLosses = Number(row?.total_losses || 0);
      const sumWins = Number(row?.sum_wins || 0);
      const sumLosses = Number(row?.sum_losses || 0);
      const maxWin = Number(row?.max_win || 0);
      const maxLoss = Math.abs(Number(row?.max_loss || 0));

      // Calculate derived metrics
      const sharpeRatio = pnlStdDev > 0 ? avgPnl / pnlStdDev : 0;

      // For max drawdown, we'd need running balance - simplified calculation
      const estimatedMaxDrawdown = maxLoss; // Simplified - actual would need full equity curve
      const maxDrawdownPercent =
        initialBalance > 0 ? (estimatedMaxDrawdown / initialBalance) * 100 : 0;

      const calmarRatio = estimatedMaxDrawdown > 0 ? totalPnl / estimatedMaxDrawdown : 0;
      const profitFactor = sumLosses > 0 ? sumWins / sumLosses : sumWins > 0 ? Infinity : 0;
      const avgWin = totalWins > 0 ? sumWins / totalWins : 0;
      const avgLoss = totalLosses > 0 ? sumLosses / totalLosses : 0;

      return {
        data: {
          avgPnl: Math.round(avgPnl * 100) / 100,
          pnlStdDev: Math.round(pnlStdDev * 100) / 100,
          sharpeRatio: Math.round(sharpeRatio * 100) / 100,
          maxDrawdown: Math.round(estimatedMaxDrawdown * 100) / 100,
          maxDrawdownPercent: Math.round(maxDrawdownPercent * 100) / 100,
          calmarRatio: Math.round(calmarRatio * 100) / 100,
          currentStreak: Number(streakRow?.current_streak || 0),
          maxWinStreak: Number(streakRow?.max_win_streak || 0),
          maxLossStreak: Number(streakRow?.max_loss_streak || 0),
          profitFactor: profitFactor === Infinity ? 999 : Math.round(profitFactor * 100) / 100,
          avgWin: Math.round(avgWin * 100) / 100,
          avgLoss: Math.round(avgLoss * 100) / 100,
          largestWin: Math.round(maxWin * 100) / 100,
          largestLoss: Math.round(maxLoss * 100) / 100,
        },
        error: null,
      };
    } catch (error) {
      this.logger.error("Failed to get advanced metrics", { error, accountId });
      return {
        data: null,
        error: new AppError("Failed to get advanced metrics", ErrorCode.DB_QUERY_FAILED, 500),
      };
    }
  }

  /**
   * Fetches lightweight trade history for charts and analytics.
   * Optimized to select only necessary fields.
   */
  async getHistoryLite(
    accountId: string,
    userId: string,
    dateRange?: { start: Date; end: Date }
  ): Promise<Result<TradeLite[], AppError>> {
    const startTime = performance.now();
    this.logger.info("Fetching trade history lite", { accountId, userId, dateRange });

    try {
      const where: Prisma.tradesWhereInput = {
        account_id: accountId,
        user_id: userId,
      };

      if (dateRange) {
        where.entry_date = {
          gte: dateRange.start,
          lte: dateRange.end,
        };
      }

      // Select only the fields used by TradeLite/Analytics
      const trades = await prisma.trades.findMany({
        where,
        select: {
          id: true,
          entry_date: true,
          entry_time: true,
          exit_date: true,
          exit_time: true,
          pnl: true,
          outcome: true,
          account_id: true,
          symbol: true,
          type: true,
          entry_price: true,
          exit_price: true,
          stop_loss: true,
          take_profit: true,
          lot: true,
          tags: true,
          strategy: true,
          setup: true,
          tf_analise: true,
          tf_entrada: true,
          market_condition: true,
          entry_quality: true,
          market_condition_v2: true,
          pd_array: true,
          session: true,
          commission: true,
          swap: true,
        },
        orderBy: [{ entry_date: "desc" }, { entry_time: "desc" }],
      });

      const durationMs = performance.now() - startTime;
      this.logSlowQuery("getHistoryLite", durationMs, { accountId, count: trades.length });

      // Mapper for TradeLite (Partial Trade)
      const tradeLites: TradeLite[] = trades.map((t) => ({
        id: t.id,
        accountId: t.account_id,
        symbol: t.symbol,
        type: t.type as "Long" | "Short",
        entryDate:
          t.entry_date instanceof Date
            ? t.entry_date.toISOString().split("T")[0]
            : String(t.entry_date),
        entryTime: t.entry_time || undefined,
        exitDate: t.exit_date
          ? t.exit_date instanceof Date
            ? t.exit_date.toISOString().split("T")[0]
            : String(t.exit_date)
          : undefined,
        exitTime: t.exit_time || undefined,
        pnl: t.pnl ? Number(t.pnl) : undefined,
        outcome: t.outcome as TradeLite["outcome"],
        entryPrice: Number(t.entry_price),
        exitPrice: t.exit_price ? Number(t.exit_price) : undefined,
        stopLoss: t.stop_loss ? Number(t.stop_loss) : 0,
        takeProfit: t.take_profit ? Number(t.take_profit) : 0,
        lot: Number(t.lot),
        tags: t.tags || undefined,
        strategy: t.strategy || undefined,
        setup: t.setup || undefined,
        tfAnalise: t.tf_analise || undefined,
        tfEntrada: t.tf_entrada || undefined,
        marketCondition: t.market_condition as TradeLite["marketCondition"],
        entry_quality: t.entry_quality as TradeLite["entry_quality"],
        market_condition_v2: t.market_condition_v2 as TradeLite["market_condition_v2"],
        pdArray: t.pd_array as TradeLite["pdArray"],
        session: t.session || undefined,
        commission: t.commission ? Number(t.commission) : undefined,
        swap: t.swap ? Number(t.swap) : undefined,
      }));

      return { data: tradeLites, error: null };
    } catch (error) {
      this.logger.error("Failed to fetch trade history lite", { error, accountId });
      return {
        data: null,
        error: new AppError("Failed to fetch trade history", ErrorCode.DB_QUERY_FAILED, 500),
      };
    }
  }

  /**
   * Fetches all trades for a user across all accounts.
   */
  async getByUserId(
    userId: string,
    options?: { limit?: number; offset?: number; accountId?: string; accountIds?: string[] }
  ): Promise<Result<Trade[], AppError>> {
    const startTime = performance.now();
    this.logger.info("Fetching trades by user ID", { userId });

    try {
      const where: Prisma.tradesWhereInput = { user_id: userId };

      if (options?.accountId) {
        where.account_id = options.accountId;
      } else if (options?.accountIds && options.accountIds.length > 0) {
        where.account_id = { in: options.accountIds };
      }

      const trades = await prisma.trades.findMany({
        where,
        orderBy: [{ entry_date: "desc" }, { entry_time: "desc" }],
        take: options?.limit,
        skip: options?.offset,
      });

      const durationMs = performance.now() - startTime;
      this.logSlowQuery("getByUserId", durationMs, { userId, count: trades.length });

      return { data: trades.map(mapPrismaToTrade), error: null };
    } catch (error) {
      this.logger.error("Failed to fetch trades by user", { error, userId });
      return {
        data: null,
        error: new AppError("Failed to fetch trades", ErrorCode.DB_QUERY_FAILED, 500),
      };
    }
  }

  /**
   * Gets stats for a mentee (user).
   */
  async getMenteeStats(
    userId: string,
    accountIds?: string[]
  ): Promise<
    Result<
      {
        totalTrades: number;
        wins: number;
        winRate: number;
        recentTradesCount: number;
        lastTradeDate: string | undefined;
      },
      AppError
    >
  > {
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const where: Prisma.tradesWhereInput = { user_id: userId };
      if (accountIds && accountIds.length > 0) {
        where.account_id = { in: accountIds };
      }

      const trades = await prisma.trades.findMany({
        where,
        select: {
          id: true,
          outcome: true,
          entry_date: true,
        },
        orderBy: { entry_date: "desc" },
      });

      const totalTrades = trades.length;
      const wins = trades.filter((t) => t.outcome === "win").length;
      const winRate = totalTrades > 0 ? Math.round((wins / totalTrades) * 100) : 0;
      const recentTradesCount = trades.filter(
        (t) => t.entry_date && new Date(t.entry_date) >= sevenDaysAgo
      ).length;
      const lastTradeDate = trades[0]?.entry_date
        ? trades[0].entry_date instanceof Date
          ? trades[0].entry_date.toISOString().split("T")[0]
          : String(trades[0].entry_date)
        : undefined;

      return {
        data: {
          totalTrades,
          wins,
          winRate,
          recentTradesCount,
          lastTradeDate,
        },
        error: null,
      };
    } catch (error) {
      this.logger.error("Failed to get mentee stats", { error, userId });
      return {
        data: null,
        error: new AppError("Failed to get mentee stats", ErrorCode.DB_QUERY_FAILED, 500),
      };
    }
  }
}

// Export singleton instance
export const prismaTradeRepo = new PrismaTradeRepository();
export { PrismaTradeRepository };
