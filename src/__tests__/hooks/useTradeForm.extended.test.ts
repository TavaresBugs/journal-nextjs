import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import {
  useTradeForm,
  mapEntryQualityToDb,
  mapEntryQualityFromDb,
  mapMarketConditionToDb,
  mapMarketConditionFromDb,
  MARKET_CONDITIONS_V2,
  ENTRY_QUALITY_OPTIONS,
  PD_ARRAY_OPTIONS,
} from "@/components/trades/hooks/useTradeForm";
import type { Trade } from "@/types";

// Mock dependencies
vi.mock("@/store/useSettingsStore", () => ({
  useSettingsStore: () => ({
    assets: [
      { symbol: "EURUSD", multiplier: 100000 },
      { symbol: "XAUUSD", multiplier: 100 },
      { symbol: "US30", multiplier: 5 },
    ],
  }),
}));

vi.mock("@/lib/timeframeUtils", () => ({
  detectSession: vi.fn((date: string, time: string) => {
    const hour = parseInt(time.split(":")[0]);
    if (hour >= 13 && hour < 21) return "New York";
    if (hour >= 8 && hour < 16) return "London";
    return "Off-Hours";
  }),
  getTimeframeAlignment: vi.fn((tfAnalise: string, tfEntrada: string) => {
    if (tfAnalise === "D1" && tfEntrada === "H1") return { aligned: true, type: "Top-Down" };
    if (tfAnalise === tfEntrada) return { aligned: true, type: "Same" };
    return { aligned: false, type: "Misaligned" };
  }),
  calculateRMultiple: vi.fn((entry: number, exit: number, sl: number) => {
    const risk = Math.abs(entry - sl);
    const reward = Math.abs(exit - entry);
    return reward / risk;
  }),
}));

describe("useTradeForm - Mapper Functions", () => {
  describe("mapEntryQualityToDb", () => {
    it("should map Picture Perfect to database value", () => {
      expect(mapEntryQualityToDb("🌟 Picture Perfect ST")).toBe("picture-perfect");
    });

    it("should map Nice to database value", () => {
      expect(mapEntryQualityToDb("✅ Nice ST")).toBe("nice");
    });

    it("should map Normal to database value", () => {
      expect(mapEntryQualityToDb("➖ Normal ST")).toBe("normal");
    });

    it("should map Ugly to database value", () => {
      expect(mapEntryQualityToDb("⚠️ Ugly ST")).toBe("ugly");
    });

    it("should return undefined for unknown values", () => {
      expect(mapEntryQualityToDb("Unknown")).toBeUndefined();
    });
  });

  describe("mapEntryQualityFromDb", () => {
    it("should map database value to display value", () => {
      expect(mapEntryQualityFromDb("picture-perfect")).toBe("🌟 Picture Perfect ST");
      expect(mapEntryQualityFromDb("nice")).toBe("✅ Nice ST");
      expect(mapEntryQualityFromDb("normal")).toBe("➖ Normal ST");
      expect(mapEntryQualityFromDb("ugly")).toBe("⚠️ Ugly ST");
    });

    it("should return empty string for undefined or unknown", () => {
      expect(mapEntryQualityFromDb(undefined)).toBe("");
      expect(mapEntryQualityFromDb("unknown")).toBe("");
    });
  });

  describe("mapMarketConditionToDb", () => {
    it("should map Tendência de Alta to bull-trend", () => {
      expect(mapMarketConditionToDb("📈 Tendência de Alta")).toBe("bull-trend");
    });

    it("should map Tendência de Baixa to bear-trend", () => {
      expect(mapMarketConditionToDb("📉 Tendência de Baixa")).toBe("bear-trend");
    });

    it("should map Lateralidade to ranging", () => {
      expect(mapMarketConditionToDb("↔️ Lateralidade")).toBe("ranging");
    });

    it("should map Rompimento to breakout", () => {
      expect(mapMarketConditionToDb("⚡ Rompimento")).toBe("breakout");
    });

    it("should return undefined for unknown values", () => {
      expect(mapMarketConditionToDb("Unknown")).toBeUndefined();
    });
  });

  describe("mapMarketConditionFromDb", () => {
    it("should map database value to display value", () => {
      expect(mapMarketConditionFromDb("bull-trend")).toBe("📈 Tendência de Alta");
      expect(mapMarketConditionFromDb("bear-trend")).toBe("📉 Tendência de Baixa");
      expect(mapMarketConditionFromDb("ranging")).toBe("↔️ Lateralidade");
      expect(mapMarketConditionFromDb("breakout")).toBe("⚡ Rompimento");
    });

    it("should return empty string for undefined or unknown", () => {
      expect(mapMarketConditionFromDb(undefined)).toBe("");
      expect(mapMarketConditionFromDb("unknown")).toBe("");
    });
  });
});

