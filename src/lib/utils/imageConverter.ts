/**
 * Image Converter Utilities
 *
 * Provides functions for converting images to WebP format before upload.
 * Uses Canvas API for browser-based conversion.
 *
 * @example
 * const webpBlob = await convertToWebP(file, 1.0);
 * const fileName = generateWebPFileName('screenshot.png');
 */

/**
 * Converts any image (File/Blob) to WebP format
 * @param file - Image file to convert (PNG, JPG, etc)
 * @param quality - WebP quality (0-1), default 1.0 for lossless
 * @returns Promise<Blob> - WebP blob
 */
export async function convertToWebP(file: File | Blob, quality: number = 1.0): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      reject(new Error("Canvas context não disponível"));
      return;
    }

    img.onload = () => {
      // Preserve original dimensions
      canvas.width = img.width;
      canvas.height = img.height;

      // Draw image on canvas
      ctx.drawImage(img, 0, 0);

      // Convert to WebP
      canvas.toBlob(
        (blob) => {
          // Cleanup object URL
          URL.revokeObjectURL(img.src);

          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("Falha ao converter imagem para WebP"));
          }
        },
        "image/webp",
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error("Erro ao carregar imagem"));
    };

    // Load image from file/blob
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Generates a unique WebP filename with timestamp
 * @param originalName - Original filename (optional)
 * @returns Unique filename in format "name-timestamp-random.webp"
 */
export function generateWebPFileName(originalName?: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);

  if (originalName) {
    // Remove extension and sanitize
    const nameWithoutExt = originalName.replace(/\.[^/.]+$/, "");
    const sanitized = nameWithoutExt.replace(/[^a-zA-Z0-9-_]/g, "-");
    return `${sanitized}-${timestamp}-${random}.webp`;
  }

  return `image-${timestamp}-${random}.webp`;
}

/**
 * Check if browser supports WebP encoding
 */
export function supportsWebPEncoding(): boolean {
  if (typeof document === "undefined") return false;

  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  return canvas.toDataURL("image/webp").startsWith("data:image/webp");
}
