import { supabase } from "@/lib/supabase";

// ============= TYPES =============

export interface MentalLog {
  id: string;
  userId: string;
  moodTag:
    | "fear"
    | "greed"
    | "fomo"
    | "tilt"
    | "revenge"
    | "hesitation"
    | "overconfidence"
    | "other";
  step1Problem: string;
  step2Validation?: string;
  step3Flaw?: string;
  step4Correction?: string;
  step5Logic?: string;
  createdAt: string;
}

export interface MentalProfile {
  id: string;
  userId: string | null;
  category: "fear" | "greed" | "tilt" | "fomo" | "hesitation" | "overconfidence" | "discipline";
  severity: number;
  description: string;
  zone: "A-Game" | "B-Game" | "C-Game";
  isSystem: boolean;
}

export interface MentalEntry {
  id: string;
  userId: string;
  createdAt: string;
  triggerEvent?: string;
  emotion?: string;
  behavior?: string;
  mistake?: string;
  correction?: string;
  zoneDetected?: "A-Game" | "B-Game" | "C-Game";
  source: "grid" | "wizard";
}

export interface CreateMentalLogInput {
  moodTag: MentalLog["moodTag"];
  step1Problem: string;
  step2Validation?: string;
  step3Flaw?: string;
  step4Correction?: string;
  step5Logic?: string;
}

export interface CreateMentalEntryInput {
  triggerEvent?: string;
  emotion?: string;
  behavior?: string;
  mistake?: string;
  correction?: string;
  zoneDetected?: MentalEntry["zoneDetected"];
  source?: "grid" | "wizard";
}

// ============= MENTAL LOGS (Original Wizard) =============

/**
 * Save a new mental log entry from Wizard
 * Also creates a synced entry in mental_entries for Grid/Gauge
 */
export async function saveMentalLog(data: CreateMentalLogInput): Promise<MentalLog | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("User not authenticated");

  // 1. Save to mental_logs (detailed wizard data)
  const { data: log, error } = await supabase
    .from("mental_logs")
    .insert({
      user_id: user.id,
      mood_tag: data.moodTag,
      step_1_problem: data.step1Problem,
      step_2_validation: data.step2Validation,
      step_3_flaw: data.step3Flaw,
      step_4_correction: data.step4Correction,
      step_5_logic: data.step5Logic,
    })
    .select()
    .single();

  if (error) {
    console.error("Error saving mental log:", error);
    throw error;
  }

  // 2. Sync to mental_entries (for Grid/Gauge)
  // Map mood_tag to zone based on severity
  const zoneMap: Record<string, MentalEntry["zoneDetected"]> = {
    fear: "B-Game",
    greed: "C-Game",
    fomo: "C-Game",
    tilt: "C-Game",
    revenge: "C-Game",
    hesitation: "B-Game",
    overconfidence: "B-Game",
    other: "B-Game",
  };

  await saveMentalEntry({
    triggerEvent: data.step1Problem,
    emotion: data.moodTag,
    behavior: data.step3Flaw,
    correction: data.step4Correction,
    zoneDetected: zoneMap[data.moodTag] || "B-Game",
    source: "wizard",
  });

  return log ? mapRowToMentalLog(log) : null;
}

/**
 * Get user's mental logs with optional limit
 */
export async function getMentalLogs(limit = 20): Promise<MentalLog[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("User not authenticated");

  const { data, error } = await supabase
    .from("mental_logs")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error fetching mental logs:", error);
    throw error;
  }

  return (data || []).map(mapRowToMentalLog);
}

/**
 * Delete a mental log
 */
export async function deleteMentalLog(id: string): Promise<void> {
  const { error } = await supabase.from("mental_logs").delete().eq("id", id);

  if (error) {
    console.error("Error deleting mental log:", error);
    throw error;
  }
}

// ============= MENTAL ENTRIES (Grid) =============

/**
 * Save a mental entry (from Grid or synced from Wizard)
 */
export async function saveMentalEntry(data: CreateMentalEntryInput): Promise<MentalEntry | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("User not authenticated");

  const { data: entry, error } = await supabase
    .from("mental_entries")
    .insert({
      user_id: user.id,
      trigger_event: data.triggerEvent,
      emotion: data.emotion,
      behavior: data.behavior,
      mistake: data.mistake,
      correction: data.correction,
      zone_detected: data.zoneDetected,
      source: data.source || "grid",
    })
    .select()
    .single();

  if (error) {
    console.error("Error saving mental entry:", error);
    throw error;
  }

  return entry ? mapRowToMentalEntry(entry) : null;
}

/**
 * Get mental entries for Grid
 */
export async function getMentalEntries(limit = 50): Promise<MentalEntry[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("User not authenticated");

  const { data, error } = await supabase
    .from("mental_entries")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error fetching mental entries:", error);
    throw error;
  }

  return (data || []).map(mapRowToMentalEntry);
}

