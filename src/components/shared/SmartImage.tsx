'use client';

/**
 * SmartImage Component
 * 
 * Uses <picture> element to serve WebP with JPEG fallback.
 * Supports legacy images that don't have WebP versions.
 * 
 * @example
 * <SmartImage
 *   webpSrc="/images/photo.webp"
 *   jpegSrc="/images/photo.jpg"
 *   alt="Photo description"
 * />
 * 
 * // For legacy images
 * <SmartImage
 *   fallbackSrc="/old/image.png"
 *   alt="Legacy photo"
 * />
 */

import { ImgHTMLAttributes, useState } from 'react';

export interface SmartImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  /** WebP source URL (preferred) */
  webpSrc?: string;
  /** JPEG source URL (fallback) */
  jpegSrc?: string;
  /** Fallback source for legacy images without WebP */
  fallbackSrc?: string;
  /** Alt text (required for accessibility) */
  alt: string;
  /** Optional blur placeholder while loading */
  blurDataUrl?: string;
  /** Callback when image loads */
  onImageLoad?: () => void;
  /** Callback when image fails to load */
  onImageError?: () => void;
}

export function SmartImage({
  webpSrc,
  jpegSrc,
  fallbackSrc,
  alt,
  blurDataUrl,
  loading = 'lazy',
  className = '',
  onImageLoad,
  onImageError,
  ...props
}: SmartImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Determine which source to use for the img fallback
  const imgSrc = jpegSrc || webpSrc || fallbackSrc;

  // If no sources provided, don't render
  if (!webpSrc && !jpegSrc && !fallbackSrc) {
    return null;
  }

  // Handle load
  const handleLoad = () => {
    setIsLoaded(true);
    onImageLoad?.();
  };

  // Handle error
  const handleError = () => {
    setHasError(true);
    onImageError?.();
  };

  // Error state - show placeholder
  if (hasError) {
    return (
      <div 
        className={`bg-gray-800 flex items-center justify-center text-gray-500 ${className}`}
        {...props}
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="24" 
          height="24" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="1.5"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
      </div>
    );
  }

  // Legacy image (no WebP/JPEG available)
  if (fallbackSrc && !webpSrc && !jpegSrc) {
    return (
      <div className={`relative ${className}`}>
        {/* Blur placeholder */}
        {blurDataUrl && !isLoaded && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={blurDataUrl}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-cover blur-sm scale-110"
          />
        )}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={fallbackSrc}
          alt={alt}
          loading={loading}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={handleLoad}
          onError={handleError}
          {...props}
        />
      </div>
    );
  }

  // Modern image with WebP + fallback
  return (
    <div className={`relative ${className}`}>
      {/* Blur placeholder */}
      {blurDataUrl && !isLoaded && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={blurDataUrl}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover blur-sm scale-110"
        />
      )}
      <picture>
        {webpSrc && <source srcSet={webpSrc} type="image/webp" />}
        {jpegSrc && <source srcSet={jpegSrc} type="image/jpeg" />}

        <img
          src={imgSrc}
          alt={alt}
          loading={loading}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={handleLoad}
          onError={handleError}
          {...props}
        />
      </picture>
    </div>
  );
}

// ============================================
// Type helpers for image data
// ============================================

export interface JournalImageData {
  /** WebP URL */
  webp?: string;
  /** JPEG URL (fallback) */
  jpeg?: string;
  /** Legacy URL (for old images) */
  legacy?: string;
  /** Low-quality preview dataURL */
  preview?: string;
}

/**
 * Parse image URL/object to SmartImage props
 */
export function parseJournalImage(
  image: string | JournalImageData
): Pick<SmartImageProps, 'webpSrc' | 'jpegSrc' | 'fallbackSrc' | 'blurDataUrl'> {
  // Legacy string URL
  if (typeof image === 'string') {
    return { fallbackSrc: image };
  }
  
  // Modern image data object
  return {
    webpSrc: image.webp,
    jpegSrc: image.jpeg,
    fallbackSrc: image.legacy,
    blurDataUrl: image.preview,
  };
}
