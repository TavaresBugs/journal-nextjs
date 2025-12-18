// Timeframe priority: higher value = higher priority (longer timeframe first)
export const getTimeframePriority = (tf: string): number => {
  const normalized = tf.toLowerCase().replace(/\s/g, "");
  if (
    normalized.includes("mensal") ||
    normalized === "mn" ||
    (normalized === "m1" && tf.includes("M"))
  )
    return 100;
  if (normalized.includes("semanal") || normalized === "w1" || normalized === "w") return 90;
  if (
    normalized.includes("diario") ||
    normalized.includes("diário") ||
    normalized === "d1" ||
    normalized === "d"
  )
    return 80;
  if (normalized === "h4" || normalized === "4h") return 70;
  if (normalized === "h1" || normalized === "1h") return 60;
  if (normalized === "m30" || normalized === "30m") return 50;
  if (normalized === "m15" || normalized === "15m") return 40;
  if (normalized === "m5" || normalized === "5m") return 30;
  if (normalized === "m3" || normalized === "3m") return 20;
  if (normalized === "m1" || normalized === "1m") return 10;
  return 0;
};

export const getSessionIcon = (session: string): string => {
  switch (session.toLowerCase()) {
    case "asian":
      return "🌏";
    case "london":
      return "🇬🇧";
    case "new york":
    case "new-york":
      return "🇺🇸";
    case "overlap":
      return "🔄";
    default:
      return "🌐";
  }
};

export const getConditionIcon = (condition: string): string => {
  switch (condition) {
    case "bull-trend":
      return "📈";
    case "bear-trend":
      return "📉";
    case "ranging":
      return "↔️";
    case "breakout":
      return "⚡";
    default:
      return "📊";
  }
};

export const getConditionLabel = (condition: string): string => {
  switch (condition) {
    case "bull-trend":
      return "Tendência de Alta";
    case "bear-trend":
      return "Tendência de Baixa";
    case "ranging":
      return "Lateralidade";
    case "breakout":
      return "Rompimento";
    default:
      return condition || "N/A";
  }
};

export const getQualityIcon = (quality: string): string => {
  switch (quality) {
    case "picture-perfect":
      return "🌟";
    case "nice":
      return "✅";
    case "normal":
      return "➖";
    case "ugly":
      return "⚠️";
    default:
      return "❓";
  }
};

export const getQualityLabel = (quality: string): string => {
  switch (quality) {
    case "picture-perfect":
      return "Picture Perfect";
    case "nice":
      return "Nice ST";
    case "normal":
      return "Normal ST";
    case "ugly":
      return "Ugly ST";
    default:
      return quality || "N/A";
  }
};

export const getPdArrayIcon = (pdArray: string): string => {
  switch (pdArray) {
    case "FVG":
      return "👑";
    case "OB":
      return "🧱";
    case "MB":
      return "🧱";
    case "BB":
      return "🧱";
    case "Swing High":
      return "📈";
    case "Swing Low":
      return "📉";
    case "PDH":
      return "📈";
    case "PDL":
      return "📉";
    default:
      return "📍";
  }
};

export const getPdArrayLabel = (pdArray: string): string => {
  switch (pdArray) {
    case "FVG":
      return "Fair Value Gap";
    case "OB":
      return "Order Block";
    case "MB":
      return "Mitigation Block";
    case "BB":
      return "Breaker Block";
    case "Swing High":
      return "Swing High (PXH)";
    case "Swing Low":
      return "Swing Low (PXL)";
    case "PDH":
      return "Previous Daily High";
    case "PDL":
      return "Previous Daily Low";
    default:
      return pdArray || "N/A";
  }
};
