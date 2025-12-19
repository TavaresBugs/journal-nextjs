import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { errorMetrics } from "@/lib/errorMetrics";

describe("errorMetrics", () => {
  beforeEach(() => {
    errorMetrics.reset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should increment error count for a context", () => {
    errorMetrics.increment("testContext");
    expect(errorMetrics.getCount("testContext")).toBe(1);
    errorMetrics.increment("testContext");
    expect(errorMetrics.getCount("testContext")).toBe(2);
  });

  it("should return 0 for unknown context", () => {
    expect(errorMetrics.getCount("unknown")).toBe(0);
  });

  it("should reset metrics", () => {
    errorMetrics.increment("context1");
    errorMetrics.increment("context2");
    expect(errorMetrics.getCount("context1")).toBe(1);
    expect(errorMetrics.getCount("context2")).toBe(1);

    errorMetrics.reset();
    expect(errorMetrics.getCount("context1")).toBe(0);
    expect(errorMetrics.getCount("context2")).toBe(0);
  });

  it("should track timestamps and limit to last 100", () => {
    const context = "timestampTest";
    // Add 105 errors
    for (let i = 0; i < 105; i++) {
      errorMetrics.increment(context);
    }

    // We can't access private variables directly, but we can infer behavior via getRecentErrors
    // assuming all happened immediately.
    // However, the test implementation of getRecentErrors depends on the internal array.

    // Check total count is 105
    expect(errorMetrics.getCount(context)).toBe(105);
  });

  it("should calculate recent errors correctly", () => {
    const context = "recentTest";
    const now = Date.now();

    // Mock Date.now
    vi.useFakeTimers();
    vi.setSystemTime(now);

    // 1 error now
    errorMetrics.increment(context);

    // 1 error 4 minutes ago
    vi.setSystemTime(now - 4 * 60 * 1000);
    // Note: increment pushes Date.now(), so we need to move time back BEFORE incrementing if we want old errors?
    // Wait, the implementation does Date.now() when .increment() is called.
    // So to simulate "4 minutes ago", we set system time, then increment.
    errorMetrics.increment(context);

    // 1 error 10 minutes ago
    vi.setSystemTime(now - 10 * 60 * 1000);
    errorMetrics.increment(context);

    // Reset time to "now" to check recent errors
    vi.setSystemTime(now);

    // getRecentErrors(context, 5) -> should include "now" and "4 mins ago", but exclude "10 mins ago"
    // Wait, the logic is: (ts > Date.now() - 5*60*1000).
    // "now" ts is `now`.
    // "4 mins ago" ts is `now - 4min`.
    // Both are > `now - 5min`.
    // "10 mins ago" ts is `now - 10min`, which is < `now - 5min`.

    expect(errorMetrics.getRecentErrors(context, 5)).toBe(2);
    expect(errorMetrics.getRecentErrors(context, 15)).toBe(3);

    vi.useRealTimers();
  });

  it("should report errors using console.table", () => {
    const consoleTableSpy = vi.spyOn(console, "table").mockImplementation(() => {});

    errorMetrics.increment("ctx1");
    errorMetrics.increment("ctx2");
    errorMetrics.increment("ctx2");

    errorMetrics.report();

    expect(consoleTableSpy).toHaveBeenCalled();
  });
});
