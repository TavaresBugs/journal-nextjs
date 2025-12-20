import { describe, it, expect, vi, beforeEach } from "vitest";
import { BaseRepository } from "@/lib/repositories/BaseRepository";
import { SupabaseClient } from "@supabase/supabase-js";
import { ErrorCode } from "@/lib/errors";

class TestRepository extends BaseRepository<{ id: string; name: string }> {
  constructor(supabase: SupabaseClient) {
    super(supabase, "test_table");
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MockSupabaseType = any;

describe("BaseRepository", () => {
  let mockSupabase: MockSupabaseType;
  let repository: TestRepository;

  beforeEach(() => {
    mockSupabase = {
      from: vi.fn(),
    };
    repository = new TestRepository(mockSupabase as unknown as SupabaseClient);
  });

  describe("getById", () => {
    it("should return data on success", async () => {
      const mockData = { id: "1", name: "Test" };
      const mockSelect = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockData, error: null }),
      };
      mockSupabase.from.mockReturnValue(mockSelect);

      const result = await repository.getById("1");

      expect(result.error).toBeNull();
      expect(result.data).toEqual(mockData);
      expect(mockSupabase.from).toHaveBeenCalledWith("test_table");
      expect(mockSelect.eq).toHaveBeenCalledWith("id", "1");
    });

    it("should handle not found error", async () => {
      const mockSelect = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: "PGRST116", message: "Not found" },
        }),
      };
      mockSupabase.from.mockReturnValue(mockSelect);

      const result = await repository.getById("1");

      expect(result.data).toBeNull();
      expect(result.error).not.toBeNull();
      expect(result.error?.code).toBe(ErrorCode.DB_NOT_FOUND);
    });

    it("should handle unexpected error", async () => {
      const mockSelect = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockRejectedValue(new Error("Network boom")),
      };
      mockSupabase.from.mockReturnValue(mockSelect);

      const result = await repository.getById("1");

      expect(result.data).toBeNull();
      expect(result.error).not.toBeNull();
      // toAppError uses the error message if it's an Error instance
      expect(result.error?.message).toBe("Network boom");
      // Metadata check if applicable, or remove
      expect(result.error?.code).toBe(ErrorCode.UNKNOWN_ERROR);
    });
  });

  describe("create", () => {
    it("should insert and return data", async () => {
      const newData = { name: "New Item" };
      const createdData = { id: "2", ...newData };

      const mockInsert = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: createdData, error: null }),
      };
      mockSupabase.from.mockReturnValue(mockInsert);

      const result = await repository.create(newData as unknown as { id: string; name: string });

      expect(result.data).toEqual(createdData);
      expect(mockInsert.insert).toHaveBeenCalledWith(newData);
    });
  });

  describe("update", () => {
    it("should update and return data", async () => {
      const updateData = { name: "Updated" };
      const updatedItem = { id: "1", ...updateData };

      const mockUpdate = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: updatedItem, error: null }),
      };
      mockSupabase.from.mockReturnValue(mockUpdate);

      const result = await repository.update("1", updateData);

      expect(result.data).toEqual(updatedItem);
      expect(mockUpdate.update).toHaveBeenCalledWith(updateData);
      expect(mockUpdate.eq).toHaveBeenCalledWith("id", "1");
    });
  });

  describe("delete", () => {
    it("should delete and return true", async () => {
      const mockDelete = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
      mockSupabase.from.mockReturnValue(mockDelete);

      const result = await repository.delete("1");

      expect(result.data).toBe(true);
      expect(mockDelete.delete).toHaveBeenCalled();
      expect(mockDelete.eq).toHaveBeenCalledWith("id", "1");
    });

    it("should return error on delete failure", async () => {
      const mockDelete = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: null, error: { message: "Failed" } }),
      };
      mockSupabase.from.mockReturnValue(mockDelete);

      const result = await repository.delete("1");
      expect(result.data).toBeNull();
      expect(result.error).toBeTruthy();
    });
  });

  describe("getByIds", () => {
    it("should query with 'in' operator", async () => {
      const mockData = [{ id: "1" }, { id: "2" }];
      const mockSelect = {
        select: vi.fn().mockReturnThis(),
        in: vi.fn().mockResolvedValue({ data: mockData, error: null }),
      };
      mockSupabase.from.mockReturnValue(mockSelect);

      const result = await repository.getByIds(["1", "2"]);

      expect(result.data).toEqual(mockData);
      expect(mockSelect.in).toHaveBeenCalledWith("id", ["1", "2"]);
    });
  });
});
