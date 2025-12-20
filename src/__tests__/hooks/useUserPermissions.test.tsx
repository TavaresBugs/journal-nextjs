import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import { isAdmin } from "@/services/admin/admin";
import { isMentor } from "@/services/mentor/invites";

vi.mock("@/services/admin/admin");
vi.mock("@/services/mentor/invites");

describe("useUserPermissions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(isAdmin).mockResolvedValue(false);
    vi.mocked(isMentor).mockResolvedValue(false);
  });

  it("should initialize with loading state", () => {
    const { result } = renderHook(() => useUserPermissions());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.isAdminUser).toBe(false);
    expect(result.current.isMentorUser).toBe(false);
  });

  it("should load admin permission correctly", async () => {
    vi.mocked(isAdmin).mockResolvedValue(true);
    vi.mocked(isMentor).mockResolvedValue(false);

    const { result } = renderHook(() => useUserPermissions());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isAdminUser).toBe(true);
    expect(result.current.isMentorUser).toBe(false);
  });

  it("should load mentor permission correctly", async () => {
    vi.mocked(isAdmin).mockResolvedValue(false);
    vi.mocked(isMentor).mockResolvedValue(true);

    const { result } = renderHook(() => useUserPermissions());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isAdminUser).toBe(false);
    expect(result.current.isMentorUser).toBe(true);
  });

  it("should load both permissions correctly", async () => {
    vi.mocked(isAdmin).mockResolvedValue(true);
    vi.mocked(isMentor).mockResolvedValue(true);

    const { result } = renderHook(() => useUserPermissions());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isAdminUser).toBe(true);
    expect(result.current.isMentorUser).toBe(true);
  });

  it("should handle permission check errors gracefully", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(isAdmin).mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useUserPermissions());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isAdminUser).toBe(false);
    expect(result.current.isMentorUser).toBe(false);
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });
});
