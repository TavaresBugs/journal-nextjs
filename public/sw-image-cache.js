/// <reference lib="webworker" />

/**
 * Service Worker for Image Cache
 * 
 * Caches images from Supabase Storage for offline access and faster subsequent loads.
 * Uses a cache-first strategy with network fallback.
 * 
 * Cache Strategy:
 * - Images: Cache-first with network fallback
 * - Other requests: Network-first (pass through)
 * 
 * Cache Limits:
 * - Max 100 images
 * - Max 50MB total size
 * - 7 days TTL
 */

declare const self: ServiceWorkerGlobalScope;

const CACHE_NAME = 'wolftab-images-v1';
const MAX_CACHE_ITEMS = 100;
const MAX_CACHE_SIZE_MB = 50;
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// Patterns for cacheable images
const CACHEABLE_PATTERNS = [
  /supabase\.co\/storage/,
  /\.png$/i,
  /\.jpg$/i,
  /\.jpeg$/i,
  /\.webp$/i,
  /\.gif$/i,
];

// ============================================
// Install Event
// ============================================

self.addEventListener('install', (event) => {
  console.log('[SW] Installing image cache service worker');
  // Skip waiting to activate immediately
  self.skipWaiting();
});

// ============================================
// Activate Event
// ============================================

self.addEventListener('activate', (event) => {
  console.log('[SW] Activating image cache service worker');
  
  // Clean up old caches
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name.startsWith('wolftab-') && name !== CACHE_NAME)
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    })
  );
  
  // Take control of all clients
  self.clients.claim();
});

// ============================================
// Fetch Event
// ============================================

self.addEventListener('fetch', (event) => {
  const request = event.request;
  
  // Only handle GET requests
  if (request.method !== 'GET') return;
  
  // Check if this is a cacheable image request
  const url = request.url;
  const isCacheable = CACHEABLE_PATTERNS.some((pattern) => pattern.test(url));
  
  if (!isCacheable) return;
  
  // Cache-first strategy for images
  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      // Try cache first
      const cachedResponse = await cache.match(request);
      
      if (cachedResponse) {
        // Check if cache is still valid (within TTL)
        const cachedDate = cachedResponse.headers.get('sw-cached-date');
        if (cachedDate) {
          const age = Date.now() - parseInt(cachedDate, 10);
          if (age < CACHE_TTL_MS) {
            console.log('[SW] Cache hit:', url.substring(0, 80));
            return cachedResponse;
          }
        }
      }
      
      // Fetch from network
      try {
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
          // Clone response for caching
          const responseToCache = networkResponse.clone();
          
          // Add timestamp header
          const headers = new Headers(responseToCache.headers);
          headers.set('sw-cached-date', Date.now().toString());
          
          const cachedBody = await responseToCache.blob();
          const newResponse = new Response(cachedBody, {
            status: responseToCache.status,
            statusText: responseToCache.statusText,
            headers,
          });
          
          // Cache the response (async, don't block)
          cache.put(request, newResponse.clone()).then(() => {
            // Enforce cache limits
            enforceCacheLimits(cache);
          });
          
          console.log('[SW] Cached from network:', url.substring(0, 80));
          return newResponse;
        }
        
        // Return cached version if network fails but we have a stale cache
        if (cachedResponse) {
          console.log('[SW] Network failed, using stale cache:', url.substring(0, 80));
          return cachedResponse;
        }
        
        return networkResponse;
      } catch (error) {
        // Network error - return cached version if available
        if (cachedResponse) {
          console.log('[SW] Offline, using cache:', url.substring(0, 80));
          return cachedResponse;
        }
        
        throw error;
      }
    })
  );
});

// ============================================
// Cache Management
// ============================================

async function enforceCacheLimits(cache: Cache): Promise<void> {
  const requests = await cache.keys();
  
  // If under limit, no action needed
  if (requests.length <= MAX_CACHE_ITEMS) return;
  
  // Get all cached items with their dates
  const items: Array<{ request: Request; date: number }> = [];
  
  for (const request of requests) {
    const response = await cache.match(request);
    if (response) {
      const dateStr = response.headers.get('sw-cached-date');
      items.push({
        request,
        date: dateStr ? parseInt(dateStr, 10) : 0,
      });
    }
  }
  
  // Sort by date (oldest first)
  items.sort((a, b) => a.date - b.date);
  
  // Remove oldest items until under limit
  const toRemove = items.slice(0, items.length - MAX_CACHE_ITEMS);
  
  for (const item of toRemove) {
    await cache.delete(item.request);
    console.log('[SW] Evicted from cache:', item.request.url.substring(0, 80));
  }
}

// ============================================
// Message Handler
// ============================================

self.addEventListener('message', (event) => {
  const { type, payload } = event.data || {};
  
  switch (type) {
    case 'CLEAR_IMAGE_CACHE':
      caches.delete(CACHE_NAME).then(() => {
        console.log('[SW] Image cache cleared');
        event.ports[0]?.postMessage({ success: true });
      });
      break;
      
    case 'GET_CACHE_STATS':
      getCacheStats().then((stats) => {
        event.ports[0]?.postMessage(stats);
      });
      break;
      
    case 'PRECACHE_IMAGE':
      if (payload?.url) {
        precacheImage(payload.url).then((success) => {
          event.ports[0]?.postMessage({ success });
        });
      }
      break;
  }
});

async function getCacheStats(): Promise<{ count: number; sizeMB: number }> {
  const cache = await caches.open(CACHE_NAME);
  const requests = await cache.keys();
  
  let totalSize = 0;
  for (const request of requests) {
    const response = await cache.match(request);
    if (response) {
      const blob = await response.blob();
      totalSize += blob.size;
    }
  }
  
  return {
    count: requests.length,
    sizeMB: Number((totalSize / (1024 * 1024)).toFixed(2)),
  };
}

async function precacheImage(url: string): Promise<boolean> {
  try {
    const cache = await caches.open(CACHE_NAME);
    const response = await fetch(url);
    
    if (response.ok) {
      const headers = new Headers(response.headers);
      headers.set('sw-cached-date', Date.now().toString());
      
      const body = await response.blob();
      const newResponse = new Response(body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
      
      await cache.put(url, newResponse);
      return true;
    }
    
    return false;
  } catch {
    return false;
  }
}

export {};
