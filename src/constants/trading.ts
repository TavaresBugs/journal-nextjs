/**
 * Trading Constants
 *
 * Centralized constants for trade-related UI components.
 * Extracted from DomainSelects.tsx for reusability.
 */

// ============================================
// TIMEFRAME OPTIONS
// ============================================

export const HTF_OPTIONS = ["Monthly", "Weekly", "Daily", "H4", "H1", "M15"] as const;
export const LTF_OPTIONS = ["Daily", "H4", "H1", "M15", "M5", "M3", "M1"] as const;

export type HTFOption = (typeof HTF_OPTIONS)[number];
export type LTFOption = (typeof LTF_OPTIONS)[number];

// ============================================
// MARKET CONDITIONS
// ============================================

export const MARKET_CONDITIONS = [
  "↔️ Lateralidade",
  "📈 Tendência de Alta",
  "📉 Tendência de Baixa",
  "⚡ Rompimento",
] as const;

export type MarketCondition = (typeof MARKET_CONDITIONS)[number];

// ============================================
// PD ARRAY OPTIONS
// ============================================

export const PD_ARRAY_OPTIONS = [
  { value: "FVG", label: "👑 FVG" },
  { value: "MB", label: "🛡️ Mitigation Block" },
  { value: "OB", label: "📦 Order Block" },
  { value: "BB", label: "💥 Breaker" },
  { value: "PXH", label: "🔺 PXH" },
  { value: "PXL", label: "🔻 PXL" },
  { value: "PDH", label: "⬆️ PDH" },
  { value: "PDL", label: "⬇️ PDL" },
] as const;

export type PdArrayValue = (typeof PD_ARRAY_OPTIONS)[number]["value"];

// ============================================
// ENTRY QUALITY OPTIONS
// ============================================

export const ENTRY_QUALITY_OPTIONS = [
  "🌟 Picture Perfect ST",
  "✅ Nice ST",
  "➖ Normal ST",
  "⚠️ Ugly ST",
] as const;

export type EntryQuality = (typeof ENTRY_QUALITY_OPTIONS)[number];

// ============================================
// DIRECTION OPTIONS
// ============================================

export const DIRECTION_OPTIONS = ["Long", "Short"] as const;
export type TradeDirection = (typeof DIRECTION_OPTIONS)[number];
