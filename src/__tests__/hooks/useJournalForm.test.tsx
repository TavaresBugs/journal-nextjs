import { renderHook, act } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { useJournalForm } from "@/hooks/useJournalForm";
import dayjs from "dayjs";

describe("useJournalForm", () => {
  it("should initialize with default values", () => {
    const { result } = renderHook(() => useJournalForm());

    expect(result.current.formData.date).toBe(dayjs().format("YYYY-MM-DD"));
    expect(result.current.formData.title).toContain("Diário");
    expect(result.current.formData.asset).toBe("");
  });

  it("should initialize with provided initial data", () => {
    const initial = { asset: "EURUSD", emotion: "happy" };
    const { result } = renderHook(() => useJournalForm(initial));

    expect(result.current.formData.asset).toBe("EURUSD");
    expect(result.current.formData.emotion).toBe("happy");
  });

  it("should update fields", () => {
    const { result } = renderHook(() => useJournalForm());

    act(() => {
      result.current.updateField("analysis", "Market was bullish");
    });

    expect(result.current.formData.analysis).toBe("Market was bullish");
  });

  it("should reset form", () => {
    const { result } = renderHook(() => useJournalForm({ asset: "N/A" }));

    act(() => {
      result.current.updateField("asset", "US30");
    });
    expect(result.current.formData.asset).toBe("US30");

    act(() => {
      result.current.resetForm({ asset: "BTCUSD" });
    });

    expect(result.current.formData.asset).toBe("BTCUSD");
    expect(result.current.formData.analysis).toBe("");
  });

  it("should prepare submission data", () => {
    const { result } = renderHook(() => useJournalForm());

    act(() => {
      result.current.updateField("technicalWins", "Good entry");
      result.current.updateField("improvements", "Exit earlier");
      result.current.updateField("errors", "None");
      result.current.updateField("asset", "GBPUSD");
    });

    const submission = result.current.prepareSubmission();

    expect(submission.asset).toBe("GBPUSD");
    expect(submission.notes).toBe(
      JSON.stringify({
        technicalWins: "Good entry",
        improvements: "Exit earlier",
        errors: "None",
      })
    );
  });

  it("should default asset to Diário if empty on submission", () => {
    const { result } = renderHook(() => useJournalForm());
    const submission = result.current.prepareSubmission();
    expect(submission.asset).toBe("Diário");
  });
});
