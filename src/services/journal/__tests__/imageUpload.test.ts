import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { uploadJournalImages, isRawImageMap } from "@/services/journal/imageUpload";
import { compressToWebP, base64ToFile } from "@/lib/utils/imageCompression";

// Mock dependencies
vi.mock("@/lib/utils/imageCompression", () => ({
  compressToWebP: vi.fn(),
  base64ToFile: vi.fn(),
}));

// Mock Supabase
const mockUpload = vi.fn();
const mockGetPublicUrl = vi.fn();
const mockRemove = vi.fn();
const mockSelect = vi.fn();
const mockEq = vi.fn();

vi.mock("@/lib/supabase", () => ({
  supabase: {
    storage: {
      from: vi.fn(() => ({
        upload: mockUpload,
        getPublicUrl: mockGetPublicUrl,
        remove: mockRemove,
      })),
    },
    from: vi.fn(() => ({
      select: mockSelect,
    })),
  },
}));

describe("Image Upload Service", () => {
  const mockFile = new File([""], "test.png", { type: "image/png" });
  const mockCompressed = {
    webp: new Blob([""], { type: "image/webp" }),
    jpeg: new Blob([""], { type: "image/jpeg" }),
    compressedSizeWebP: 100,
    compressedSizeJpeg: 120,
    originalSize: 200,
    previewDataUrl: "data:image/jpeg;base64,preview",
    width: 800,
    height: 600,
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mocks
    vi.mocked(base64ToFile).mockReturnValue(mockFile);
    vi.mocked(compressToWebP).mockResolvedValue(mockCompressed);

    mockUpload.mockResolvedValue({ data: { path: "some/path" }, error: null });
    mockGetPublicUrl.mockReturnValue({ data: { publicUrl: "https://bucket.co/storage/img.webp" } });

    // Database mock chain for cleanup
    mockSelect.mockReturnValue({ eq: mockEq });
    mockEq.mockResolvedValue({ data: [], error: null });

    // Mock global crypto
    global.crypto.randomUUID = vi.fn().mockReturnValue("uuid-123");
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("uploadJournalImages", () => {
    const options = {
      userId: "user-1",
      accountId: "acc-1",
      entryId: "entry-1",
      date: "2023-10-01",
      asset: "EURUSD",
    };

    it("should upload new base64 images", async () => {
      const imageMap = {
        M5: ["data:image/png;base64,fakecontent"],
      };

      const result = await uploadJournalImages(imageMap, options);

      expect(base64ToFile).toHaveBeenCalled();
      expect(compressToWebP).toHaveBeenCalled();
      expect(mockUpload).toHaveBeenCalled();
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        userId: "user-1",
        journalEntryId: "entry-1",
        timeframe: "M5",
        path: expect.stringContaining("EURUSD-M5-0"),
      });
    });

    it("should handle existing URLs without re-uploading", async () => {
      const existingUrl =
        "https://bucket.co/storage/journal-images/user-1/acc-1/2023/10/01/img.webp";
      const imageMap = {
        H1: [existingUrl],
      };

      const result = await uploadJournalImages(imageMap, options);

      expect(mockUpload).not.toHaveBeenCalled();
      expect(result).toHaveLength(1);
      expect(result[0].url).toBe(existingUrl);
      expect(result[0].path).toContain("user-1/acc-1/2023/10/01/img.webp");
    });

    it("should cleanup orphaned images", async () => {
      // Mock DB returning an image that is NOT in the new list
      const oldPath = "path/to/old_image.webp";
      mockEq.mockResolvedValue({
        data: [{ path: oldPath }],
        error: null,
      });

      const imageMap = {
        M5: ["data:image/png;base64,newimg"],
      };

      await uploadJournalImages(imageMap, options);

      expect(mockRemove).toHaveBeenCalledWith([oldPath]);
    });

    it("should not cleanup images that are still present", async () => {
      const existingUrl = "https://bucket.co/journal-images/path/to/kept_image.webp";
      const keptPath = "path/to/kept_image.webp";

      // DB says this image exists
      mockEq.mockResolvedValue({
        data: [{ path: keptPath }],
        error: null,
      });

      const imageMap = {
        H1: [existingUrl],
      };

      await uploadJournalImages(imageMap, options);

      expect(mockRemove).not.toHaveBeenCalled();
    });

    it("should handle upload errors gracefully", async () => {
      mockUpload.mockResolvedValueOnce({ data: null, error: new Error("Upload Failed") });
      const imageMap = {
        M5: ["data:image/png;base64,fail"],
        H1: ["data:image/png;base64,success"],
      };

      const result = await uploadJournalImages(imageMap, options);

      // Should skip the failed one but process the success one
      expect(result).toHaveLength(1);
      expect(result[0].timeframe).toBe("H1");
    });
  });

  describe("isRawImageMap", () => {
    it("should identify valid image maps", () => {
      expect(isRawImageMap({ M5: ["img1"], H1: [] })).toBe(true);
    });

    it("should reject non-objects", () => {
      expect(isRawImageMap(null)).toBe(false);
      expect(isRawImageMap("string")).toBe(false);
      expect(isRawImageMap([1, 2])).toBe(false);
    });

    it("should reject objects with non-array values", () => {
      expect(isRawImageMap({ M5: "not-array" })).toBe(false);
    });
  });
});
