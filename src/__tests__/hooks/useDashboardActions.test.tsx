/* eslint-disable @typescript-eslint/no-explicit-any */
import { renderHook } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useDashboardActions } from "@/hooks/useDashboardActions";
import { useAccountStore } from "@/store/useAccountStore";
import { useTradeStore } from "@/store/useTradeStore";
import { usePlaybookStore } from "@/store/usePlaybookStore";
import { useToast } from "@/providers/ToastProvider";

// Mocks
vi.mock("@/store/useAccountStore");
vi.mock("@/store/useTradeStore");
vi.mock("@/store/usePlaybookStore");
vi.mock("@/providers/ToastProvider");

describe("useDashboardActions", () => {
  const accountId = "acc-123";
  const mockShowToast = vi.fn();
  const mockAddTrade = vi.fn();
  const mockUpdateTrade = vi.fn();
  const mockRemoveTrade = vi.fn();
  const mockLoadTrades = vi.fn();
  const mockUpdateAccount = vi.fn();
  const mockLoadPlaybooks = vi.fn();
  const mockRemovePlaybook = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useToast).mockReturnValue({ showToast: mockShowToast } as any);

    const tradeStoreState = {
      addTrade: mockAddTrade,
      updateTrade: mockUpdateTrade,
      removeTrade: mockRemoveTrade,
      loadTrades: mockLoadTrades,
      allHistory: [],
    };

    vi.mocked(useTradeStore).mockImplementation((selector: any) => {
      if (selector && typeof selector === "function") {
        return selector(tradeStoreState);
      }
      return tradeStoreState;
    });

    vi.mocked(useAccountStore).mockReturnValue({
      currentAccount: { id: accountId, initialBalance: 10000, currentBalance: 10000 },
      updateAccount: mockUpdateAccount,
    } as any);

    vi.mocked(usePlaybookStore).mockReturnValue({
      loadPlaybooks: mockLoadPlaybooks,
      removePlaybook: mockRemovePlaybook,
    } as any);

    // Mock window.confirm
    global.confirm = vi.fn(() => true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should create a trade", async () => {
    const { result } = renderHook(() => useDashboardActions(accountId));
    const tradeData = {
      symbol: "EURUSD",
      pnl: 100,
    };

    await result.current.handleCreateTrade(tradeData as any);

    expect(mockAddTrade).toHaveBeenCalledWith(
      expect.objectContaining({
        symbol: "EURUSD",
        pnl: 100,
      })
    );
  });

  it("should update a trade", async () => {
    const { result } = renderHook(() => useDashboardActions(accountId));
    const trade = { id: "t1", symbol: "USDJPY" };

    await result.current.handleUpdateTrade(trade as any);

    expect(mockUpdateTrade).toHaveBeenCalledWith(trade);
  });

  it("should delete a trade if confirmed", async () => {
    const { result } = renderHook(() => useDashboardActions(accountId));

    await result.current.handleDeleteTrade("t1");

    expect(mockRemoveTrade).toHaveBeenCalledWith("t1", accountId);
    expect(mockShowToast).toHaveBeenCalledWith("Trade excluído com sucesso!", "success");
  });

  it("should not delete trade if not confirmed", async () => {
    global.confirm = vi.fn(() => false);
    const { result } = renderHook(() => useDashboardActions(accountId));

    await result.current.handleDeleteTrade("t1");

    expect(mockRemoveTrade).not.toHaveBeenCalled();
  });

  it("should update balance", async () => {
    const { result } = renderHook(() => useDashboardActions(accountId));

    await result.current.handleUpdateBalance(10500);

    expect(mockUpdateAccount).toHaveBeenCalledWith(
      expect.objectContaining({
        id: accountId,
        currentBalance: 10500,
      })
    );
    expect(mockShowToast).toHaveBeenCalledWith("Saldo atualizado com sucesso!", "success");
  });

  it("should handle playbook deletion", async () => {
    const { result } = renderHook(() => useDashboardActions(accountId));

    await result.current.handleDeletePlaybook("pb1");

    expect(mockRemovePlaybook).toHaveBeenCalledWith("pb1");
    expect(mockShowToast).toHaveBeenCalledWith("Playbook excluído com sucesso!", "success");
  });
});
