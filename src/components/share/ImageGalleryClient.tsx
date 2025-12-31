"use client";

import { useState } from "react";
import Image from "next/image";
import { useBlockBodyScroll } from "@/hooks/useBlockBodyScroll";
import { ImagePreviewLightbox } from "@/components/shared/ImagePreviewLightbox";
import type { JournalImage } from "@/types";

// Mapeamento de timeframes para labels em português
const TIMEFRAME_LABELS: Record<string, string> = {
  tfM: "Mensal",
  tfW: "Semanal",
  tfD: "Diário",
  tfH4: "4H",
  tfH1: "1H",
  tfM15: "M15",
  tfM5: "M5",
  tfM3: "M3/M1",
};

interface ImageGalleryClientProps {
  images: JournalImage[];
}

export function ImageGalleryClient({ images }: ImageGalleryClientProps) {
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // Block body scroll when lightbox is open
  useBlockBodyScroll(!!lightboxImage);

  const handleCloseLightbox = () => {
    setLightboxImage(null);
  };

  if (images.length === 0) {
    return null;
  }

  return (
    <>
      <div className="mb-8">
        <h3 className="mb-4 text-xl font-semibold text-gray-200">📸 Análises</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {images.map((img) => (
            <div
              key={img.id}
              className="overflow-hidden rounded-lg border border-gray-700 bg-gray-800/50"
            >
              <div className="border-b border-gray-700 bg-gray-900/50 p-2">
                <span className="text-xs font-medium text-gray-400">
                  {TIMEFRAME_LABELS[img.timeframe] || img.timeframe}
                </span>
              </div>
              <div
                className="relative aspect-video w-full cursor-pointer transition-opacity hover:opacity-90"
                onClick={() => setLightboxImage(img.url)}
              >
                <Image
                  src={img.url}
                  alt={TIMEFRAME_LABELS[img.timeframe] || img.timeframe}
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  loading="lazy"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox for image preview with Zoom */}
      {lightboxImage && (
        <ImagePreviewLightbox
          images={images.map((img) => ({
            url: img.url,
            label: TIMEFRAME_LABELS[img.timeframe] || img.timeframe,
          }))}
          currentIndex={images.findIndex((img) => img.url === lightboxImage)}
          onClose={handleCloseLightbox}
          onNavigate={(index) => setLightboxImage(images[index].url)}
        />
      )}
    </>
  );
}
