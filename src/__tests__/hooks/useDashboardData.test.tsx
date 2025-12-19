/* eslint-disable @typescript-eslint/no-explicit-any */
import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useAccountStore } from "@/store/useAccountStore";
import { useTradeStore } from "@/store/useTradeStore";
import { useJournalStore } from "@/store/useJournalStore";
import { usePlaybookStore } from "@/store/usePlaybookStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import { isAdmin } from "@/services/admin/admin";
import { isMentor } from "@/services/mentor/invites";
import { useToast } from "@/providers/ToastProvider";
import { useRouter } from "next/navigation";

// Mocks
vi.mock("@/store/useAccountStore");
vi.mock("@/store/useTradeStore");
vi.mock("@/store/useJournalStore");
vi.mock("@/store/usePlaybookStore");
vi.mock("@/store/useSettingsStore");
vi.mock("@/services/admin/admin");
vi.mock("@/services/mentor/invites");
vi.mock("@/providers/ToastProvider");
vi.mock("next/navigation"); // Already mocked in setup, but fine to override or rely on global

describe("useDashboardData", () => {
    // Setup generic spies
    const mockRouter = { push: vi.fn() };
    const mockShowToast = vi.fn();

    // Store spies
    const mockLoadAccounts = vi.fn();
    const mockSetCurrentAccount = vi.fn();
    const mockUpdateAccountBalance = vi.fn();
    
    const mockLoadTrades = vi.fn();
    const mockLoadPage = vi.fn();
    
    const mockLoadEntries = vi.fn();
    const mockLoadPlaybooks = vi.fn();
    const mockLoadSettings = vi.fn();

    const mockAccount = {
        id: "123e4567-e89b-12d3-a456-426614174000",
        name: "Test Account",
        initialBalance: 10000,
        currentBalance: 10000,
        currency: "USD",
        isDefault: true
    };

    beforeEach(() => {
        vi.clearAllMocks();

        // Router
        vi.mocked(useRouter).mockReturnValue(mockRouter as any);

        // Toast
        vi.mocked(useToast).mockReturnValue({ showToast: mockShowToast } as any);

        // Account Store Default
        vi.mocked(useAccountStore).mockReturnValue({
            accounts: [mockAccount],
            currentAccount: mockAccount,
            setCurrentAccount: mockSetCurrentAccount,
            updateAccountBalance: mockUpdateAccountBalance,
            loadAccounts: mockLoadAccounts
        } as any);
        // Also need to mock getState for non-hook usage in the hook
        (useAccountStore as any).getState = vi.fn().mockReturnValue({
            accounts: [mockAccount],
            loadAccounts: mockLoadAccounts
        });

        // Trade Store Default
        vi.mocked(useTradeStore).mockReturnValue({
            trades: [],
            allHistory: [],
            totalCount: 0,
            currentPage: 1,
            loadTrades: mockLoadTrades,
            loadPage: mockLoadPage
        } as any);
        (useTradeStore as any).getState = vi.fn().mockReturnValue({
            trades: [],
            allHistory: []
        });

        // Journal Store Default
        vi.mocked(useJournalStore).mockReturnValue({
            entries: [],
            loadEntries: mockLoadEntries
        } as any);
        (useJournalStore as any).getState = vi.fn().mockReturnValue({ entries: [] });

        // Playbook Store Default
        vi.mocked(usePlaybookStore).mockReturnValue({
            playbooks: [],
            loadPlaybooks: mockLoadPlaybooks
        } as any);
        (usePlaybookStore as any).getState = vi.fn().mockReturnValue({ playbooks: [] });

        // Settings Store Default
        vi.mocked(useSettingsStore).mockReturnValue({
            loadSettings: mockLoadSettings
        } as any);

        // Services Default
        vi.mocked(isAdmin).mockResolvedValue(false);
        vi.mocked(isMentor).mockResolvedValue(false);
    });

    it("should redirect if accountId is invalid format", () => {
        renderHook(() => useDashboardData("invalid-id"));
        expect(mockRouter.push).toHaveBeenCalledWith("/");
    });

    it("should redirect if account is not found", async () => {
        const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
        // Setup empty accounts initially or just trigger the check
        (useAccountStore as any).getState.mockReturnValue({
             accounts: [mockAccount],
             loadAccounts: mockLoadAccounts
        });
        
        // Use a valid UUID but one that doesn't match our mockAccount
        const validUnmatchedId = "987e4567-e89b-12d3-a456-426614174999"; 
        
        renderHook(() => useDashboardData(validUnmatchedId));

        await waitFor(() => {
            expect(mockRouter.push).toHaveBeenCalledWith("/");
            expect(consoleSpy).toHaveBeenCalledWith("Account not found after loading:", validUnmatchedId);
        });
        consoleSpy.mockRestore();
    });

    it("should load data successfully for valid account", async () => {
        const { result } = renderHook(() => useDashboardData(mockAccount.id));

        expect(result.current.isLoading).toBe(true);
        expect(mockLoadTrades).toHaveBeenCalledWith(mockAccount.id);
        expect(mockLoadEntries).toHaveBeenCalledWith(mockAccount.id);
        expect(mockLoadPlaybooks).toHaveBeenCalled();
        expect(mockLoadSettings).toHaveBeenCalled();

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.currentAccount).toEqual(mockAccount);
    });

    it("should update account balance if calculated PnL differs", async () => {
        const tradeHistory = [
             { pnl: 100, entryDate: "2023-01-01T10:00:00.000Z" }
        ];
        
        // Mock Trade Store behaving with history
        vi.mocked(useTradeStore).mockReturnValue({
            trades: [],
            allHistory: tradeHistory,
            totalCount: 1,
            currentPage: 1,
            loadTrades: mockLoadTrades,
            loadPage: mockLoadPage
        } as any);
        (useTradeStore as any).getState.mockReturnValue({
            trades: [],
            allHistory: tradeHistory
        });

        // Current balance is 10000, initial 10000.
        // PnL is +100. Expected balance 10100.
        // Difference is present, so updateAccountBalance should be called.

        const { result } = renderHook(() => useDashboardData(mockAccount.id));

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(mockUpdateAccountBalance).toHaveBeenCalledWith(mockAccount.id, 100);
    });

    it("should calculate streak metrics correctly", async () => {
        const today = new Date().toISOString().split("T")[0];
        const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

        const entries = [
            { date: today },
            { date: yesterday }
        ];

        vi.mocked(useJournalStore).mockReturnValue({
            entries: entries,
            loadEntries: mockLoadEntries
        } as any);

        const { result } = renderHook(() => useDashboardData(mockAccount.id));

        await waitFor(() => {
             expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.streakMetrics.streak).toBe(2);
        expect(result.current.streakMetrics.daysAccessed).toBe(2);
    });

    it("should load admin and mentor permissions", async () => {
        vi.mocked(isAdmin).mockResolvedValue(true);
        vi.mocked(isMentor).mockResolvedValue(true);

        const { result } = renderHook(() => useDashboardData(mockAccount.id));
        
        await waitFor(() => {
             expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.isAdminUser).toBe(true);
        expect(result.current.isMentorUser).toBe(true);
    });

    it("should handle initialization errors", async () => {
        mockLoadTrades.mockRejectedValue(new Error("Network Error"));
        const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

        const { result } = renderHook(() => useDashboardData(mockAccount.id));

        await waitFor(() => {
             expect(result.current.isLoading).toBe(false);
        });

        expect(mockShowToast).toHaveBeenCalledWith("Erro ao carregar dados do dashboard", "error");
        expect(consoleSpy).toHaveBeenCalled();
    });

    it("should load accounts if none present", async () => {
        // Setup empty accounts initially
        (useAccountStore as any).getState.mockReturnValue({
             accounts: [],
             loadAccounts: mockLoadAccounts
        });

        // After loadAccounts is called, it should return accounts. 
        mockLoadAccounts.mockImplementation(async () => {
            (useAccountStore as any).getState.mockReturnValue({
                accounts: [mockAccount],
                loadAccounts: mockLoadAccounts
            });
        });

        renderHook(() => useDashboardData(mockAccount.id));

        await waitFor(() => {
            expect(mockLoadAccounts).toHaveBeenCalled();
        });
    });

    it("should break streak counting on gap", async () => {
        const today = new Date().toISOString().split("T")[0];
        // Gap of 2 days
        const threeDaysAgo = new Date(Date.now() - 3 * 86400000).toISOString().split("T")[0];

        const entries = [
            { date: today },
            { date: threeDaysAgo }
        ];

        vi.mocked(useJournalStore).mockReturnValue({
            entries: entries,
            loadEntries: mockLoadEntries
        } as any);

        const { result } = renderHook(() => useDashboardData(mockAccount.id));

        await waitFor(() => {
             expect(result.current.isLoading).toBe(false);
        });

        // Streak should be 1 (today only) because of the gap
        expect(result.current.streakMetrics.streak).toBe(1);
    });
});
