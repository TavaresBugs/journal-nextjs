import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useTradeValidation, type TradeValidationInput } from "../hooks/useTradeValidation";

describe("useTradeValidation", () => {
  // Helper to create a valid trade input
  const createValidInput = (): TradeValidationInput => ({
    symbol: "EURUSD",
    type: "Long",
    entryPrice: "1.1000",
    exitPrice: "1.1050",
    stopLoss: "1.0950",
    takeProfit: "1.1100",
    lot: "1.0",
    entryDate: "2024-12-19",
    entryTime: "10:00",
    exitDate: "2024-12-19",
    exitTime: "11:00",
  });

  // Helper to create an empty/invalid trade input
  const createEmptyInput = (): TradeValidationInput => ({
    symbol: "",
    type: "",
    entryPrice: "",
    exitPrice: "",
    stopLoss: "",
    takeProfit: "",
    lot: "",
    entryDate: "",
    entryTime: "",
    exitDate: "",
    exitTime: "",
  });

  describe("validateForm - Required Fields", () => {
    it("should return errors when all required fields are empty", () => {
      const { result } = renderHook(() => useTradeValidation());

      act(() => {
        result.current.validateForm(createEmptyInput());
      });

      expect(result.current.lastResult?.isValid).toBe(false);
      expect(result.current.lastResult?.errors.length).toBeGreaterThan(0);
    });

    it("should return error when symbol is empty", () => {
      const { result } = renderHook(() => useTradeValidation());
      const input = { ...createValidInput(), symbol: "" };

      act(() => {
        result.current.validateForm(input);
      });

      expect(result.current.hasError("symbol")).toBe(true);
      expect(result.current.getError("symbol")).toContain("obrigatório");
    });

    it("should return error when type (direction) is empty", () => {
      const { result } = renderHook(() => useTradeValidation());
      const input = { ...createValidInput(), type: "" as const };

      act(() => {
        result.current.validateForm(input);
      });

      expect(result.current.hasError("type")).toBe(true);
      expect(result.current.getError("type")).toContain("obrigatório");
    });

    it("should return error when entryPrice is empty", () => {
      const { result } = renderHook(() => useTradeValidation());
      const input = { ...createValidInput(), entryPrice: "" };

      act(() => {
        result.current.validateForm(input);
      });

      expect(result.current.hasError("entryPrice")).toBe(true);
    });

    it("should return error when lot is empty", () => {
      const { result } = renderHook(() => useTradeValidation());
      const input = { ...createValidInput(), lot: "" };

      act(() => {
        result.current.validateForm(input);
      });

      expect(result.current.hasError("lot")).toBe(true);
      expect(result.current.getError("lot")).toContain("obrigatório");
    });

    it("should return error when entryDate is empty", () => {
      const { result } = renderHook(() => useTradeValidation());
      const input = { ...createValidInput(), entryDate: "" };

      act(() => {
        result.current.validateForm(input);
      });

      expect(result.current.hasError("entryDate")).toBe(true);
      expect(result.current.getError("entryDate")).toContain("obrigatório");
    });
  });

  describe("validateForm - Valid Input", () => {
    it("should return valid when all required fields are filled correctly", () => {
      const { result } = renderHook(() => useTradeValidation());

      act(() => {
        result.current.validateForm(createValidInput());
      });

      expect(result.current.lastResult?.isValid).toBe(true);
      expect(result.current.lastResult?.errors.length).toBe(0);
    });

    it("should have no field errors on valid input", () => {
      const { result } = renderHook(() => useTradeValidation());

      act(() => {
        result.current.validateForm(createValidInput());
      });

      expect(result.current.hasError("symbol")).toBe(false);
      expect(result.current.hasError("type")).toBe(false);
      expect(result.current.hasError("entryPrice")).toBe(false);
      expect(result.current.hasError("lot")).toBe(false);
      expect(result.current.hasError("entryDate")).toBe(false);
    });
  });

  describe("validateForm - Price Validation", () => {
    it("should return error when entryPrice is negative", () => {
      const { result } = renderHook(() => useTradeValidation());
      const input = { ...createValidInput(), entryPrice: "-1.1000" };

      act(() => {
        result.current.validateForm(input);
      });

      expect(result.current.hasError("entryPrice")).toBe(true);
    });

    it("should return error when entryPrice is zero", () => {
      const { result } = renderHook(() => useTradeValidation());
      const input = { ...createValidInput(), entryPrice: "0" };

      act(() => {
        result.current.validateForm(input);
      });

      expect(result.current.hasError("entryPrice")).toBe(true);
    });

    it("should return error when lot is negative", () => {
      const { result } = renderHook(() => useTradeValidation());
      const input = { ...createValidInput(), lot: "-1" };

      act(() => {
        result.current.validateForm(input);
      });

      expect(result.current.hasError("lot")).toBe(true);
    });

    it("should return error when lot exceeds max size", () => {
      const { result } = renderHook(() => useTradeValidation());
      const input = { ...createValidInput(), lot: "99999" };

      act(() => {
        result.current.validateForm(input);
      });

      expect(result.current.hasError("lot")).toBe(true);
    });
  });

  describe("validateForm - Date Validation", () => {
    it("should return error when exitDate is before entryDate", () => {
      const { result } = renderHook(() => useTradeValidation());
      const input = {
        ...createValidInput(),
        entryDate: "2024-12-19",
        entryTime: "10:00",
        exitDate: "2024-12-18", // day before
        exitTime: "10:00",
      };

      act(() => {
        result.current.validateForm(input);
      });

      expect(result.current.hasError("exitDate")).toBe(true);
    });

    it("should return error when exitTime is before entryTime on same day", () => {
      const { result } = renderHook(() => useTradeValidation());
      const input = {
        ...createValidInput(),
        entryDate: "2024-12-19",
        entryTime: "10:00",
        exitDate: "2024-12-19",
        exitTime: "09:00", // hour before
      };

      act(() => {
        result.current.validateForm(input);
      });

      expect(result.current.hasError("exitDate") || result.current.hasError("exitTime")).toBe(true);
    });
  });

  describe("validateForm - Position Warnings (non-blocking)", () => {
    it("should return warning when SL is above entry for Long trade", () => {
      const { result } = renderHook(() => useTradeValidation());
      const input = {
        ...createValidInput(),
        type: "Long" as const,
        entryPrice: "1.1000",
        stopLoss: "1.1100", // SL above entry (wrong for Long)
      };

      act(() => {
        result.current.validateForm(input);
      });

      // Should be a warning, not an error
      expect(result.current.hasWarning("stopLoss")).toBe(true);
      // But form should still be valid (warnings don't block)
      expect(result.current.lastResult?.isValid).toBe(true);
    });

    it("should return warning when TP is below entry for Long trade", () => {
      const { result } = renderHook(() => useTradeValidation());
      const input = {
        ...createValidInput(),
        type: "Long" as const,
        entryPrice: "1.1000",
        takeProfit: "1.0900", // TP below entry (wrong for Long)
      };

      act(() => {
        result.current.validateForm(input);
      });

      expect(result.current.hasWarning("takeProfit")).toBe(true);
      expect(result.current.lastResult?.isValid).toBe(true);
    });

    it("should return warning when SL is below entry for Short trade", () => {
      const { result } = renderHook(() => useTradeValidation());
      const input = {
        ...createValidInput(),
        type: "Short" as const,
        entryPrice: "1.1000",
        stopLoss: "1.0900", // SL below entry (wrong for Short)
      };

      act(() => {
        result.current.validateForm(input);
      });

      expect(result.current.hasWarning("stopLoss")).toBe(true);
      expect(result.current.lastResult?.isValid).toBe(true);
    });
  });

  describe("validateSingleField", () => {
    it("should validate individual field on blur", () => {
      const { result } = renderHook(() => useTradeValidation());
      const input = createValidInput();

      act(() => {
        result.current.validateSingleField("lot", "0", input);
      });

      expect(result.current.hasError("lot")).toBe(true);
    });

    it("should clear error when field becomes valid", () => {
      const { result } = renderHook(() => useTradeValidation());
      const input = createValidInput();

      // First, set an error
      act(() => {
        result.current.validateSingleField("lot", "0", input);
      });
      expect(result.current.hasError("lot")).toBe(true);

      // Then fix it
      act(() => {
        result.current.validateSingleField("lot", "1.0", input);
      });
      expect(result.current.hasError("lot")).toBe(false);
    });
  });

  describe("Error Management", () => {
    it("should clear specific field error", () => {
      const { result } = renderHook(() => useTradeValidation());

      // Set an error
      act(() => {
        result.current.validateForm({ ...createValidInput(), symbol: "" });
      });
      expect(result.current.hasError("symbol")).toBe(true);

      // Clear it
      act(() => {
        result.current.clearFieldError("symbol");
      });
      expect(result.current.hasError("symbol")).toBe(false);
    });

    it("should clear all errors", () => {
      const { result } = renderHook(() => useTradeValidation());

      // Set multiple errors
      act(() => {
        result.current.validateForm(createEmptyInput());
      });
      expect(Object.keys(result.current.fieldErrors).length).toBeGreaterThan(0);

      // Clear all
      act(() => {
        result.current.clearAllErrors();
      });
      expect(Object.keys(result.current.fieldErrors).length).toBe(0);
    });

    it("should set manual error", () => {
      const { result } = renderHook(() => useTradeValidation());

      act(() => {
        result.current.setFieldError("symbol", "Custom error message");
      });

      expect(result.current.hasError("symbol")).toBe(true);
      expect(result.current.getError("symbol")).toBe("Custom error message");
    });
  });

  describe("Error Count on Invalid Form", () => {
    it("should count all required field errors", () => {
      const { result } = renderHook(() => useTradeValidation());

      act(() => {
        result.current.validateForm(createEmptyInput());
      });

      // Should have errors for: symbol, type, entryPrice, lot, entryDate
      const errorCount = result.current.lastResult?.errors.length || 0;
      expect(errorCount).toBeGreaterThanOrEqual(5);
    });
  });
});
