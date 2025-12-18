/**
 * useMentalHub Hook
 *
 * Centralizes all Mental Hub logic:
 * - Loading profiles and entries from Supabase
 * - Saving new entries
 * - Seeding user profiles during onboarding
 */

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { getSeedsByCategory, type MentalSeedProfile } from "@/constants/mental";

// Types
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
      const { data, error: fetchError } = await supabase
        .from("mental_profiles")
        .select("*")
        .order("category", { ascending: true })
        .order("severity", { ascending: false });

      if (fetchError) throw fetchError;

      const mapped: MentalProfile[] = (data || []).map((p) => ({
        id: p.id,
        userId: p.user_id,
        category: p.category,
        severity: p.severity,
        description: p.description,
        zone: p.zone,
        isSystem: p.is_system,
        createdAt: p.created_at,
      }));

      setProfiles(mapped);
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
      const { data, error: fetchError } = await supabase
        .from("mental_entries")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (fetchError) throw fetchError;

      const mapped: MentalEntry[] = (data || []).map((e) => ({
        id: e.id,
        userId: e.user_id,
        createdAt: e.created_at,
        triggerEvent: e.trigger_event,
        emotion: e.emotion,
        behavior: e.behavior,
        mistake: e.mistake,
        correction: e.correction,
        zoneDetected: e.zone_detected,
        source: e.source || "grid",
      }));

      setEntries(mapped);
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
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error("User not authenticated");

        const { error: insertError } = await supabase.from("mental_entries").insert({
          user_id: user.id,
          trigger_event: data.triggerEvent || null,
          emotion: data.emotion || null,
          behavior: data.behavior || null,
          mistake: data.mistake || null,
          correction: data.correction || null,
          zone_detected: data.zoneDetected || null,
          source: data.source || "grid",
        });

        if (insertError) throw insertError;

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

        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error("User not authenticated");

        const seeds = getSeedsByCategory(category);

        if (seeds.length === 0) {
          throw new Error("No seeds found for category");
        }

        // Prepare batch insert data
        const insertData = seeds.map((seed: MentalSeedProfile) => ({
          user_id: user.id,
          category: seed.category,
          description: seed.description,
          zone: seed.zone,
          severity: seed.severity,
          is_system: false, // User's copy, not system default
        }));

        const { error: insertError } = await supabase.from("mental_profiles").insert(insertData);

        if (insertError) throw insertError;

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
      const { error: deleteError } = await supabase.from("mental_entries").delete().eq("id", id);

      if (deleteError) throw deleteError;

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
