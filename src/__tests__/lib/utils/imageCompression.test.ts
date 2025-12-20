/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  getBase64SizeInfo,
  shouldCompress,
  compressImageForPreview,
  compressImagesForPreview,
  generateThumbnail,
  base64ToFile,
  compressBase64ToWebP,
} from "@/lib/utils/imageCompression";

describe("Image Compression Utils", () => {
  // Basic setup for mocks
  const originalImage = global.Image;
  const originalCreateElement = document.createElement;

  beforeEach(() => {
    // Mock Image
    global.Image = class {
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      width = 2000;
      height = 1500;
      src = "";
      constructor() {
        setTimeout(() => {
          if (this.onload) this.onload();
        }, 10);
      }
    } as any;

    // Mock Canvas
    const mockContext = {
      drawImage: vi.fn(),
    };
    const mockCanvas = {
      width: 0,
      height: 0,
      getContext: vi.fn().mockReturnValue(mockContext),
      toDataURL: vi.fn().mockReturnValue("data:image/jpeg;base64,compresseddata"),
      toBlob: vi.fn((cb) => cb(new Blob(["compressed"], { type: "image/webp" }))),
    };

    vi.spyOn(document, "createElement").mockImplementation((tagName) => {
      if (tagName === "canvas") return mockCanvas as any;
      return originalCreateElement.call(document, tagName);
    });

    // Mock createImageBitmap (missing in jsdom)
    global.createImageBitmap = vi.fn().mockResolvedValue({
      width: 2000,
      height: 1500,
      close: vi.fn(),
    });
  });

  afterEach(() => {
    global.Image = originalImage;
    vi.restoreAllMocks();
  });

  describe("getBase64SizeInfo", () => {
    it("should calculate size correctly", () => {
      const base64 = "data:image/png;base64," + "a".repeat(50000); // ~50KB
      const info = getBase64SizeInfo(base64);

      expect(info.originalSizeBytes).toBeGreaterThan(0);
      expect(info.originalSizeMB).toBeGreaterThan(0);
    });
  });

  describe("shouldCompress", () => {
    it("should return true for large images", () => {
      const largeBase64 = "data:image/png;base64," + "a".repeat(1024 * 1024); // ~1MB
      expect(shouldCompress(largeBase64, 0.5)).toBe(true);
    });

    it("should return false for small images", () => {
      const smallBase64 = "data:image/png;base64," + "a".repeat(100);
      expect(shouldCompress(smallBase64, 0.5)).toBe(false);
    });
  });

  describe("compressImageForPreview", () => {
    it("should compress image if needed", async () => {
      // Mock large image input
      const largeBase64 = "data:image/png;base64," + "a".repeat(1000000); // 1MB ish

      // Mock getBase64SizeInfo internals implicitly via input length
      // The mock toDataURL returns a string "data:image/jpeg;base64,compresseddata"
      // which represents a very small size.

      const result = await compressImageForPreview(largeBase64);

      expect(result).toBe("data:image/jpeg;base64,compresseddata");
    });

    it("should skip compression for tiny images", async () => {
      const smallBase64 = "data:image/png;base64,abc";
      const result = await compressImageForPreview(smallBase64);
      expect(result).toBe(smallBase64);
    });
  });

  describe("compressImagesForPreview", () => {
    it("should compress multiple images", async () => {
      const imgs = [
        "data:image/png;base64," + "a".repeat(1000000),
        "data:image/png;base64," + "b".repeat(1000000),
      ];
      const results = await compressImagesForPreview(imgs);
      expect(results).toHaveLength(2);
      expect(results[0]).toContain("compresseddata");
    });
  });

  describe("generateThumbnail", () => {
    it("should generate a thumbnail", async () => {
      const largeBase64 = "data:image/png;base64," + "a".repeat(1000000);
      const result = await generateThumbnail(largeBase64);
      expect(result).toContain("compresseddata");
    });
  });

  describe("base64ToFile", () => {
    it("should convert base64 to file", () => {
      const base64 = "data:image/png;base64,YWJj"; // "abc"
      const file = base64ToFile(base64, "test.png");

      expect(file).toBeInstanceOf(File);
      expect(file.name).toBe("test.png");
      expect(file.type).toBe("image/png");
    });
  });

  describe("compressBase64ToWebP", () => {
    it("should compress base64 to WebP", async () => {
      const base64 = "data:image/png;base64,YWJj";
      const result = await compressBase64ToWebP(base64);

      expect(result.webp).toBeInstanceOf(Blob);
      expect(result.jpeg).toBeInstanceOf(Blob);
      expect(result.previewDataUrl).toBe("data:image/jpeg;base64,compresseddata");
    });
  });
});
