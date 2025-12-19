import { describe, it, expect } from "vitest";
import { detectColumnMapping } from "../../services/trades/importParsers";
import { cleanSymbol, normalizeTradeType } from "../../services/trades/import";

describe("NinjaTrader Import Logic", () => {
  describe("detectColumnMapping", () => {
    it("detects English NinjaTrader headers", () => {
      const headers = [
        "Trade number",
        "Instrument",
        "Account",
        "Strategy",
        "Market pos.",
        "Qty",
        "Entry price",
        "Exit price",
        "Entry time",
        "Exit time",
      ];

      const mapping = detectColumnMapping(headers);

      expect(mapping.symbol).toBe("Instrument");
      expect(mapping.direction).toBe("Market pos.");
      expect(mapping.volume).toBe("Qty");
      expect(mapping.entryPrice).toBe("Entry price");
      expect(mapping.exitPrice).toBe("Exit price");
      expect(mapping.entryDate).toBe("Entry time");
      expect(mapping.exitDate).toBe("Exit time");
    });
  });

  describe("cleanSymbol", () => {
    it("cleans standard NinjaTrader format (MNQ 12-25)", () => {
      expect(cleanSymbol("MNQ 12-25")).toBe("MNQ");
    });

    it("cleans English NinjaTrader format (NQ DEC25)", () => {
      expect(cleanSymbol("NQ DEC25")).toBe("NQ");
      expect(cleanSymbol("MNQ DEC25")).toBe("MNQ");
      expect(cleanSymbol("MES MAR26")).toBe("MES");
    });

    it("handles symbols without date", () => {
      expect(cleanSymbol("EURUSD")).toBe("EURUSD");
    });
      
      it("cleans MetaTrader symbols", () => {
          expect(cleanSymbol("EURUSD.cash")).toBe("EURUSD");
      });
  });

  describe("normalizeTradeType", () => {
    it("normalizes English types", () => {
      expect(normalizeTradeType("Long")).toBe("Long");
      expect(normalizeTradeType("Short")).toBe("Short");
    });

    it("normalizes Portuguese types", () => {
      expect(normalizeTradeType("Comprada")).toBe("Long");
      expect(normalizeTradeType("Venda")).toBe("Short");
    });

    it("is case insensitive", () => {
      expect(normalizeTradeType("long")).toBe("Long");
      expect(normalizeTradeType("short")).toBe("Short");
      expect(normalizeTradeType("comprada")).toBe("Long");
    });
  });
});
