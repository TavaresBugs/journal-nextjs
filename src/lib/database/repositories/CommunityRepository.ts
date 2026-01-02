/**
 * Prisma Community Repository
 *
 * Type-safe implementation of CommunityRepository using Prisma ORM.
 * Handles leaderboard and shared playbooks.
 * Extends BaseRepository for common logging and error handling.
 */

import { prisma } from "@/lib/database";
import {
  leaderboard_opt_in as PrismaLeaderboardOptIn,
  shared_playbooks as PrismaSharedPlaybook,
} from "@/generated/prisma";
import { Result } from "../types";
import { AppError } from "@/lib/errors";
import { BaseRepository } from "./BaseRepository";
import { formatTimeMinutes } from "@/lib/calculations";

// Domain types
export interface LeaderboardOptIn {
  userId: string;
  displayName: string;
  showWinRate: boolean;
  showProfitFactor: boolean;
  showTotalTrades: boolean;
  showPnl: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LeaderboardEntry {
  rank: number;
  displayName: string;
  winRate: number | null;
  profitFactor: number | null;
  totalTrades: number | null;
  totalPnl: number | null;
  showWinRate: boolean;
  showProfitFactor: boolean;
  showTotalTrades: boolean;
  showPnl: boolean;
}

export interface SharedPlaybook {
  id: string;
  playbookId: string;
  userId: string;
  isPublic: boolean;
  description: string | null;
  stars: number;
  downloads: number;
  createdAt: string;
  updatedAt: string;
  playbookTitle?: string;
  authorName?: string;
  isStarredByMe?: boolean;
}

function mapLeaderboardOptInFromPrisma(opt: PrismaLeaderboardOptIn): LeaderboardOptIn {
  return {
    userId: opt.user_id,
    displayName: opt.display_name,
    showWinRate: opt.show_win_rate || false,
    showProfitFactor: opt.show_profit_factor || false,
    showTotalTrades: opt.show_total_trades || false,
    showPnl: opt.show_pnl || false,
    createdAt: opt.created_at?.toISOString() || new Date().toISOString(),
    updatedAt: opt.updated_at?.toISOString() || new Date().toISOString(),
  };
}

function mapSharedPlaybookFromPrisma(sp: PrismaSharedPlaybook): SharedPlaybook {
  return {
    id: sp.id,
    playbookId: sp.playbook_id,
    userId: sp.user_id,
    isPublic: sp.is_public || false,
    description: sp.description,
    stars: sp.stars || 0,
    downloads: sp.downloads || 0,
    createdAt: sp.created_at?.toISOString() || new Date().toISOString(),
    updatedAt: sp.updated_at?.toISOString() || new Date().toISOString(),
  };
}

class PrismaCommunityRepository extends BaseRepository {
  protected readonly repositoryName = "PrismaCommunityRepository";

  // LEADERBOARD
  async getMyLeaderboardStatus(userId: string): Promise<Result<LeaderboardOptIn | null, AppError>> {
    return this.withQuery(
      "getMyLeaderboardStatus",
      async () => {
        const optIn = await prisma.leaderboard_opt_in.findUnique({ where: { user_id: userId } });
        return optIn ? mapLeaderboardOptInFromPrisma(optIn) : null;
      },
      { userId }
    );
  }

  async joinLeaderboard(
    userId: string,
    displayName: string,
    options?: {
      showWinRate?: boolean;
      showProfitFactor?: boolean;
      showTotalTrades?: boolean;
      showPnl?: boolean;
    }
  ): Promise<Result<LeaderboardOptIn, AppError>> {
    return this.withQuery(
      "joinLeaderboard",
      async () => {
        const created = await prisma.leaderboard_opt_in.create({
          data: {
            user_id: userId,
            display_name: displayName,
            show_win_rate: options?.showWinRate ?? true,
            show_profit_factor: options?.showProfitFactor ?? true,
            show_total_trades: options?.showTotalTrades ?? true,
            show_pnl: options?.showPnl ?? false,
          },
        });
        return mapLeaderboardOptInFromPrisma(created);
      },
      { userId, displayName }
    );
  }

  async leaveLeaderboard(userId: string): Promise<Result<boolean, AppError>> {
    return this.withQuery(
      "leaveLeaderboard",
      async () => {
        await prisma.leaderboard_opt_in.delete({ where: { user_id: userId } });
        return true;
      },
      { userId }
    );
  }

  async updateLeaderboardPreferences(
    userId: string,
    options: Partial<{
      displayName: string;
      showWinRate: boolean;
      showProfitFactor: boolean;
      showTotalTrades: boolean;
      showPnl: boolean;
    }>
  ): Promise<Result<LeaderboardOptIn, AppError>> {
    return this.withQuery(
      "updateLeaderboardPreferences",
      async () => {
        const updated = await prisma.leaderboard_opt_in.update({
          where: { user_id: userId },
          data: {
            display_name: options.displayName,
            show_win_rate: options.showWinRate,
            show_profit_factor: options.showProfitFactor,
            show_total_trades: options.showTotalTrades,
            show_pnl: options.showPnl,
            updated_at: new Date(),
          },
        });
        return mapLeaderboardOptInFromPrisma(updated);
      },
      { userId }
    );
  }

