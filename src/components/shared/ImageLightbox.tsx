'use client';

import { createPortal } from 'react-dom';

interface ImageData {
  key: string;
  url: string;
  index: number;
  label: string;
}

interface ImageLightboxProps {
  images: ImageData[];
  currentIndex: number;
  onClose: () => void;
  onNext: (e: React.MouseEvent) => void;
  onPrev: (e: React.MouseEvent) => void;
}

/**
 * Full-screen lightbox component for viewing images with navigation.
 */
export function ImageLightbox({
  images,
  currentIndex,
  onClose,
  onNext,
  onPrev
}: ImageLightboxProps) {
  if (typeof document === 'undefined' || currentIndex < 0 || currentIndex >= images.length) {
    return null;
  }

  const currentImage = images[currentIndex];
  const currentTimeframeImages = images.filter(img => img.key === currentImage.key);
  const currentIndexInTimeframe = currentTimeframeImages.findIndex(
    img => img.index === currentImage.index
  );

  return createPortal(
    <div
      className="fixed inset-0 z-60 bg-linear-to-br from-black/40 to-black/10 backdrop-blur-md flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Close Button */}
      <button
        className="absolute top-4 right-4 text-gray-400 hover:text-white p-2"
        onClick={onClose}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>

      <div className="relative max-w-7xl max-h-[90vh] w-full h-full flex items-center justify-center">
        {/* Navigation Buttons */}
        {images.length > 1 && (
          <>
            <button
              className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors z-50"
              onClick={onPrev}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <button
              className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors z-50"
              onClick={onNext}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </>
        )}

        {/* Image Container */}
        <div className="relative" onClick={e => e.stopPropagation()}>
          {/* Image Info Label */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/60 px-3 py-1 rounded-full text-sm font-medium text-cyan-400 z-10 flex gap-2">
            <span>{currentImage.label}</span>
            {currentTimeframeImages.length > 1 && (
              <span className="text-gray-400">
                ({currentIndexInTimeframe + 1}/{currentTimeframeImages.length})
              </span>
            )}
          </div>

          {/* Main Image */}
          <img
            src={currentImage.url}
            alt="Preview"
            className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
          />
        </div>
      </div>
    </div>,
    document.body
  );
}
