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
export async function getLeaderboardAction(): Promise<LeaderboardEntry[]> {
  try {
    // Query the leaderboard view
    const leaderboard = await prisma.$queryRaw<
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

    // Map SQL snake_case fields to camelCase LeaderboardEntry
    return leaderboard.map((entry) => ({
      userId: entry.user_id,
      displayName: entry.display_name || "Trader",
      showWinRate: entry.show_win_rate ?? true,
      showProfitFactor: entry.show_profit_factor ?? false,
      showTotalTrades: entry.show_total_trades ?? true,
      showPnl: entry.show_pnl ?? true,
      totalTrades: entry.total_trades ?? undefined,
      winRate: entry.win_rate ?? undefined,
      totalPnl: entry.total_pnl ? Number(entry.total_pnl) : undefined,
      avgRR: entry.avg_rr ? Number(entry.avg_rr) : undefined,
      streak: entry.streak ?? 0,
    }));
  } catch (error) {
    console.error("[getLeaderboardAction] Error:", error);
    // Fallback to simple opt-ins if view fails
    const result = await prismaCommunityRepo.getLeaderboardOptIns();
    return (result.data || []).map((opt) => ({
      userId: opt.userId,
      displayName: opt.displayName,
      showWinRate: opt.showWinRate,
      showProfitFactor: opt.showProfitFactor,
      showTotalTrades: opt.showTotalTrades,
      showPnl: opt.showPnl,
      streak: 0,
    }));
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