  async getLeaderboardOptIns(): Promise<Result<LeaderboardOptIn[], AppError>> {
    return this.withQuery("getLeaderboardOptIns", async () => {
      const optIns = await prisma.leaderboard_opt_in.findMany({ orderBy: { created_at: "asc" } });
      return optIns.map(mapLeaderboardOptInFromPrisma);
    });
  }

  // SHARED PLAYBOOKS
  async sharePlaybook(
    userId: string,
    playbookId: string,
    description?: string
  ): Promise<Result<SharedPlaybook, AppError>> {
    return this.withQuery(
      "sharePlaybook",
      async () => {
        const existing = await prisma.shared_playbooks.findUnique({
          where: { playbook_id: playbookId },
        });

        if (existing) {
          const updated = await prisma.shared_playbooks.update({
            where: { playbook_id: playbookId },
            data: {
              is_public: true,
              description: description || existing.description,
              updated_at: new Date(),
            },
          });
          return mapSharedPlaybookFromPrisma(updated);
        }

        const created = await prisma.shared_playbooks.create({
          data: {
            user_id: userId,
            playbook_id: playbookId,
            is_public: true,
            description: description || null,
          },
        });
        return mapSharedPlaybookFromPrisma(created);
      },
      { userId, playbookId }
    );
  }

  async unsharePlaybook(playbookId: string, userId: string): Promise<Result<boolean, AppError>> {
    return this.withQuery(
      "unsharePlaybook",
      async () => {
        await prisma.shared_playbooks.update({
          where: { playbook_id: playbookId, user_id: userId },
          data: { is_public: false, updated_at: new Date() },
        });
        return true;
      },
      { playbookId }
    );
  }

  async getPublicPlaybooks(limit = 20, offset = 0): Promise<Result<SharedPlaybook[], AppError>> {
    return this.withQuery(
      "getPublicPlaybooks",
      async () => {
        const playbooks = await prisma.shared_playbooks.findMany({
          where: { is_public: true },
          orderBy: { stars: "desc" },
          take: limit,
          skip: offset,
          include: { playbooks: true, users: { include: { profiles: true } } },
        });

        // Optimization: Batch fetch trades
        const globalStrategiesToFetch: { userId: string; strategy: string }[] = [];
        playbooks.forEach((sp) => {
          if (sp.user_id && sp.playbooks?.name) {
            globalStrategiesToFetch.push({ userId: sp.user_id, strategy: sp.playbooks.name });
          }
        });

        let allTrades: Array<{
          user_id: string | null;
          strategy: string | null;
          pnl: import("@/generated/prisma").Prisma.Decimal | null;
          outcome: string | null;
          r_multiple: import("@/generated/prisma").Prisma.Decimal | null;
          symbol: string;
          session: string | null;
          entry_date: Date;
          entry_time: string | null;
          exit_date: Date | null;
          exit_time: string | null;
        }> = [];

        if (globalStrategiesToFetch.length > 0) {
          allTrades = await prisma.trades.findMany({
            where: {
              OR: globalStrategiesToFetch.map((item) => ({
                user_id: item.userId,
                strategy: item.strategy,
              })),
            },
            select: {
              user_id: true,
              strategy: true,
              pnl: true,
              outcome: true,
              r_multiple: true,
              symbol: true,
              session: true,
              entry_date: true,
              entry_time: true,
              exit_date: true,
              exit_time: true,
            },
            orderBy: { entry_date: "asc" },
          });
        }

        const tradesMap = new Map<string, typeof allTrades>();
        allTrades.forEach((t) => {
          if (t.user_id && t.strategy) {
            const key = `${t.user_id}|${t.strategy}`;
            if (!tradesMap.has(key)) tradesMap.set(key, []);
            tradesMap.get(key)?.push(t);
          }
        });

        return playbooks.map((sp) => {
          const profile = sp.users?.profiles;
          const playbookName = sp.playbooks?.name;
          let authorStats = undefined;

          if (playbookName && sp.user_id) {
            const trades = tradesMap.get(`${sp.user_id}|${playbookName}`) || [];
            if (trades.length > 0) {
              const wins = trades.filter((t) => t.outcome === "win").length;
              const totalPnl = trades.reduce((sum, t) => sum + (Number(t.pnl) || 0), 0);
              const avgRR =
                trades.reduce((sum, t) => sum + (Number(t.r_multiple) || 0), 0) / trades.length;

              let maxStreak = 0,
                currentStreak = 0;
              for (const t of trades) {
                if (t.outcome === "win") {
                  currentStreak++;
                  maxStreak = Math.max(maxStreak, currentStreak);
                } else {
                  currentStreak = 0;
                }
              }

              let totalDurationMinutes = 0,
                validDurationCount = 0;
              for (const t of trades) {
                if (t.exit_date && t.exit_time && t.entry_date) {
                  try {
                    const combineDateTime = (date: Date, timeStr: string) =>
                      new Date(`${date.toISOString().split("T")[0]}T${timeStr}:00`);
                    const start = combineDateTime(t.entry_date, t.entry_time || "00:00");
                    const end = combineDateTime(t.exit_date, t.exit_time);
                    const minutes = (end.getTime() - start.getTime()) / 1000 / 60;
                    if (minutes > 0 && minutes < 43200) {
                      totalDurationMinutes += minutes;
                      validDurationCount++;
                    }
                  } catch {
                    /* ignore */
                  }
                }
              }

              const symbolCounts: Record<string, number> = {};
              trades.forEach((t) => {
                if (t.symbol) symbolCounts[t.symbol] = (symbolCounts[t.symbol] || 0) + 1;
              });
              const preferredSymbol = Object.entries(symbolCounts).sort(
                (a, b) => b[1] - a[1]
              )[0]?.[0];

              const sessionCounts: Record<string, number> = {};
              trades.forEach((t) => {
                if (t.session) sessionCounts[t.session] = (sessionCounts[t.session] || 0) + 1;
              });
              const preferredSession = Object.entries(sessionCounts).sort(
                (a, b) => b[1] - a[1]
              )[0]?.[0];

              authorStats = {
                totalTrades: trades.length,
                winRate: Math.round((wins / trades.length) * 100 * 10) / 10,
                avgRR: Math.round(avgRR * 100) / 100,
                netPnl: Math.round(totalPnl * 100) / 100,
                maxWinStreak: maxStreak,
                preferredSymbol,
                preferredSession,
                avgDuration:
                  validDurationCount > 0
                    ? formatTimeMinutes(totalDurationMinutes / validDurationCount)
                    : undefined,
              };
            }
          }

          return {
            ...mapSharedPlaybookFromPrisma(sp),
            playbook: sp.playbooks
              ? {
                  id: sp.playbooks.id,
                  name: sp.playbooks.name,
                  icon: sp.playbooks.icon,
                  color: sp.playbooks.color,
                  description: sp.playbooks.description,
                  ruleGroups: sp.playbooks.rule_groups as
                    | { id: string; name: string; rules: string[] }[]
                    | undefined,
                }
              : undefined,
            userName: profile?.display_name || "Trader Anônimo",
            userAvatar: profile?.avatar_url || undefined,
            authorStats,
          };
        }) as SharedPlaybook[];
      },
      { limit, offset }
    );
  }

