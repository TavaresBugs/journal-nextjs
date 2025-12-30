"use client";

import React, { memo, useRef, useCallback } from "react";
import { IconActionButton } from "@/components/ui";

interface RecapImageUploaderProps {
  previews: string[];
  carouselIndex: number;
  onCarouselIndexChange: (index: number) => void;
  onAddFiles: (files: File[]) => void;
  onRemoveImage: (index: number) => void;
}

export const RecapImageUploader = memo(function RecapImageUploader({
  previews,
  carouselIndex,
  onCarouselIndexChange,
  onAddFiles,
  onRemoveImage,
}: RecapImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadZoneRef = useRef<HTMLDivElement>(null);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (files.length > 0) {
        onAddFiles(files);
      }
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    [onAddFiles]
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      const imageFiles: File[] = [];
      for (const item of items) {
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) imageFiles.push(file);
        }
      }

      if (imageFiles.length > 0) {
        e.preventDefault();
        onAddFiles(imageFiles);
      }
    },
    [onAddFiles]
  );

  const handlePrevious = () => {
    onCarouselIndexChange(carouselIndex > 0 ? carouselIndex - 1 : previews.length - 1);
  };

  const handleNext = () => {
    onCarouselIndexChange(carouselIndex < previews.length - 1 ? carouselIndex + 1 : 0);
  };

  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-gray-300">Screenshots</label>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />

      <div
        ref={uploadZoneRef}
        tabIndex={0}
        onClick={() => uploadZoneRef.current?.focus()}
        onPaste={handlePaste}
        className="group relative aspect-video w-full cursor-pointer overflow-hidden rounded-xl border-2 border-dashed border-gray-700 bg-gray-900/50 transition-all outline-none hover:border-cyan-500/50 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/30"
      >
        {previews.length > 0 ? (
          <>
            {/* Main Image Display */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previews[carouselIndex]}
              alt={`Screenshot ${carouselIndex + 1}`}
              className="h-full w-full object-cover"
            />

            {/* Image Counter Badge */}
            <div className="absolute top-3 left-3 rounded bg-black/70 px-2 py-1 text-xs font-medium text-cyan-400">
              {carouselIndex + 1} / {previews.length}
            </div>

            {/* Delete Current Image Button */}
            <IconActionButton
              variant="delete"
              onClick={(e) => {
                e.stopPropagation();
                onRemoveImage(carouselIndex);
              }}
              className="absolute top-3 right-3 bg-black/50 opacity-0 group-hover:opacity-100 hover:bg-black/80"
            />

            {/* Carousel Navigation */}
            {previews.length > 1 && (
              <>
                <IconActionButton
                  variant="back"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePrevious();
                  }}
                  className="absolute top-1/2 left-3 -translate-y-1/2 bg-black/50 opacity-0 group-hover:opacity-100 hover:bg-black/80"
                />
                <IconActionButton
                  variant="next"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNext();
                  }}
                  className="absolute top-1/2 right-3 -translate-y-1/2 bg-black/50 opacity-0 group-hover:opacity-100 hover:bg-black/80"
                />
              </>
            )}

            {/* Bottom Controls */}
            <div className="absolute right-3 bottom-3 left-3 flex items-end justify-between opacity-0 transition-opacity group-hover:opacity-100">
              <span className="rounded bg-cyan-500/20 px-2 py-1 text-[10px] font-bold text-cyan-400">
                CTRL+V
              </span>
              <IconActionButton
                variant="add"
                title="Adicionar mais imagens"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                className="bg-cyan-500 text-white hover:bg-cyan-400 hover:text-white"
              />
            </div>

            {/* Thumbnail Strip */}
            {previews.length > 1 && (
              <div className="absolute right-3 bottom-14 left-3 flex justify-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                {previews.map((preview, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onCarouselIndexChange(index);
                    }}
                    className={`h-10 w-10 overflow-hidden rounded-lg border-2 transition-all ${
                      index === carouselIndex
                        ? "border-cyan-500 ring-2 ring-cyan-500/50"
                        : "border-white/30 hover:border-white/60"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={preview}
                      alt={`Thumb ${index + 1}`}
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </>
        ) : (
          /* Empty State */
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <svg
              className="mb-3 h-10 w-10 text-gray-600 group-hover:text-gray-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p className="mb-1 text-sm text-gray-500">Clique ou cole uma imagem</p>

            {/* Controls visible on hover/focus */}
            <div className="absolute bottom-3 flex w-full items-end justify-between px-3 opacity-0 transition-opacity group-hover:opacity-100 group-focus:opacity-100">
              <span className="rounded bg-cyan-500/20 px-2 py-1 text-[10px] font-bold text-cyan-400">
                CTRL+V
              </span>
              <IconActionButton
                variant="add"
                title="Upload Imagem"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                className="bg-cyan-500 text-white hover:bg-cyan-400 hover:text-white"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
});
