export const MARKET_CONDITIONS_V2 = [
  "📈 Tendência de Alta",
  "📉 Tendência de Baixa",
  "↔️ Lateralidade",
  "⚡ Rompimento",
];

export const ENTRY_QUALITY_OPTIONS = [
  "🌟 Picture Perfect ST",
  "✅ Nice ST",
  "➖ Normal ST",
  "⚠️ Ugly ST",
];

export const PD_ARRAY_OPTIONS = [
  { value: "FVG", label: "👑 FVG" },
  { value: "MB", label: "🛡️ Mitigation Block" },
  { value: "OB", label: "📦 Order Block" },
  { value: "BB", label: "💥 Breaker" },
  { value: "PXH", label: "🔺 PXH" },
  { value: "PXL", label: "🔻 PXL" },
  { value: "PDH", label: "⬆️ PDH" },
  { value: "PDL", label: "⬇️ PDL" },
];

/**
 * Map entry quality display value to DB value
 */
export function mapEntryQualityToDb(
  value: string
): "picture-perfect" | "nice" | "normal" | "ugly" | undefined {
  if (value.includes("Picture")) return "picture-perfect";
  if (value.includes("Nice")) return "nice";
  if (value.includes("Normal")) return "normal";
  if (value.includes("Ugly")) return "ugly";
  return undefined;
}

/**
 * Map entry quality DB value to display value
 */
export function mapEntryQualityFromDb(value?: string): string {
  switch (value) {
    case "picture-perfect":
      return "🌟 Picture Perfect ST";
    case "nice":
      return "✅ Nice ST";
    case "normal":
      return "➖ Normal ST";
    case "ugly":
      return "⚠️ Ugly ST";
    default:
      return "";
  }
}

/**
 * Map market condition display value to DB value
 */
export function mapMarketConditionToDb(
  value: string
): "bull-trend" | "bear-trend" | "ranging" | "breakout" | undefined {
  if (value.includes("Alta")) return "bull-trend";
  if (value.includes("Baixa")) return "bear-trend";
  if (value.includes("Lateral")) return "ranging";
  if (value.includes("Rompimento")) return "breakout";
  return undefined;
}

/**
 * Map market condition DB value to display value
 */
export function mapMarketConditionFromDb(value?: string): string {
  switch (value) {
    case "bull-trend":
      return "📈 Tendência de Alta";
    case "bear-trend":
      return "📉 Tendência de Baixa";
    case "ranging":
      return "↔️ Lateralidade";
    case "breakout":
      return "⚡ Rompimento";
    default:
      return "";
  }
}
