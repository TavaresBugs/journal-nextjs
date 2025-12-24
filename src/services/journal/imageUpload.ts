/**
 * Journal Image Upload Service
 *
 * Handles client-side image processing and upload to Supabase Storage
 * before calling Server Actions. This is necessary because:
 * 1. Image compression uses browser-only APIs (canvas, createImageBitmap)
 * 2. Server Actions can't access browser APIs
 * 3. We need to upload to Storage first, then save metadata via Prisma
 */

import { supabase } from "@/lib/supabase";
import { compressToWebP, base64ToFile } from "@/lib/utils/imageCompression";
import { JournalImage } from "@/types";

const BUCKET_NAME = "journal-images";

export interface UploadedImage {
  url: string;
  path: string;
  timeframe: string;
  displayOrder: number;
}

export interface ImageUploadOptions {
  userId: string;
  accountId: string;
  entryId: string;
  date: string;
  asset?: string;
}

/**
 * Processes and uploads journal images from the form's image map.
 *
 * @param imageMap - Map of timeframe -> array of base64 strings or existing URLs
 * @param options - Upload configuration with user/entry info
 * @returns Array of JournalImage objects ready for database storage
 */
export async function uploadJournalImages(
  imageMap: Record<string, string[]>,
  options: ImageUploadOptions
): Promise<JournalImage[]> {
  const { userId, accountId, entryId, date, asset } = options;
  const uploadedImages: JournalImage[] = [];
  const keptFileNames = new Set<string>();
  let displayOrder = 0;

  // Parse date components for path organization
  const [year, month, day] = date.split("-");
  const sanitizedAsset = (asset || "Diario").replace(/[^a-zA-Z0-9]/g, "-");
  const shortId = entryId.slice(0, 8);

  for (const [timeframe, imagesArray] of Object.entries(imageMap)) {
    if (!Array.isArray(imagesArray)) continue;

    for (let i = 0; i < imagesArray.length; i++) {
      const imageData = imagesArray[i];

      if (typeof imageData === "string" && imageData.startsWith("data:image")) {
        // New image (base64) - needs upload
        try {
          // Convert base64 to File for WebP compression
          const file = base64ToFile(imageData, `image-${timeframe}-${i}.png`);

          // Compress to WebP
          const compressed = await compressToWebP(file, {
            maxWidth: 1920,
            maxHeight: 1080,
            qualityWebP: 1.0,
            qualityJpeg: 0.85,
          });

          // Build storage path
          const basePath = `${userId}/${accountId}/${year}/${month}/${day}/${sanitizedAsset}-${timeframe}-${i}-${shortId}`;
          const webpFileName = `${basePath}.webp`;
          keptFileNames.add(webpFileName);

          // Upload WebP to Storage
          const { error: uploadError } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(webpFileName, compressed.webp, {
              contentType: "image/webp",
              upsert: true,
            });

          if (uploadError) {
            console.error(
              `[uploadJournalImages] Upload failed for ${timeframe}-${i}:`,
              uploadError
            );
            continue;
          }

          // Get public URL
          const {
            data: { publicUrl },
          } = supabase.storage.from(BUCKET_NAME).getPublicUrl(webpFileName);

          // Add cache buster
          const urlWithCacheBuster = `${publicUrl}?t=${Date.now()}`;

          uploadedImages.push({
            id: crypto.randomUUID(),
            userId,
            journalEntryId: entryId,
            url: urlWithCacheBuster,
            path: webpFileName,
            timeframe,
            displayOrder: displayOrder++,
            createdAt: new Date().toISOString(),
          });

          // Log compression stats in development
          if (process.env.NODE_ENV === "development") {
            const savings = (
              (1 - compressed.compressedSizeWebP / compressed.originalSize) *
              100
            ).toFixed(1);
            console.log(
              `[uploadJournalImages] ${timeframe}-${i}: ${(compressed.originalSize / 1024).toFixed(0)}KB → ${(compressed.compressedSizeWebP / 1024).toFixed(0)}KB (-${savings}%)`
            );
          }
        } catch (err) {
          console.error(`[uploadJournalImages] Failed to process image ${timeframe}-${i}:`, err);
        }
      } else if (typeof imageData === "string" && imageData.startsWith("http")) {
        // Existing image URL - just keep reference
        let path = "";
        try {
          const urlObj = new URL(imageData);
          const pathParts = urlObj.pathname.split("/journal-images/");
          if (pathParts.length > 1) {
            path = decodeURIComponent(pathParts[1]);
            // Remove query params from path
            const pathWithoutQuery = path.split("?")[0];
            keptFileNames.add(pathWithoutQuery);
          }
        } catch (e) {
          console.warn("[uploadJournalImages] Could not extract path from URL:", imageData, e);
        }

        if (path) {
          uploadedImages.push({
            id: crypto.randomUUID(),
            userId,
            journalEntryId: entryId,
            url: imageData,
            path: path.split("?")[0], // Store path without query params
            timeframe,
            displayOrder: displayOrder++,
            createdAt: new Date().toISOString(),
          });
        }
      }
    }
  }

  // Cleanup orphaned images from Storage
  try {
    const { data: dbImages, error: dbError } = await supabase
      .from("journal_images")
      .select("path")
      .eq("journal_entry_id", entryId);

    if (!dbError && dbImages) {
      const filesToDelete = dbImages
        .map((img) => img.path)
        .filter((path): path is string => !!path && !keptFileNames.has(path));

      if (filesToDelete.length > 0) {
        console.log("[uploadJournalImages] Deleting orphaned images:", filesToDelete);
        await supabase.storage.from(BUCKET_NAME).remove(filesToDelete);
      }
    }
  } catch (cleanupError) {
    console.error("[uploadJournalImages] Failed to cleanup orphaned images:", cleanupError);
  }

  return uploadedImages;
}

/**
 * Checks if the images object is a raw image map (needs processing)
 * or already processed JournalImage array.
 */
export function isRawImageMap(images: unknown): images is Record<string, string[]> {
  if (!images || typeof images !== "object") return false;
  if (Array.isArray(images)) return false;

  // Check if it's a map of string arrays
  const values = Object.values(images);
  return values.every((v) => Array.isArray(v));
}
