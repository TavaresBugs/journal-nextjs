/**
 * Service Worker Registration Utility
 *
 * Registers the image cache service worker and provides utilities
 * for interacting with it.
 *
 * @example
 * // In your app initialization
 * import { registerImageCacheServiceWorker } from '@/lib/swRegistration';
 *
 * if (typeof window !== 'undefined') {
 *   registerImageCacheServiceWorker();
 * }
 */

// ============================================
// Registration
// ============================================

let swRegistration: ServiceWorkerRegistration | null = null;

/**
 * Register the image cache service worker
 */
export async function registerImageCacheServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    console.log("[SW] Service Worker not supported");
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register("/sw-image-cache.js", {
      scope: "/",
    });

    swRegistration = registration;

    if (registration.installing) {
      console.log("[SW] Service Worker installing");
    } else if (registration.waiting) {
      console.log("[SW] Service Worker installed, waiting to activate");
    } else if (registration.active) {
      console.log("[SW] Service Worker active");
    }

    // Check for updates periodically
    setInterval(
      () => {
        registration.update();
      },
      60 * 60 * 1000
    ); // Every hour

    return registration;
  } catch (error) {
    console.error("[SW] Service Worker registration failed:", error);
    return null;
  }
}

/**
 * Unregister the service worker
 */
export async function unregisterServiceWorker(): Promise<boolean> {
  if (swRegistration) {
    const success = await swRegistration.unregister();
    if (success) {
      swRegistration = null;
      console.log("[SW] Service Worker unregistered");
    }
    return success;
  }
  return false;
}

// ============================================
// Communication with Service Worker
// ============================================

/**
 * Send a message to the service worker and wait for response
 */
async function sendMessage<T>(type: string, payload?: unknown): Promise<T | null> {
  const registration = swRegistration || (await navigator.serviceWorker?.ready);

  if (!registration?.active) {
    console.warn("[SW] No active service worker");
    return null;
  }

  return new Promise((resolve) => {
    const channel = new MessageChannel();

    channel.port1.onmessage = (event) => {
      resolve(event.data);
    };

    registration.active!.postMessage({ type, payload }, [channel.port2]);

    // Timeout after 5 seconds
    setTimeout(() => resolve(null), 5000);
  });
}

/**
 * Clear all cached images
 */
export async function clearImageCache(): Promise<boolean> {
  const result = await sendMessage<{ success: boolean }>("CLEAR_IMAGE_CACHE");
  return result?.success ?? false;
}

/**
 * Get cache statistics
 */
export async function getImageCacheStats(): Promise<{ count: number; sizeMB: number } | null> {
  return sendMessage("GET_CACHE_STATS");
}

/**
 * Precache a specific image
 */
export async function precacheImage(url: string): Promise<boolean> {
  const result = await sendMessage<{ success: boolean }>("PRECACHE_IMAGE", { url });
  return result?.success ?? false;
}

// ============================================
// React Hook for Service Worker Status
// ============================================

import { useState, useEffect } from "react";

export interface ServiceWorkerStatus {
  isSupported: boolean;
  isRegistered: boolean;
  isActive: boolean;
  cacheStats: { count: number; sizeMB: number } | null;
}

/**
 * Hook to track service worker status
 */
export function useServiceWorkerStatus(): ServiceWorkerStatus {
  const [status, setStatus] = useState<ServiceWorkerStatus>({
    isSupported: false,
    isRegistered: false,
    isActive: false,
    cacheStats: null,
  });

  useEffect(() => {
    const checkStatus = async () => {
      const isSupported = typeof window !== "undefined" && "serviceWorker" in navigator;

      if (!isSupported) {
        setStatus((prev) => ({ ...prev, isSupported: false }));
        return;
      }

      const registration = await navigator.serviceWorker.getRegistration("/");
      const isRegistered = !!registration;
      const isActive = !!registration?.active;

      let cacheStats = null;
      if (isActive) {
        cacheStats = await getImageCacheStats();
      }

      setStatus({
        isSupported,
        isRegistered,
        isActive,
        cacheStats,
      });
    };

    checkStatus();
  }, []);

  return status;
}
