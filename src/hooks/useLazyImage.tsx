/**
 * Lazy Image Loading Hook with Intersection Observer
 * 
 * Provides efficient lazy loading for images using the Intersection Observer API.
 * Only loads images when they enter the viewport, reducing initial page load.
 * 
 * Features:
 * - Deferred loading until element is visible
 * - Optional placeholder while loading
 * - Loading state for UI feedback
 * - Error handling with fallback
 * - Configurable root margin for preloading
 * 
 * @example
 * function ImageComponent({ src }) {
 *   const { ref, isLoaded, isLoading, error, imageSrc } = useLazyImage(src, {
 *     placeholder: '/placeholder.png',
 *     rootMargin: '100px' // Preload 100px before visible
 *   });
 *   
 *   return (
 *     <div ref={ref}>
 *       {isLoading && <Spinner />}
 *       {imageSrc && <img src={imageSrc} />}
 *     </div>
 *   );
 * }
 */

import { useRef, useState, useEffect, useCallback } from 'react';

// ============================================
// Types
// ============================================

export interface LazyImageOptions {
  /** Placeholder image to show before loading (default: none) */
  placeholder?: string;
  /** Root margin for Intersection Observer (default: '50px') */
  rootMargin?: string;
  /** Threshold for triggering load (default: 0.1) */
  threshold?: number;
  /** Skip lazy loading and load immediately (default: false) */
  eager?: boolean;
  /** Callback when image loads successfully */
  onLoad?: () => void;
  /** Callback when image fails to load */
  onError?: (error: Error) => void;
}

export interface LazyImageReturn {
  /** Ref to attach to the container element */
  ref: React.RefObject<HTMLDivElement | null>;
  /** Current image source (placeholder or actual) */
  imageSrc: string | null;
  /** Whether the image has fully loaded */
  isLoaded: boolean;
  /** Whether the image is currently loading */
  isLoading: boolean;
  /** Whether the element is in the viewport */
  isInView: boolean;
  /** Error if loading failed */
  error: Error | null;
  /** Manually trigger load */
  load: () => void;
}

// ============================================
// Hook Implementation
// ============================================

export function useLazyImage(
  src: string | null | undefined,
  options: LazyImageOptions = {}
): LazyImageReturn {
  const {
    placeholder,
    rootMargin = '50px',
    threshold = 0.1,
    eager = false,
    onLoad,
    onError,
  } = options;

  const ref = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(placeholder || null);

  // Load the image
  const load = useCallback(() => {
    if (!src || isLoading || isLoaded) return;

    setIsLoading(true);
    setError(null);

    const img = new Image();
    
    img.onload = () => {
      setImageSrc(src);
      setIsLoaded(true);
      setIsLoading(false);
      onLoad?.();
    };

    img.onerror = () => {
      const err = new Error(`Failed to load image: ${src}`);
      setError(err);
      setIsLoading(false);
      onError?.(err);
    };

    img.src = src;
  }, [src, isLoading, isLoaded, onLoad, onError]);

  // Set up Intersection Observer
  useEffect(() => {
    if (eager) {
      setIsInView(true);
      load();
      return;
    }

    if (!ref.current || typeof IntersectionObserver === 'undefined') {
      // Fallback for environments without Intersection Observer
      setIsInView(true);
      load();
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      { rootMargin, threshold }
    );

    observer.observe(ref.current);

    return () => {
      observer.disconnect();
    };
  }, [eager, load, rootMargin, threshold]);

  // Trigger load when in view
  useEffect(() => {
    if (isInView && src && !isLoaded && !isLoading) {
      load();
    }
  }, [isInView, src, isLoaded, isLoading, load]);

  return {
    ref,
    imageSrc,
    isLoaded,
    isLoading,
    isInView,
    error,
    load,
  };
}

// ============================================
// Component Wrapper (Optional)
// ============================================

export interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholder?: string;
  rootMargin?: string;
  onLoad?: () => void;
  onError?: (error: Error) => void;
}

/**
 * Pre-built LazyImage component using the hook
 */
export function LazyImage({
  src,
  alt,
  className = '',
  placeholder,
  rootMargin,
  onLoad,
  onError,
}: LazyImageProps) {
  const { ref, imageSrc, isLoading, isLoaded } = useLazyImage(src, {
    placeholder,
    rootMargin,
    onLoad,
    onError,
  });

  return (
    <div ref={ref as React.RefObject<HTMLDivElement>} className={`lazy-image-container ${className}`}>
      {isLoading && (
        <div className="lazy-image-loading absolute inset-0 flex items-center justify-center bg-gray-900/50">
          <div className="animate-spin w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full" />
        </div>
      )}
      {imageSrc && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageSrc}
          alt={alt}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          loading="lazy"
        />
      )}
    </div>
  );
}
