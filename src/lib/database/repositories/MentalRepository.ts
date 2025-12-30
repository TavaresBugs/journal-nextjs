/**
 * Prisma Mental Repository
 *
 * Type-safe implementation of MentalRepository using Prisma ORM.
 * Handles mental profiles, entries, and logs for the Mental Hub feature.
 *
 * @example
 * import { prismaMentalRepo } from '@/lib/database/repositories';
 * const profiles = await prismaMentalRepo.getProfiles(userId);
 */

import { prisma } from "@/lib/database";
import {
  mental_profiles as PrismaMentalProfile,
  mental_entries as PrismaMentalEntry,
  mental_logs as PrismaMentalLog,
} from "@/generated/prisma";
import { Result } from "../types";
import { AppError, ErrorCode } from "@/lib/errors";
import { Logger } from "@/lib/logging/Logger";

// Domain types
export interface MentalProfile {
  id: string;
  userId: string | null;
  category: string;
  severity: number | null;
  description: string;
  zone: string;
  isSystem: boolean;
  createdAt: string;
}

export interface MentalEntry {
  id: string;
  userId: string;
  createdAt: string;
  triggerEvent: string | null;
  emotion: string | null;
  behavior: string | null;
  mistake: string | null;
  correction: string | null;
  zoneDetected: string | null;
  source: "grid" | "wizard";
}

export interface MentalLog {
  id: string;
  userId: string;
  moodTag: string | null;
  step1Problem: string;
  step2Validation: string | null;
  step3Flaw: string | null;
  step4Correction: string | null;
  step5Logic: string | null;
  createdAt: string;
}

// Mappers
function mapProfileFromPrisma(p: PrismaMentalProfile): MentalProfile {
  return {
    id: p.id,
    userId: p.user_id,
    category: p.category,
    severity: p.severity,
    description: p.description,
    zone: p.zone,
    isSystem: p.is_system || false,
    createdAt: p.created_at?.toISOString() || new Date().toISOString(),
  };
}

function mapEntryFromPrisma(e: PrismaMentalEntry): MentalEntry {
  return {
    id: e.id,
    userId: e.user_id,
    createdAt: e.created_at?.toISOString() || new Date().toISOString(),
    triggerEvent: e.trigger_event,
    emotion: e.emotion,
    behavior: e.behavior,
    mistake: e.mistake,
    correction: e.correction,
    zoneDetected: e.zone_detected,
    source: (e.source as "grid" | "wizard") || "grid",
  };
}

function mapLogFromPrisma(l: PrismaMentalLog): MentalLog {
  return {
    id: l.id,
    userId: l.user_id,
    moodTag: l.mood_tag,
    step1Problem: l.step_1_problem,
    step2Validation: l.step_2_validation,
    step3Flaw: l.step_3_flaw,
    step4Correction: l.step_4_correction,
    step5Logic: l.step_5_logic,
    createdAt: l.created_at?.toISOString() || new Date().toISOString(),
  };
}

class PrismaMentalRepository {
  private logger = new Logger("PrismaMentalRepository");

  // ========================================
  // PROFILES
  // ========================================

  /**
   * Get all profiles for a user (including system profiles).
   */
  async getProfiles(userId: string): Promise<Result<MentalProfile[], AppError>> {
    this.logger.info("Fetching mental profiles", { userId });

    try {
      const profiles = await prisma.mental_profiles.findMany({
        where: {
          OR: [{ user_id: userId }, { is_system: true }],
        },
        orderBy: [{ category: "asc" }, { severity: "desc" }],
      });

      return { data: profiles.map(mapProfileFromPrisma), error: null };
    } catch (error) {
      this.logger.error("Failed to fetch profiles", { error });
      return {
        data: null,
        error: new AppError("Failed to fetch profiles", ErrorCode.DB_QUERY_FAILED, 500),
      };
    }
  }

