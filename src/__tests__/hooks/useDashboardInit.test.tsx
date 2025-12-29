/* eslint-disable @typescript-eslint/no-explicit-any */
import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useDashboardInit } from "@/hooks/useDashboardInit";
import { useAccountStore } from "@/store/useAccountStore";
import { useTradeStore } from "@/store/useTradeStore";
import { useJournalStore } from "@/store/useJournalStore";
import { usePlaybookStore } from "@/store/usePlaybookStore";
import { useToast } from "@/providers/ToastProvider";
import { useRouter } from "next/navigation";
import { batchDashboardInitAction } from "@/app/actions/_batch/dashboardInit";

// Mocks
vi.mock("@/store/useAccountStore");
vi.mock("@/store/useTradeStore");
vi.mock("@/store/useJournalStore");
vi.mock("@/store/usePlaybookStore");
vi.mock("@/providers/ToastProvider");
vi.mock("next/navigation");
vi.mock("@/app/actions/_batch/dashboardInit");
vi.mock("@/hooks/useStratifiedLoading", () => ({
  useStratifiedLoading: vi.fn(() => ({
    phases: { 1: "idle", 2: "idle", 3: "idle" },
    loadCalendarData: vi.fn(),
    loadReportsData: vi.fn(),
    playbookStats: [],
    loadPlaybookStats: vi.fn(),
  })),
}));

describe("useDashboardInit", () => {
  const accountId = "acc-123";
  const mockRouter = { push: vi.fn() };
  const mockShowToast = vi.fn();

  const mockLoadAccounts = vi.fn();
  const mockSetCurrentAccount = vi.fn();
  const mockLoadTrades = vi.fn();
  const mockLoadEntries = vi.fn();
  const mockLoadPlaybooks = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useRouter).mockReturnValue(mockRouter as any);
    vi.mocked(useToast).mockReturnValue({ showToast: mockShowToast } as any);

    vi.mocked(useAccountStore).mockReturnValue({
      accounts: [{ id: accountId, name: "Test Account" }],
      currentAccount: null,
      setCurrentAccount: mockSetCurrentAccount,
      loadAccounts: mockLoadAccounts,
    } as any);
    // Mock getState/setState
    (useAccountStore as any).getState = vi.fn().mockReturnValue({
      accounts: [{ id: accountId, name: "Test Account" }],
      loadAccounts: mockLoadAccounts,
      setCurrentAccount: mockSetCurrentAccount,
    });
    (useAccountStore as any).setState = vi.fn();

    vi.mocked(useTradeStore).mockReturnValue({
      trades: [],
      allHistory: [],
      totalCount: 0,
      currentPage: 1,
      loadTrades: mockLoadTrades,
      isLoading: false,
      sortDirection: "desc",
      filterAsset: "all",
      setSortDirection: vi.fn(),
      setFilterAsset: vi.fn(),
    } as any);
    (useTradeStore as any).getState = vi.fn().mockReturnValue({
      trades: [],
      allHistory: [],
    });
    (useTradeStore as any).setState = vi.fn();

    vi.mocked(useJournalStore).mockReturnValue({
      entries: [],
      loadEntries: mockLoadEntries,
    } as any);
    (useJournalStore as any).getState = vi.fn().mockReturnValue({ entries: [] });

    vi.mocked(usePlaybookStore).mockReturnValue({
      playbooks: [],
      loadPlaybooks: mockLoadPlaybooks,
    } as any);
    (usePlaybookStore as any).getState = vi.fn().mockReturnValue({ playbooks: [] });

    // Mock Batch Action Success
    vi.mocked(batchDashboardInitAction).mockImplementation(async (id) => {
      // Simulate "Account Not Found" (valid response, but empty account)
      if (id === "invalid-acc") {
        return {
          account: null,
          trades: { data: [], count: 0 },
          metrics: null,
        };
      }

      return {
        account: {
          id: accountId === id ? accountId : id,
          name: "Test Account",
          initialBalance: 10000,
          currentBalance: 10000,
          currency: "USD",
          isDefault: true,
          userId: "user-123", // Added minimal required prop
        } as any,
        trades: { data: [], count: 0 },
        metrics: {
          totalTrades: 10,
          winRate: 50,
          profitFactor: 1.5,
          totalPnl: 1000,
          wins: 5,
          losses: 5,
          breakeven: 0,
        },
      };
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should initialize dashboard data successfully", async () => {
    const { result } = renderHook(() => useDashboardInit(accountId, true));

    // Initially loading
    // expect(result.current.isLoading).toBe(true); // Can happen too fast to catch

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Expect batch action call instead of individual calls
    expect(batchDashboardInitAction).toHaveBeenCalledWith(accountId, 1, 10, true);
    expect(mockSetCurrentAccount).toHaveBeenCalledWith(accountId);

    expect(result.current.isAccountReady).toBe(true);
    // isAccountFound is true by default and stays true
    expect(result.current.isAccountFound).toBe(true);
    expect(result.current.serverMetrics).not.toBeNull();
  });

  it("should redirect if account not found (via batch)", async () => {
    const invalidId = "invalid-acc";
    // Setup accounts to NOT include invalidId
    (useAccountStore as any).getState.mockReturnValue({
      accounts: [{ id: accountId }],
      loadAccounts: mockLoadAccounts,
      setCurrentAccount: mockSetCurrentAccount,
    });

    const { result } = renderHook(() => useDashboardInit(invalidId, true));

    await waitFor(() => {
      // In batch flow, if account returns null, we redirect
      expect(mockRouter.push).toHaveBeenCalledWith("/");
      expect(result.current.isAccountFound).toBe(false);
    });
  });

  it("should handle initialization error", async () => {
    // Ensure Fast Path is skipped by clearing accounts
    (useAccountStore as any).getState.mockReturnValue({
      accounts: [],
      loadAccounts: mockLoadAccounts,
    });

    vi.mocked(batchDashboardInitAction).mockRejectedValue(new Error("Fetch error"));
    // Suppress console error for this test
    vi.spyOn(console, "error").mockImplementation(() => {});

    const { result } = renderHook(() => useDashboardInit(accountId, true));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockShowToast).toHaveBeenCalledWith("Erro ao carregar dados do dashboard", "error");
  });

  it("should not init if isValidAccount is false", () => {
    const { result } = renderHook(() => useDashboardInit(accountId, false));
    expect(result.current.isLoading).toBe(false);
    expect(batchDashboardInitAction).not.toHaveBeenCalled();
  });
});
