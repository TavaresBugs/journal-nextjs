/**
 * Prisma Trade Repository
 *
 * Type-safe implementation of TradeRepository using Prisma ORM.
 * Extends BaseRepository for common logging and error handling.
 */

import { prisma } from "@/lib/database";
import { trades as PrismaTrade, Prisma } from "@/generated/prisma";
import { Result } from "../types";
import { AppError } from "@/lib/errors";
import { BaseRepository } from "./BaseRepository";
import { Trade, TradeLite } from "@/types";

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

class PrismaTradeRepository extends BaseRepository {
  protected readonly repositoryName = "PrismaTradeRepository";

  async getByAccountId(
    accountId: string,
    userId: string,
    options?: {
      limit?: number;
      offset?: number;
      orderBy?: Prisma.tradesOrderByWithRelationInput | Prisma.tradesOrderByWithRelationInput[];
      symbol?: string;
    }
  ): Promise<Result<Trade[], AppError>> {
    return this.withQuery(
      "getByAccountId",
      async () => {
        const whereClause: Prisma.tradesWhereInput = { account_id: accountId, user_id: userId };
        if (options?.symbol && options.symbol !== "TODOS OS ATIVOS")
          whereClause.symbol = options.symbol;

        const trades = await prisma.trades.findMany({
          where: whereClause,
          orderBy: options?.orderBy || [{ entry_date: "desc" }, { entry_time: "desc" }],
          take: options?.limit,
          skip: options?.offset,
        });
        return trades.map(mapPrismaToTrade);
      },
      { accountId, symbol: options?.symbol }
    );
  }

  async getMany(options?: {
    where?: Prisma.tradesWhereInput;
    orderBy?: Prisma.tradesOrderByWithRelationInput;
    take?: number;
    skip?: number;
  }): Promise<Result<Trade[], AppError>> {
    return this.withQuery("getMany", async () => {
      const trades = await prisma.trades.findMany(options);
      return trades.map(mapPrismaToTrade);
    });
  }

  async countByAccountId(
    accountId: string,
    userId: string,
    symbol?: string
  ): Promise<Result<number, AppError>> {
    return this.withQuery(
      "countByAccountId",
      async () => {
        const whereClause: Prisma.tradesWhereInput = { account_id: accountId, user_id: userId };
        if (symbol && symbol !== "TODOS OS ATIVOS") whereClause.symbol = symbol;
        return prisma.trades.count({ where: whereClause });
      },
      { accountId, symbol }
    );
  }

  async getById(tradeId: string, userId: string): Promise<Result<Trade, AppError>> {
    return this.withQuery(
      "getById",
      async () => {
        const trade = await prisma.trades.findFirst({ where: { id: tradeId, user_id: userId } });
        if (!trade) throw this.notFoundError("Trade");
        return mapPrismaToTrade(trade);
      },
      { tradeId }
    );
  }

  async getTradeOwnerId(tradeId: string): Promise<Result<string, AppError>> {
    return this.withQuery(
      "getTradeOwnerId",
      async () => {
        const trade = await prisma.trades.findUnique({
          where: { id: tradeId },
          select: { user_id: true },
        });
        if (!trade?.user_id) throw this.notFoundError("Trade");
        return trade.user_id;
      },
      { tradeId }
    );
  }

  async getByJournalId(
    journalId: string,
    options?: { limit?: number; offset?: number }
  ): Promise<Result<Trade[], AppError>> {
    return this.withQuery(
      "getByJournalId",
      async () => {
        const trades = await prisma.trades.findMany({
          where: { journal_entry_trades: { some: { journal_entry_id: journalId } } },
          orderBy: { created_at: "desc" },
          take: options?.limit,
          skip: options?.offset,
        });
        return trades.map(mapPrismaToTrade);
      },
      { journalId }
    );
  }

