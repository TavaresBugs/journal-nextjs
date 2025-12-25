import { describe, it, expect } from "vitest";
import {
  getTimeframePriority,
  getSessionIcon,
  getConditionIcon,
  getConditionLabel,
  getQualityIcon,
  getQualityLabel,
  getPdArrayIcon,
  getPdArrayLabel,
} from "@/lib/utils/playbook";

describe("Playbook Utilities", () => {
  describe("getTimeframePriority", () => {
    it("should return higher priority for longer timeframes", () => {
      // Monthly variations
      expect(getTimeframePriority("Mensal")).toBe(100);
      expect(getTimeframePriority("MN")).toBe(100);

      // Weekly variations
      expect(getTimeframePriority("Semanal")).toBe(90);
      expect(getTimeframePriority("W1")).toBe(90);
      expect(getTimeframePriority("W")).toBe(90);

      // Daily variations
      expect(getTimeframePriority("Diario")).toBe(80);
      expect(getTimeframePriority("Diário")).toBe(80);
      expect(getTimeframePriority("D1")).toBe(80);
      expect(getTimeframePriority("D")).toBe(80);
    });

    it("should return correct priority for hour-based timeframes", () => {
      expect(getTimeframePriority("4H")).toBe(70);
      expect(getTimeframePriority("H4")).toBe(70);
      expect(getTimeframePriority("4h")).toBe(70);

      expect(getTimeframePriority("1H")).toBe(60);
      expect(getTimeframePriority("H1")).toBe(60);
      expect(getTimeframePriority("1h")).toBe(60);
    });

    it("should return correct priority for minute-based timeframes", () => {
      expect(getTimeframePriority("30m")).toBe(50);
      expect(getTimeframePriority("M30")).toBe(50);

      expect(getTimeframePriority("15m")).toBe(40);
      expect(getTimeframePriority("M15")).toBe(40);

      expect(getTimeframePriority("5m")).toBe(30);
      expect(getTimeframePriority("M5")).toBe(30);

      expect(getTimeframePriority("3m")).toBe(20);
      expect(getTimeframePriority("M3")).toBe(20);

      expect(getTimeframePriority("1m")).toBe(10);
      // M1 with uppercase M is treated as Monthly (100), lowercase m1 is 1 minute (10)
      expect(getTimeframePriority("m1")).toBe(10);
    });

    it("should return 0 for unknown timeframes", () => {
      expect(getTimeframePriority("Unknown")).toBe(0);
      expect(getTimeframePriority("")).toBe(0);
      expect(getTimeframePriority("XYZ")).toBe(0);
    });

    it("should be case insensitive", () => {
      expect(getTimeframePriority("DIARIO")).toBe(80);
      expect(getTimeframePriority("diario")).toBe(80);
      expect(getTimeframePriority("Diario")).toBe(80);

      expect(getTimeframePriority("SEMANAL")).toBe(90);
      expect(getTimeframePriority("semanal")).toBe(90);
    });

    it("should handle whitespace", () => {
      expect(getTimeframePriority("D 1")).toBe(80);
      expect(getTimeframePriority(" M30 ")).toBe(50);
    });
  });

  describe("getSessionIcon", () => {
    it("should return correct icons for trading sessions", () => {
      expect(getSessionIcon("asian")).toBe("🌏");
      expect(getSessionIcon("Asian")).toBe("🌏");
      expect(getSessionIcon("ASIAN")).toBe("🌏");
    });

    it("should return London icon", () => {
      expect(getSessionIcon("london")).toBe("🇬🇧");
      expect(getSessionIcon("London")).toBe("🇬🇧");
    });

    it("should return New York icon", () => {
      expect(getSessionIcon("new york")).toBe("🇺🇸");
      expect(getSessionIcon("New York")).toBe("🇺🇸");
      expect(getSessionIcon("new-york")).toBe("🇺🇸");
      expect(getSessionIcon("New-York")).toBe("🇺🇸");
    });

    it("should return Overlap icon", () => {
      expect(getSessionIcon("overlap")).toBe("🔄");
      expect(getSessionIcon("Overlap")).toBe("🔄");
    });

    it("should return default icon for unknown sessions", () => {
      expect(getSessionIcon("unknown")).toBe("🌐");
      expect(getSessionIcon("")).toBe("🌐");
      expect(getSessionIcon("Sydney")).toBe("🌐");
    });
  });

  describe("getConditionIcon", () => {
    it("should return correct icon for bull trend", () => {
      expect(getConditionIcon("bull-trend")).toBe("📈");
    });

    it("should return correct icon for bear trend", () => {
      expect(getConditionIcon("bear-trend")).toBe("📉");
    });

    it("should return correct icon for ranging", () => {
      expect(getConditionIcon("ranging")).toBe("↔️");
    });

    it("should return correct icon for breakout", () => {
      expect(getConditionIcon("breakout")).toBe("⚡");
    });

    it("should return default icon for unknown conditions", () => {
      expect(getConditionIcon("unknown")).toBe("📊");
      expect(getConditionIcon("")).toBe("📊");
    });
  });

  describe("getConditionLabel", () => {
    it("should return Portuguese labels for market conditions", () => {
      expect(getConditionLabel("bull-trend")).toBe("Tendência de Alta");
      expect(getConditionLabel("bear-trend")).toBe("Tendência de Baixa");
      expect(getConditionLabel("ranging")).toBe("Lateralidade");
      expect(getConditionLabel("breakout")).toBe("Rompimento");
    });

    it("should return input value for unknown conditions", () => {
      expect(getConditionLabel("custom")).toBe("custom");
    });

    it("should return N/A for empty string", () => {
      expect(getConditionLabel("")).toBe("N/A");
    });
  });

  describe("getQualityIcon", () => {
    it("should return correct icons for entry quality", () => {
      expect(getQualityIcon("picture-perfect")).toBe("🌟");
      expect(getQualityIcon("nice")).toBe("✅");
      expect(getQualityIcon("normal")).toBe("➖");
      expect(getQualityIcon("ugly")).toBe("⚠️");
    });

    it("should return default icon for unknown quality", () => {
      expect(getQualityIcon("unknown")).toBe("❓");
      expect(getQualityIcon("")).toBe("❓");
    });
  });

  describe("getQualityLabel", () => {
    it("should return English labels for entry quality", () => {
      expect(getQualityLabel("picture-perfect")).toBe("Picture Perfect");
      expect(getQualityLabel("nice")).toBe("Nice ST");
      expect(getQualityLabel("normal")).toBe("Normal ST");
      expect(getQualityLabel("ugly")).toBe("Ugly ST");
    });

    it("should return input value for unknown quality", () => {
      expect(getQualityLabel("custom")).toBe("custom");
    });

    it("should return N/A for empty string", () => {
      expect(getQualityLabel("")).toBe("N/A");
    });
  });

  describe("getPdArrayIcon", () => {
    it("should return correct icons for PD Arrays", () => {
      expect(getPdArrayIcon("FVG")).toBe("👑");
      expect(getPdArrayIcon("OB")).toBe("🧱");
      expect(getPdArrayIcon("MB")).toBe("🧱");
      expect(getPdArrayIcon("BB")).toBe("🧱");
    });

    it("should return trend icons for swing points", () => {
      expect(getPdArrayIcon("Swing High")).toBe("📈");
      expect(getPdArrayIcon("Swing Low")).toBe("📉");
      expect(getPdArrayIcon("PDH")).toBe("📈");
      expect(getPdArrayIcon("PDL")).toBe("📉");
    });

    it("should return default icon for unknown PD Arrays", () => {
      expect(getPdArrayIcon("unknown")).toBe("📍");
      expect(getPdArrayIcon("")).toBe("📍");
    });
  });

  describe("getPdArrayLabel", () => {
    it("should return full labels for common PD Arrays", () => {
      expect(getPdArrayLabel("FVG")).toBe("Fair Value Gap");
      expect(getPdArrayLabel("OB")).toBe("Order Block");
      expect(getPdArrayLabel("MB")).toBe("Mitigation Block");
      expect(getPdArrayLabel("BB")).toBe("Breaker Block");
    });

    it("should return descriptive labels for swing points", () => {
      expect(getPdArrayLabel("Swing High")).toBe("Swing High (PXH)");
      expect(getPdArrayLabel("Swing Low")).toBe("Swing Low (PXL)");
      expect(getPdArrayLabel("PDH")).toBe("Previous Daily High");
      expect(getPdArrayLabel("PDL")).toBe("Previous Daily Low");
    });

    it("should return input value for unknown PD Arrays", () => {
      expect(getPdArrayLabel("custom")).toBe("custom");
    });

    it("should return N/A for empty string", () => {
      expect(getPdArrayLabel("")).toBe("N/A");
    });
  });

  describe("Edge Cases and Integration", () => {
    it("should handle all priority levels in sequence", () => {
      const timeframes = [
        "Mensal",
        "Semanal",
        "Diario",
        "4H",
        "1H",
        "30m",
        "15m",
        "5m",
        "3m",
        "1m",
      ];
      const priorities = timeframes.map(getTimeframePriority);

      // Verify descending order
      for (let i = 0; i < priorities.length - 1; i++) {
        expect(priorities[i]).toBeGreaterThan(priorities[i + 1]);
      }
    });

    it("should maintain icon consistency across related functions", () => {
      // Bull/Bear icons should match in condition and swing points
      const bullConditionIcon = getConditionIcon("bull-trend");
      const swingHighIcon = getPdArrayIcon("Swing High");
      expect(bullConditionIcon).toBe("📈");
      expect(swingHighIcon).toBe("📈");

      const bearConditionIcon = getConditionIcon("bear-trend");
      const swingLowIcon = getPdArrayIcon("Swing Low");
      expect(bearConditionIcon).toBe("📉");
      expect(swingLowIcon).toBe("📉");
    });

    it("should return valid icons for all standard inputs", () => {
      const sessions = ["asian", "london", "new york", "overlap"];
      sessions.forEach((session) => {
        const icon = getSessionIcon(session);
        expect(icon).toBeTruthy();
        expect(typeof icon).toBe("string");
      });

      const conditions = ["bull-trend", "bear-trend", "ranging", "breakout"];
      conditions.forEach((condition) => {
        const icon = getConditionIcon(condition);
        expect(icon).toBeTruthy();
        expect(typeof icon).toBe("string");
      });

      const qualities = ["picture-perfect", "nice", "normal", "ugly"];
      qualities.forEach((quality) => {
        const icon = getQualityIcon(quality);
        expect(icon).toBeTruthy();
        expect(typeof icon).toBe("string");
      });
    });
  });
});
