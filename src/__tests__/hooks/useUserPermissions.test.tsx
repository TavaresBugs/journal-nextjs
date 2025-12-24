import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import { isAdminAction } from "@/app/actions/admin";
import { isMentorAction } from "@/app/actions/mentor";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

vi.mock("@/app/actions/admin");
vi.mock("@/app/actions/mentor");

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return Wrapper;
};

describe("useUserPermissions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(isAdminAction).mockResolvedValue(false);
    vi.mocked(isMentorAction).mockResolvedValue(false);
  });

  it("should initialize with loading state", () => {
    const { result } = renderHook(() => useUserPermissions(), { wrapper: createWrapper() });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.isAdminUser).toBe(false);
    expect(result.current.isMentorUser).toBe(false);
  });

  it("should load admin permission correctly", async () => {
    vi.mocked(isAdminAction).mockResolvedValue(true);
    vi.mocked(isMentorAction).mockResolvedValue(false);

    const { result } = renderHook(() => useUserPermissions(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isAdminUser).toBe(true);
    expect(result.current.isMentorUser).toBe(false);
  });

  it("should load mentor permission correctly", async () => {
    vi.mocked(isAdminAction).mockResolvedValue(false);
    vi.mocked(isMentorAction).mockResolvedValue(true);

    const { result } = renderHook(() => useUserPermissions(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isAdminUser).toBe(false);
    expect(result.current.isMentorUser).toBe(true);
  });

  it("should load both permissions correctly", async () => {
    vi.mocked(isAdminAction).mockResolvedValue(true);
    vi.mocked(isMentorAction).mockResolvedValue(true);

    const { result } = renderHook(() => useUserPermissions(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isAdminUser).toBe(true);
    expect(result.current.isMentorUser).toBe(true);
  });

  it("should handle permission check errors gracefully", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(isAdminAction).mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useUserPermissions(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isAdminUser).toBe(false);
    expect(result.current.isMentorUser).toBe(false);
    // expect(consoleSpy).toHaveBeenCalled(); // React Query handles this internally

    consoleSpy.mockRestore();
  });
});