describe("useTradeForm - Hook Initialization", () => {
  it("should initialize with default empty state", () => {
    const { result } = renderHook(() => useTradeForm());

    expect(result.current.state.symbol).toBe("");
    expect(result.current.state.type).toBe("");
    expect(result.current.state.entryPrice).toBe("");
    expect(result.current.state.stopLoss).toBe("");
    expect(result.current.state.takeProfit).toBe("");
    expect(result.current.state.tradeMode).toBe("open");
  });

  it("should initialize with provided initial data", () => {
    const initialTrade: Partial<Trade> = {
      symbol: "EURUSD",
      type: "Long",
      entryPrice: 1.1,
      stopLoss: 1.09,
      takeProfit: 1.12,
      lot: 1,
      strategy: "ICT",
      setup: "SMT",
      entry_quality: "picture-perfect",
      market_condition_v2: "bull-trend",
    };

    const { result } = renderHook(() => useTradeForm(initialTrade));

    expect(result.current.state.symbol).toBe("EURUSD");
    expect(result.current.state.type).toBe("Long");
    expect(result.current.state.entryPrice).toBe("1.1");
    expect(result.current.state.stopLoss).toBe("1.09");
    expect(result.current.state.takeProfit).toBe("1.12");
    expect(result.current.state.strategy).toBe("ICT");
    expect(result.current.state.setup).toBe("SMT");
    expect(result.current.state.entryQuality).toBe("🌟 Picture Perfect ST");
    expect(result.current.state.marketConditionV2).toBe("📈 Tendência de Alta");
  });

  it("should parse tags from comma-separated string", () => {
    const initialTrade: Partial<Trade> = {
      tags: "breakout, momentum, news",
    };

    const { result } = renderHook(() => useTradeForm(initialTrade));

    expect(result.current.state.tagsList).toEqual(["breakout", "momentum", "news"]);
  });

  it("should handle commission as absolute value", () => {
    const initialTrade: Partial<Trade> = {
      commission: -5.5,
    };

    const { result } = renderHook(() => useTradeForm(initialTrade));

    expect(result.current.state.commission).toBe("5.5");
  });
});

describe("useTradeForm - State Updates", () => {
  it("should update symbol", () => {
    const { result } = renderHook(() => useTradeForm());

    act(() => {
      result.current.setters.setSymbol("XAUUSD");
    });

    expect(result.current.state.symbol).toBe("XAUUSD");
  });

  it("should update trade type", () => {
    const { result } = renderHook(() => useTradeForm());

    act(() => {
      result.current.setters.setType("Short");
    });

    expect(result.current.state.type).toBe("Short");
  });

  it("should update entry price", () => {
    const { result } = renderHook(() => useTradeForm());

    act(() => {
      result.current.setters.setEntryPrice("1.1234");
    });

    expect(result.current.state.entryPrice).toBe("1.1234");
  });

  it("should update stop loss", () => {
    const { result } = renderHook(() => useTradeForm());

    act(() => {
      result.current.setters.setStopLoss("1.1");
    });

    expect(result.current.state.stopLoss).toBe("1.1");
  });

  it("should update take profit", () => {
    const { result } = renderHook(() => useTradeForm());

    act(() => {
      result.current.setters.setTakeProfit("1.15");
    });

    expect(result.current.state.takeProfit).toBe("1.15");
  });

  it("should update trade mode", () => {
    const { result } = renderHook(() => useTradeForm());

    act(() => {
      result.current.setters.setTradeMode("closed");
    });

    expect(result.current.state.tradeMode).toBe("closed");
    expect(result.current.computed.isTradeOpen).toBe(false);
  });
});

