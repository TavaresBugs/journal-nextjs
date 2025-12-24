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
import { Playbook, RuleGroup, PlaybookStats } from "@/types";

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
   * Fetches playbook statistics for a user, largely replacing client-side calculation.
   */
  async getPlaybookStats(
    userId: string,
    accountId?: string
  ): Promise<Result<PlaybookStats[], AppError>> {
    this.logger.info("Fetching playbook stats", { userId, accountId });

    try {
      // 1. Get all playbooks first (to include those with 0 trades)
      const playbooksRes = accountId
        ? await this.getByAccountId(accountId)
        : await this.getByUserId(userId);

      if (playbooksRes.error) return { data: null, error: playbooksRes.error };
      const playbooks = playbooksRes.data || [];
      const playbookNames = new Set(playbooks.map((p) => p.name));

      // 2. Aggregate Metrics via Prisma
      // We run parallel aggregations because conditional aggregation in one query is complex with Prisma groupBy
      const whereCondition = {
        user_id: userId,
        account_id: accountId, // Optional filter
        NOT: { strategy: null }, // Only trades with strategy
      };

      const statsMap = new Map<string, PlaybookStats>();

      // Initialize with Playbooks
      playbooks.forEach((pb) => {
        statsMap.set(pb.name, {
          id: pb.id,
          name: pb.name,
          totalTrades: 0,
          wins: 0,
          losses: 0,
          breakeven: 0,
          netPnL: 0,
          winRate: 0,
          profitFactor: 0,
          avgWin: 0,
          avgLoss: 0,
          expectancy: 0,
          avgRR: 0,
        });
      });

      const [totals, wins, losses, breakeven] = await Promise.all([
        // Total stats (count, sum pnl, avg rr)
        prisma.trades.groupBy({
          by: ["strategy"],
          where: { ...whereCondition, strategy: { not: null } },
          _count: { _all: true },
          _sum: { pnl: true },
          _avg: { r_multiple: true },
        }),
        // Win stats
        prisma.trades.groupBy({
          by: ["strategy"],
          where: { ...whereCondition, outcome: "win", strategy: { not: null } },
          _count: { _all: true },
          _sum: { pnl: true },
        }),
        // Loss stats
        prisma.trades.groupBy({
          by: ["strategy"],
          where: { ...whereCondition, outcome: "loss", strategy: { not: null } },
          _count: { _all: true },
          _sum: { pnl: true },
        }),
        // Breakeven stats
        prisma.trades.groupBy({
          by: ["strategy"],
          where: { ...whereCondition, outcome: "breakeven", strategy: { not: null } },
          _count: { _all: true },
        }),
      ]);

      // Process totals
      for (const t of totals) {
        if (!t.strategy) continue;

        const current = statsMap.get(t.strategy) || {
          name: t.strategy,
          totalTrades: 0,
          wins: 0,
          losses: 0,
          breakeven: 0,
          netPnL: 0,
          winRate: 0,
          profitFactor: 0,
          avgWin: 0,
          avgLoss: 0,
          expectancy: 0,
          avgRR: 0,
        };

        current.totalTrades = t._count._all;
        current.netPnL = t._sum.pnl ? t._sum.pnl.toNumber() : 0;
        current.avgRR = t._avg.r_multiple ? t._avg.r_multiple.toNumber() : 0;

        statsMap.set(t.strategy, current);
      }

      // Process wins
      for (const w of wins) {
        if (!w.strategy) continue;
        const current = statsMap.get(w.strategy) || {
          name: w.strategy,
          totalTrades: 0,
          wins: 0,
          losses: 0,
          breakeven: 0,
          netPnL: 0,
          winRate: 0,
          profitFactor: 0,
          avgWin: 0,
          avgLoss: 0,
          expectancy: 0,
          avgRR: 0,
        };
        current.wins = w._count._all;
        statsMap.set(w.strategy, current);
      }

      // Process losses
      for (const l of losses) {
        if (!l.strategy) continue;
        const current = statsMap.get(l.strategy) || {
          name: l.strategy,
          totalTrades: 0,
          wins: 0,
          losses: 0,
          breakeven: 0,
          netPnL: 0,
          winRate: 0,
          profitFactor: 0,
          avgWin: 0,
          avgLoss: 0,
          expectancy: 0,
          avgRR: 0,
        };
        current.losses = l._count._all;
        statsMap.set(l.strategy, current);
      }

      // Process breakeven
      for (const b of breakeven) {
        if (!b.strategy) continue;
        const current = statsMap.get(b.strategy) || {
          name: b.strategy,
          totalTrades: 0,
          wins: 0,
          losses: 0,
          breakeven: 0,
          netPnL: 0,
          winRate: 0,
          profitFactor: 0,
          avgWin: 0,
          avgLoss: 0,
          expectancy: 0,
          avgRR: 0,
        };
        current.breakeven = b._count._all;
        statsMap.set(b.strategy, current);
      }

      // Also handle "Sem Estratégia" or strategies not in playbooks list
      // We add them dynamically if found in trades
      const allStrategies = new Set([...totals.map((t) => t.strategy!), ...playbookNames]);

      allStrategies.forEach((strategy) => {
        if (!strategy) return;

        // Find aggregates
        const total = totals.find((t) => t.strategy === strategy);
        const win = wins.find((t) => t.strategy === strategy);
        const loss = losses.find((t) => t.strategy === strategy);
        const be = breakeven.find((t) => t.strategy === strategy);

        const totalTrades = total?._count._all || 0;
        const totalWins = win?._count._all || 0;
        const totalLosses = loss?._count._all || 0;
        const totalBreakeven = be?._count._all || 0;
        const netPnL = Number(total?._sum.pnl || 0);
        const sumWins = Number(win?._sum.pnl || 0);
        const sumLosses = Math.abs(Number(loss?._sum.pnl || 0));
        const avgRR = total?._avg.r_multiple ? Number(total._avg.r_multiple) : 0;

        // Calculate derived
        const winRate = totalTrades > 0 ? (totalWins / totalTrades) * 100 : 0;
        const profitFactor = sumLosses > 0 ? sumWins / sumLosses : sumWins > 0 ? 999 : 0;
        const avgWin = totalWins > 0 ? sumWins / totalWins : 0;
        const avgLoss = totalLosses > 0 ? sumLosses / totalLosses : 0;
        const expectancy =
          totalTrades > 0 ? (winRate / 100) * avgWin - (1 - winRate / 100) * avgLoss : 0;

        // Existing stats (from playbook init) or new object
        const existing = statsMap.get(strategy) || {
          name: strategy,
          id: undefined, // "Sem Estratégia" or manual strategy has no ID
          totalTrades: 0,
          wins: 0,
          losses: 0,
          breakeven: 0,
          netPnL: 0,
          winRate: 0,
          profitFactor: 0,
          avgWin: 0,
          avgLoss: 0,
          expectancy: 0,
          avgRR: 0,
        };

        statsMap.set(strategy, {
          ...existing,
          totalTrades,
          wins: totalWins,
          losses: totalLosses,
          breakeven: totalBreakeven,
          netPnL,
          winRate,
          profitFactor,
          avgWin,
          avgLoss,
          expectancy,
          avgRR,
        });
      });

      // Convert to array and sort
      const results = Array.from(statsMap.values()).sort((a, b) => {
        // "Sem Estratégia" always last
        if (a.name === "Sem Estratégia") return 1;
        if (b.name === "Sem Estratégia") return -1;
        // Then by PnL desc
        return b.netPnL - a.netPnL;
      });

      return { data: results, error: null };
    } catch (error) {
      this.logger.error("Failed to calculate playbook stats", { error });
      return {
        data: null,
        error: new AppError("Failed to calculate stats", ErrorCode.DB_QUERY_FAILED, 500),
      };
    }
  }

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
   * Fetches a single playbook by ID with ownership verification.
   * @param id - The playbook ID to fetch
   * @param userId - The user ID for ownership verification (REQUIRED for security)
   */
  async getById(id: string, userId: string): Promise<Result<Playbook, AppError>> {
    this.logger.info("Fetching playbook by ID", { id, userId });

    try {
      // Use compound where clause for security (prevents IDOR)
      const playbook = await prisma.playbooks.findFirst({
        where: {
          id,
          user_id: userId,
        },
      });

      if (!playbook) {
        return {
          data: null,
          error: new AppError("Playbook not found", ErrorCode.DB_NOT_FOUND, 404),
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
