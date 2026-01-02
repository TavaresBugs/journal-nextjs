/**
 * Prisma Settings Repository
 *
 * Handles settings for users and accounts using Prisma ORM.
 * Extends BaseRepository for common logging and error handling.
 */

import { prisma } from "@/lib/database";
import { settings as PrismaSettings } from "@/generated/prisma";
import { Result } from "../types";
import { AppError } from "@/lib/errors";
import { BaseRepository } from "./BaseRepository";
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

class PrismaSettingsRepository extends BaseRepository {
  protected readonly repositoryName = "PrismaSettingsRepository";

  /**
   * Fetches settings for a user or a specific account.
   */
  async getSettings(userId: string, accountId?: string): Promise<Result<Settings, AppError>> {
    return this.withQuery(
      "getSettings",
      async () => {
        const settings = await prisma.settings.findFirst({
          where: {
            user_id: userId,
            account_id: accountId || null,
          },
        });

        if (!settings) {
          throw this.notFoundError("Settings");
        }

        return mapSettingsFromPrisma(settings);
      },
      { userId, accountId }
    );
  }

  /**
   * Fetches global user settings.
   */
  async getUserSettings(userId: string): Promise<Result<UserSettings, AppError>> {
    return this.withQuery(
      "getUserSettings",
      async () => {
        const settings = await prisma.settings.findFirst({
          where: {
            user_id: userId,
            account_id: null,
          },
        });

        if (!settings) {
          throw this.notFoundError("User settings");
        }

        return mapUserSettingsFromPrisma(settings);
      },
      { userId }
    );
  }

  /**
   * Upserts settings for a user or account.
   */
  async saveSettings(settings: Partial<Settings>): Promise<Result<Settings, AppError>> {
    return this.withQuery(
      "saveSettings",
      async () => {
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

        return mapSettingsFromPrisma(upserted);
      },
      { userId: settings.userId, accountId: settings.accountId }
    );
  }

  /**
   * Specifically saves user settings by user_id conflict.
   */
  async saveUserSettings(
    userId: string,
    settings: Partial<UserSettings>
  ): Promise<Result<UserSettings, AppError>> {
    return this.withQuery(
      "saveUserSettings",
      async () => {
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

        return mapUserSettingsFromPrisma(upserted);
      },
      { userId }
    );
  }
}

export const prismaSettingsRepo = new PrismaSettingsRepository();
export { PrismaSettingsRepository };
