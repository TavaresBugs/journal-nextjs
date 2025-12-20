import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combina classes CSS condicionalmente e resolve conflitos do Tailwind.
 * Utilitário padrão para usar com shadcn/ui.
 *
 * @param inputs - Lista de classes ou objetos condicionais
 * @returns String com as classes combinadas e mergeadas
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Safely extracts error message from unknown error objects
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  if (typeof error === "object" && error !== null && "message" in error) {
    return String((error as Record<string, unknown>).message);
  }
  return "An unknown error occurred";
}

/**
 * Converte uma string Base64 em um objeto Blob.
 * Útil para upload de imagens que estão em formato base64.
 *
 * @param base64 - String no formato "data:image/png;base64,..."
 * @returns Blob pronto para upload
 */
export function base64ToBlob(base64: string): Blob {
  try {
    const arr = base64.split(",");
    const mime = arr[0].match(/:(.*?);/)?.[1] || "image/png";
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  } catch (e) {
    console.error("Error converting base64 to blob:", e);
    return new Blob([], { type: "image/png" });
  }
}

// Supabase Storage bucket name for journal images
const JOURNAL_IMAGES_BUCKET = "journal-images";

/**
 * Builds the full Supabase Storage URL for a given path.
 * Uses the NEXT_PUBLIC_SUPABASE_URL environment variable.
 *
 * @param path - The storage path (e.g., "userId/accountId/2025/12/10/image.png")
 * @param bucket - The storage bucket name (defaults to journal-images)
 * @returns Full public URL for the storage object
 */
export function getSupabaseStorageUrl(
  path: string,
  bucket: string = JOURNAL_IMAGES_BUCKET
): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) {
    console.error("NEXT_PUBLIC_SUPABASE_URL is not defined");
    return path;
  }
  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`;
}

/**
 * Get a cached image URL with TTL-based versioning.
 *
 * Uses hour-based timestamps to leverage browser cache while still
 * allowing updates. Images are cached for the duration of the TTL,
 * reducing unnecessary refetches.
 *
 * @param urlOrPath - The image URL or storage path
 * @param ttlSeconds - Cache TTL in seconds (default: 3600 = 1 hour)
 * @returns URL with TTL-based cache version
 */
export function getCachedImageUrl(urlOrPath: string, ttlSeconds: number = 3600): string {
  if (!urlOrPath) return urlOrPath;

  let fullUrl = urlOrPath;

  // If it's not a complete URL, build the full Supabase Storage URL
  if (!urlOrPath.startsWith("http")) {
    fullUrl = getSupabaseStorageUrl(urlOrPath);
  }

  try {
    const urlObj = new URL(fullUrl);
    // Remove old cache-busting parameters
    urlObj.searchParams.delete("t");
    urlObj.searchParams.delete("v");
    // Add TTL-based version (changes every TTL period)
    const version = Math.floor(Date.now() / (ttlSeconds * 1000));
    urlObj.searchParams.set("v", version.toString());
    return urlObj.toString();
  } catch {
    const base = fullUrl.split("?")[0];
    const version = Math.floor(Date.now() / (ttlSeconds * 1000));
    return `${base}?v=${version}`;
  }
}

/**
 * Ensures an image URL is complete and has a fresh cache-busting parameter.
 *
 * Handles three scenarios:
 * 1. Full URL (starts with http) - Just adds cache buster
 * 2. Storage path only (no http) - Builds full Supabase URL then adds cache buster
 * 3. Empty/invalid - Returns as-is
 *
 * ⚠️ Note: This forces a fresh fetch on every call. For better performance,
 * consider using getCachedImageUrl() with a TTL for static images.
 *
 * @param urlOrPath - The image URL or storage path to process
 * @returns Full URL with a fresh timestamp parameter
 */
export function ensureFreshImageUrl(urlOrPath: string): string {
  if (!urlOrPath) return urlOrPath;

  let fullUrl = urlOrPath;

  // If it's not a complete URL, build the full Supabase Storage URL
  if (!urlOrPath.startsWith("http")) {
    fullUrl = getSupabaseStorageUrl(urlOrPath);
  }

  try {
    const urlObj = new URL(fullUrl);
    // Remove old cache-busting parameters
    urlObj.searchParams.delete("t");
    urlObj.searchParams.delete("v");
    // Add new timestamp to force fresh fetch
    urlObj.searchParams.set("v", Date.now().toString());
    return urlObj.toString();
  } catch {
    // Fallback for malformed URLs
    const base = fullUrl.split("?")[0];
    return `${base}?v=${Date.now()}`;
  }
}
