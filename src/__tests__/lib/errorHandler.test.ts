import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { handleServiceError, registerToastHandler, safeAsync } from "@/lib/errorHandler";
import { errorMetrics } from "@/lib/errorMetrics";

// Mock errorMetris to avoid side effects and verify calls
vi.mock("@/lib/errorMetrics", () => ({
  errorMetrics: {
    increment: vi.fn(),
  },
}));

describe("errorHandler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset internal toast handler between tests if possible,
    // or just overwrite it in tests that need it.
    // Since it's a module level variable, we can override it via registerToastHandler(null as any) if needed
    // but the types don't allow null. We can just register a dummy one.
    registerToastHandler(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("handleServiceError", () => {
    it("should handle Error objects", () => {
      const error = new Error("Test error");
      const result = handleServiceError(error, "testContext");

      expect(result).toMatchObject({
        message: "Test error",
        context: "testContext",
        severity: "error",
      });
      expect(result.timestamp).toBeDefined();
    });

    it("should handle string errors", () => {
      const result = handleServiceError("String error", "testContext");
      expect(result.message).toBe("String error");
    });

    it("should handle Supabase-style errors", () => {
      const error = { message: "Supabase error", code: "PGRST116" };
      const result = handleServiceError(error, "dbInfo");
      expect(result.message).toBe("Supabase error");
      expect(result.code).toBe("PGRST116");
    });

    it("should handle unknown errors", () => {
      const result = handleServiceError(123, "unknownCtx");
      expect(result.message).toBe("Erro desconhecido");
    });

    it("should log errors to console based on severity", () => {
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const consoleDebugSpy = vi.spyOn(console, "debug").mockImplementation(() => {});

      handleServiceError(new Error("err"), "ctx", { severity: "critical" });
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("CRITICAL"),
        expect.any(Error)
      );

      handleServiceError(new Error("err"), "ctx", { severity: "error" });
      expect(consoleErrorSpy).toHaveBeenCalledTimes(2); // increased

      handleServiceError(new Error("err"), "ctx", { severity: "warn" });
      expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining("⚠️"), expect.any(Error));

      handleServiceError(new Error("err"), "ctx", { severity: "silent" });
      expect(consoleDebugSpy).toHaveBeenCalledWith(
        expect.stringContaining("🔇"),
        expect.any(Error)
      );
    });

    it("should increment metrics", () => {
      handleServiceError(new Error("metrics"), "metricsCtx");
      expect(errorMetrics.increment).toHaveBeenCalledWith("metricsCtx");
    });

    it("should call toast handler if registered and enabled", () => {
      const toastMock = vi.fn();
      registerToastHandler(toastMock);

      handleServiceError(new Error("Toast me"), "toastCtx", { showToast: true });
      expect(toastMock).toHaveBeenCalledWith("Toast me", "error");
    });

    it("should utilize userMessage for toast", () => {
      const toastMock = vi.fn();
      registerToastHandler(toastMock);

      handleServiceError(new Error("Technical error"), "userMsgCtx", {
        showToast: true,
        userMessage: "Friendly message",
      });
      expect(toastMock).toHaveBeenCalledWith("Friendly message", "error");
    });

    it("should not call toast if showToast is false", () => {
      const toastMock = vi.fn();
      registerToastHandler(toastMock);

      handleServiceError(new Error("Hidden"), "hiddenCtx", { showToast: false });
      expect(toastMock).not.toHaveBeenCalled();
    });
  });

  describe("safeAsync", () => {
    it("should return data on success", async () => {
      const operation = vi.fn().mockResolvedValue("success");
      const result = await safeAsync(operation, "asyncCtx");
      expect(result).toBe("success");
    });

    it("should return null and handle error on failure", async () => {
      const error = new Error("Async failure");
      const operation = vi.fn().mockRejectedValue(error);

      const result = await safeAsync(operation, "asyncFailCtx");

      expect(result).toBeNull();
      expect(errorMetrics.increment).toHaveBeenCalledWith("asyncFailCtx");
    });
  });
});