describe("useTradeForm - Computed Values", () => {
  it("should detect trading session based on entry time", () => {
    const { result } = renderHook(() => useTradeForm());

    act(() => {
      result.current.setters.setEntryDate("2024-01-15");
      result.current.setters.setEntryTime("10:00");
    });

    expect(result.current.computed.detectedSession).toBe("London");

    act(() => {
      result.current.setters.setEntryTime("15:00");
    });

    expect(result.current.computed.detectedSession).toBe("New York");

    act(() => {
      result.current.setters.setEntryTime("22:00");
    });

    expect(result.current.computed.detectedSession).toBe("Off-Hours");
  });

  it("should calculate timeframe alignment", () => {
    const { result } = renderHook(() => useTradeForm());

    act(() => {
      result.current.setters.setTfAnalise("D1");
      result.current.setters.setTfEntrada("H1");
    });

    expect(result.current.computed.alignmentResult).toEqual({
      aligned: true,
      type: "Top-Down",
    });
  });

  it("should calculate R Multiple preview", () => {
    const { result } = renderHook(() => useTradeForm());

    act(() => {
      result.current.setters.setType("Long");
      result.current.setters.setEntryPrice("100");
      result.current.setters.setExitPrice("105");
      result.current.setters.setStopLoss("98");
    });

    expect(result.current.computed.rMultiplePreview).toBe(2.5); // (105-100) / (100-98) = 2.5
  });

  it("should return null R Multiple when data incomplete", () => {
    const { result } = renderHook(() => useTradeForm());

    act(() => {
      result.current.setters.setEntryPrice("100");
      result.current.setters.setStopLoss("98");
      // Missing exitPrice
    });

    expect(result.current.computed.rMultiplePreview).toBeNull();
  });
});

describe("useTradeForm - Risk/Reward Calculations", () => {
  it("should calculate risk based on entry and stop loss", () => {
    const { result } = renderHook(() => useTradeForm());

    act(() => {
      result.current.setters.setSymbol("EURUSD");
      result.current.setters.setEntryPrice("1.1000");
      result.current.setters.setStopLoss("1.0950");
      result.current.setters.setLot("1");
    });

    // Risk = |1.1000 - 1.0950| * 1 * 100000 = 500
    expect(result.current.computed.estimates.risk).toBeCloseTo(500, 0);
  });

  it("should calculate reward based on entry and take profit", () => {
    const { result } = renderHook(() => useTradeForm());

    act(() => {
      result.current.setters.setSymbol("EURUSD");
      result.current.setters.setEntryPrice("1.1000");
      result.current.setters.setTakeProfit("1.1100");
      result.current.setters.setStopLoss("1.0950");
      result.current.setters.setLot("1");
    });

    // Reward = |1.1100 - 1.1000| * 1 * 100000 = 1000
    expect(result.current.computed.estimates.reward).toBeCloseTo(1000, 0);
  });

  it("should use correct multiplier for different assets", () => {
    const { result } = renderHook(() => useTradeForm());

    act(() => {
      result.current.setters.setSymbol("XAUUSD");
      result.current.setters.setEntryPrice("2000");
      result.current.setters.setStopLoss("1990");
      result.current.setters.setTakeProfit("2020");
      result.current.setters.setLot("1");
    });

    // Risk = |2000 - 1990| * 1 * 100 = 1000
    // Reward = |2020 - 2000| * 1 * 100 = 2000
    expect(result.current.computed.estimates.risk).toBe(1000);
    expect(result.current.computed.estimates.reward).toBe(2000);
  });

  it("should default to multiplier 1 for unknown assets", () => {
    const { result } = renderHook(() => useTradeForm());

    act(() => {
      result.current.setters.setSymbol("UNKNOWN");
      result.current.setters.setEntryPrice("100");
      result.current.setters.setStopLoss("95");
      result.current.setters.setLot("2");
    });

    // Risk = |100 - 95| * 2 * 1 = 10
    expect(result.current.computed.estimates.risk).toBe(10);
  });

  it("should return zero estimates when required fields missing", () => {
    const { result } = renderHook(() => useTradeForm());

    act(() => {
      result.current.setters.setEntryPrice("100");
      // Missing lot or stopLoss
    });

    expect(result.current.computed.estimates.risk).toBe(0);
    expect(result.current.computed.estimates.reward).toBe(0);
  });
});