  /**
   * Search profiles by description text.
   */
  async searchProfiles(
    query: string,
    category?: string
  ): Promise<Result<MentalProfile[], AppError>> {
    this.logger.info("Searching mental profiles", { query, category });

    try {
      const profiles = await prisma.mental_profiles.findMany({
        where: {
          description: { contains: query, mode: "insensitive" },
          ...(category ? { category } : {}),
        },
        orderBy: { severity: "desc" },
        take: 20,
      });

      return { data: profiles.map(mapProfileFromPrisma), error: null };
    } catch (error) {
      this.logger.error("Failed to search profiles", { error });
      return {
        data: null,
        error: new AppError("Failed to search profiles", ErrorCode.DB_QUERY_FAILED, 500),
      };
    }
  }

  /**
   * Create profiles for a user (seeding).
   */
  async createProfiles(
    userId: string,
    profiles: Array<{
      category: string;
      description: string;
      zone: string;
      severity: number;
    }>
  ): Promise<Result<MentalProfile[], AppError>> {
    this.logger.info("Creating mental profiles", { userId, count: profiles.length });

    try {
      const created = await prisma.mental_profiles.createManyAndReturn({
        data: profiles.map((p) => ({
          user_id: userId,
          category: p.category,
          description: p.description,
          zone: p.zone,
          severity: p.severity,
          is_system: false,
        })),
      });

      return { data: created.map(mapProfileFromPrisma), error: null };
    } catch (error) {
      this.logger.error("Failed to create profiles", { error });
      return {
        data: null,
        error: new AppError("Failed to create profiles", ErrorCode.DB_QUERY_FAILED, 500),
      };
    }
  }

  /**
   * Check if user has any non-system profiles.
   */
  async hasUserProfiles(userId: string): Promise<Result<boolean, AppError>> {
    try {
      const count = await prisma.mental_profiles.count({
        where: { user_id: userId, is_system: false },
      });

      return { data: count > 0, error: null };
    } catch (error) {
      this.logger.error("Failed to check profiles", { error });
      return {
        data: null,
        error: new AppError("Failed to check profiles", ErrorCode.DB_QUERY_FAILED, 500),
      };
    }
  }

  // ========================================
  // ENTRIES
  // ========================================

  /**
   * Get mental entries for a user.
   */
  async getEntries(userId: string, limit = 50): Promise<Result<MentalEntry[], AppError>> {
    this.logger.info("Fetching mental entries", { userId, limit });

    try {
      const entries = await prisma.mental_entries.findMany({
        where: { user_id: userId },
        orderBy: { created_at: "desc" },
        take: limit,
      });

      return { data: entries.map(mapEntryFromPrisma), error: null };
    } catch (error) {
      this.logger.error("Failed to fetch entries", { error });
      return {
        data: null,
        error: new AppError("Failed to fetch entries", ErrorCode.DB_QUERY_FAILED, 500),
      };
    }
  }

  /**
   * Create a mental entry.
   */
  async createEntry(
    userId: string,
    data: {
      triggerEvent?: string;
      emotion?: string;
      behavior?: string;
      mistake?: string;
      correction?: string;
      zoneDetected?: string;
      source?: "grid" | "wizard";
    }
  ): Promise<Result<MentalEntry, AppError>> {
    this.logger.info("Creating mental entry", { userId });

    try {
      const created = await prisma.mental_entries.create({
        data: {
          user_id: userId,
          trigger_event: data.triggerEvent || null,
          emotion: data.emotion || null,
          behavior: data.behavior || null,
          mistake: data.mistake || null,
          correction: data.correction || null,
          zone_detected: data.zoneDetected || null,
          source: data.source || "grid",
        },
      });

      return { data: mapEntryFromPrisma(created), error: null };
    } catch (error) {
      this.logger.error("Failed to create entry", { error });
      return {
        data: null,
        error: new AppError("Failed to create entry", ErrorCode.DB_QUERY_FAILED, 500),
      };
    }
  }

