'use client';

import React, { memo, useRef } from 'react';

interface ImageUploadZoneProps {
  timeframe: { key: string; label: string };
  images: string[];
  onPaste: (e: React.ClipboardEvent<HTMLDivElement>) => void;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: () => void;
  onAddMore?: () => void;
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
  onAddMore
}: ImageUploadZoneProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const triggerFileInput = () => {
    document.getElementById(`file-input-${timeframe.key}`)?.click();
  };

  const handleContainerClick = () => {
    // Give focus to the container so paste works
    containerRef.current?.focus();
  };

  return (
    <div
      ref={containerRef}
      className="aspect-video bg-gray-900/50 border-2 border-dashed border-gray-700 hover:border-cyan-500/50 rounded-xl relative group overflow-hidden transition-all duration-200 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 cursor-pointer"
      onPaste={(e) => {
        e.stopPropagation();
        onPaste(e);
      }}
      onClick={handleContainerClick}
      tabIndex={0}
    >
      <input
        type="file"
        id={`file-input-${timeframe.key}`}
        className="hidden"
        accept="image/*"
        onChange={onFileSelect}
      />

      <div className="absolute top-2 left-2 bg-black/60 px-2 py-0.5 rounded text-[10px] font-medium text-cyan-400 z-10">
        {timeframe.label} {images.length > 0 && `(${images.length})`}
      </div>

      {images.length > 0 ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={images[images.length - 1]}
            alt={timeframe.label}
            className="w-full h-full object-cover"
          />

          {/* Delete Button - Removes last image */}
          <button
            type="button"
            onClick={onRemove}
            className="absolute top-2 right-2 p-1 bg-red-500/80 rounded hover:bg-red-600 text-white opacity-0 group-hover:opacity-100 transition-opacity z-20"
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
            <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity z-20">
              <span className="bg-cyan-500/20 text-cyan-400 text-[10px] font-bold px-2 py-1 rounded">
                CTRL+V
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  triggerFileInput();
                }}
                className="bg-cyan-500 hover:bg-cyan-400 text-white p-2 rounded-lg shadow-lg transition-colors"
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
          <span className="text-2xl text-gray-600 group-hover:text-gray-500 mb-2">
            +
          </span>

          {/* Controls that appear on hover/focus */}
          <div className="absolute bottom-3 w-full px-3 flex justify-between items-end opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity">
            <span className="bg-cyan-500/20 text-cyan-400 text-[10px] font-bold px-2 py-1 rounded">
              CTRL+V
            </span>
            <button
              type="button"
              onClick={triggerFileInput}
              className="bg-cyan-500 hover:bg-cyan-400 text-white p-2 rounded-lg shadow-lg transition-colors"
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
