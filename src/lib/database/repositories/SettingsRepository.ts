/**
 * Prisma Settings Repository
 *
 * Handles settings for users and accounts using Prisma ORM.
 */

import { prisma } from "@/lib/database";
import { settings as PrismaSettings } from "@/generated/prisma";
import { Result } from "../types";
import { AppError, ErrorCode } from "@/lib/errors";
import { Logger } from "@/lib/logging/Logger";
import { Settings, UserSettings } from "@/types";

/**
 * Maps Prisma settings to domain Settings type
 */
function mapSettingsFromPrisma(s: PrismaSettings): Settings {
  return {
    id: s.id,
    userId: s.user_id,
    accountId: s.account_id || undefined,
    currencies: (s.currencies as string[]) || [],
    leverages: (s.leverages as string[]) || [],
    assets: (s.assets as Record<string, number>) || {},
    strategies: (s.strategies as string[]) || [],
    setups: (s.setups as string[]) || [],
    createdAt: s.created_at?.toISOString() || new Date().toISOString(),
    updatedAt: s.updated_at?.toISOString() || new Date().toISOString(),
  };
}

/**
 * Maps Prisma settings to UserSettings type
 */
function mapUserSettingsFromPrisma(s: PrismaSettings): UserSettings {
  return {
    id: s.id,
    user_id: s.user_id,
    currencies: (s.currencies as string[]) || [],
    leverages: (s.leverages as string[]) || [],
    assets: Object.entries((s.assets as Record<string, number>) || {}).map(
      ([symbol, multiplier]) => ({
        symbol,
        multiplier,
      })
    ),
    strategies: (s.strategies as string[]) || [],
    setups: (s.setups as string[]) || [],
    created_at: s.created_at?.toISOString() || new Date().toISOString(),
    updated_at: s.updated_at?.toISOString() || new Date().toISOString(),
  };
}

class PrismaSettingsRepository {
  private logger = new Logger("PrismaSettingsRepository");

  /**
   * Fetches settings for a user or a specific account.
   */
  async getSettings(userId: string, accountId?: string): Promise<Result<Settings, AppError>> {
    this.logger.info("Fetching settings", { userId, accountId });

    try {
      const settings = await prisma.settings.findFirst({
        where: {
          user_id: userId,
          account_id: accountId || null,
        },
      });

      if (!settings) {
        return {
          data: null,
          error: new AppError("Settings not found", ErrorCode.DB_NOT_FOUND, 404),
        };
      }

      return { data: mapSettingsFromPrisma(settings), error: null };
    } catch (error) {
      this.logger.error("Failed to fetch settings", { error, userId, accountId });
      return {
        data: null,
        error: new AppError("Failed to fetch settings", ErrorCode.DB_QUERY_FAILED, 500),
      };
    }
  }

  /**
   * Fetches global user settings.
   */
  async getUserSettings(userId: string): Promise<Result<UserSettings, AppError>> {
    this.logger.info("Fetching user settings", { userId });

    try {
      const settings = await prisma.settings.findFirst({
        where: {
          user_id: userId,
          account_id: null,
        },
      });

      if (!settings) {
        return {
          data: null,
          error: new AppError("User settings not found", ErrorCode.DB_NOT_FOUND, 404),
        };
      }

      return { data: mapUserSettingsFromPrisma(settings), error: null };
    } catch (error) {
      this.logger.error("Failed to fetch user settings", { error, userId });
      return {
        data: null,
        error: new AppError("Failed to fetch user settings", ErrorCode.DB_QUERY_FAILED, 500),
      };
    }
  }

  /**
   * Upserts settings for a user or account.
   */
  async saveSettings(settings: Partial<Settings>): Promise<Result<Settings, AppError>> {
    this.logger.info("Saving settings", { userId: settings.userId, accountId: settings.accountId });

    try {
      const upserted = await prisma.settings.upsert({
        where: settings.id ? { id: settings.id } : { user_id: settings.userId! },
        create: {
          user_id: settings.userId!,
          account_id: settings.accountId || null,
          currencies: settings.currencies || [],
          leverages: settings.leverages || [],
          assets: settings.assets || {},
          strategies: settings.strategies || [],
          setups: settings.setups || [],
        },
        update: {
          account_id: settings.accountId,
          currencies: settings.currencies,
          leverages: settings.leverages,
          assets: settings.assets,
          strategies: settings.strategies,
          setups: settings.setups,
          updated_at: new Date(),
        },
      });

      return { data: mapSettingsFromPrisma(upserted), error: null };
    } catch (error) {
      this.logger.error("Failed to save settings", { error });
      return {
        data: null,
        error: new AppError("Failed to save settings", ErrorCode.DB_QUERY_FAILED, 500),
      };
    }
  }

  /**
   * Specifically saves user settings by user_id conflict.
   */
  async saveUserSettings(
    userId: string,
    settings: Partial<UserSettings>
  ): Promise<Result<UserSettings, AppError>> {
    this.logger.info("Saving user settings", { userId });

    try {
      const upserted = await prisma.settings.upsert({
        where: { user_id: userId },
        create: {
          user_id: userId,
          account_id: null,
          currencies: settings.currencies || [],
          leverages: settings.leverages || [],
          assets: settings.assets
            ? Object.fromEntries(settings.assets.map((a) => [a.symbol, a.multiplier]))
            : {},
          strategies: settings.strategies || [],
          setups: settings.setups || [],
        },
        update: {
          currencies: settings.currencies,
          leverages: settings.leverages,
          assets: settings.assets
            ? Object.fromEntries(settings.assets.map((a) => [a.symbol, a.multiplier]))
            : undefined,
          strategies: settings.strategies,
          setups: settings.setups,
          updated_at: new Date(),
        },
      });

      return { data: mapUserSettingsFromPrisma(upserted), error: null };
    } catch (error) {
      this.logger.error("Failed to save user settings", { error });
      return {
        data: null,
        error: new AppError("Failed to save user settings", ErrorCode.DB_QUERY_FAILED, 500),
      };
    }
  }
}

export const prismaSettingsRepo = new PrismaSettingsRepository();
export { PrismaSettingsRepository };
