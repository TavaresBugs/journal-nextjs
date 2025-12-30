/**
 * Emotional Profile Repository
 *
 * Handles structured emotional profiles (Fear, Greed, Tilt, etc.)
 * with Quick Notes, Injecting Logic, Levels, Triggers, and History.
 */

import { prisma } from "@/lib/database";
import { emotional_profiles as PrismaEmotionalProfile } from "@/generated/prisma";
import { Result } from "../types";
import { AppError, ErrorCode } from "@/lib/errors";
import { Logger } from "@/lib/logging/Logger";

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

class PrismaEmotionalProfileRepository {
  private logger = new Logger("PrismaEmotionalProfileRepository");

  /**
   * Get all emotional profiles for a user.
   */
  async getProfiles(userId: string): Promise<Result<EmotionalProfile[], AppError>> {
    this.logger.info("Fetching emotional profiles", { userId });

    try {
      const profiles = await prisma.emotional_profiles.findMany({
        where: { user_id: userId },
        orderBy: { emotion_type: "asc" },
      });

      return { data: profiles.map(mapFromPrisma), error: null };
    } catch (error) {
      this.logger.error("Failed to fetch emotional profiles", { error });
      return {
        data: null,
        error: new AppError("Failed to fetch emotional profiles", ErrorCode.DB_QUERY_FAILED, 500),
      };
    }
  }

  /**
   * Get a specific emotional profile by emotion type.
   */
  async getProfile(
    userId: string,
    emotionType: EmotionType
  ): Promise<Result<EmotionalProfile | null, AppError>> {
    this.logger.info("Fetching emotional profile", { userId, emotionType });

    try {
      const profile = await prisma.emotional_profiles.findUnique({
        where: {
          user_id_emotion_type: { user_id: userId, emotion_type: emotionType },
        },
      });

      return { data: profile ? mapFromPrisma(profile) : null, error: null };
    } catch (error) {
      this.logger.error("Failed to fetch emotional profile", { error });
      return {
        data: null,
        error: new AppError("Failed to fetch emotional profile", ErrorCode.DB_QUERY_FAILED, 500),
      };
    }
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
    this.logger.info("Upserting emotional profile", { userId, emotionType });

    try {
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

      return { data: mapFromPrisma(profile), error: null };
    } catch (error) {
      this.logger.error("Failed to upsert emotional profile", { error });
      return {
        data: null,
        error: new AppError("Failed to upsert emotional profile", ErrorCode.DB_QUERY_FAILED, 500),
      };
    }
  }

  /**
   * Increment occurrence count and update last occurrence date.
   */
  async incrementOccurrence(
    userId: string,
    emotionType: EmotionType
  ): Promise<Result<EmotionalProfile, AppError>> {
    this.logger.info("Incrementing occurrence", { userId, emotionType });

    try {
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

      return { data: mapFromPrisma(profile), error: null };
    } catch (error) {
      this.logger.error("Failed to increment occurrence", { error });
      return {
        data: null,
        error: new AppError("Failed to increment occurrence", ErrorCode.DB_QUERY_FAILED, 500),
      };
    }
  }

  /**
   * Initialize all profiles for a user (create empty profiles for each emotion type).
   */
  async initializeProfiles(userId: string): Promise<Result<EmotionalProfile[], AppError>> {
    this.logger.info("Initializing emotional profiles", { userId });

    try {
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
      return this.getProfiles(userId);
    } catch (error) {
      this.logger.error("Failed to initialize profiles", { error });
      return {
        data: null,
        error: new AppError("Failed to initialize profiles", ErrorCode.DB_QUERY_FAILED, 500),
      };
    }
  }
}

export const prismaEmotionalProfileRepo = new PrismaEmotionalProfileRepository();
export { PrismaEmotionalProfileRepository };
