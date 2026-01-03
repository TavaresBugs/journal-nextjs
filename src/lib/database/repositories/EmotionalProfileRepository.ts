/**
 * Emotional Profile Repository
 *
 * Handles structured emotional profiles (Fear, Greed, Tilt, etc.)
 * with Quick Notes, Injecting Logic, Levels, Triggers, and History.
 * Extends BaseRepository for common logging and error handling.
 */

import { prisma } from "@/lib/database";
import { emotional_profiles as PrismaEmotionalProfile } from "@/generated/prisma";
import { Result } from "../types";
import { AppError } from "@/lib/errors";
import { BaseRepository } from "./BaseRepository";

// Domain types
export interface EmotionalProfile {
  id: string;
  userId: string;
  emotionType: string;
  firstSign: string | null;
  correctiveActions: string | null;
  injectingLogic: string | null;
  angerLevels: Record<string, string>;
  technicalChanges: Record<string, string>;
  triggers: string[];
  history: string | null;
  occurrenceCount: number;
  lastOccurrence: string | null;
  createdAt: string;
  updatedAt: string;
}

export type EmotionType =
  | "fear"
  | "greed"
  | "fomo"
  | "tilt"
  | "revenge"
  | "hesitation"
  | "overconfidence";

export const EMOTION_TYPES: EmotionType[] = [
  "fear",
  "greed",
  "fomo",
  "tilt",
  "revenge",
  "hesitation",
  "overconfidence",
];

// Mapper
function mapFromPrisma(p: PrismaEmotionalProfile): EmotionalProfile {
  return {
    id: p.id,
    userId: p.user_id,
    emotionType: p.emotion_type,
    firstSign: p.first_sign,
    correctiveActions: p.corrective_actions,
    injectingLogic: p.injecting_logic,
    angerLevels: (p.anger_levels as Record<string, string>) || {},
    technicalChanges: (p.technical_changes as Record<string, string>) || {},
    triggers: p.triggers || [],
    history: p.history,
    occurrenceCount: p.occurrence_count,
    lastOccurrence: p.last_occurrence?.toISOString() || null,
    createdAt: p.created_at?.toISOString() || new Date().toISOString(),
    updatedAt: p.updated_at?.toISOString() || new Date().toISOString(),
  };
}

class PrismaEmotionalProfileRepository extends BaseRepository {
  protected readonly repositoryName = "PrismaEmotionalProfileRepository";

  /**
   * Get all emotional profiles for a user.
   */
  async getProfiles(userId: string): Promise<Result<EmotionalProfile[], AppError>> {
    return this.withQuery(
      "getProfiles",
      async () => {
        const profiles = await prisma.emotional_profiles.findMany({
          where: { user_id: userId },
          orderBy: { emotion_type: "asc" },
        });
        return profiles.map(mapFromPrisma);
      },
      { userId }
    );
  }

  /**
   * Get a specific emotional profile by emotion type.
   */
  async getProfile(
    userId: string,
    emotionType: EmotionType
  ): Promise<Result<EmotionalProfile | null, AppError>> {
    return this.withQuery(
      "getProfile",
      async () => {
        const profile = await prisma.emotional_profiles.findUnique({
          where: {
            user_id_emotion_type: { user_id: userId, emotion_type: emotionType },
          },
        });
        return profile ? mapFromPrisma(profile) : null;
      },
      { userId, emotionType }
    );
  }

  /**
   * Create or update an emotional profile.
   */
  async upsertProfile(
    userId: string,
    emotionType: EmotionType,
    data: Partial<{
      firstSign: string;
      correctiveActions: string;
      injectingLogic: string;
      angerLevels: Record<string, string>;
      technicalChanges: Record<string, string>;
      triggers: string[];
      history: string;
    }>
  ): Promise<Result<EmotionalProfile, AppError>> {
    return this.withQuery(
      "upsertProfile",
      async () => {
        const profile = await prisma.emotional_profiles.upsert({
          where: {
            user_id_emotion_type: { user_id: userId, emotion_type: emotionType },
          },
          create: {
            user_id: userId,
            emotion_type: emotionType,
            first_sign: data.firstSign || null,
            corrective_actions: data.correctiveActions || null,
            injecting_logic: data.injectingLogic || null,
            anger_levels: data.angerLevels || {},
            technical_changes: data.technicalChanges || {},
            triggers: data.triggers || [],
            history: data.history || null,
          },
          update: {
            first_sign: data.firstSign,
            corrective_actions: data.correctiveActions,
            injecting_logic: data.injectingLogic,
            anger_levels: data.angerLevels,
            technical_changes: data.technicalChanges,
            triggers: data.triggers,
            history: data.history,
            updated_at: new Date(),
          },
        });
        return mapFromPrisma(profile);
      },
      { userId, emotionType }
    );
  }

