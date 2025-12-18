/**
 * Image Compression Utilities
 *
 * Provides functions for compressing images before caching or uploading.
 * Uses canvas-based compression for maximum browser compatibility.
 *
 * @example
 * // Compress a base64 image for preview
 * const compressed = await compressImageForPreview(base64, { maxWidth: 800 });
 *
 * // Get image size info
 * const info = getBase64SizeInfo(base64);
 * console.log(info.sizeMB); // e.g., 0.5
 */

// ============================================
// Types
// ============================================

export interface CompressionOptions {
  /** Maximum width in pixels (default: 1200) */
  maxWidth?: number;
  /** Maximum height in pixels (default: 900) */
  maxHeight?: number;
  /** JPEG quality 0-1 (default: 0.95) */
  quality?: number;
  /** Output format (default: auto-detect from input) */
  format?: "jpeg" | "png" | "webp";
}

export interface ImageSizeInfo {
  originalSizeBytes: number;
  originalSizeMB: number;
  estimatedCompressedMB?: number;
}

// ============================================
// Size Utilities
// ============================================

/**
 * Get size information for a base64 encoded image
 */
export function getBase64SizeInfo(base64: string): ImageSizeInfo {
  // Base64 encoded size is ~33% larger than binary
  // Remove data URL prefix for accurate calculation
  const base64Data = base64.includes(",") ? base64.split(",")[1] : base64;
  const sizeBytes = Math.round((base64Data.length * 3) / 4);
  const sizeMB = sizeBytes / (1024 * 1024);

  return {
    originalSizeBytes: sizeBytes,
    originalSizeMB: Number(sizeMB.toFixed(2)),
    // Estimate compressed size (typically 30-50% reduction at quality 0.7)
    estimatedCompressedMB: Number((sizeMB * 0.4).toFixed(2)),
  };
}

/**
 * Check if an image should be compressed based on size
 */
export function shouldCompress(base64: string, thresholdMB = 0.5): boolean {
  const info = getBase64SizeInfo(base64);
  return info.originalSizeMB > thresholdMB;
}

// ============================================
// Compression Functions
// ============================================

/**
 * Compress a base64 image for preview/thumbnail use.
 *
 * Uses canvas-based compression which works in all modern browsers.
 * Falls back to original if compression fails.
 *
 * @param base64 - Base64 encoded image (with or without data URL prefix)
 * @param options - Compression options
 * @returns Compressed base64 image
 */
export async function compressImageForPreview(
  base64: string,
  options: CompressionOptions = {}
): Promise<string> {
  const { maxWidth = 1200, maxHeight = 900, quality = 0.95, format } = options;

  // Check if compression is needed
  const sizeInfo = getBase64SizeInfo(base64);
  if (sizeInfo.originalSizeMB < 0.1) {
    // Skip tiny images
    return base64;
  }

  return new Promise((resolve) => {
    const img = new Image();

    img.onload = () => {
      try {
        // Calculate new dimensions maintaining aspect ratio
        let { width, height } = img;

        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }

        // Create canvas
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(width);
        canvas.height = Math.round(height);

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          console.warn("[compressImage] Canvas context unavailable");
          resolve(base64);
          return;
        }

        // Draw image
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Determine output format
        const inputFormat = base64.includes("image/png")
          ? "png"
          : base64.includes("image/webp")
            ? "webp"
            : "jpeg";
        const outputFormat = format || (inputFormat === "png" ? "png" : "jpeg");
        const mimeType = `image/${outputFormat}`;

        // Convert to compressed base64
        const compressed = canvas.toDataURL(mimeType, quality);

        // Verify compression actually reduced size
        const compressedSize = getBase64SizeInfo(compressed);
        if (compressedSize.originalSizeMB >= sizeInfo.originalSizeMB) {
          // Compression didn't help, return original
          resolve(base64);
          return;
        }

        if (process.env.NODE_ENV === "development") {
          console.log(
            `[compressImage] ${sizeInfo.originalSizeMB}MB → ${compressedSize.originalSizeMB}MB ` +
              `(${Math.round((1 - compressedSize.originalSizeMB / sizeInfo.originalSizeMB) * 100)}% reduction)`
          );
        }

        resolve(compressed);
      } catch (error) {
        console.warn("[compressImage] Compression failed:", error);
        resolve(base64);
      }
    };

    img.onerror = () => {
      console.warn("[compressImage] Failed to load image");
      resolve(base64);
    };

    img.src = base64;
  });
}

/**
 * Compress multiple images in parallel
 */
export async function compressImagesForPreview(
  images: string[],
  options: CompressionOptions = {}
): Promise<string[]> {
  return Promise.all(images.map((img) => compressImageForPreview(img, options)));
}

// ============================================
// Thumbnail Generation
// ============================================

/**
 * Generate a small thumbnail for quick previews (e.g., in lists)
 * More aggressive compression than preview
 */
