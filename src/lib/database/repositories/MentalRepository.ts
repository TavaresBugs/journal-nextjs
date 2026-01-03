/**
 * Prisma Mental Repository
 *
 * Type-safe implementation of MentalRepository using Prisma ORM.
 * Handles mental profiles, entries, and logs for the Mental Hub feature.
 * Extends BaseRepository for common logging and error handling.
 */

import { prisma } from "@/lib/database";
import {
  mental_profiles as PrismaMentalProfile,
  mental_entries as PrismaMentalEntry,
  mental_logs as PrismaMentalLog,
} from "@/generated/prisma";
import { Result } from "../types";
import { AppError } from "@/lib/errors";
import { BaseRepository } from "./BaseRepository";

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

class PrismaMentalRepository extends BaseRepository {
  protected readonly repositoryName = "PrismaMentalRepository";

  // PROFILES
  async getProfiles(userId: string): Promise<Result<MentalProfile[], AppError>> {
    return this.withQuery(
      "getProfiles",
      async () => {
        const profiles = await prisma.mental_profiles.findMany({
          where: { OR: [{ user_id: userId }, { is_system: true }] },
          orderBy: [{ category: "asc" }, { severity: "desc" }],
        });
        return profiles.map(mapProfileFromPrisma);
      },
      { userId }
    );
  }

  async searchProfiles(
    query: string,
    category?: string
  ): Promise<Result<MentalProfile[], AppError>> {
    return this.withQuery(
      "searchProfiles",
      async () => {
        const profiles = await prisma.mental_profiles.findMany({
          where: {
            description: { contains: query, mode: "insensitive" },
            ...(category ? { category } : {}),
          },
          orderBy: { severity: "desc" },
          take: 20,
        });
        return profiles.map(mapProfileFromPrisma);
      },
      { query, category }
    );
  }

  async createProfiles(
    userId: string,
    profiles: Array<{ category: string; description: string; zone: string; severity: number }>
  ): Promise<Result<MentalProfile[], AppError>> {
    return this.withQuery(
      "createProfiles",
      async () => {
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
        return created.map(mapProfileFromPrisma);
      },
      { userId, count: profiles.length }
    );
  }

  async hasUserProfiles(userId: string): Promise<Result<boolean, AppError>> {
    return this.withQuery("hasUserProfiles", async () => {
      const count = await prisma.mental_profiles.count({
        where: { user_id: userId, is_system: false },
      });
      return count > 0;
    });
  }

  // ENTRIES
  async getEntries(userId: string, limit = 50): Promise<Result<MentalEntry[], AppError>> {
    return this.withQuery(
      "getEntries",
      async () => {
        const entries = await prisma.mental_entries.findMany({
          where: { user_id: userId },
          orderBy: { created_at: "desc" },
          take: limit,
        });
        return entries.map(mapEntryFromPrisma);
      },
      { userId, limit }
    );
  }

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
    return this.withQuery(
      "createEntry",
      async () => {
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
        return mapEntryFromPrisma(created);
      },
      { userId }
    );
  }

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
    return this.withQuery(
      "updateEntry",
      async () => {
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
        return mapEntryFromPrisma(updated);
      },
      { entryId }
    );
  }

  async deleteEntry(entryId: string, userId: string): Promise<Result<boolean, AppError>> {
    return this.withQuery(
      "deleteEntry",
      async () => {
        await prisma.mental_entries.delete({ where: { id: entryId, user_id: userId } });
        return true;
      },
      { entryId }
    );
  }

  // LOGS
  async getLogs(userId: string, limit = 20): Promise<Result<MentalLog[], AppError>> {
    return this.withQuery(
      "getLogs",
      async () => {
        const logs = await prisma.mental_logs.findMany({
          where: { user_id: userId },
          orderBy: { created_at: "desc" },
          take: limit,
        });
        return logs.map(mapLogFromPrisma);
      },
      { userId, limit }
    );
  }

  async getLogsByMood(
    userId: string,
    moodTag: string,
    limit = 10
  ): Promise<Result<MentalLog[], AppError>> {
    return this.withQuery(
      "getLogsByMood",
      async () => {
        const logs = await prisma.mental_logs.findMany({
          where: { user_id: userId, mood_tag: { equals: moodTag, mode: "insensitive" } },
          orderBy: { created_at: "desc" },
          take: limit,
        });
        return logs.map(mapLogFromPrisma);
      },
      { userId, moodTag, limit }
    );
  }

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
    return this.withQuery(
      "createLog",
      async () => {
        const result = await prisma.$transaction(async (tx) => {
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
        return mapLogFromPrisma(result);
      },
      { userId, moodTag: data.moodTag }
    );
  }

  async deleteLog(logId: string, userId: string): Promise<Result<boolean, AppError>> {
    return this.withQuery(
      "deleteLog",
      async () => {
        await prisma.mental_logs.delete({ where: { id: logId, user_id: userId } });
        return true;
      },
      { logId }
    );
  }

  async updateLog(
    logId: string,
    userId: string,
    data: Partial<{
      moodTag: string;
      step1Problem: string;
      step2Validation: string;
      step3Flaw: string;
      step4Correction: string;
      step5Logic: string;
    }>
  ): Promise<Result<MentalLog, AppError>> {
    return this.withQuery(
      "updateLog",
      async () => {
        const updated = await prisma.mental_logs.update({
          where: { id: logId, user_id: userId },
          data: {
            mood_tag: data.moodTag,
            step_1_problem: data.step1Problem,
            step_2_validation: data.step2Validation,
            step_3_flaw: data.step3Flaw,
            step_4_correction: data.step4Correction,
            step_5_logic: data.step5Logic,
          },
        });
        return mapLogFromPrisma(updated);
      },
      { logId }
    );
  }

  // ANALYTICS
  async getZoneAverage(userId: string, limit = 5): Promise<Result<number, AppError>> {
    return this.withQuery(
      "getZoneAverage",
      async () => {
        const entries = await prisma.mental_entries.findMany({
          where: { user_id: userId, zone_detected: { not: null } },
          orderBy: { created_at: "desc" },
          take: limit,
          select: { zone_detected: true },
        });

        if (entries.length === 0) return 0;

        const zoneValues: Record<string, number> = { "A-Game": 0, "B-Game": -1, "C-Game": 1 };
        const sum = entries.reduce(
          (acc, e) => acc + (zoneValues[e.zone_detected || "B-Game"] ?? 0),
          0
        );
        return sum / entries.length;
      },
      { userId, limit }
    );
  }

  async getZoneStats(
    userId: string,
    limit = 30
  ): Promise<Result<{ aGame: number; bGame: number; cGame: number }, AppError>> {
    return this.withQuery(
      "getZoneStats",
      async () => {
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
        return stats;
      },
      { userId, limit }
    );
  }
}

// Export singleton instance
export const prismaMentalRepo = new PrismaMentalRepository();
export { PrismaMentalRepository };
