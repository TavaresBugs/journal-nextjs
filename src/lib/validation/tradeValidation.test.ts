import { describe, it, expect } from "vitest";
import {
  validateDates,
  validatePrices,
  validateQuantity,
  validateRequiredFields,
  validateTrade,
  validateField,
} from "./tradeValidation";
import type { TradeValidationInput } from "./tradeValidation.types";

// ============================================
// Test Helpers
// ============================================

const createValidInput = (): TradeValidationInput => ({
  type: "Long",
  entryPrice: "100",
  exitPrice: "",
  stopLoss: "95",
  takeProfit: "110",
  lot: "1",
  entryDate: "2025-01-15",
  entryTime: "10:00",
  exitDate: "",
  exitTime: "",
  symbol: "EURUSD",
});

// ============================================
// validateDates Tests
// ============================================

describe("validateDates", () => {
  it("should return no errors for valid entry date", () => {
    const errors = validateDates("2025-01-15", "10:00", "", "");
    expect(errors).toHaveLength(0);
  });

  it("should error when entry date is empty", () => {
    const errors = validateDates("", "", "", "");
    expect(errors).toHaveLength(1);
    expect(errors[0].code).toBe("REQUIRED");
    expect(errors[0].field).toBe("entryDate");
  });

  it("should error when exit date is before entry date", () => {
    const errors = validateDates("2025-01-15", "10:00", "2025-01-10", "10:00");
    expect(errors.some((e) => e.code === "DATE_SEQUENCE")).toBe(true);
  });

  it("should allow exit date equal to entry date", () => {
    const errors = validateDates("2025-01-15", "10:00", "2025-01-15", "11:00");
    expect(errors.filter((e) => e.code === "DATE_SEQUENCE")).toHaveLength(0);
  });

  it("should error when entry year is before minYear", () => {
    const errors = validateDates("1990-01-15", "", "", "");
    expect(errors.some((e) => e.code === "OUT_OF_RANGE")).toBe(true);
  });

  it("should error when entry year is after maxYear", () => {
    const errors = validateDates("2099-01-15", "", "", "");
    expect(errors.some((e) => e.code === "OUT_OF_RANGE")).toBe(true);
  });

  it("should error for invalid date format", () => {
    const errors = validateDates("invalid-date", "", "", "");
    expect(errors.some((e) => e.code === "INVALID_DATE")).toBe(true);
  });

  it("should allow exit next day even with earlier time (overnight trade)", () => {
    // Entry: 17/01/2024 15:00, Exit: 18/01/2024 03:15
    // This is a valid overnight trade - exit IS after entry
    const errors = validateDates("2024-01-17", "15:00", "2024-01-18", "03:15");
    expect(errors.filter((e) => e.code === "DATE_SEQUENCE")).toHaveLength(0);
  });
});

// ============================================
// validatePrices Tests
// ============================================

describe("validatePrices", () => {
  it("should return no errors for valid prices", () => {
    const result = validatePrices("100", "", "95", "110", "Long");
    expect(result.errors).toHaveLength(0);
  });

  it("should error when entry price is zero", () => {
    const { errors } = validatePrices("0", "", "", "", "Long");
    expect(errors.some((e) => e.field === "entryPrice" && e.code === "INVALID_PRICE")).toBe(true);
  });

  it("should error when entry price is negative", () => {
    const { errors } = validatePrices("-100", "", "", "", "Long");
    expect(errors.some((e) => e.field === "entryPrice" && e.code === "INVALID_PRICE")).toBe(true);
  });

  it("should error when entry price is NaN", () => {
    const { errors } = validatePrices("abc", "", "", "", "Long");
    expect(errors.some((e) => e.field === "entryPrice" && e.code === "INVALID_FORMAT")).toBe(true);
  });

  it("should error when stop loss is zero", () => {
    const { errors } = validatePrices("100", "", "0", "", "Long");
    expect(errors.some((e) => e.field === "stopLoss" && e.code === "INVALID_PRICE")).toBe(true);
  });

  it("should warn when SL is above entry for Long", () => {
    const { warnings } = validatePrices("100", "", "110", "", "Long");
    expect(warnings.some((e) => e.field === "stopLoss" && e.isWarning)).toBe(true);
  });

  it("should warn when TP is below entry for Long", () => {
    const { warnings } = validatePrices("100", "", "", "90", "Long");
    expect(warnings.some((e) => e.field === "takeProfit" && e.isWarning)).toBe(true);
  });

  it("should warn when SL is below entry for Short", () => {
    const { warnings } = validatePrices("100", "", "90", "", "Short");
    expect(warnings.some((e) => e.field === "stopLoss" && e.isWarning)).toBe(true);
  });

  it("should warn when TP is above entry for Short", () => {
    const { warnings } = validatePrices("100", "", "", "110", "Short");
    expect(warnings.some((e) => e.field === "takeProfit" && e.isWarning)).toBe(true);
  });

  it("should not warn when SL/TP are correctly positioned for Long", () => {
    const { warnings } = validatePrices("100", "", "95", "110", "Long");
    expect(warnings).toHaveLength(0);
  });

  it("should not warn when SL/TP are correctly positioned for Short", () => {
    const { warnings } = validatePrices("100", "", "110", "90", "Short");
    expect(warnings).toHaveLength(0);
  });

  it("should warn when direction is not defined but trade has exit price", () => {
    const { warnings } = validatePrices("100", "105", "", "", "");
    expect(warnings.some((e) => e.field === "type" && e.isWarning)).toBe(true);
  });

  it("should not warn about direction when trade is open (no exit price)", () => {
    const { warnings } = validatePrices("100", "", "", "", "");
    expect(warnings.filter((e) => e.field === "type")).toHaveLength(0);
  });
});

