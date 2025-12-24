"use server";

/**
 * Community Server Actions
 *
 * Server-side actions for community operations using Prisma ORM.
 * Covers leaderboard and shared playbooks.
 *
 * @example
 * import { joinLeaderboardAction, getPublicPlaybooksAction } from "@/app/actions/community";
 *
 * const optIn = await joinLeaderboardAction("MyDisplayName");
 * const playbooks = await getPublicPlaybooksAction();
 */

import { prismaCommunityRepo, LeaderboardOptIn, SharedPlaybook } from "@/lib/database/repositories";
import { getCurrentUserId } from "@/lib/database/auth";
import { prisma } from "@/lib/database";
import { LeaderboardEntry } from "@/types";

// ========================================
// LEADERBOARD
// ========================================

/**
 * Get current user's leaderboard status.
 */
export async function getMyLeaderboardStatusAction(): Promise<LeaderboardOptIn | null> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return null;

    const result = await prismaCommunityRepo.getMyLeaderboardStatus(userId);

    if (result.error) {
      console.error("[getMyLeaderboardStatusAction] Error:", result.error);
      return null;
    }

    return result.data;
  } catch (error) {
    console.error("[getMyLeaderboardStatusAction] Unexpected error:", error);
    return null;
  }
}

/**
 * Join the leaderboard.
 */
export async function joinLeaderboardAction(
  displayName: string,
  options?: {
    showWinRate?: boolean;
    showProfitFactor?: boolean;
    showTotalTrades?: boolean;
    showPnl?: boolean;
  }
): Promise<{ success: boolean; optIn?: LeaderboardOptIn; error?: string }> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: "Not authenticated" };
    }

    const result = await prismaCommunityRepo.joinLeaderboard(userId, displayName, options);

    if (result.error) {
      console.error("[joinLeaderboardAction] Error:", result.error);
      return { success: false, error: result.error.message };
    }

    return { success: true, optIn: result.data || undefined };
  } catch (error) {
    console.error("[joinLeaderboardAction] Unexpected error:", error);
    return { success: false, error: "Unexpected error occurred" };
  }
}

/**
 * Leave the leaderboard.
 */
export async function leaveLeaderboardAction(): Promise<{ success: boolean; error?: string }> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: "Not authenticated" };
    }

    const result = await prismaCommunityRepo.leaveLeaderboard(userId);

    if (result.error) {
      console.error("[leaveLeaderboardAction] Error:", result.error);
      return { success: false, error: result.error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("[leaveLeaderboardAction] Unexpected error:", error);
    return { success: false, error: "Unexpected error occurred" };
  }
}

/**
 * Update leaderboard preferences.
 */
export async function updateLeaderboardPreferencesAction(
  options: Partial<{
    displayName: string;
    showWinRate: boolean;
    showProfitFactor: boolean;
    showTotalTrades: boolean;
    showPnl: boolean;
  }>
): Promise<{ success: boolean; error?: string }> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: "Not authenticated" };
    }

    const result = await prismaCommunityRepo.updateLeaderboardPreferences(userId, options);

    if (result.error) {
      console.error("[updateLeaderboardPreferencesAction] Error:", result.error);
      return { success: false, error: result.error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("[updateLeaderboardPreferencesAction] Unexpected error:", error);
    return { success: false, error: "Unexpected error occurred" };
  }
}

/**
 * Get all leaderboard opt-ins.
 */
export async function getLeaderboardOptInsAction(): Promise<LeaderboardOptIn[]> {
  try {
    const result = await prismaCommunityRepo.getLeaderboardOptIns();

    if (result.error) {
      console.error("[getLeaderboardOptInsAction] Error:", result.error);
      return [];
    }

    return result.data || [];
  } catch (error) {
    console.error("[getLeaderboardOptInsAction] Unexpected error:", error);
    return [];
  }
}

/**
 * Get current user display name.
 */
export async function getCurrentUserDisplayNameAction(): Promise<string | null> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return null;

    // 1. Try leaderboard_opt_in
    const status = await prismaCommunityRepo.getMyLeaderboardStatus(userId);
    if (status.data?.displayName) return status.data.displayName;

    // 2. Try profile
    const profile = await prisma.profiles.findUnique({
      where: { id: userId },
      select: { display_name: true },
    });
    if (profile?.display_name) return profile.display_name;

    return null;
  } catch (error) {
    console.error("[getCurrentUserDisplayNameAction] Error:", error);
    return null;
  }
}

