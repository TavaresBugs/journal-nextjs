/**
 * Prisma Community Repository
 *
 * Type-safe implementation of CommunityRepository using Prisma ORM.
 * Handles leaderboard and shared playbooks.
 *
 * @example
 * import { prismaCommunityRepo } from '@/lib/database/repositories';
 * const leaderboard = await prismaCommunityRepo.getLeaderboard();
 */

import { prisma } from "@/lib/database";
import {
  leaderboard_opt_in as PrismaLeaderboardOptIn,
  shared_playbooks as PrismaSharedPlaybook,
} from "@/generated/prisma";
import { Result } from "../types";
import { AppError, ErrorCode } from "@/lib/errors";
import { Logger } from "@/lib/logging/Logger";

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
  // Populated fields
  playbookTitle?: string;
  authorName?: string;
  isStarredByMe?: boolean;
}

// Mappers
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

class PrismaCommunityRepository {
  private logger = new Logger("PrismaCommunityRepository");

  // ========================================
  // LEADERBOARD
  // ========================================

  /**
   * Get user's leaderboard status.
   */
  async getMyLeaderboardStatus(userId: string): Promise<Result<LeaderboardOptIn | null, AppError>> {
    this.logger.info("Fetching leaderboard status", { userId });

    try {
      const optIn = await prisma.leaderboard_opt_in.findUnique({
        where: { user_id: userId },
      });

      if (!optIn) {
        return { data: null, error: null };
      }

      return { data: mapLeaderboardOptInFromPrisma(optIn), error: null };
    } catch (error) {
      this.logger.error("Failed to fetch leaderboard status", { error });
      return {
        data: null,
        error: new AppError("Failed to fetch leaderboard status", ErrorCode.DB_QUERY_FAILED, 500),
      };
    }
  }

  /**
   * Join leaderboard.
   */
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
    this.logger.info("Joining leaderboard", { userId, displayName });

