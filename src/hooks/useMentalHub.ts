/**
 * useMentalHub Hook
 *
 * Centralizes all Mental Hub logic using Server Actions:
 * - Loading profiles and entries from Prisma via Server Actions
 * - Saving new entries
 * - Seeding user profiles during onboarding
 *
 * @migrated Phase 6a - Migrated from direct Supabase calls to Server Actions
 */

import { useState, useEffect, useCallback } from "react";
import {
  getMentalProfilesAction,
  getMentalEntriesAction,
  saveMentalEntryAction,
  deleteMentalEntryAction,
  seedMentalProfilesAction,
} from "@/app/actions";

// Types (re-exported from repository for convenience)
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

export interface MentalEntryInput {
  triggerEvent?: string;
  emotion?: string;
  behavior?: string;
  mistake?: string;
  correction?: string;
  zoneDetected?: string;
  source?: "grid" | "wizard";
}

interface UseMentalHubReturn {
  // State
  profiles: MentalProfile[];
  entries: MentalEntry[];
  isLoading: boolean;
  error: string | null;
  hasProfiles: boolean;

  // Actions
  loadProfiles: () => Promise<void>;
  loadEntries: (limit?: number) => Promise<void>;
  saveEntry: (data: MentalEntryInput) => Promise<boolean>;
  seedProfiles: (category: "fear" | "greed" | "tilt" | "all") => Promise<boolean>;
  deleteEntry: (id: string) => Promise<boolean>;
  refresh: () => Promise<void>;
}

/**
 * Hook for managing Mental Hub data
 * Uses Server Actions for all database operations
 */
export function useMentalHub(): UseMentalHubReturn {
  const [profiles, setProfiles] = useState<MentalProfile[]>([]);
  const [entries, setEntries] = useState<MentalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load user's mental profiles (including system defaults)
   */
  const loadProfiles = useCallback(async () => {
    try {
      setError(null);
      const data = await getMentalProfilesAction();
      setProfiles(data);
    } catch (err) {
      console.error("Error loading mental profiles:", err);
      setError("Erro ao carregar perfis mentais");
    }
  }, []);

  /**
   * Load recent mental entries for the grid/chart
   */
  const loadEntries = useCallback(async (limit = 50) => {
    try {
      setError(null);
      const data = await getMentalEntriesAction(limit);
      setEntries(data);
    } catch (err) {
      console.error("Error loading mental entries:", err);
      setError("Erro ao carregar histórico mental");
    }
  }, []);

  /**
   * Save a new mental entry
   */
  const saveEntry = useCallback(
    async (data: MentalEntryInput): Promise<boolean> => {
      try {
        setError(null);
        const result = await saveMentalEntryAction({
          triggerEvent: data.triggerEvent,
          emotion: data.emotion,
          behavior: data.behavior,
          mistake: data.mistake,
          correction: data.correction,
          zoneDetected: data.zoneDetected,
          source: data.source || "grid",
        });

        if (!result.success) {
          throw new Error(result.error || "Failed to save entry");
        }

        // Reload entries after insert
        await loadEntries();
        return true;
      } catch (err) {
        console.error("Error saving mental entry:", err);
        setError("Erro ao salvar entrada mental");
        return false;
      }
    },
    [loadEntries]
  );

  /**
   * Seed profiles for the user during onboarding
   * Inserts pre-defined psychological patterns
   */
  const seedProfiles = useCallback(
    async (category: "fear" | "greed" | "tilt" | "all"): Promise<boolean> => {
      try {
        setIsLoading(true);
        setError(null);

        const result = await seedMentalProfilesAction(category);

        if (!result.success) {
          throw new Error(result.error || "Failed to seed profiles");
        }

        // Reload profiles after seeding
        await loadProfiles();
        return true;
      } catch (err) {
        console.error("Error seeding mental profiles:", err);
        setError("Erro ao importar perfis mentais");
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [loadProfiles]
  );

  /**
   * Delete a mental entry
   */
  const deleteEntry = useCallback(async (id: string): Promise<boolean> => {
    try {
      setError(null);
      const result = await deleteMentalEntryAction(id);

      if (!result.success) {
        throw new Error(result.error || "Failed to delete entry");
      }

      // Remove from local state
      setEntries((prev) => prev.filter((e) => e.id !== id));
      return true;
    } catch (err) {
      console.error("Error deleting mental entry:", err);
      setError("Erro ao deletar entrada");
      return false;
    }
  }, []);

  /**
   * Refresh all data
   */
  const refresh = useCallback(async () => {
    setIsLoading(true);
    await Promise.all([loadProfiles(), loadEntries()]);
    setIsLoading(false);
  }, [loadProfiles, loadEntries]);

  // Initial load
  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      await Promise.all([loadProfiles(), loadEntries()]);
      setIsLoading(false);
    };
    init();
  }, [loadProfiles, loadEntries]);

  // Check if user has any non-system profiles
  const hasProfiles = profiles.some((p) => !p.isSystem);

  return {
    profiles,
    entries,
    isLoading,
    error,
    hasProfiles,
    loadProfiles,
    loadEntries,
    saveEntry,
    seedProfiles,
    deleteEntry,
    refresh,
  };
}
