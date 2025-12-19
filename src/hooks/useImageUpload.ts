import { useState, useCallback, useEffect, useRef } from "react";
import { useImageCache } from "./useImageCache";
import { compressImageForPreview, shouldCompress } from "@/lib/utils/imageCompression";

export interface ImageBlobs {
  webp: Blob;
  jpeg: Blob;
  timeframe: string;
}

export interface UseImageUploadReturn {
  /** Base64 preview images by timeframe */
  images: Record<string, string[]>;
  /** Compressed WebP/JPEG blobs ready for upload */
  webpBlobs: ImageBlobs[];
  handlePasteImage: (e: React.ClipboardEvent<HTMLDivElement>, timeframe: string) => Promise<void>;
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>, timeframe: string) => void;
  removeLastImage: (timeframe: string) => void;
  setImages: React.Dispatch<React.SetStateAction<Record<string, string[]>>>;
  clearAllImages: () => void;
  /** Indicates if compression is in progress */
  isCompressing: boolean;
}

export interface UseImageUploadOptions {
  /** Unique context ID for cache key namespacing (e.g., journalId, 'new-entry') */
  contextId?: string;
  /** Enable caching of uploaded images (default: true) */
  enableCache?: boolean;
  /** Compress large images before storing (default: true) */
  compressPreview?: boolean;
  /** Compression threshold in MB (default: 0.5) */
  compressionThresholdMB?: number;
  /** Convert to WebP format for upload (default: true) */
  useWebP?: boolean;
}

/**
 * Custom hook for managing image uploads in journal entries.
 * Supports both paste (CTRL+V) and file selection.
 *
 * ⚠️ Memory Management: This hook stores images as base64 strings which can be large.
 * When caching is enabled, images are also stored in the global LRU cache for
 * efficient memory management. The cleanup effect clears both local state and
 * cache entries when the component unmounts.
 *
 * @param initialImages - Initial images state (optional)
 * @param options - Configuration options
 * @returns Image upload utilities
 */
export function useImageUpload(
  initialImages: Record<string, string[]> = {},
  options: UseImageUploadOptions = {}
): UseImageUploadReturn {
  const {
    contextId = "upload",
    enableCache = true,
    compressPreview = true,
    compressionThresholdMB = 0.5,
  } = options;

  const [images, setImages] = useState<Record<string, string[]>>(initialImages);
  const [isCompressing, setIsCompressing] = useState(false);
  const webpBlobs: ImageBlobs[] = [];
  const imageCache = useImageCache({ maxItems: 30, ttlMs: 10 * 60 * 1000 });

  // Track cache keys for cleanup
  const cacheKeysRef = useRef<Set<string>>(new Set());

  // Cache image and track key
  const cacheImage = useCallback(
    (timeframe: string, base64: string, index: number) => {
      if (!enableCache) return;
      const key = `${contextId}_${timeframe}_${index}`;
      imageCache.set(key, base64);
      cacheKeysRef.current.add(key);

      if (process.env.NODE_ENV === "development") {
        console.log(`[useImageUpload] Cached image: ${key.slice(0, 50)}...`);
      }
    },
    [contextId, enableCache, imageCache]
  );

  // Process and optionally compress an image
  const processImage = useCallback(
    async (base64: string): Promise<string> => {
      if (!compressPreview || !shouldCompress(base64, compressionThresholdMB)) {
        return base64;
      }

      try {
        setIsCompressing(true);
        const compressed = await compressImageForPreview(base64, {
          maxWidth: 10000,
          maxHeight: 10000,
          quality: 0.95,
        });
        return compressed;
      } catch (error) {
        console.warn("[useImageUpload] Compression failed, using original:", error);
        return base64;
      } finally {
        setIsCompressing(false);
      }
    },
    [compressPreview, compressionThresholdMB]
  );

  // Cleanup on unmount to prevent memory leaks
  useEffect(() => {
    // Capture ref value for cleanup
    const keysToClean = cacheKeysRef.current;
    const ctx = contextId;

    return () => {
      // Clear cached images for this context
      if (enableCache && keysToClean.size > 0) {
        const clearedCount = imageCache.clear((key) =>
          Array.from(keysToClean).some((k) => key.startsWith(k.split("_")[0]))
        );

        if (process.env.NODE_ENV === "development") {
          console.log(
            `[useImageUpload] Cleanup: cleared ${clearedCount} cached images for context '${ctx}'`
          );
        }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePasteImage = useCallback(
    async (e: React.ClipboardEvent<HTMLDivElement>, timeframe: string) => {
      const items = e.clipboardData.items;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            const reader = new FileReader();
            reader.onload = async (event) => {
              const rawBase64 = event.target?.result as string;
              const base64 = await processImage(rawBase64);

              setImages((prev) => {
                const newImages = {
                  ...prev,
                  [timeframe]: [...(prev[timeframe] || []), base64],
                };
                // Cache the newly added image
                const newIndex = newImages[timeframe].length - 1;
                cacheImage(timeframe, base64, newIndex);
                return newImages;
              });
            };
            reader.readAsDataURL(blob);
          }
        }
      }
    },
    [cacheImage, processImage]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>, timeframe: string) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = async (event) => {
          const rawResult = event.target?.result as string;
          if (rawResult) {
            const result = await processImage(rawResult);

            setImages((prev) => {
              const newImages = {
                ...prev,
                [timeframe]: [...(prev[timeframe] || []), result],
              };
              // Cache the newly added image
              const newIndex = newImages[timeframe].length - 1;
              cacheImage(timeframe, result, newIndex);
              return newImages;
            });
          }
        };
        reader.readAsDataURL(file);
      }
    },
    [cacheImage, processImage]
  );

  const removeLastImage = useCallback(
    (timeframe: string) => {
      setImages((prev) => {
        const currentImages = prev[timeframe] || [];
        if (currentImages.length > 0) {
          // Remove from cache
          const indexToRemove = currentImages.length - 1;
          const key = `${contextId}_${timeframe}_${indexToRemove}`;
          imageCache.remove(key);
          cacheKeysRef.current.delete(key);
        }
        return {
          ...prev,
          [timeframe]: currentImages.slice(0, -1),
        };
      });
    },
    [contextId, imageCache]
  );

  const clearAllImages = useCallback(() => {
    // Clear all cached images for this context
    if (enableCache) {
      const cleared = imageCache.clear((key) => key.startsWith(contextId));
      cacheKeysRef.current.clear();

      if (process.env.NODE_ENV === "development") {
        console.log(`[useImageUpload] clearAllImages: cleared ${cleared} from cache`);
      }
    }
    setImages({});
  }, [contextId, enableCache, imageCache]);

  return {
    images,
    webpBlobs,
    handlePasteImage,
    handleFileSelect,
    removeLastImage,
    setImages,
    clearAllImages,
    isCompressing,
  };
}
