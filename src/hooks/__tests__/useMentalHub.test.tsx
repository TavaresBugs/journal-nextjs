import { renderHook, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useMentalHub } from "../useMentalHub";

// Mock Server Actions
const mockGetProfiles = vi.fn();
const mockGetEntries = vi.fn();
const mockSaveEntry = vi.fn();
const mockDeleteEntry = vi.fn();
const mockSeedProfiles = vi.fn();

/* eslint-disable @typescript-eslint/no-explicit-any */
vi.mock("@/app/actions", () => ({
  getMentalProfilesAction: (...args: any[]) => mockGetProfiles(...args),
  getMentalEntriesAction: (...args: any[]) => mockGetEntries(...args),
  saveMentalEntryAction: (...args: any[]) => mockSaveEntry(...args),
  deleteMentalEntryAction: (...args: any[]) => mockDeleteEntry(...args),
  seedMentalProfilesAction: (...args: any[]) => mockSeedProfiles(...args),
}));

describe("useMentalHub", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Defaults
    mockGetProfiles.mockResolvedValue([]);
    mockGetEntries.mockResolvedValue([]);
  });

  it("should load profiles and entries on mount", async () => {
    mockGetProfiles.mockResolvedValue([{ id: "p1", category: "fear" }]);
    mockGetEntries.mockResolvedValue([{ id: "e1", emotion: "angry" }]);

    const { result } = renderHook(() => useMentalHub());

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.profiles).toHaveLength(1);
    expect(result.current.entries).toHaveLength(1);
    expect(mockGetProfiles).toHaveBeenCalled();
    expect(mockGetEntries).toHaveBeenCalled();
  });

  it("should handle loading errors", async () => {
    mockGetProfiles.mockRejectedValue(new Error("Failed"));

    const { result } = renderHook(() => useMentalHub());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe("Erro ao carregar perfis mentais");
  });

  it("should save entry and reload", async () => {
    mockSaveEntry.mockResolvedValue({ success: true });

    const { result } = renderHook(() => useMentalHub());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      const success = await result.current.saveEntry({ emotion: "happy" });
      expect(success).toBe(true);
    });

    // Should reload entries
    expect(mockGetEntries).toHaveBeenCalledTimes(2); // Initial + Reload
    expect(mockSaveEntry).toHaveBeenCalledWith(expect.objectContaining({ emotion: "happy" }));
  });

  it("should handle save entry error", async () => {
    mockSaveEntry.mockResolvedValue({ success: false, error: "Validation" });

    const { result } = renderHook(() => useMentalHub());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      const success = await result.current.saveEntry({ emotion: "sad" });
      expect(success).toBe(false);
    });

    expect(result.current.error).toBe("Erro ao salvar entrada mental");
  });

  it("should delete entry", async () => {
    mockGetEntries.mockResolvedValue([{ id: "e1" }]);
    mockDeleteEntry.mockResolvedValue({ success: true });

    const { result } = renderHook(() => useMentalHub());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      const success = await result.current.deleteEntry("e1");
      expect(success).toBe(true);
    });

    expect(mockDeleteEntry).toHaveBeenCalledWith("e1");
    // Verify optimistic update or reload? Hook uses setEntries filter
    expect(result.current.entries).toHaveLength(0);
  });

  it("should seed profiles", async () => {
    mockSeedProfiles.mockResolvedValue({ success: true });

    const { result } = renderHook(() => useMentalHub());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      const success = await result.current.seedProfiles("fear");
      expect(success).toBe(true);
    });

    expect(mockSeedProfiles).toHaveBeenCalledWith("fear");
    expect(mockGetProfiles).toHaveBeenCalledTimes(2); // Initial + Reload
  });
});
