import { describe, it, expect } from "vitest";
import {
  parseTradovateMoney,
  parseTradovatePrice,
  parseTradovateDate,
  parseTradovateContent,
  determineTradovateDirection,
  cleanTradovateSymbol,
} from "../../services/trades/tradovateParser";

describe("Tradovate Import Logic", () => {
  describe("parseTradovateMoney", () => {
    it("parses positive money values", () => {
      expect(parseTradovateMoney("$255.00")).toBe(255);
      expect(parseTradovateMoney("$110.00")).toBe(110);
      expect(parseTradovateMoney("$0.00")).toBe(0);
    });

    it("parses negative money values with parentheses", () => {
      expect(parseTradovateMoney("$(115.00)")).toBe(-115);
      expect(parseTradovateMoney("$(255.00)")).toBe(-255);
      expect(parseTradovateMoney("$(5.00)")).toBe(-5);
    });

    it("handles values without dollar sign", () => {
      expect(parseTradovateMoney("255.00")).toBe(255);
      expect(parseTradovateMoney("(115.00)")).toBe(-115);
    });

    it("handles number input", () => {
      expect(parseTradovateMoney(255)).toBe(255);
      expect(parseTradovateMoney(-115)).toBe(-115);
    });

    it("handles empty/invalid input", () => {
      expect(parseTradovateMoney("")).toBe(0);
      expect(parseTradovateMoney("invalid")).toBe(0);
    });
  });

  describe("parseTradovatePrice", () => {
    it("parses price values with dot decimal", () => {
      expect(parseTradovatePrice("25501.00")).toBe(25501);
      expect(parseTradovatePrice("25513.75")).toBe(25513.75);
      expect(parseTradovatePrice("25473.75")).toBe(25473.75);
    });

    it("handles number input", () => {
      expect(parseTradovatePrice(25501.0)).toBe(25501);
    });
  });

  describe("parseTradovateDate", () => {
    it("parses MM/dd/yyyy HH:mm:ss format", () => {
      const date = parseTradovateDate("11/30/2025 20:15:41");
      expect(date).not.toBeNull();
      expect(date?.getFullYear()).toBe(2025);
      expect(date?.getMonth()).toBe(10); // November (0-indexed)
      expect(date?.getDate()).toBe(30);
      expect(date?.getHours()).toBe(20);
      expect(date?.getMinutes()).toBe(15);
      expect(date?.getSeconds()).toBe(41);
    });

    it("parses single digit hour format", () => {
      const date = parseTradovateDate("11/30/2025 8:15:41");
      expect(date).not.toBeNull();
      expect(date?.getHours()).toBe(8);
    });

    it("handles empty/invalid input", () => {
      expect(parseTradovateDate("")).toBeNull();
      expect(parseTradovateDate("invalid")).toBeNull();
    });
  });

  describe("determineTradovateDirection", () => {
    it("returns Long when bought before sold", () => {
      const direction = determineTradovateDirection("11/30/2025 20:15:41", "11/30/2025 20:21:56");
      expect(direction).toBe("Long");
    });

    it("returns Short when sold before bought", () => {
      const direction = determineTradovateDirection("11/30/2025 20:21:56", "11/30/2025 20:15:41");
      expect(direction).toBe("Short");
    });

    it("defaults to Long for invalid dates", () => {
      const direction = determineTradovateDirection("", "");
      expect(direction).toBe("Long");
    });
  });

  describe("cleanTradovateSymbol", () => {
    it("removes contract month/year code", () => {
      // Format: [Base 2-4 letters][Month Code][Year 1-2 digits]
      // Month codes: F,G,H,J,K,M,N,Q,U,V,X,Z
      expect(cleanTradovateSymbol("NQZ5")).toBe("NQ"); // NQ + Z(Dec) + 5(2025)
      expect(cleanTradovateSymbol("ESZ5")).toBe("ES"); // ES + Z(Dec) + 5(2025)
      expect(cleanTradovateSymbol("MESH5")).toBe("MES"); // MES + H(Mar) + 5(2025)
      expect(cleanTradovateSymbol("MNQZ25")).toBe("MNQ"); // MNQ + Z(Dec) + 25(2025)
    });

    it("handles empty input", () => {
      expect(cleanTradovateSymbol("")).toBe("");
    });

    it("preserves symbols without contract code", () => {
      expect(cleanTradovateSymbol("EURUSD")).toBe("EURUSD");
    });
  });

  describe("parseTradovateContent", () => {
    it("parses valid CSV content", () => {
      const csv = `symbol,_priceFormat,_priceFormatType,_tickSize,buyFillId,sellFillId,qty,buyPrice,sellPrice,pnl,boughtTimestamp,soldTimestamp,duration
NQZ5,-2,0,0.25,334740350013,334740350038,1,25501.00,25513.75,$255.00,11/30/2025 20:15:41,11/30/2025 20:21:56,6min 15sec
NQZ5,-2,0,0.25,334740350052,334740350077,1,25473.75,25473.75,$0.00,11/30/2025 20:32:29,11/30/2025 20:34:02,1min 32sec`;

      const result = parseTradovateContent(csv);
      expect(result.data).toHaveLength(2);
      expect(result.data[0].symbol).toBe("NQZ5");
      expect(result.data[0].pnl).toBe("$255.00");
      expect(result.data[0].buyPrice).toBe("25501.00");
      expect(result.totalPnL).toBe(255); // 255 + 0
    });

    it("throws error for missing required columns", () => {
      const csv = `wrong,columns,here
1,2,3`;
      expect(() => parseTradovateContent(csv)).toThrow("Missing required columns");
    });

    it("throws error for empty content", () => {
      expect(() => parseTradovateContent("")).toThrow("File is empty");
    });
  });
});