/**
 * Get leaderboard entries.
 * Fetches from leaderboard_view and maps fields to LeaderboardEntry interface.
 */
// Helper to ensure the view definition is correct (self-healing)
async function ensureLeaderboardView() {
  // Define view to aggregate ALL trades per user (All-Time) with simple stats
  try {
    await prisma.$executeRaw`
      CREATE OR REPLACE VIEW public.leaderboard_view AS
      WITH user_stats AS (
        SELECT
          t.user_id,
          COUNT(t.id) as total_trades,
          SUM(CASE WHEN t.outcome = 'win' THEN 1 ELSE 0 END) as win_count,
          SUM(CASE WHEN t.outcome = 'loss' THEN 1 ELSE 0 END) as loss_count,
          SUM(COALESCE(t.pnl, 0)) as total_pnl,
          AVG(COALESCE(t.r_multiple, 0)) as avg_rr,
          0 as streak
        FROM
          public.trades t
        GROUP BY
          t.user_id
      )
      SELECT
        lo.user_id,
        lo.display_name,
        lo.show_win_rate,
        lo.show_profit_factor,
        lo.show_total_trades,
        lo.show_pnl,
        COALESCE(us.total_trades, 0) as total_trades,
        CASE 
          WHEN COALESCE(us.total_trades, 0) > 0 THEN (us.win_count::decimal / us.total_trades::decimal) * 100 
          ELSE 0 
        END as win_rate,
        COALESCE(us.total_pnl, 0) as total_pnl,
        COALESCE(us.avg_rr, 0) as avg_rr,
        0 as streak
      FROM
        public.leaderboard_opt_in lo
      LEFT JOIN
        user_stats us ON lo.user_id = us.user_id;
    `;
  } catch (e) {
    console.error("Failed to ensure leaderboard view", e);
  }
}

export async function getLeaderboardAction(): Promise<LeaderboardEntry[]> {
  try {
    // Ensure the view is correct before querying
    await ensureLeaderboardView();

    // 1. Query the leaderboard view for stats
    const leaderboardStats = await prisma.$queryRaw<
      Array<{
        user_id: string;
        display_name: string;
        show_win_rate: boolean | null;
        show_profit_factor: boolean | null;
        show_total_trades: boolean | null;
        show_pnl: boolean | null;
        total_trades: number | null;
        win_rate: number | null;
        total_pnl: number | null;
        avg_rr: number | null;
        streak: number | null;
      }>
    >`SELECT * FROM public.leaderboard_view LIMIT 100`;

    // 2. Fetch profile data for these users to ensure we have latest avatar and name
    const userIds = leaderboardStats.map((entry) => entry.user_id);
    const profiles = await prisma.profiles.findMany({
      where: { id: { in: userIds } },
      select: { id: true, display_name: true, avatar_url: true },
    });

    const profilesMap = new Map(profiles.map((p) => [p.id, p]));

    // 3. Map and merge
    return leaderboardStats.map((entry) => {
      const profile = profilesMap.get(entry.user_id);

      return {
        userId: entry.user_id,
        displayName: entry.display_name || profile?.display_name || "Trader",
        avatarUrl: profile?.avatar_url || undefined,
        showWinRate: entry.show_win_rate ?? true,
        showProfitFactor: entry.show_profit_factor ?? false,
        showTotalTrades: entry.show_total_trades ?? true,
        showPnl: entry.show_pnl ?? true,
        totalTrades: entry.total_trades != null ? Number(entry.total_trades) : undefined,
        winRate: entry.win_rate != null ? Number(entry.win_rate) : undefined,
        totalPnl: entry.total_pnl != null ? Number(entry.total_pnl) : undefined,
        avgRR: entry.avg_rr != null ? Number(entry.avg_rr) : undefined,
        streak: entry.streak != null ? Number(entry.streak) : 0,
      };
    });
  } catch (error) {
    console.error("[getLeaderboardAction] Error:", error);
    // Fallback if view fails completely
    const result = await prismaCommunityRepo.getLeaderboardOptIns();

    // Also fetch profiles for fallback
    const userIds = result.data?.map((opt) => opt.userId) || [];
    let profilesMap = new Map();
    if (userIds.length > 0) {
      try {
        const profiles = await prisma.profiles.findMany({
          where: { id: { in: userIds } },
          select: { id: true, display_name: true, avatar_url: true },
        });
        profilesMap = new Map(profiles.map((p) => [p.id, p]));
      } catch (e) {
        console.error("Failed to fetch profiles for fallback", e);
      }
    }

    return (result.data || []).map((opt) => {
      const profile = profilesMap.get(opt.userId);
      return {
        userId: opt.userId,
        displayName: opt.displayName || profile?.display_name || "Trader",
        avatarUrl: profile?.avatar_url || undefined,
        showWinRate: opt.showWinRate,
        showProfitFactor: opt.showProfitFactor,
        showTotalTrades: opt.showTotalTrades,
        showPnl: opt.showPnl,
        streak: 0,
      };
    });
  }
}

