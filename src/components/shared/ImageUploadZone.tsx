"use client";

import React, { memo, useRef, useCallback } from "react";

interface ImageUploadZoneProps {
  timeframe: { key: string; label: string };
  images: string[];
  onPaste: (e: React.ClipboardEvent<HTMLDivElement>, timeframeKey: string) => void;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>, timeframeKey: string) => void;
  onRemove: (timeframeKey: string) => void;
  onAddMore?: (timeframeKey: string) => void;
}

/**
 * Component for uploading and displaying images for a specific timeframe.
 * Supports both paste (CTRL+V) and file selection.
 * Memoized to prevent unnecessary re-renders
 */
const ImageUploadZoneComponent = ({
  timeframe,
  images,
  onPaste,
  onFileSelect,
  onRemove,
  onAddMore,
}: ImageUploadZoneProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Stable callback references using currying with useCallback
  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLDivElement>) => {
      e.stopPropagation();
      onPaste(e, timeframe.key);
    },
    [onPaste, timeframe.key]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onFileSelect(e, timeframe.key);
    },
    [onFileSelect, timeframe.key]
  );

  const handleRemove = useCallback(() => {
    onRemove(timeframe.key);
  }, [onRemove, timeframe.key]);

  const triggerFileInput = useCallback(() => {
    document.getElementById(`file-input-${timeframe.key}`)?.click();
  }, [timeframe.key]);

  const handleContainerClick = useCallback(() => {
    // Give focus to the container so paste works
    containerRef.current?.focus();
  }, []);

  return (
    <div
      ref={containerRef}
      className="group relative aspect-video cursor-pointer overflow-hidden rounded-xl border-2 border-dashed border-gray-700 bg-gray-900/50 transition-all duration-200 hover:border-cyan-500/50 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500"
      onPaste={handlePaste}
      onClick={handleContainerClick}
      tabIndex={0}
    >
      <input
        type="file"
        id={`file-input-${timeframe.key}`}
        className="hidden"
        accept="image/*"
        onChange={handleFileSelect}
      />

      <div className="absolute top-2 left-2 z-10 rounded bg-black/60 px-2 py-0.5 text-[10px] font-medium text-cyan-400">
        {timeframe.label} {images.length > 0 && `(${images.length})`}
      </div>

      {images.length > 0 ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={images[images.length - 1]}
            alt={timeframe.label}
            className="h-full w-full object-cover"
            loading="lazy"
          />

          {/* Delete Button - Removes last image */}
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-2 right-2 z-20 rounded bg-red-500/80 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-600"
            title="Remover última imagem"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>

          {/* Add Button Overlay */}
          {onAddMore && (
            <div className="absolute right-3 bottom-3 left-3 z-20 flex items-end justify-between opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
              <span className="rounded bg-cyan-500/20 px-2 py-1 text-[10px] font-bold text-cyan-400">
                CTRL+V
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  triggerFileInput();
                }}
                className="rounded-lg bg-cyan-500 p-2 text-white shadow-lg transition-colors hover:bg-cyan-400"
                title="Adicionar outra imagem"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="mb-2 text-2xl text-gray-600 group-hover:text-gray-500">+</span>

          {/* Controls that appear on hover/focus */}
          <div className="absolute bottom-3 flex w-full items-end justify-between px-3 opacity-0 transition-opacity group-hover:opacity-100 group-focus:opacity-100">
            <span className="rounded bg-cyan-500/20 px-2 py-1 text-[10px] font-bold text-cyan-400">
              CTRL+V
            </span>
            <button
              type="button"
              onClick={triggerFileInput}
              className="rounded-lg bg-cyan-500 p-2 text-white shadow-lg transition-colors hover:bg-cyan-400"
              title="Upload Imagem"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export const ImageUploadZone = memo(ImageUploadZoneComponent);
