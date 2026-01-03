/**
 * Prisma Playbook Repository
 *
 * Type-safe implementation of PlaybookRepository using Prisma ORM.
 * Handles trading strategies/playbooks with rule groups.
 * Extends BaseRepository for common logging and error handling.
 */

import { prisma } from "@/lib/database";
import { playbooks as PrismaPlaybook } from "@/generated/prisma";
import { Result } from "../types";
import { AppError } from "@/lib/errors";
import { BaseRepository } from "./BaseRepository";
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

class PrismaPlaybookRepository extends BaseRepository {
  protected readonly repositoryName = "PrismaPlaybookRepository";

  /**
   * Fetches playbook statistics for a user.
   */
  async getPlaybookStats(
    userId: string,
    accountId?: string
  ): Promise<Result<PlaybookStats[], AppError>> {
    return this.withQuery(
      "getPlaybookStats",
      async () => {
        // 1. Get all playbooks first
        const playbooksRes = accountId
          ? await this.getByAccountId(accountId)
          : await this.getByUserId(userId);

        if (playbooksRes.error) throw playbooksRes.error;
        const playbooks = playbooksRes.data || [];
        const playbookNames = new Set(playbooks.map((p) => p.name));

        // 2. Aggregate Metrics via Prisma
        const whereCondition = {
          user_id: userId,
          account_id: accountId,
          NOT: { strategy: null },
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
          prisma.trades.groupBy({
            by: ["strategy"],
            where: { ...whereCondition, strategy: { not: null } },
            _count: { _all: true },
            _sum: { pnl: true },
            _avg: { r_multiple: true },
          }),
          prisma.trades.groupBy({
            by: ["strategy"],
            where: { ...whereCondition, outcome: "win", strategy: { not: null } },
            _count: { _all: true },
            _sum: { pnl: true },
          }),
          prisma.trades.groupBy({
            by: ["strategy"],
            where: { ...whereCondition, outcome: "loss", strategy: { not: null } },
            _count: { _all: true },
            _sum: { pnl: true },
          }),
          prisma.trades.groupBy({
            by: ["strategy"],
            where: { ...whereCondition, outcome: "breakeven", strategy: { not: null } },
            _count: { _all: true },
          }),
        ]);

        // Process all aggregations
        const allStrategies = new Set([...totals.map((t) => t.strategy!), ...playbookNames]);

        allStrategies.forEach((strategy) => {
          if (!strategy) return;

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

          const winRate = totalTrades > 0 ? (totalWins / totalTrades) * 100 : 0;
          const profitFactor = sumLosses > 0 ? sumWins / sumLosses : sumWins > 0 ? 999 : 0;
          const avgWin = totalWins > 0 ? sumWins / totalWins : 0;
          const avgLoss = totalLosses > 0 ? sumLosses / totalLosses : 0;
          const expectancy =
            totalTrades > 0 ? (winRate / 100) * avgWin - (1 - winRate / 100) * avgLoss : 0;

          const existing = statsMap.get(strategy) || { name: strategy };

          statsMap.set(strategy, {
            ...existing,
            name: strategy,
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

        return Array.from(statsMap.values()).sort((a, b) => {
          if (a.name === "Sem Estratégia") return 1;
          if (b.name === "Sem Estratégia") return -1;
          return b.netPnL - a.netPnL;
        });
      },
      { userId, accountId }
    );
  }

  /**
   * Fetches all playbooks for a user.
   */
  async getByUserId(userId: string): Promise<Result<Playbook[], AppError>> {
    return this.withQuery(
      "getByUserId",
      async () => {
        const playbooks = await prisma.playbooks.findMany({
          where: { user_id: userId },
          orderBy: { created_at: "desc" },
        });
        return playbooks.map(mapPlaybookFromPrisma);
      },
      { userId }
    );
  }

  /**
   * Fetches playbooks for an account.
   */
  async getByAccountId(accountId: string): Promise<Result<Playbook[], AppError>> {
    return this.withQuery(
      "getByAccountId",
      async () => {
        const playbooks = await prisma.playbooks.findMany({
          where: { account_id: accountId },
          orderBy: { name: "asc" },
        });
        return playbooks.map(mapPlaybookFromPrisma);
      },
      { accountId }
    );
  }

  /**
   * Fetches a single playbook by ID with ownership verification.
   */
  async getById(id: string, userId: string): Promise<Result<Playbook, AppError>> {
    return this.withQuery(
      "getById",
      async () => {
        const playbook = await prisma.playbooks.findFirst({
          where: { id, user_id: userId },
        });

        if (!playbook) {
          throw this.notFoundError("Playbook");
        }

        return mapPlaybookFromPrisma(playbook);
      },
      { id, userId }
    );
  }

  /**
   * Creates a new playbook.
   */
  async create(playbook: Partial<Playbook>): Promise<Result<Playbook, AppError>> {
    return this.withQuery(
      "create",
      async () => {
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
        return mapPlaybookFromPrisma(created);
      },
      { name: playbook.name }
    );
  }

  /**
   * Updates a playbook with ownership verification.
   */
  async update(
    id: string,
    userId: string,
    data: Partial<Playbook>
  ): Promise<Result<Playbook, AppError>> {
    return this.withQuery(
      "update",
      async () => {
        const existing = await prisma.playbooks.findUnique({
          where: { id },
          select: { user_id: true },
        });

        if (!existing || existing.user_id !== userId) {
          throw this.unauthorizedError();
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

        return mapPlaybookFromPrisma(updated);
      },
      { id, userId }
    );
  }

  /**
   * Deletes a playbook with ownership verification.
   */
  async delete(id: string, userId: string): Promise<Result<boolean, AppError>> {
    return this.withQuery(
      "delete",
      async () => {
        const deleted = await prisma.playbooks.deleteMany({
          where: { id, user_id: userId },
        });

        if (deleted.count === 0) {
          throw this.notFoundError("Playbook");
        }

        return true;
      },
      { id, userId }
    );
  }

  /**
   * Gets playbook count for a user.
   */
  async getCount(userId: string): Promise<Result<number, AppError>> {
    return this.withQuery(
      "getCount",
      async () => {
        return prisma.playbooks.count({ where: { user_id: userId } });
      },
      { userId }
    );
  }
}

// Export singleton instance
export const prismaPlaybookRepo = new PrismaPlaybookRepository();
export { PrismaPlaybookRepository };
