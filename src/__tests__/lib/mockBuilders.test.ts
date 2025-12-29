import { describe, it, expect, afterEach } from "vitest";
import {
  createSupabaseMock,
  mockMatchMedia,
  mockResizeObserver,
} from "@/lib/tests/utils/mockBuilders";

describe("mockBuilders", () => {
  describe("createSupabaseMock", () => {
    it("should create a mock with method chaining support", () => {
      const mock = createSupabaseMock();

      expect(mock.from).toBeDefined();
      expect(mock.select).toBeDefined();
      expect(mock.insert).toBeDefined();
      expect(mock.update).toBeDefined();
      expect(mock.delete).toBeDefined();
      expect(mock.eq).toBeDefined();
    });

    it("should chain methods correctly", () => {
      const mock = createSupabaseMock();

      // Chaining should work
      const result = mock.from("table").select("*").eq("id", 1);

      expect(result).toBeDefined();
    });

    it("should have auth methods", () => {
      const mock = createSupabaseMock();

      expect(mock.auth.getUser).toBeDefined();
      expect(mock.auth.signInWithPassword).toBeDefined();
      expect(mock.auth.signOut).toBeDefined();
      expect(mock.auth.getSession).toBeDefined();
    });

    it("should have storage methods", () => {
      const mock = createSupabaseMock();

      expect(mock.storage.from).toBeDefined();
      expect(mock.storage.upload).toBeDefined();
      expect(mock.storage.getPublicUrl).toBeDefined();
      expect(mock.storage.remove).toBeDefined();
    });
  });

  describe("mockMatchMedia", () => {
    const originalMatchMedia = window.matchMedia;

    afterEach(() => {
      // Restore original matchMedia
      Object.defineProperty(window, "matchMedia", {
        writable: true,
        value: originalMatchMedia,
      });
    });

    it("should mock window.matchMedia", () => {
      mockMatchMedia();

      expect(window.matchMedia).toBeDefined();
      expect(typeof window.matchMedia).toBe("function");
    });

    it("should return a mock implementation", () => {
      mockMatchMedia();

      const result = window.matchMedia("(min-width: 768px)");

      expect(result.matches).toBe(false);
      expect(result.media).toBe("(min-width: 768px)");
      expect(result.addEventListener).toBeDefined();
      expect(result.removeEventListener).toBeDefined();
    });
  });

  describe("mockResizeObserver", () => {
    const originalResizeObserver = global.ResizeObserver;

    afterEach(() => {
      // Restore original ResizeObserver
      global.ResizeObserver = originalResizeObserver;
    });

    it("should mock global ResizeObserver", () => {
      mockResizeObserver();

      expect(global.ResizeObserver).toBeDefined();
    });

    it("should create a mock that returns expected methods", () => {
      mockResizeObserver();

      // The mock is a vi.fn() that returns an object with observe, unobserve, disconnect
      // Call it as a function (vi.fn() returns a callable mock)
      const MockedResizeObserver = global.ResizeObserver as unknown as () => {
        observe: unknown;
        unobserve: unknown;
        disconnect: unknown;
      };
      const mockInstance = MockedResizeObserver();

      expect(mockInstance.observe).toBeDefined();
      expect(mockInstance.unobserve).toBeDefined();
      expect(mockInstance.disconnect).toBeDefined();
    });
  });
});