  async create(trade: Partial<Trade>): Promise<Result<Trade, AppError>> {
    return this.withQuery(
      "create",
      async () => {
        const created = await prisma.trades.create({ data: mapTradeToPrisma(trade) });
        return mapPrismaToTrade(created);
      },
      { symbol: trade.symbol }
    );
  }

  async createMany(trades: Partial<Trade>[]): Promise<Result<{ count: number }, AppError>> {
    return this.withQuery(
      "createMany",
      async () => {
        if (trades.length === 0) return { count: 0 };
        const created = await prisma.trades.createMany({
          data: trades.map(mapTradeToPrismaMany),
          skipDuplicates: true,
        });
        return { count: created.count };
      },
      { count: trades.length }
    );
  }

  async createWithJournal(
    trade: Partial<Trade>,
    journalId: string,
    userId: string
  ): Promise<Result<Trade, AppError>> {
    return this.withQuery(
      "createWithJournal",
      async () => {
        const result = await prisma.$transaction(async (tx) => {
          const journal = await tx.journal_entries.findUnique({
            where: { id: journalId },
            select: { id: true, user_id: true },
          });
          if (!journal) throw this.notFoundError("Journal");
          if (journal.user_id !== userId) throw this.unauthorizedError();
          const created = await tx.trades.create({ data: mapTradeToPrisma(trade) });
          await tx.journal_entry_trades.create({
            data: { journal_entry_id: journalId, trade_id: created.id },
          });
          return created;
        });
        return mapPrismaToTrade(result);
      },
      { journalId }
    );
  }