// ========================================
// SHARED PLAYBOOKS
// ========================================

/**
 * Share a playbook.
 */
export async function sharePlaybookAction(
  playbookId: string,
  description?: string
): Promise<{ success: boolean; sharedPlaybook?: SharedPlaybook; error?: string }> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: "Not authenticated" };
    }

    const result = await prismaCommunityRepo.sharePlaybook(userId, playbookId, description);

    if (result.error) {
      console.error("[sharePlaybookAction] Error:", result.error);
      return { success: false, error: result.error.message };
    }

    return { success: true, sharedPlaybook: result.data || undefined };
  } catch (error) {
    console.error("[sharePlaybookAction] Unexpected error:", error);
    return { success: false, error: "Unexpected error occurred" };
  }
}

/**
 * Unshare a playbook.
 */
export async function unsharePlaybookAction(
  playbookId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: "Not authenticated" };
    }

    const result = await prismaCommunityRepo.unsharePlaybook(playbookId, userId);

    if (result.error) {
      console.error("[unsharePlaybookAction] Error:", result.error);
      return { success: false, error: result.error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("[unsharePlaybookAction] Unexpected error:", error);
    return { success: false, error: "Unexpected error occurred" };
  }
}

/**
 * Get public playbooks.
 */
export async function getPublicPlaybooksAction(limit = 20, offset = 0): Promise<SharedPlaybook[]> {
  try {
    const result = await prismaCommunityRepo.getPublicPlaybooks(limit, offset);

    if (result.error) {
      console.error("[getPublicPlaybooksAction] Error:", result.error);
      return [];
    }

    return result.data || [];
  } catch (error) {
    console.error("[getPublicPlaybooksAction] Unexpected error:", error);
    return [];
  }
}

/**
 * Get current user's shared playbooks.
 */
export async function getMySharedPlaybooksAction(): Promise<SharedPlaybook[]> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return [];

    const result = await prismaCommunityRepo.getMySharedPlaybooks(userId);

    if (result.error) {
      console.error("[getMySharedPlaybooksAction] Error:", result.error);
      return [];
    }

    return result.data || [];
  } catch (error) {
    console.error("[getMySharedPlaybooksAction] Unexpected error:", error);
    return [];
  }
}

/**
 * Toggle star on a shared playbook.
 */
export async function togglePlaybookStarAction(
  sharedPlaybookId: string
): Promise<{ success: boolean; isStarred?: boolean; error?: string }> {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: "Not authenticated" };
    }

    const result = await prismaCommunityRepo.togglePlaybookStar(sharedPlaybookId, userId);

    if (result.error) {
      console.error("[togglePlaybookStarAction] Error:", result.error);
      return { success: false, error: result.error.message };
    }

    return { success: true, isStarred: result.data ?? undefined };
  } catch (error) {
    console.error("[togglePlaybookStarAction] Unexpected error:", error);
    return { success: false, error: "Unexpected error occurred" };
  }
}

/**
 * Increment playbook downloads.
 */
export async function incrementPlaybookDownloadsAction(
  sharedPlaybookId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await prismaCommunityRepo.incrementPlaybookDownloads(sharedPlaybookId);

    if (result.error) {
      console.error("[incrementPlaybookDownloadsAction] Error:", result.error);
      return { success: false, error: result.error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("[incrementPlaybookDownloadsAction] Unexpected error:", error);
    return { success: false, error: "Unexpected error occurred" };
  }
}