  /**
   * Update a mental entry.
   */
  async updateEntry(
    entryId: string,
    userId: string,
    data: Partial<{
      triggerEvent: string;
      emotion: string;
      behavior: string;
      mistake: string;
      correction: string;
      zoneDetected: string;
    }>
  ): Promise<Result<MentalEntry, AppError>> {
    this.logger.info("Updating mental entry", { entryId });

    try {
      const updated = await prisma.mental_entries.update({
        where: { id: entryId, user_id: userId },
        data: {
          trigger_event: data.triggerEvent,
          emotion: data.emotion,
          behavior: data.behavior,
          mistake: data.mistake,
          correction: data.correction,
          zone_detected: data.zoneDetected,
        },
      });

      return { data: mapEntryFromPrisma(updated), error: null };
    } catch (error) {
      this.logger.error("Failed to update entry", { error });
      return {
        data: null,
        error: new AppError("Failed to update entry", ErrorCode.DB_QUERY_FAILED, 500),
      };
    }
  }

  /**
   * Delete a mental entry.
   */
  async deleteEntry(entryId: string, userId: string): Promise<Result<boolean, AppError>> {
    this.logger.info("Deleting mental entry", { entryId });

    try {
      await prisma.mental_entries.delete({
        where: { id: entryId, user_id: userId },
      });

      return { data: true, error: null };
    } catch (error) {
      this.logger.error("Failed to delete entry", { error });
      return {
        data: null,
        error: new AppError("Failed to delete entry", ErrorCode.DB_QUERY_FAILED, 500),
      };
    }
  }

  // ========================================
  // LOGS (Wizard)
  // ========================================

  /**
   * Get mental logs for a user.
   */
  async getLogs(userId: string, limit = 20): Promise<Result<MentalLog[], AppError>> {
    this.logger.info("Fetching mental logs", { userId, limit });

    try {
      const logs = await prisma.mental_logs.findMany({
        where: { user_id: userId },
        orderBy: { created_at: "desc" },
        take: limit,
      });

      return { data: logs.map(mapLogFromPrisma), error: null };
    } catch (error) {
      this.logger.error("Failed to fetch logs", { error });
      return {
        data: null,
        error: new AppError("Failed to fetch logs", ErrorCode.DB_QUERY_FAILED, 500),
      };
    }
  }

  /**
   * Get mental logs filtered by mood tag.
   */
  async getLogsByMood(
    userId: string,
    moodTag: string,
    limit = 10
  ): Promise<Result<MentalLog[], AppError>> {
    this.logger.info("Fetching mental logs by mood", { userId, moodTag, limit });

    try {
      // DEBUG: Verifying mood tag content
      console.log(`[Repo] Querying logs for mood_tag: '${moodTag}'`);

      const logs = await prisma.mental_logs.findMany({
        where: {
          user_id: userId,
          mood_tag: {
            equals: moodTag,
            mode: "insensitive", // Handle case mismatches (Fear vs fear)
          },
        },
        orderBy: { created_at: "desc" },
        take: limit,
      });

      console.log(`[Repo] Logs found for '${moodTag}': ${logs.length}`);
      if (logs.length === 0) {
        // Checking if ANY log exists for this user to rule out other issues
        const anyLog = await prisma.mental_logs.findFirst({ where: { user_id: userId } });
        console.log(`[Repo] Any log exists for user?: ${!!anyLog} (tag: ${anyLog?.mood_tag})`);
      }

      return { data: logs.map(mapLogFromPrisma), error: null };
    } catch (error) {
      this.logger.error("Failed to fetch logs by mood", { error });
      return {
        data: null,
        error: new AppError("Failed to fetch logs by mood", ErrorCode.DB_QUERY_FAILED, 500),
      };
    }
  }