describe("useTradeForm - Reset Function", () => {
  it("should reset all fields to default state", () => {
    const { result } = renderHook(() => useTradeForm());

    // Set some values
    act(() => {
      result.current.setters.setSymbol("EURUSD");
      result.current.setters.setType("Long");
      result.current.setters.setEntryPrice("1.1");
      result.current.setters.setStopLoss("1.09");
      result.current.setters.setStrategy("ICT");
      result.current.setters.setTagsList(["test", "tag"]);
    });

    // Reset
    act(() => {
      result.current.resetForm();
    });

    // Verify all fields are reset
    expect(result.current.state.symbol).toBe("");
    expect(result.current.state.type).toBe("");
    expect(result.current.state.entryPrice).toBe("");
    expect(result.current.state.stopLoss).toBe("");
    expect(result.current.state.takeProfit).toBe("");
    expect(result.current.state.strategy).toBe("");
    expect(result.current.state.tagsList).toEqual([]);
    expect(result.current.state.tradeMode).toBe("open");
  });
});

describe("useTradeForm - Trade Mode Logic", () => {
  it("should initialize as open when no exit price", () => {
    const initialTrade: Partial<Trade> = {
      entryPrice: 1.1,
    };

    const { result } = renderHook(() => useTradeForm(initialTrade));

    expect(result.current.state.tradeMode).toBe("open");
    expect(result.current.computed.isTradeOpen).toBe(true);
  });

  it("should initialize as closed when exit price exists", () => {
    const initialTrade: Partial<Trade> = {
      entryPrice: 1.1,
      exitPrice: 1.12,
    };

    const { result } = renderHook(() => useTradeForm(initialTrade));

    expect(result.current.state.tradeMode).toBe("closed");
    expect(result.current.computed.isTradeOpen).toBe(false);
  });

  it("should allow manual toggle of trade mode", () => {
    const { result } = renderHook(() => useTradeForm());

    expect(result.current.state.tradeMode).toBe("open");

    act(() => {
      result.current.setters.setTradeMode("closed");
    });

    expect(result.current.state.tradeMode).toBe("closed");
    expect(result.current.computed.isTradeOpen).toBe(false);
  });
});

describe("useTradeForm - Constants", () => {
  it("should export market conditions options", () => {
    expect(MARKET_CONDITIONS_V2).toHaveLength(4);
    expect(MARKET_CONDITIONS_V2).toContain("📈 Tendência de Alta");
    expect(MARKET_CONDITIONS_V2).toContain("📉 Tendência de Baixa");
  });

  it("should export entry quality options", () => {
    expect(ENTRY_QUALITY_OPTIONS).toHaveLength(4);
    expect(ENTRY_QUALITY_OPTIONS).toContain("🌟 Picture Perfect ST");
    expect(ENTRY_QUALITY_OPTIONS).toContain("⚠️ Ugly ST");
  });

  it("should export PD array options", () => {
    expect(PD_ARRAY_OPTIONS).toHaveLength(8);
    expect(PD_ARRAY_OPTIONS[0]).toEqual({ value: "FVG", label: "👑 FVG" });
  });
});