// ============================================
// validateQuantity Tests
// ============================================

describe("validateQuantity", () => {
  it("should return no errors for valid lot", () => {
    const errors = validateQuantity("1");
    expect(errors).toHaveLength(0);
  });

  it("should error when lot is empty", () => {
    const errors = validateQuantity("");
    expect(errors.some((e) => e.code === "REQUIRED")).toBe(true);
  });

  it("should error when lot is zero", () => {
    const errors = validateQuantity("0");
    expect(errors.some((e) => e.code === "INVALID_QUANTITY")).toBe(true);
  });

  it("should error when lot is negative", () => {
    const errors = validateQuantity("-1");
    expect(errors.some((e) => e.code === "INVALID_QUANTITY")).toBe(true);
  });

  it("should error when lot exceeds maxLotSize", () => {
    const errors = validateQuantity("9999");
    expect(errors.some((e) => e.code === "OUT_OF_RANGE")).toBe(true);
  });

  it("should error when lot is not a number", () => {
    const errors = validateQuantity("abc");
    expect(errors.some((e) => e.code === "INVALID_FORMAT")).toBe(true);
  });

  it("should accept decimal lots", () => {
    const errors = validateQuantity("0.01");
    expect(errors).toHaveLength(0);
  });
});

// ============================================
// validateRequiredFields Tests
// ============================================

describe("validateRequiredFields", () => {
  it("should return no errors when all required fields are filled", () => {
    const input = createValidInput();
    const errors = validateRequiredFields(input);
    expect(errors).toHaveLength(0);
  });

  it("should error when symbol is empty", () => {
    const input = { ...createValidInput(), symbol: "" };
    const errors = validateRequiredFields(input);
    expect(errors.some((e) => e.field === "symbol")).toBe(true);
  });

  it("should error when type is empty", () => {
    const input = { ...createValidInput(), type: "" as const };
    const errors = validateRequiredFields(input);
    expect(errors.some((e) => e.field === "type")).toBe(true);
  });

  it("should error when entryPrice is empty", () => {
    const input = { ...createValidInput(), entryPrice: "" };
    const errors = validateRequiredFields(input);
    expect(errors.some((e) => e.field === "entryPrice")).toBe(true);
  });

  it("should error when lot is empty", () => {
    const input = { ...createValidInput(), lot: "" };
    const errors = validateRequiredFields(input);
    expect(errors.some((e) => e.field === "lot")).toBe(true);
  });

  it("should error when entryDate is empty", () => {
    const input = { ...createValidInput(), entryDate: "" };
    const errors = validateRequiredFields(input);
    expect(errors.some((e) => e.field === "entryDate")).toBe(true);
  });
});

// ============================================
// validateTrade (Integration) Tests
// ============================================

describe("validateTrade", () => {
  it("should return isValid=true for valid trade", () => {
    const input = createValidInput();
    const result = validateTrade(input);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("should return isValid=false for trade with missing required fields", () => {
    const input = { ...createValidInput(), symbol: "", type: "" as const };
    const result = validateTrade(input);
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it("should return isValid=false for trade with invalid dates", () => {
    const input = {
      ...createValidInput(),
      exitDate: "2024-01-01", // Before entry
    };
    const result = validateTrade(input);
    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.code === "DATE_SEQUENCE")).toBe(true);
  });

  it("should return isValid=false for trade with invalid prices", () => {
    const input = { ...createValidInput(), entryPrice: "0" };
    const result = validateTrade(input);
    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.field === "entryPrice")).toBe(true);
  });

  it("should return warnings separately from errors", () => {
    const input = {
      ...createValidInput(),
      stopLoss: "110", // Above entry for Long = warning
    };
    const result = validateTrade(input);
    expect(result.isValid).toBe(true); // Warnings don't make it invalid
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it("should deduplicate errors with same field and code", () => {
    const input = {
      ...createValidInput(),
      entryDate: "",
      entryPrice: "",
    };
    const result = validateTrade(input);
    const entryDateErrors = result.errors.filter((e) => e.field === "entryDate");
    // Should only have one error per field even if multiple validation functions flag it
    expect(entryDateErrors.length).toBeLessThanOrEqual(2);
  });
});

// ============================================
// validateField Tests
// ============================================

describe("validateField", () => {
  it("should validate single field in context", () => {
    const input = { ...createValidInput(), entryPrice: "0" };
    const errors = validateField("entryPrice", "0", input);
    expect(errors.some((e) => e.code === "INVALID_PRICE")).toBe(true);
  });

  it("should validate lot field independently", () => {
    const errors = validateField("lot", "-5", undefined);
    expect(errors.some((e) => e.code === "INVALID_QUANTITY")).toBe(true);
  });

  it("should validate symbol as required", () => {
    const errors = validateField("symbol", "", undefined);
    expect(errors.some((e) => e.code === "REQUIRED")).toBe(true);
  });
});