  /**
   * Create a mental log (from Wizard).
   * Also creates a synced entry in mental_entries.
   */
  async createLog(
    userId: string,
    data: {
      moodTag: string;
      step1Problem: string;
      step2Validation?: string;
      step3Flaw?: string;
      step4Correction?: string;
      step5Logic?: string;
    }
  ): Promise<Result<MentalLog, AppError>> {
    this.logger.info("Creating mental log", { userId, moodTag: data.moodTag });

    try {
      // Use transaction to create both log and synced entry
      const result = await prisma.$transaction(async (tx) => {
        // Create the log
        const log = await tx.mental_logs.create({
          data: {
            user_id: userId,
            mood_tag: data.moodTag,
            step_1_problem: data.step1Problem,
            step_2_validation: data.step2Validation || null,
            step_3_flaw: data.step3Flaw || null,
            step_4_correction: data.step4Correction || null,
            step_5_logic: data.step5Logic || null,
          },
        });

        // Also create synced entry for Grid/Gauge
        await tx.mental_entries.create({
          data: {
            user_id: userId,
            trigger_event: data.step1Problem,
            emotion: data.moodTag,
            mistake: data.step3Flaw || null,
            correction: data.step4Correction || null,
            zone_detected:
              log.mood_tag === "tilt" || log.mood_tag === "revenge" ? "C-Game" : "B-Game",
            source: "wizard",
          },
        });

        return log;
      });

      return { data: mapLogFromPrisma(result), error: null };
    } catch (error) {
      this.logger.error("Failed to create log", { error });
      return {
        data: null,
        error: new AppError("Failed to create log", ErrorCode.DB_QUERY_FAILED, 500),
      };
    }
  }

  /**
   * Delete a mental log.
   */
  async deleteLog(logId: string, userId: string): Promise<Result<boolean, AppError>> {
    this.logger.info("Deleting mental log", { logId });

    try {
      await prisma.mental_logs.delete({
        where: { id: logId, user_id: userId },
      });

      return { data: true, error: null };
    } catch (error) {
      this.logger.error("Failed to delete log", { error });
      return {
        data: null,
        error: new AppError("Failed to delete log", ErrorCode.DB_QUERY_FAILED, 500),
      };
    }
  }

  // ========================================
  // ANALYTICS
  // ========================================

  /**
   * Calculate zone average from last N entries.
   * Returns: -1 (C-Game/Tilt) to 1 (A-Game/Peak)
   */
  async getZoneAverage(userId: string, limit = 5): Promise<Result<number, AppError>> {
    this.logger.info("Calculating zone average", { userId, limit });

    try {
      const entries = await prisma.mental_entries.findMany({
        where: { user_id: userId, zone_detected: { not: null } },
        orderBy: { created_at: "desc" },
        take: limit,
        select: { zone_detected: true },
      });

      if (entries.length === 0) {
        return { data: 0, error: null };
      }

      const zoneValues: Record<string, number> = {
        "A-Game": 0,
        "B-Game": -1,
        "C-Game": 1,
      };

      const sum = entries.reduce((acc, e) => {
        const value = zoneValues[e.zone_detected || "B-Game"] ?? 0;
        return acc + value;
      }, 0);

      return { data: sum / entries.length, error: null };
    } catch (error) {
      this.logger.error("Failed to calculate zone average", { error });
      return {
        data: null,
        error: new AppError("Failed to calculate zone average", ErrorCode.DB_QUERY_FAILED, 500),
      };
    }
  }

  /**
   * Get zone distribution stats.
   */
  async getZoneStats(
    userId: string,
    limit = 30
  ): Promise<Result<{ aGame: number; bGame: number; cGame: number }, AppError>> {
    this.logger.info("Getting zone stats", { userId, limit });

    try {
      const entries = await prisma.mental_entries.findMany({
        where: { user_id: userId, zone_detected: { not: null } },
        orderBy: { created_at: "desc" },
        take: limit,
        select: { zone_detected: true },
      });

      const stats = { aGame: 0, bGame: 0, cGame: 0 };

      entries.forEach((e) => {
        if (e.zone_detected === "A-Game") stats.aGame++;
        else if (e.zone_detected === "B-Game") stats.bGame++;
        else if (e.zone_detected === "C-Game") stats.cGame++;
      });

      return { data: stats, error: null };
    } catch (error) {
      this.logger.error("Failed to get zone stats", { error });
      return {
        data: null,
        error: new AppError("Failed to get zone stats", ErrorCode.DB_QUERY_FAILED, 500),
      };
    }
  }
}

// Export singleton instance
export const prismaMentalRepo = new PrismaMentalRepository();
export { PrismaMentalRepository };
