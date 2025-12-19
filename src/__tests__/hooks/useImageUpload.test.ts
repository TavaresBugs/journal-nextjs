import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useImageUpload } from "@/hooks/useImageUpload";
import { useImageCache } from "@/hooks/useImageCache";
import { compressImageForPreview, shouldCompress } from "@/lib/utils/imageCompression";

// Mock dependencies
vi.mock("@/hooks/useImageCache", () => ({
  useImageCache: vi.fn(),
}));

vi.mock("@/lib/utils/imageCompression", () => ({
  compressImageForPreview: vi.fn(),
  shouldCompress: vi.fn(),
}));

describe("useImageUpload", () => {
  const mockImageCache = {
    set: vi.fn(),
    get: vi.fn(),
    remove: vi.fn(),
    clear: vi.fn(),
    cleanup: vi.fn(),
    getStats: vi.fn(),
    has: vi.fn(),
    keys: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useImageCache).mockReturnValue(mockImageCache);
    // Default behaviors
    vi.mocked(shouldCompress).mockReturnValue(false);
    vi.mocked(compressImageForPreview).mockResolvedValue("compressed-base64");
  });

  it("should initialize with default empty state", () => {
    const { result } = renderHook(() => useImageUpload());

    expect(result.current.images).toEqual({});
    expect(result.current.isCompressing).toBe(false);
  });

  it("should initialize with provided images", () => {
    const initialImages = { H1: ["img1", "img2"] };
    const { result } = renderHook(() => useImageUpload(initialImages));

    expect(result.current.images).toEqual(initialImages);
  });

  it("should handle paste image event with compression", async () => {
    const { result } = renderHook(() => useImageUpload());
    
    // Simulate compression needed
    vi.mocked(shouldCompress).mockReturnValue(true);
    vi.mocked(compressImageForPreview).mockResolvedValue("compressed-base64");

    const mockFile = new File(["dummy content"], "test.png", { type: "image/png" });
    const mockClipboardEvent = {
      clipboardData: {
        items: [
          {
            type: "image/png",
            getAsFile: () => mockFile,
          },
        ],
      },
      preventDefault: vi.fn(),
    } as unknown as React.ClipboardEvent<HTMLDivElement>;

    // We need to wait for FileReader
    await act(async () => {
      await result.current.handlePasteImage(mockClipboardEvent, "H1");
    });

    // Wait for async state update
    await vi.waitFor(() => {
        expect(result.current.images["H1"]).toEqual(["compressed-base64"]);
    });
    
    expect(shouldCompress).toHaveBeenCalled();
    expect(compressImageForPreview).toHaveBeenCalled();
    expect(mockImageCache.set).toHaveBeenCalled();
  });

  it("should handle paste NOT an image", async () => {
    const { result } = renderHook(() => useImageUpload());
    
    const mockClipboardEvent = {
      clipboardData: {
        items: [
          {
            type: "text/plain",
            getAsFile: () => null,
          },
        ],
      },
    } as unknown as React.ClipboardEvent<HTMLDivElement>;

    await act(async () => {
      await result.current.handlePasteImage(mockClipboardEvent, "H1");
    });

    expect(result.current.images["H1"]).toBeUndefined();
  });

  it("should handle file select", async () => {
    const { result } = renderHook(() => useImageUpload());
    
    const mockFile = new File(["dummy content"], "test.png", { type: "image/png" });
    const mockChangeEvent = {
      target: {
        files: [mockFile],
      },
    } as unknown as React.ChangeEvent<HTMLInputElement>;

    await act(async () => {
      result.current.handleFileSelect(mockChangeEvent, "D1");
    });

    // Need to wait for FileReader onload
    await vi.waitFor(() => {
      // Since we mocked FileReader to standard behavior in browser/jsdom, 
      // but here we are in a test env where FileReader implementation might vary 
      // or we rely on the mocked logic inside the hook if we mocked global FileReader (we didn't).
      // However, usually jsdom supports FileReader.
      // Let's check if 'shouldCompress' is called which implies the reader finished.
       expect(shouldCompress).toHaveBeenCalled();
    });
    
    // Check if state updated (assuming no compression for simplicity unless set)
    // Actually the hook calls processImage which calls shouldCompress
  });

  it("should remove last image", () => {
    const initialImages = { H1: ["img1", "img2"] };
    const { result } = renderHook(() => useImageUpload(initialImages));

    act(() => {
      result.current.removeLastImage("H1");
    });

    expect(result.current.images["H1"]).toEqual(["img1"]);
    expect(mockImageCache.remove).toHaveBeenCalled();
  });

  it("should clear all images", () => {
    const initialImages = { H1: ["img1"] };
    const { result } = renderHook(() => useImageUpload(initialImages));

    act(() => {
      result.current.clearAllImages();
    });

    expect(result.current.images).toEqual({});
    expect(mockImageCache.clear).toHaveBeenCalled();
  });
});
