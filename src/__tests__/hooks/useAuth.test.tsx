import { renderHook, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useAuth } from "@/hooks/useAuth";
import * as authLib from "@/lib/auth";

// Mock dependencies
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/lib/auth", () => ({
  getCurrentUser: vi.fn(),
  onAuthStateChange: vi.fn(),
  signInWithEmail: vi.fn(),
  signUpWithEmail: vi.fn(),
  signInWithGoogle: vi.fn(),
  signInWithGithub: vi.fn(),
  signOut: vi.fn(),
}));

// Mock window.location
const originalLocation = window.location;
const mockLocation = { href: "" };

describe("useAuth Hook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mocks to avoid undefined behavior
    (authLib.getCurrentUser as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (authLib.onAuthStateChange as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      unsubscribe: vi.fn(),
    });

    // Reset window.location mock
    mockLocation.href = "";
    Object.defineProperty(window, "location", {
      configurable: true,
      value: mockLocation,
    });
  });

  afterEach(() => {
    Object.defineProperty(window, "location", {
      configurable: true,
      value: originalLocation,
    });
  });

  it("should initialize with loading state and fetch user", async () => {
    const mockUser = { id: "123", email: "test@example.com" };
    (authLib.getCurrentUser as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockUser);

    // We need to re-render or wait for effect
    const { result } = renderHook(() => useAuth());

    // Initial state
    expect(result.current.loading).toBe(true);
    expect(result.current.user).toBeNull();

    // After fetch
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.user).toEqual(mockUser);
  });

  it("should handle getCurrentUser error", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    (authLib.getCurrentUser as unknown as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("Auth error")
    );

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.user).toBeNull();
    consoleSpy.mockRestore();
  });

  // Action Tests
  it("should call signInWithEmail successfully", async () => {
    const mockUser = { id: "1", email: "test@test.com" };
    (authLib.signInWithEmail as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: mockUser,
      error: null,
    });

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      const user = await result.current.signInWithEmail("test@test.com", "pass");
      expect(user).toEqual(mockUser);
    });
  });

  it("should throw error on signInWithEmail failure", async () => {
    (authLib.signInWithEmail as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: null,
      error: "Invalid credentials",
    });

    const { result } = renderHook(() => useAuth());

    await expect(result.current.signInWithEmail("test@test.com", "pass")).rejects.toThrow(
      "Invalid credentials"
    );
  });

  it("should call signUpWithEmail successfully", async () => {
    const mockUser = { id: "2", email: "new@test.com" };
    (authLib.signUpWithEmail as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: mockUser,
      error: null,
    });

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      const user = await result.current.signUpWithEmail("new@test.com", "pass");
      expect(user).toEqual(mockUser);
    });
  });

  it("should call google sign in", async () => {
    (authLib.signInWithGoogle as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      error: null,
    });
    const { result } = renderHook(() => useAuth());
    await act(async () => {
      await result.current.signInWithGoogle();
    });
    expect(authLib.signInWithGoogle).toHaveBeenCalled();
  });

  it("should call github sign in", async () => {
    (authLib.signInWithGithub as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      error: null,
    });
    const { result } = renderHook(() => useAuth());
    await act(async () => {
      await result.current.signInWithGithub();
    });
    expect(authLib.signInWithGithub).toHaveBeenCalled();
  });

  it("should handle signOut correctly", async () => {
    (authLib.signOut as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signOut();
    });

    expect(authLib.signOut).toHaveBeenCalled();
    expect(result.current.user).toBeNull();
    expect(window.location.href).toBe("/login");
  });
});
