import { describe, it, expect } from "vitest";
import { isValidUUID } from "../uuid";

describe("isValidUUID", () => {
  it("should return true for valid UUIDs", () => {
    expect(isValidUUID("123e4567-e89b-12d3-a456-426614174000")).toBe(true);
    expect(isValidUUID("c56a4180-65aa-42ec-a945-5fd21dec0538")).toBe(true);
  });

  it("should return false for invalid UUIDs", () => {
    expect(isValidUUID("invalid-uuid")).toBe(false);
    expect(isValidUUID("12345")).toBe(false);
    expect(isValidUUID("")).toBe(false);
    expect(isValidUUID("123e4567-e89b-12d3-a456-42661417400")).toBe(false); // Too short
    expect(isValidUUID("123e4567-e89b-12d3-a456-4266141740000")).toBe(false); // Too long
    expect(isValidUUID("g23e4567-e89b-12d3-a456-426614174000")).toBe(false); // Invalid char 'g'
  });
});
