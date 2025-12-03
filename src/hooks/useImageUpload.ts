import { useState, useCallback } from 'react';

export interface UseImageUploadReturn {
  images: Record<string, string[]>;
  handlePasteImage: (e: React.ClipboardEvent<HTMLDivElement>, timeframe: string) => Promise<void>;
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>, timeframe: string) => void;
  removeLastImage: (timeframe: string) => void;
  setImages: React.Dispatch<React.SetStateAction<Record<string, string[]>>>;
}

/**
 * Custom hook for managing image uploads in journal entries.
 * Supports both paste (CTRL+V) and file selection.
 * 
 * @param initialImages - Initial images state (optional)
 * @returns Image upload utilities
 */
export function useImageUpload(
  initialImages: Record<string, string[]> = {}
): UseImageUploadReturn {
  const [images, setImages] = useState<Record<string, string[]>>(initialImages);

  const handlePasteImage = useCallback(async (
    e: React.ClipboardEvent<HTMLDivElement>,
    timeframe: string
  ) => {
    const items = e.clipboardData.items;
    
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const blob = items[i].getAsFile();
        if (blob) {
          const reader = new FileReader();
          reader.onload = (event) => {
            const base64 = event.target?.result as string;
            setImages(prev => ({ 
              ...prev, 
              [timeframe]: [...(prev[timeframe] || []), base64] 
            }));
          };
          reader.readAsDataURL(blob);
        }
      }
    }
  }, []);

  const handleFileSelect = useCallback((
    e: React.ChangeEvent<HTMLInputElement>,
    timeframe: string
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (result) {
          setImages(prev => ({
            ...prev,
            [timeframe]: [...(prev[timeframe] || []), result]
          }));
        }
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const removeLastImage = useCallback((timeframe: string) => {
    setImages(prev => ({ 
      ...prev, 
      [timeframe]: (prev[timeframe] || []).slice(0, -1)
    }));
  }, []);

  return {
    images,
    handlePasteImage,
    handleFileSelect,
    removeLastImage,
    setImages
  };
}
