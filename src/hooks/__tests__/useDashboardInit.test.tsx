import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useDashboardInit } from "../useDashboardInit";

// Mock dependent hooks
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/providers/ToastProvider", () => ({
  useToast: () => ({ showToast: vi.fn() }),
}));

vi.mock("../useStratifiedLoading", () => ({
  useStratifiedLoading: () => ({
    phases: {},
    loadCalendarData: vi.fn(),
    loadReportsData: vi.fn(),
    playbookStats: [],
    loadPlaybookStats: vi.fn(),
  }),
}));

// Mock Server Actions
const mockBatchInit = vi.fn();
vi.mock("@/app/actions/_batch/dashboardInit", () => ({
  /* eslint-disable @typescript-eslint/no-explicit-any */
  batchDashboardInitAction: (...args: any[]) => mockBatchInit(...args),
}));

// Mock Stores (simplified for testing)
// We need to mock the implementation of these stores
const mockAccountStore = {
  accounts: [{ id: "acc-1", name: "Test" }],
  currentAccount: null,
  setCurrentAccount: vi.fn(),
};

const mockTradeStore = {
  trades: [],
  allHistory: [],
  totalCount: 0,
  currentPage: 1,
  currentAccountId: null,
  isLoading: false,
  sortDirection: "desc",
  filterAsset: "",
  loadTrades: vi.fn(),
  loadPage: vi.fn(),
  setSortDirection: vi.fn(),
  setFilterAsset: vi.fn(),
  setState: vi.fn(), // Mock setState for direct manipulation
};

const mockJournalStore = {
  entries: [],
  loadEntries: vi.fn(),
};

const mockPlaybookStore = {
  playbooks: [],
  loadPlaybooks: vi.fn(),
};

vi.mock("@/store/useAccountStore", () => ({
  useAccountStore: Object.assign(
    () => mockAccountStore, // hook usage
    {
      getState: () => mockAccountStore,
      setState: (fn: any) => {
        const updates = typeof fn === "function" ? fn(mockAccountStore) : fn;
        Object.assign(mockAccountStore, updates);
      },
    }
  ),
}));

vi.mock("@/store/useTradeStore", () => ({
  useTradeStore: Object.assign(
    (selector: any) => (selector ? selector(mockTradeStore) : mockTradeStore),
    {
      getState: () => mockTradeStore,
      setState: (updates: any) => Object.assign(mockTradeStore, widthUpdates(updates)),
    }
  ),
}));

// Helper for handling store updates mock
function widthUpdates(updates: any) {
  return updates;
}

vi.mock("@/store/useJournalStore", () => ({
  useJournalStore: () => mockJournalStore,
}));

vi.mock("@/store/usePlaybookStore", () => ({
  usePlaybookStore: Object.assign(() => mockPlaybookStore, { getState: () => mockPlaybookStore }),
}));

describe("useDashboardInit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockBatchInit.mockResolvedValue({
      account: { id: "acc-1", name: "Fetched Account" },
      trades: { data: [], count: 0 },
      metrics: { totalTrades: 10, totalPnl: 100 },
    });

    // Reset store state mocks
    mockAccountStore.currentAccount = null;
    mockTradeStore.currentAccountId = null;
    mockTradeStore.setState = vi.fn();
  });

  it("should initialize dashboard with remote data (Slow Path)", async () => {
    const { result } = renderHook(() => useDashboardInit("acc-1", true));

    // Initially loading
    expect(result.current.isLoading).toBe(true);

    // Wait for init
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockBatchInit).toHaveBeenCalledWith("acc-1", 1, 10);
    expect(result.current.isAccountFound).toBe(true);
    expect(result.current.serverMetrics).toEqual({ totalTrades: 10, totalPnl: 100 });
  });

  it("should use cached account if available (Fast Path)", async () => {
    // Setup cache
    mockAccountStore.accounts = [{ id: "acc-cached", name: "Cached" }];

    renderHook(() => useDashboardInit("acc-cached", true));

    // Should be faster/immediate readiness for account
    // But hooks might still start loading=true briefly.

    await waitFor(() => {
      expect(mockAccountStore.setCurrentAccount).toHaveBeenCalledWith("acc-cached");
    });

    // It should still fetch data in background
    await waitFor(() => {
      expect(mockBatchInit).toHaveBeenCalled();
    });
  });

  it("should handle invalid account format", async () => {
    const { result } = renderHook(() => useDashboardInit("invalid-id", false));

    expect(result.current.isLoading).toBe(false);
    expect(mockBatchInit).not.toHaveBeenCalled();
  });

  it("should handle initialization errors gracefuly", async () => {
    mockBatchInit.mockRejectedValue(new Error("Network fail"));

    const { result } = renderHook(() => useDashboardInit("acc-error", true));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Metrics should be null (default)
    expect(result.current.serverMetrics).toBeNull();
  });
});
