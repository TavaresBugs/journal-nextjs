"use client";

import { createPortal } from "react-dom";
import Image from "next/image";
import { useBlockBodyScroll } from "@/hooks/useBlockBodyScroll";

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
  onPrev,
}: ImageLightboxProps) {
  const isOpen = currentIndex >= 0 && currentIndex < images.length;
  useBlockBodyScroll(isOpen);

  if (typeof document === "undefined" || !isOpen) {
    return null;
  }

  const currentImage = images[currentIndex];
  const currentTimeframeImages = images.filter((img) => img.key === currentImage.key);
  const currentIndexInTimeframe = currentTimeframeImages.findIndex(
    (img) => img.index === currentImage.index
  );

  return createPortal(
    <div
      className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      {/* Close Button */}
      <button
        className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white"
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

      <div className="relative flex h-full max-h-[90vh] w-full max-w-7xl items-center justify-center">
        {/* Navigation Buttons */}
        {images.length > 1 && (
          <>
            <button
              className="absolute top-1/2 left-4 z-50 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-black/70"
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
              className="absolute top-1/2 right-4 z-50 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-black/70"
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
        <div className="relative" onClick={(e) => e.stopPropagation()}>
          {/* Image Info Label */}
          <div className="absolute top-4 left-1/2 z-10 flex -translate-x-1/2 gap-2 rounded-full bg-black/60 px-3 py-1 text-sm font-medium text-cyan-400">
            <span>{currentImage.label}</span>
            {currentTimeframeImages.length > 1 && (
              <span className="text-gray-400">
                ({currentIndexInTimeframe + 1}/{currentTimeframeImages.length})
              </span>
            )}
          </div>

          {/* Main Image */}
          <div className="relative h-[85vh] w-full">
            <Image
              src={currentImage.url}
              alt="Preview"
              fill
              className="rounded-lg object-contain shadow-2xl"
              quality={100}
            />
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
