import { describe, it, expect } from "vitest";
import { calculateSession } from "@/lib/utils/trade";

describe("calculateSession", () => {
  describe("Asian session (17:00 - 03:00)", () => {
    it("should return Asian for 17:00", () => {
      expect(calculateSession("17:00:00")).toBe("Asian");
    });

    it("should return Asian for 20:00", () => {
      expect(calculateSession("20:00:00")).toBe("Asian");
    });

    it("should return Asian for 23:59", () => {
      expect(calculateSession("23:59:00")).toBe("Asian");
    });

    it("should return Asian for 00:00", () => {
      expect(calculateSession("00:00:00")).toBe("Asian");
    });

    it("should return Asian for 02:30", () => {
      expect(calculateSession("02:30:00")).toBe("Asian");
    });
  });

  describe("London session (03:00 - 08:00)", () => {
    it("should return London for 03:00", () => {
      expect(calculateSession("03:00:00")).toBe("London");
    });

    it("should return London for 05:30", () => {
      expect(calculateSession("05:30:00")).toBe("London");
    });

    it("should return London for 07:59", () => {
      expect(calculateSession("07:59:00")).toBe("London");
    });
  });

  describe("Overlap session (08:00 - 12:00)", () => {
    it("should return Overlap for 08:00", () => {
      expect(calculateSession("08:00:00")).toBe("Overlap");
    });

    it("should return Overlap for 10:30", () => {
      expect(calculateSession("10:30:00")).toBe("Overlap");
    });

    it("should return Overlap for 11:59", () => {
      expect(calculateSession("11:59:00")).toBe("Overlap");
    });
  });

  describe("New York session (12:00 - 17:00)", () => {
    it("should return New-York for 12:00", () => {
      expect(calculateSession("12:00:00")).toBe("New-York");
    });

    it("should return New-York for 14:30", () => {
      expect(calculateSession("14:30:00")).toBe("New-York");
    });

    it("should return New-York for 16:59", () => {
      expect(calculateSession("16:59:00")).toBe("New-York");
    });
  });

  describe("edge cases", () => {
    it("should return N/A for empty string", () => {
      expect(calculateSession("")).toBe("N/A");
    });

    it("should return N/A for invalid time format", () => {
      expect(calculateSession("invalid")).toBe("N/A");
    });

    it("should handle time without seconds", () => {
      expect(calculateSession("14:30")).toBe("New-York");
    });
  });
});