    try {
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

      return { data: mapLeaderboardOptInFromPrisma(created), error: null };
    } catch (error) {
      this.logger.error("Failed to join leaderboard", { error });
      return {
        data: null,
        error: new AppError("Failed to join leaderboard", ErrorCode.DB_QUERY_FAILED, 500),
      };
    }
  }

  /**
   * Leave leaderboard.
   */
  async leaveLeaderboard(userId: string): Promise<Result<boolean, AppError>> {
    this.logger.info("Leaving leaderboard", { userId });

    try {
      await prisma.leaderboard_opt_in.delete({
        where: { user_id: userId },
      });

      return { data: true, error: null };
    } catch (error) {
      this.logger.error("Failed to leave leaderboard", { error });
      return {
        data: null,
        error: new AppError("Failed to leave leaderboard", ErrorCode.DB_QUERY_FAILED, 500),
      };
    }
  }

  /**
   * Update leaderboard preferences.
   */
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
    this.logger.info("Updating leaderboard preferences", { userId });

    try {
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

      return { data: mapLeaderboardOptInFromPrisma(updated), error: null };
    } catch (error) {
      this.logger.error("Failed to update leaderboard preferences", { error });
      return {
        data: null,
        error: new AppError("Failed to update preferences", ErrorCode.DB_QUERY_FAILED, 500),
      };
    }
  }

  /**
   * Get all leaderboard entries (with stats calculated).
   * Note: Actual stats calculation requires joining with trades table.
   */
  async getLeaderboardOptIns(): Promise<Result<LeaderboardOptIn[], AppError>> {
    this.logger.info("Fetching leaderboard opt-ins");

    try {
      const optIns = await prisma.leaderboard_opt_in.findMany({
        orderBy: { created_at: "asc" },
      });

      return { data: optIns.map(mapLeaderboardOptInFromPrisma), error: null };
    } catch (error) {
      this.logger.error("Failed to fetch leaderboard opt-ins", { error });
      return {
        data: null,
        error: new AppError("Failed to fetch leaderboard", ErrorCode.DB_QUERY_FAILED, 500),
      };
    }
  }

  // ========================================
  // SHARED PLAYBOOKS
  // ========================================

  /**
   * Share a playbook.
   */
  async sharePlaybook(
    userId: string,
    playbookId: string,
    description?: string
  ): Promise<Result<SharedPlaybook, AppError>> {
    this.logger.info("Sharing playbook", { userId, playbookId });

    try {
      // Check if already shared
      const existing = await prisma.shared_playbooks.findUnique({
        where: { playbook_id: playbookId },
      });

      if (existing) {
        // Update existing
        const updated = await prisma.shared_playbooks.update({
          where: { playbook_id: playbookId },
          data: {
            is_public: true,
            description: description || existing.description,
            updated_at: new Date(),
          },
        });
        return { data: mapSharedPlaybookFromPrisma(updated), error: null };
      }

      // Create new
      const created = await prisma.shared_playbooks.create({
        data: {
          user_id: userId,
          playbook_id: playbookId,
          is_public: true,
          description: description || null,
        },
      });

      return { data: mapSharedPlaybookFromPrisma(created), error: null };
    } catch (error) {
      this.logger.error("Failed to share playbook", { error });
      return {
        data: null,
        error: new AppError("Failed to share playbook", ErrorCode.DB_QUERY_FAILED, 500),
      };
    }
  }

  /**
   * Unshare a playbook.
   */
  async unsharePlaybook(playbookId: string, userId: string): Promise<Result<boolean, AppError>> {
    this.logger.info("Unsharing playbook", { playbookId });

    try {
      await prisma.shared_playbooks.update({
        where: { playbook_id: playbookId, user_id: userId },
        data: { is_public: false, updated_at: new Date() },
      });

      return { data: true, error: null };
    } catch (error) {
      this.logger.error("Failed to unshare playbook", { error });
      return {
        data: null,
        error: new AppError("Failed to unshare playbook", ErrorCode.DB_QUERY_FAILED, 500),
      };
    }
  }

  /**
   * Get public playbooks.
   */
  async getPublicPlaybooks(limit = 20, offset = 0): Promise<Result<SharedPlaybook[], AppError>> {
    this.logger.info("Fetching public playbooks", { limit, offset });

    try {
      const playbooks = await prisma.shared_playbooks.findMany({
        where: { is_public: true },
        orderBy: { stars: "desc" },
        take: limit,
        skip: offset,
      });

      return { data: playbooks.map(mapSharedPlaybookFromPrisma), error: null };
    } catch (error) {
      this.logger.error("Failed to fetch public playbooks", { error });
      return {
        data: null,
        error: new AppError("Failed to fetch public playbooks", ErrorCode.DB_QUERY_FAILED, 500),
      };
    }
  }

  /**
   * Get user's shared playbooks.
   */
  async getMySharedPlaybooks(userId: string): Promise<Result<SharedPlaybook[], AppError>> {
    this.logger.info("Fetching user shared playbooks", { userId });

    try {
      const playbooks = await prisma.shared_playbooks.findMany({
        where: { user_id: userId },
        orderBy: { created_at: "desc" },
      });

      return { data: playbooks.map(mapSharedPlaybookFromPrisma), error: null };
    } catch (error) {
      this.logger.error("Failed to fetch user shared playbooks", { error });
      return {
        data: null,
        error: new AppError("Failed to fetch shared playbooks", ErrorCode.DB_QUERY_FAILED, 500),
      };
    }
  }

  /**
   * Toggle star on a shared playbook.
   */
  async togglePlaybookStar(
    sharedPlaybookId: string,
    userId: string
  ): Promise<Result<boolean, AppError>> {
    this.logger.info("Toggling playbook star", { sharedPlaybookId, userId });

    try {
      // Check if already starred
      const existing = await prisma.playbook_stars.findUnique({
        where: {
          shared_playbook_id_user_id: {
            shared_playbook_id: sharedPlaybookId,
            user_id: userId,
          },
        },
      });

      if (existing) {
        // Remove star
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
        return { data: false, error: null }; // Not starred
      } else {
        // Add star
        await prisma.$transaction([
          prisma.playbook_stars.create({
            data: {
              user_id: userId,
              shared_playbook_id: sharedPlaybookId,
            },
          }),
          prisma.shared_playbooks.update({
            where: { id: sharedPlaybookId },
            data: { stars: { increment: 1 } },
          }),
        ]);
        return { data: true, error: null }; // Starred
      }
    } catch (error) {
      this.logger.error("Failed to toggle playbook star", { error });
      return {
        data: null,
        error: new AppError("Failed to toggle star", ErrorCode.DB_QUERY_FAILED, 500),
      };
    }
  }

  /**
   * Increment playbook downloads.
   */
  async incrementPlaybookDownloads(sharedPlaybookId: string): Promise<Result<boolean, AppError>> {
    this.logger.info("Incrementing playbook downloads", { sharedPlaybookId });

    try {
      await prisma.shared_playbooks.update({
        where: { id: sharedPlaybookId },
        data: { downloads: { increment: 1 } },
      });

      return { data: true, error: null };
    } catch (error) {
      this.logger.error("Failed to increment downloads", { error });
      return {
        data: null,
        error: new AppError("Failed to increment downloads", ErrorCode.DB_QUERY_FAILED, 500),
      };
    }
  }
}

// Export singleton instance
export const prismaCommunityRepo = new PrismaCommunityRepository();
export { PrismaCommunityRepository };