  async update(
    tradeId: string,
    userId: string,
    data: Partial<Trade>
  ): Promise<Result<Trade, AppError>> {
    return this.withQuery(
      "update",
      async () => {
        const existing = await prisma.trades.findUnique({
          where: { id: tradeId },
          select: { user_id: true },
        });
        if (!existing) throw this.notFoundError("Trade");
        if (existing.user_id !== userId) throw this.unauthorizedError();

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
            commission: data.commission,
            swap: data.swap,
            entry_date: data.entryDate ? new Date(data.entryDate) : undefined,
            entry_time: data.entryTime,
            exit_date: data.exitDate ? new Date(data.exitDate) : undefined,
            exit_time: data.exitTime,
            tf_analise: data.tfAnalise,
            tf_entrada: data.tfEntrada,
            strategy: data.strategy,
            strategy_icon: data.strategyIcon,
            setup: data.setup,
            pd_array: data.pdArray,
            tags: data.tags,
            notes: data.notes,
            outcome: data.outcome,
            session: data.session,
            htf_aligned: data.htfAligned,
            r_multiple: data.rMultiple,
            market_condition: data.marketCondition,
            market_condition_v2: data.market_condition_v2,
            plan_adherence: data.planAdherence,
            plan_adherence_rating: data.planAdherenceRating,
            entry_quality: data.entry_quality,
            updated_at: new Date(),
          },
        });
        return mapPrismaToTrade(updated);
      },
      { tradeId }
    );
  }

  async delete(tradeId: string, userId: string): Promise<Result<boolean, AppError>> {
    return this.withQuery(
      "delete",
      async () => {
        const deleted = await prisma.trades.deleteMany({ where: { id: tradeId, user_id: userId } });
        if (deleted.count === 0) throw this.notFoundError("Trade");
        return true;
      },
      { tradeId }
    );
  }

  async deleteByAccountId(accountId: string, userId: string): Promise<Result<number, AppError>> {
    return this.withQuery(
      "deleteByAccountId",
      async () => {
        const deleted = await prisma.trades.deleteMany({
          where: { account_id: accountId, user_id: userId },
        });
        return deleted.count;
      },
      { accountId }
    );
  }

  async getCount(accountId: string, userId: string): Promise<Result<number, AppError>> {
    return this.withQuery(
      "getCount",
      async () => {
        return prisma.trades.count({ where: { account_id: accountId, user_id: userId } });
      },
      { accountId }
    );
  }

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
    return this.withQuery(
      "getDashboardMetrics",
      async () => {
        const result = await prisma.$queryRaw<
          Array<{
            total_trades: bigint;
            wins: bigint;
            losses: bigint;
            breakeven: bigint;
            total_pnl: number | null;
          }>
        >`
        SELECT COUNT(*) as total_trades, COUNT(*) FILTER (WHERE outcome = 'win') as wins,
        COUNT(*) FILTER (WHERE outcome = 'loss') as losses, COUNT(*) FILTER (WHERE outcome = 'breakeven') as breakeven,
        COALESCE(SUM(pnl), 0) as total_pnl FROM trades WHERE account_id = ${accountId}::uuid AND user_id = ${userId}::uuid
      `;
        const row = result[0];
        const totalTrades = Number(row?.total_trades || 0),
          wins = Number(row?.wins || 0),
          losses = Number(row?.losses || 0);
        const breakeven = Number(row?.breakeven || 0),
          totalPnl = Number(row?.total_pnl || 0);
        const decisiveTrades = wins + losses;
        const winRate = decisiveTrades > 0 ? (wins / decisiveTrades) * 100 : 0;
        return {
          totalTrades,
          wins,
          losses,
          breakeven,
          winRate: Math.round(winRate * 100) / 100,
          totalPnl,
        };
      },
      { accountId }
    );
  }

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
    return this.withQuery(
      "getAdvancedMetrics",
      async () => {
        const result = await prisma.$queryRaw<
          Array<{
            avg_pnl: number | null;
            pnl_stddev: number | null;
            total_pnl: number | null;
            total_wins: bigint;
            total_losses: bigint;
            sum_wins: number | null;
            sum_losses: number | null;
            max_win: number | null;
            max_loss: number | null;
          }>
        >`
        SELECT AVG(pnl) as avg_pnl, STDDEV_POP(pnl) as pnl_stddev, SUM(pnl) as total_pnl,
        COUNT(*) FILTER (WHERE outcome = 'win') as total_wins, COUNT(*) FILTER (WHERE outcome = 'loss') as total_losses,
        COALESCE(SUM(pnl) FILTER (WHERE outcome = 'win'), 0) as sum_wins,
        COALESCE(ABS(SUM(pnl) FILTER (WHERE outcome = 'loss')), 0) as sum_losses,
        COALESCE(MAX(pnl) FILTER (WHERE outcome = 'win'), 0) as max_win,
        COALESCE(MIN(pnl) FILTER (WHERE outcome = 'loss'), 0) as max_loss
        FROM trades WHERE account_id = ${accountId}::uuid AND user_id = ${userId}::uuid
      `;

        const streakResult = await prisma.$queryRaw<
          Array<{
            current_streak: number | null;
            max_win_streak: number | null;
            max_loss_streak: number | null;
          }>
        >`
        WITH ordered_trades AS (
          SELECT outcome, ROW_NUMBER() OVER (ORDER BY entry_date DESC, entry_time DESC) as rn,
          LAG(outcome) OVER (ORDER BY entry_date DESC, entry_time DESC) as prev_outcome
          FROM trades WHERE account_id = ${accountId}::uuid AND user_id = ${userId}::uuid
        ), streak_groups AS (
          SELECT outcome, rn, SUM(CASE WHEN outcome != prev_outcome OR prev_outcome IS NULL THEN 1 ELSE 0 END) OVER (ORDER BY rn) as streak_group
          FROM ordered_trades
        ), streaks AS (
          SELECT outcome, COUNT(*) as streak_len, MIN(rn) as first_rn FROM streak_groups GROUP BY outcome, streak_group
        )
        SELECT (SELECT streak_len FROM streaks WHERE first_rn = 1 LIMIT 1) as current_streak,
        COALESCE((SELECT MAX(streak_len) FROM streaks WHERE outcome = 'win'), 0) as max_win_streak,
        COALESCE((SELECT MAX(streak_len) FROM streaks WHERE outcome = 'loss'), 0) as max_loss_streak
      `;

        const row = result[0],
          streakRow = streakResult[0];
        const avgPnl = Number(row?.avg_pnl || 0),
          pnlStdDev = Number(row?.pnl_stddev || 0),
          totalPnl = Number(row?.total_pnl || 0);
        const totalWins = Number(row?.total_wins || 0),
          totalLosses = Number(row?.total_losses || 0);
        const sumWins = Number(row?.sum_wins || 0),
          sumLosses = Number(row?.sum_losses || 0);
        const maxWin = Number(row?.max_win || 0),
          maxLoss = Math.abs(Number(row?.max_loss || 0));

        const sharpeRatio = pnlStdDev > 0 ? avgPnl / pnlStdDev : 0;
        const estimatedMaxDrawdown = maxLoss;
        const maxDrawdownPercent =
          initialBalance > 0 ? (estimatedMaxDrawdown / initialBalance) * 100 : 0;
        const calmarRatio = estimatedMaxDrawdown > 0 ? totalPnl / estimatedMaxDrawdown : 0;
        const profitFactor = sumLosses > 0 ? sumWins / sumLosses : sumWins > 0 ? Infinity : 0;
        const avgWin = totalWins > 0 ? sumWins / totalWins : 0,
          avgLoss = totalLosses > 0 ? sumLosses / totalLosses : 0;

        return {
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
        };
      },
      { accountId, initialBalance }
    );
  }

  async getHistoryLite(
    accountId: string,
    userId: string,
    dateRange?: { start: Date; end: Date }
  ): Promise<Result<TradeLite[], AppError>> {
    return this.withQuery(
      "getHistoryLite",
      async () => {
        const where: Prisma.tradesWhereInput = { account_id: accountId, user_id: userId };
        if (dateRange) where.entry_date = { gte: dateRange.start, lte: dateRange.end };

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

        return trades.map((t) => ({
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
      },
      { accountId }
    );
  }

  async getByUserId(
    userId: string,
    options?: { limit?: number; offset?: number; accountId?: string; accountIds?: string[] }
  ): Promise<Result<Trade[], AppError>> {
    return this.withQuery(
      "getByUserId",
      async () => {
        const where: Prisma.tradesWhereInput = { user_id: userId };
        if (options?.accountId) where.account_id = options.accountId;
        else if (options?.accountIds?.length) where.account_id = { in: options.accountIds };

        const trades = await prisma.trades.findMany({
          where,
          orderBy: [{ entry_date: "desc" }, { entry_time: "desc" }],
          take: options?.limit,
          skip: options?.offset,
        });
        return trades.map(mapPrismaToTrade);
      },
      { userId }
    );
  }

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
    return this.withQuery(
      "getMenteeStats",
      async () => {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const where: Prisma.tradesWhereInput = { user_id: userId };
        if (accountIds?.length) where.account_id = { in: accountIds };

        const trades = await prisma.trades.findMany({
          where,
          select: { id: true, outcome: true, entry_date: true },
          orderBy: { entry_date: "desc" },
        });

        const totalTrades = trades.length,
          wins = trades.filter((t) => t.outcome === "win").length;
        const winRate = totalTrades > 0 ? Math.round((wins / totalTrades) * 100) : 0;
        const recentTradesCount = trades.filter(
          (t) => t.entry_date && new Date(t.entry_date) >= sevenDaysAgo
        ).length;
        const lastTradeDate = trades[0]?.entry_date
          ? trades[0].entry_date instanceof Date
            ? trades[0].entry_date.toISOString().split("T")[0]
            : String(trades[0].entry_date)
          : undefined;

        return { totalTrades, wins, winRate, recentTradesCount, lastTradeDate };
      },
      { userId }
    );
  }
}

export const prismaTradeRepo = new PrismaTradeRepository();
export { PrismaTradeRepository };
