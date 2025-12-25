import { describe, it, expect } from "vitest";
import {
  getStrategyIcon,
  getStrategyLabel,
  getPDArrayIcon,
  getPDArrayLabel,
} from "@/lib/tradeHelpers";

describe("Trade Helpers", () => {
  describe("getStrategyIcon", () => {
    it("should return correct icon for MMBM strategy", () => {
      expect(getStrategyIcon("mmbm")).toBe("🧪");
      expect(getStrategyIcon("MMBM")).toBe("🧪");
      expect(getStrategyIcon("MmBm")).toBe("🧪");
    });

    it("should return correct icon for AMD strategy", () => {
      expect(getStrategyIcon("amd")).toBe("🧪");
      expect(getStrategyIcon("AMD")).toBe("🧪");
    });

    it("should return correct icon for Breaker strategy", () => {
      expect(getStrategyIcon("breaker")).toBe("🧪");
      expect(getStrategyIcon("BREAKER")).toBe("🧪");
    });

    it("should return correct icon for Silver Bullet strategy", () => {
      expect(getStrategyIcon("silver_bullet")).toBe("🧪");
      expect(getStrategyIcon("SILVER_BULLET")).toBe("🧪");
    });

    it("should return default icon for unknown strategy", () => {
      expect(getStrategyIcon("unknown")).toBe("🧪");
      expect(getStrategyIcon("random_strategy")).toBe("🧪");
    });

    it("should return default icon for empty string", () => {
      expect(getStrategyIcon("")).toBe("🧪");
    });

    it("should handle null/undefined gracefully", () => {
      expect(getStrategyIcon(null as unknown as string)).toBe("🧪");
      expect(getStrategyIcon(undefined as unknown as string)).toBe("🧪");
    });
  });

  describe("getStrategyLabel", () => {
    it("should return empty string for falsy values", () => {
      expect(getStrategyLabel("")).toBe("");
      expect(getStrategyLabel(null as unknown as string)).toBe("");
      expect(getStrategyLabel(undefined as unknown as string)).toBe("");
    });

    it("should return correct label for MMBM", () => {
      expect(getStrategyLabel("mmbm")).toBe("MMBM");
      expect(getStrategyLabel("MMBM")).toBe("MMBM");
    });

    it("should return correct label for AMD", () => {
      expect(getStrategyLabel("amd")).toBe("AMD");
      expect(getStrategyLabel("AMD")).toBe("AMD");
    });

    it("should return correct label for Breaker", () => {
      expect(getStrategyLabel("breaker")).toBe("Breaker");
      expect(getStrategyLabel("BREAKER")).toBe("Breaker");
    });

    it("should return correct label for Silver Bullet", () => {
      expect(getStrategyLabel("silver_bullet")).toBe("Silver Bullet");
      expect(getStrategyLabel("SILVER_BULLET")).toBe("Silver Bullet");
    });

    it("should return uppercase for unknown strategy", () => {
      expect(getStrategyLabel("custom")).toBe("CUSTOM");
      expect(getStrategyLabel("my_strategy")).toBe("MY_STRATEGY");
    });

    it("should be case insensitive", () => {
      expect(getStrategyLabel("MmBm")).toBe("MMBM");
      expect(getStrategyLabel("AmD")).toBe("AMD");
    });
  });

  describe("getPDArrayIcon", () => {
    it("should return correct icon for FVG", () => {
      expect(getPDArrayIcon("fvg")).toBe("👑");
      expect(getPDArrayIcon("FVG")).toBe("👑");
    });

    it("should return correct icon for OB", () => {
      expect(getPDArrayIcon("ob")).toBe("📦");
      expect(getPDArrayIcon("OB")).toBe("📦");
    });

    it("should return correct icon for Breaker", () => {
      expect(getPDArrayIcon("breaker")).toBe("💥");
      expect(getPDArrayIcon("BREAKER")).toBe("💥");
    });

    it("should return correct icon for BB", () => {
      expect(getPDArrayIcon("bb")).toBe("💥");
      expect(getPDArrayIcon("BB")).toBe("💥");
    });

    it("should return correct icon for MB/Mitigation", () => {
      expect(getPDArrayIcon("mb")).toBe("🛡️");
      expect(getPDArrayIcon("MB")).toBe("🛡️");
      expect(getPDArrayIcon("mitigation")).toBe("🛡️");
      expect(getPDArrayIcon("MITIGATION")).toBe("🛡️");
    });

    it("should return correct icon for swing points", () => {
      expect(getPDArrayIcon("pxh")).toBe("🔺");
      expect(getPDArrayIcon("pxl")).toBe("🔻");
      expect(getPDArrayIcon("PXH")).toBe("🔺");
      expect(getPDArrayIcon("PXL")).toBe("🔻");
    });

    it("should return correct icon for previous daily levels", () => {
      expect(getPDArrayIcon("pdh")).toBe("⬆️");
      expect(getPDArrayIcon("pdl")).toBe("⬇️");
      expect(getPDArrayIcon("PDH")).toBe("⬆️");
      expect(getPDArrayIcon("PDL")).toBe("⬇️");
    });

    it("should return default icon for unknown PD Array", () => {
      expect(getPDArrayIcon("unknown")).toBe("👑");
      expect(getPDArrayIcon("random")).toBe("👑");
    });

    it("should return default icon for empty string", () => {
      expect(getPDArrayIcon("")).toBe("👑");
    });

    it("should handle null/undefined gracefully", () => {
      expect(getPDArrayIcon(null as unknown as string)).toBe("👑");
      expect(getPDArrayIcon(undefined as unknown as string)).toBe("👑");
    });

    it("should be case insensitive", () => {
      expect(getPDArrayIcon("FvG")).toBe("👑");
      expect(getPDArrayIcon("Ob")).toBe("📦");
    });
  });

  describe("getPDArrayLabel", () => {
    it("should return empty string for falsy values", () => {
      expect(getPDArrayLabel("")).toBe("");
      expect(getPDArrayLabel(null as unknown as string)).toBe("");
      expect(getPDArrayLabel(undefined as unknown as string)).toBe("");
    });

    it("should return correct label for FVG", () => {
      expect(getPDArrayLabel("fvg")).toBe("FVG");
      expect(getPDArrayLabel("FVG")).toBe("FVG");
    });

    it("should return correct label for OB", () => {
      expect(getPDArrayLabel("ob")).toBe("OB");
      expect(getPDArrayLabel("OB")).toBe("OB");
    });

    it("should return correct label for Breaker", () => {
      expect(getPDArrayLabel("breaker")).toBe("Breaker");
      expect(getPDArrayLabel("BREAKER")).toBe("Breaker");
    });

    it("should return correct label for Mitigation", () => {
      expect(getPDArrayLabel("mitigation")).toBe("Mitigation Block");
      expect(getPDArrayLabel("MITIGATION")).toBe("Mitigation Block");
    });

    it("should return uppercase for unknown PD Arrays", () => {
      expect(getPDArrayLabel("custom")).toBe("CUSTOM");
      expect(getPDArrayLabel("pxh")).toBe("PXH");
      expect(getPDArrayLabel("pdl")).toBe("PDL");
    });

    it("should be case insensitive", () => {
      expect(getPDArrayLabel("FvG")).toBe("FVG");
      expect(getPDArrayLabel("Ob")).toBe("OB");
    });
  });

  describe("Integration - Icons and Labels Consistency", () => {
    it("should have matching icons and labels for all strategies", () => {
      const strategies = ["mmbm", "amd", "breaker", "silver_bullet"];

      strategies.forEach((strategy) => {
        const icon = getStrategyIcon(strategy);
        const label = getStrategyLabel(strategy);

        expect(icon).toBeTruthy();
        expect(label).toBeTruthy();
        expect(icon).toBe("🧪"); // All strategies use the same icon
      });
    });

    it("should have matching icons and labels for all PD Arrays", () => {
      const pdArrays = ["fvg", "ob", "breaker", "mitigation"];

      pdArrays.forEach((pdArray) => {
        const icon = getPDArrayIcon(pdArray);
        const label = getPDArrayLabel(pdArray);

        expect(icon).toBeTruthy();
        expect(label).toBeTruthy();
      });
    });

    it("should handle mixed case consistently", () => {
      // Strategies
      expect(getStrategyIcon("MmBm")).toBe(getStrategyIcon("mmbm"));
      expect(getStrategyLabel("MmBm")).toBe(getStrategyLabel("MMBM"));

      // PD Arrays
      expect(getPDArrayIcon("FvG")).toBe(getPDArrayIcon("fvg"));
      expect(getPDArrayLabel("FvG")).toBe(getPDArrayLabel("FVG"));
    });
  });
});
