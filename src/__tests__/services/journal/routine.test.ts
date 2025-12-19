import { describe, it, expect, vi, beforeEach, Mock } from "vitest";
import {
  getDailyRoutines,
  saveDailyRoutine,
  deleteDailyRoutine,
  mapDailyRoutineFromDB,
  mapDailyRoutineToDB,
} from "@/services/journal/routine";
import { supabase } from "@/lib/supabase";
import { getCurrentUserId } from "@/services/core/account";

// Mock do supabase
vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: vi.fn(),
  },
}));

// Mock do getCurrentUserId
vi.mock("@/services/core/account", () => ({
  getCurrentUserId: vi.fn(),
}));

describe("Routine Service", () => {
  const mockUserId = "user-123";
  const mockDate = "2025-12-19T12:00:00Z";

  const mockRoutineDB = {
    id: "routine-1",
    user_id: mockUserId,
    account_id: "account-1",
    date: "2025-12-19",
    aerobic: true,
    diet: false,
    reading: true,
    meditation: false,
    pre_market: true,
    prayer: true,
    created_at: mockDate,
    updated_at: mockDate,
  };

  const mockRoutineApp = {
    id: "routine-1",
    userId: mockUserId,
    accountId: "account-1",
    date: "2025-12-19",
    aerobic: true,
    diet: false,
    reading: true,
    meditation: false,
    preMarket: true,
    prayer: true,
    createdAt: mockDate,
    updatedAt: mockDate,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Mappers", () => {
    it("should map from DB to App correctly", () => {
      const result = mapDailyRoutineFromDB(mockRoutineDB);
      expect(result).toEqual(mockRoutineApp);
    });

    it("should map from App to DB correctly", () => {
        // Mock Date to ensure updatedAt consistency if needed, 
        // but the function creates a new Date(). 
        // We can just check properties.
        const result = mapDailyRoutineToDB(mockRoutineApp);
        
        expect(result.id).toBe(mockRoutineApp.id);
        expect(result.user_id).toBe(mockRoutineApp.userId);
        expect(result.pre_market).toBe(mockRoutineApp.preMarket);
        // Date will be different for updatedAt
        expect(result.updated_at).toBeDefined();
    });
  });

  describe("getDailyRoutines", () => {
    it("should return routines for an account", async () => {
      (getCurrentUserId as Mock).mockResolvedValue(mockUserId);

      const selectMock = vi.fn().mockReturnThis();
      const eqMock = vi.fn().mockReturnThis();
      const orderMock = vi.fn().mockResolvedValue({ data: [mockRoutineDB], error: null });

      (supabase.from as Mock).mockReturnValue({
        select: selectMock,
        eq: eqMock,
        order: orderMock,
      });

      const result = await getDailyRoutines("account-1");

      expect(getCurrentUserId).toHaveBeenCalled();
      expect(selectMock).toHaveBeenCalledWith("*");
      expect(eqMock).toHaveBeenCalledWith("account_id", "account-1");
      expect(eqMock).toHaveBeenCalledWith("user_id", mockUserId);
      expect(result).toEqual([mockRoutineApp]);
    });

    it("should return empty array if user not authenticated", async () => {
        (getCurrentUserId as Mock).mockResolvedValue(null);
        const result = await getDailyRoutines("account-1");
        expect(result).toEqual([]);
        expect(supabase.from).not.toHaveBeenCalled();
    });

    it("should return empty array on DB error", async () => {
        (getCurrentUserId as Mock).mockResolvedValue(mockUserId);
  
        const selectMock = vi.fn().mockReturnThis();
        const eqMock = vi.fn().mockReturnThis();
        const orderMock = vi.fn().mockResolvedValue({ data: null, error: { message: "Error" } });
  
        (supabase.from as Mock).mockReturnValue({
          select: selectMock,
          eq: eqMock,
          order: orderMock,
        });
  
        const result = await getDailyRoutines("account-1");
        expect(result).toEqual([]);
    });
  });

  describe("saveDailyRoutine", () => {
    it("should save a routine successfully", async () => {
      (getCurrentUserId as Mock).mockResolvedValue(mockUserId);

      const upsertMock = vi.fn().mockResolvedValue({ error: null });

      (supabase.from as Mock).mockReturnValue({
        upsert: upsertMock,
      });

      const result = await saveDailyRoutine(mockRoutineApp);

      expect(getCurrentUserId).toHaveBeenCalled();
      expect(upsertMock).toHaveBeenCalledWith(
        expect.objectContaining({
            user_id: mockUserId,
            account_id: "account-1",
            date: "2025-12-19"
        }), 
        { onConflict: "account_id, date" }
      );
      expect(result).toBe(true);
    });

    it("should return false if user not authenticated", async () => {
        (getCurrentUserId as Mock).mockResolvedValue(null);
        const result = await saveDailyRoutine(mockRoutineApp);
        expect(result).toBe(false);
    });

    it("should return false on DB error", async () => {
        (getCurrentUserId as Mock).mockResolvedValue(mockUserId);
        const upsertMock = vi.fn().mockResolvedValue({ error: { message: "Error" } });
        (supabase.from as Mock).mockReturnValue({ upsert: upsertMock });
  
        const result = await saveDailyRoutine(mockRoutineApp);
        expect(result).toBe(false);
    });
  });

  describe("deleteDailyRoutine", () => {
    it("should delete a routine successfully", async () => {
      (getCurrentUserId as Mock).mockResolvedValue(mockUserId);

      // Create a chainable mock object
      const queryBuilder = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        then: vi.fn((resolve) => resolve({ error: null })),
      };

      (supabase.from as Mock).mockReturnValue(queryBuilder);

      const result = await deleteDailyRoutine("routine-1");

      expect(queryBuilder.delete).toHaveBeenCalled();
      expect(queryBuilder.eq).toHaveBeenCalledWith("id", "routine-1");
      expect(queryBuilder.eq).toHaveBeenCalledWith("user_id", mockUserId);
      expect(result).toBe(true);
    });

    it("should return false if user not authenticated", async () => {
        (getCurrentUserId as Mock).mockResolvedValue(null);
        const result = await deleteDailyRoutine("routine-1");
        expect(result).toBe(false);
    });

    it("should return false on DB error", async () => {
        (getCurrentUserId as Mock).mockResolvedValue(mockUserId);
        
        const queryBuilder = {
            delete: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            then: vi.fn((resolve) => resolve({ error: { message: "Error" } })),
        };

        (supabase.from as Mock).mockReturnValue(queryBuilder);
  
        const result = await deleteDailyRoutine("routine-1");
        expect(result).toBe(false);
    });
  });
});