export async function generateThumbnail(base64: string, size: number = 200): Promise<string> {
  return compressImageForPreview(base64, {
    maxWidth: size,
    maxHeight: size,
    quality: 0.6,
    format: "jpeg",
  });
}

// ============================================
// WebP Conversion
// ============================================

export interface CompressedImage {
  /** WebP blob (primary format) */
  webp: Blob;
  /** JPEG blob (fallback) */
  jpeg: Blob;
  /** Low-quality base64 preview for immediate UI display */
  previewDataUrl: string;
  /** Final width in pixels */
  width: number;
  /** Final height in pixels */
  height: number;
  /** Original file size in bytes */
  originalSize: number;
  /** Compressed WebP size in bytes */
  compressedSizeWebP: number;
  /** Compressed JPEG size in bytes */
  compressedSizeJpeg: number;
}

export interface WebPCompressionOptions {
  /** Maximum width in pixels (default: 1920) */
  maxWidth?: number;
  /** Maximum height in pixels (default: 1080) */
  maxHeight?: number;
  /** WebP quality 0-1 (default: 0.8) */
  qualityWebP?: number;
  /** JPEG quality 0-1 (default: 0.85) */
  qualityJpeg?: number;
  /** Preview quality 0-1 (default: 0.5) */
  previewQuality?: number;
}

/**
 * Check if the browser supports WebP encoding
 */
export function supportsWebP(): boolean {
  if (typeof document === "undefined") return false;

  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  return canvas.toDataURL("image/webp").startsWith("data:image/webp");
}

/**
 * Compress a File to WebP format with JPEG fallback.
 *
 * Generates:
 * - WebP blob (primary, ~70-80% smaller)
 * - JPEG blob (fallback for old browsers)
 * - Low-quality preview dataURL for immediate display
 *
 * @param file - Image file to compress
 * @param options - Compression options
 * @returns CompressedImage with all variants
 */
export async function compressToWebP(
  file: File,
  options: WebPCompressionOptions = {}
): Promise<CompressedImage> {
  const {
    maxWidth = 1920,
    maxHeight = 1080,
    qualityWebP = 1.0,
    qualityJpeg = 0.85,
    previewQuality = 0.5,
  } = options;

  // 1. Load image using createImageBitmap for better performance
  let img: ImageBitmap | HTMLImageElement;

  try {
    img = await createImageBitmap(file);
  } catch {
    // Fallback for browsers without createImageBitmap
    img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = URL.createObjectURL(file);
    });
  }

  // 2. Calculate dimensions maintaining aspect ratio
  let width = img.width;
  let height = img.height;

  if (width > maxWidth || height > maxHeight) {
    const ratio = Math.min(maxWidth / width, maxHeight / height);
    width = Math.floor(width * ratio);
    height = Math.floor(height * ratio);
  }

  // 3. Create canvas and draw
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas 2D context not available");
  }

  ctx.drawImage(img, 0, 0, width, height);

  // 4. Generate WebP blob
  const webpBlob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("WebP conversion failed"))),
      "image/webp",
      qualityWebP
    );
  });

  // 5. Generate JPEG fallback
  const jpegBlob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("JPEG conversion failed"))),
      "image/jpeg",
      qualityJpeg
    );
  });

  // 6. Generate preview dataURL (low quality for fast display)
  const previewDataUrl = canvas.toDataURL("image/webp", previewQuality);

  // Log compression stats in development
  if (process.env.NODE_ENV === "development") {
    const savingsWebP = ((1 - webpBlob.size / file.size) * 100).toFixed(1);
    const savingsJpeg = ((1 - jpegBlob.size / file.size) * 100).toFixed(1);
    console.log(
      `[WebP] ${file.name}: ${(file.size / 1024).toFixed(0)}KB → ` +
        `WebP: ${(webpBlob.size / 1024).toFixed(0)}KB (-${savingsWebP}%), ` +
        `JPEG: ${(jpegBlob.size / 1024).toFixed(0)}KB (-${savingsJpeg}%)`
    );
  }

  // Cleanup ImageBitmap if used
  if ("close" in img) {
    (img as ImageBitmap).close();
  }

  return {
    webp: webpBlob,
    jpeg: jpegBlob,
    previewDataUrl,
    width,
    height,
    originalSize: file.size,
    compressedSizeWebP: webpBlob.size,
    compressedSizeJpeg: jpegBlob.size,
  };
}

/**
 * Convert base64 to File for WebP compression
 */
export function base64ToFile(base64: string, filename: string = "image.png"): File {
  const arr = base64.split(",");
  const mime = arr[0].match(/:(.*?);/)?.[1] || "image/png";
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);

  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }

  return new File([u8arr], filename, { type: mime });
}

/**
 * Compress base64 to WebP
 * Convenience wrapper that converts base64 -> File -> WebP
 */
export async function compressBase64ToWebP(
  base64: string,
  options: WebPCompressionOptions = {}
): Promise<CompressedImage> {
  const file = base64ToFile(base64);
  return compressToWebP(file, options);
}
