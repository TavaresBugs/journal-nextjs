"use client";

import { memo } from "react";

import { ImageUploadZone } from "./ImageUploadZone";

interface Timeframe {
  key: string;
  label: string;
}

interface TimeframeImageGridProps {
  timeframes: readonly Timeframe[];
  images: Record<string, string[]>;
  onPaste: (e: React.ClipboardEvent<HTMLDivElement>, timeframe: string) => void;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>, timeframe: string) => void;
  onRemoveImage: (timeframe: string) => void;
}

/**
 * Grid component for displaying multiple timeframe image upload zones.
 * Memoized to prevent unnecessary re-renders
 */
const TimeframeImageGridComponent = ({
  timeframes,
  images,
  onPaste,
  onFileSelect,
  onRemoveImage,
}: TimeframeImageGridProps) => {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {timeframes.map((tf) => (
        <ImageUploadZone
          key={tf.key}
          timeframe={tf}
          images={images[tf.key] || []}
          onPaste={(e) => onPaste(e, tf.key)}
          onFileSelect={(e) => onFileSelect(e, tf.key)}
          onRemove={() => onRemoveImage(tf.key)}
          onAddMore={() => {
            document.getElementById(`file-input-${tf.key}`)?.click();
          }}
        />
      ))}
    </div>
  );
};

export const TimeframeImageGrid = memo(TimeframeImageGridComponent);