/**
 * Update a mental entry
 */
export async function updateMentalEntry(
  id: string,
  data: Partial<CreateMentalEntryInput>
): Promise<void> {
  const { error } = await supabase
    .from("mental_entries")
    .update({
      trigger_event: data.triggerEvent,
      emotion: data.emotion,
      behavior: data.behavior,
      mistake: data.mistake,
      correction: data.correction,
      zone_detected: data.zoneDetected,
    })
    .eq("id", id);

  if (error) {
    console.error("Error updating mental entry:", error);
    throw error;
  }
}

/**
 * Delete a mental entry
 */
export async function deleteMentalEntry(id: string): Promise<void> {
  const { error } = await supabase.from("mental_entries").delete().eq("id", id);

  if (error) {
    console.error("Error deleting mental entry:", error);
    throw error;
  }
}

// ============= MENTAL PROFILES (Autocomplete) =============

/**
 * Search profiles for autocomplete
 */
export async function searchProfiles(query: string, category?: string): Promise<MentalProfile[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("User not authenticated");

  let queryBuilder = supabase
    .from("mental_profiles")
    .select("*")
    .or(`is_system.eq.true,user_id.eq.${user.id}`)
    .ilike("description", `%${query}%`)
    .limit(10);

  if (category) {
    queryBuilder = queryBuilder.eq("category", category);
  }

  const { data, error } = await queryBuilder;

  if (error) {
    console.error("Error searching profiles:", error);
    throw error;
  }

  return (data || []).map(mapRowToMentalProfile);
}

/**
 * Get all profiles (for full list)
 */
export async function getAllProfiles(): Promise<MentalProfile[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("User not authenticated");

  const { data, error } = await supabase
    .from("mental_profiles")
    .select("*")
    .or(`is_system.eq.true,user_id.eq.${user.id}`)
    .order("zone", { ascending: true })
    .order("severity", { ascending: false });

  if (error) {
    console.error("Error fetching profiles:", error);
    throw error;
  }

  return (data || []).map(mapRowToMentalProfile);
}

// ============= PERFORMANCE GAUGE =============

/**
 * Calculate zone average from last N entries for gauge positioning
 * Returns: -1 (C-Game/Tilt) to 1 (A-Game/Peak)
 */
export async function getZoneAverage(limit = 5): Promise<number> {
  const entries = await getMentalEntries(limit);

  if (entries.length === 0) return 0; // Neutral

  const zoneValues: Record<string, number> = {
    "A-Game": 1,
    "B-Game": 0,
    "C-Game": -1,
  };

  const total = entries.reduce((sum, entry) => {
    return sum + (zoneValues[entry.zoneDetected || "B-Game"] || 0);
  }, 0);

  return total / entries.length;
}

/**
 * Get zone distribution stats
 */
export async function getZoneStats(
  limit = 30
): Promise<{ aGame: number; bGame: number; cGame: number }> {
  const entries = await getMentalEntries(limit);

  const stats = { aGame: 0, bGame: 0, cGame: 0 };

  entries.forEach((entry) => {
    if (entry.zoneDetected === "A-Game") stats.aGame++;
    else if (entry.zoneDetected === "B-Game") stats.bGame++;
    else if (entry.zoneDetected === "C-Game") stats.cGame++;
  });

  return stats;
}

// ============= MAPPERS =============

function mapRowToMentalLog(row: Record<string, unknown>): MentalLog {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    moodTag: row.mood_tag as MentalLog["moodTag"],
    step1Problem: row.step_1_problem as string,
    step2Validation: row.step_2_validation as string | undefined,
    step3Flaw: row.step_3_flaw as string | undefined,
    step4Correction: row.step_4_correction as string | undefined,
    step5Logic: row.step_5_logic as string | undefined,
    createdAt: row.created_at as string,
  };
}

function mapRowToMentalEntry(row: Record<string, unknown>): MentalEntry {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    createdAt: row.created_at as string,
    triggerEvent: row.trigger_event as string | undefined,
    emotion: row.emotion as string | undefined,
    behavior: row.behavior as string | undefined,
    mistake: row.mistake as string | undefined,
    correction: row.correction as string | undefined,
    zoneDetected: row.zone_detected as MentalEntry["zoneDetected"],
    source: row.source as "grid" | "wizard",
  };
}

function mapRowToMentalProfile(row: Record<string, unknown>): MentalProfile {
  return {
    id: row.id as string,
    userId: row.user_id as string | null,
    category: row.category as MentalProfile["category"],
    severity: row.severity as number,
    description: row.description as string,
    zone: row.zone as MentalProfile["zone"],
    isSystem: row.is_system as boolean,
  };
}