  /**
   * Increment occurrence count and update last occurrence date.
   */
  async incrementOccurrence(
    userId: string,
    emotionType: EmotionType
  ): Promise<Result<EmotionalProfile, AppError>> {
    return this.withQuery(
      "incrementOccurrence",
      async () => {
        const profile = await prisma.emotional_profiles.upsert({
          where: {
            user_id_emotion_type: { user_id: userId, emotion_type: emotionType },
          },
          create: {
            user_id: userId,
            emotion_type: emotionType,
            occurrence_count: 1,
            last_occurrence: new Date(),
          },
          update: {
            occurrence_count: { increment: 1 },
            last_occurrence: new Date(),
            updated_at: new Date(),
          },
        });
        return mapFromPrisma(profile);
      },
      { userId, emotionType }
    );
  }

  /**
   * Initialize all profiles for a user (create empty profiles for each emotion type).
   */
  async initializeProfiles(userId: string): Promise<Result<EmotionalProfile[], AppError>> {
    return this.withQuery(
      "initializeProfiles",
      async () => {
        const existingProfiles = await prisma.emotional_profiles.findMany({
          where: { user_id: userId },
          select: { emotion_type: true },
        });

        const existingTypes = new Set(existingProfiles.map((p) => p.emotion_type));
        const missingTypes = EMOTION_TYPES.filter((t) => !existingTypes.has(t));

        if (missingTypes.length > 0) {
          await prisma.emotional_profiles.createMany({
            data: missingTypes.map((emotionType) => ({
              user_id: userId,
              emotion_type: emotionType,
              triggers: [],
            })),
          });
        }

        // Return all profiles
        const allProfiles = await prisma.emotional_profiles.findMany({
          where: { user_id: userId },
          orderBy: { emotion_type: "asc" },
        });
        return allProfiles.map(mapFromPrisma);
      },
      { userId }
    );
  }

  /**
   * Sync occurrence counts based on actual mental logs.
   */
  async syncOccurrenceCounts(userId: string): Promise<Result<Record<string, number>, AppError>> {
    return this.withQuery(
      "syncOccurrenceCounts",
      async () => {
        const logCounts = await prisma.mental_logs.groupBy({
          by: ["mood_tag"],
          where: { user_id: userId },
          _count: { id: true },
        });

        const countsMap: Record<string, number> = {};
        for (const entry of logCounts) {
          if (entry.mood_tag) {
            const emotionType = entry.mood_tag.toLowerCase();
            countsMap[emotionType] = entry._count.id;
          }
        }

        for (const emotionType of EMOTION_TYPES) {
          const count = countsMap[emotionType] || 0;
          const lastLog = await prisma.mental_logs.findFirst({
            where: {
              user_id: userId,
              mood_tag: { equals: emotionType, mode: "insensitive" },
            },
            orderBy: { created_at: "desc" },
            select: { created_at: true },
          });

          await prisma.emotional_profiles.upsert({
            where: {
              user_id_emotion_type: { user_id: userId, emotion_type: emotionType },
            },
            create: {
              user_id: userId,
              emotion_type: emotionType,
              occurrence_count: count,
              last_occurrence: lastLog?.created_at || null,
              triggers: [],
            },
            update: {
              occurrence_count: count,
              last_occurrence: lastLog?.created_at || null,
              updated_at: new Date(),
            },
          });
        }

        return countsMap;
      },
      { userId }
    );
  }
}

export const prismaEmotionalProfileRepo = new PrismaEmotionalProfileRepository();
export { PrismaEmotionalProfileRepository };