  async getMySharedPlaybooks(userId: string): Promise<Result<SharedPlaybook[], AppError>> {
    return this.withQuery(
      "getMySharedPlaybooks",
      async () => {
        const playbooks = await prisma.shared_playbooks.findMany({
          where: { user_id: userId },
          orderBy: { created_at: "desc" },
        });
        return playbooks.map(mapSharedPlaybookFromPrisma);
      },
      { userId }
    );
  }

  async togglePlaybookStar(
    sharedPlaybookId: string,
    userId: string
  ): Promise<Result<boolean, AppError>> {
    return this.withQuery(
      "togglePlaybookStar",
      async () => {
        const existing = await prisma.playbook_stars.findUnique({
          where: {
            shared_playbook_id_user_id: { shared_playbook_id: sharedPlaybookId, user_id: userId },
          },
        });

        if (existing) {
          await prisma.$transaction([
            prisma.playbook_stars.delete({
              where: {
                shared_playbook_id_user_id: {
                  shared_playbook_id: sharedPlaybookId,
                  user_id: userId,
                },
              },
            }),
            prisma.shared_playbooks.update({
              where: { id: sharedPlaybookId },
              data: { stars: { decrement: 1 } },
            }),
          ]);
          return false;
        } else {
          await prisma.$transaction([
            prisma.playbook_stars.create({
              data: { user_id: userId, shared_playbook_id: sharedPlaybookId },
            }),
            prisma.shared_playbooks.update({
              where: { id: sharedPlaybookId },
              data: { stars: { increment: 1 } },
            }),
          ]);
          return true;
        }
      },
      { sharedPlaybookId, userId }
    );
  }

  async incrementPlaybookDownloads(sharedPlaybookId: string): Promise<Result<boolean, AppError>> {
    return this.withQuery(
      "incrementPlaybookDownloads",
      async () => {
        await prisma.shared_playbooks.update({
          where: { id: sharedPlaybookId },
          data: { downloads: { increment: 1 } },
        });
        return true;
      },
      { sharedPlaybookId }
    );
  }
}

export const prismaCommunityRepo = new PrismaCommunityRepository();
export { PrismaCommunityRepository };
