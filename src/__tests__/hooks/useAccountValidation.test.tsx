import { renderHook } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useAccountValidation } from "@/hooks/useAccountValidation";

describe("useAccountValidation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return isValidAccount true for valid UUID", () => {
    const validUUID = "123e4567-e89b-12d3-a456-426614174000";
    const { result } = renderHook(() => useAccountValidation(validUUID));

    expect(result.current.isValidAccount).toBe(true);
  });

  it("should return isValidAccount false for invalid UUID", () => {
    const invalidUUID = "invalid-id";
    const { result } = renderHook(() => useAccountValidation(invalidUUID));

    expect(result.current.isValidAccount).toBe(false);
  });

  it("should accept uppercase UUIDs", () => {
    const uppercaseUUID = "123E4567-E89B-12D3-A456-426614174000";
    const { result } = renderHook(() => useAccountValidation(uppercaseUUID));

    expect(result.current.isValidAccount).toBe(true);
  });

  it("should reject malformed UUIDs", () => {
    const malformedUUIDs = [
      "123e4567-e89b-12d3-a456", // too short
      "123e4567-e89b-12d3-a456-426614174000-extra", // too long
      "not-valid-at-all",
      "",
      "123e4567e89b12d3a456426614174000", // no dashes
    ];

    malformedUUIDs.forEach((uuid) => {
      const { result } = renderHook(() => useAccountValidation(uuid));
      expect(result.current.isValidAccount).toBe(false);
    });
  });
});
