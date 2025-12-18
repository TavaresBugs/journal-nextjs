import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { useBlockBodyScroll } from '@/hooks/useBlockBodyScroll';
import { Button, IconActionButton } from '@/components/ui';

export interface ImageItem {
  url: string;
  label?: string;
}

interface ImagePreviewLightboxProps {
  images: ImageItem[];
  currentIndex: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

/**
 * Reusable image preview lightbox with zoom/pan controls.
 * Used by Journal and Recap image previews.
 */
export function ImagePreviewLightbox({
  images,
  currentIndex,
  onClose,
  onNavigate,
}: ImagePreviewLightboxProps) {
  const [showZoomHint, setShowZoomHint] = useState(true);

  // Block body scroll when lightbox is open
  useBlockBodyScroll(true);

  // Auto-hide zoom hint after 3 seconds
  useEffect(() => {
    if (showZoomHint) {
      const timer = setTimeout(() => setShowZoomHint(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showZoomHint]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
        if (e.key === 'ArrowLeft') handlePrev(e as any);
        if (e.key === 'ArrowRight') handleNext(e as any);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, images.length, onClose, onNavigate]);

  const currentImage = images[currentIndex];
  if (!currentImage) return null;

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newIndex = currentIndex > 0 ? currentIndex - 1 : images.length - 1;
    onNavigate(newIndex);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newIndex = currentIndex < images.length - 1 ? currentIndex + 1 : 0;
    onNavigate(newIndex);
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-200 bg-black/90 backdrop-blur-sm flex items-center justify-center transition-opacity duration-300"
      onClick={onClose}
    >
      {/* Close Button */}
      <IconActionButton
        variant="close"
        size="lg"
        className="absolute top-4 right-4 z-50 text-gray-200"
        onClick={onClose}
      />

      {/* Image Label */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/70 px-4 py-2 rounded-full text-sm font-medium text-cyan-400 z-50 flex gap-2 pointer-events-none">
        <span>{currentImage.label || `Screenshot ${currentIndex + 1}`}</span>
        {images.length > 1 && (
          <span className="text-gray-400">
            ({currentIndex + 1}/{images.length})
          </span>
        )}
      </div>

      {/* Navigation Arrows */}
      {images.length > 1 && (
        <>
            <IconActionButton
                variant="back"
                size="lg"
                className="absolute left-4 top-1/2 -translate-y-1/2 z-50 text-gray-200"
                onClick={handlePrev}
            />
            <IconActionButton
                variant="next"
                size="lg"
                className="absolute right-4 top-1/2 -translate-y-1/2 z-50 text-gray-200"
                onClick={handleNext}
            />
        </>
      )}

      {/* Zoomable Image Container */}
      <div 
        className="absolute inset-0 flex items-center justify-center"
        onClick={e => e.stopPropagation()}
      >
        <TransformWrapper
          key={currentImage.url} // Reset zoom when image changes
          initialScale={1}
          minScale={0.5}
          maxScale={4}
          doubleClick={{ mode: 'reset' }} // Built-in reset on double-click
          wheel={{ step: 0.1 }}
          panning={{ 
            disabled: false,
            velocityDisabled: true,
          }}
          limitToBounds={false}
          centerOnInit={true}
          centerZoomedOut={true}
          onTransformed={(_, state) => {
            const indicator = document.getElementById('lightbox-zoom-indicator');
            if (indicator) {
              indicator.textContent = `${Math.round(state.scale * 100)}%`;
              indicator.className = `text-sm min-w-14 text-center font-mono ${
                state.scale < 0.99 ? 'text-yellow-300' : state.scale > 1.01 ? 'text-green-300' : 'text-white'
              }`;
            }
          }}
        >
          {({ zoomIn, zoomOut, resetTransform, instance }) => {
            const scale = instance.transformState.scale;
            
            return (
            <>
              <TransformComponent
                wrapperStyle={{
                  width: '100%',
                  height: '100%',
                }}
                contentStyle={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={currentImage.url}
                  alt="Preview"
                  style={{ 
                    maxWidth: '90vw',
                    maxHeight: '85vh',
                    objectFit: 'contain',
                    borderRadius: '0.5rem',
                    userSelect: 'none',
                    WebkitUserDrag: 'none',
                    touchAction: 'none',
                    cursor: scale > 1 ? 'grab' : 'zoom-in',
                  } as React.CSSProperties}
                  draggable={false}
                />
              </TransformComponent>
              
              {/* Zoom Controls */}
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/70 rounded-full px-4 py-2 backdrop-blur-sm z-50">
                {/* Reset Button */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => resetTransform()} 
                  className="text-white w-8 h-8 hover:bg-white/10 rounded-full transition-colors"
                  aria-label="Resetar para 100%"
                  title="Resetar zoom (100%)"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </Button>
                
                <div className="w-px h-5 bg-white/20" />
                
                {/* Zoom Out */}
                <Button 
                    variant="ghost"
                    size="icon"
                  onClick={() => zoomOut(0.25)} 
                  className="text-white w-8 h-8 hover:bg-white/10 rounded-full transition-colors"
                  aria-label="Diminuir zoom"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </Button>
                
                {/* Percentage Indicator */}
                <span 
                  id="lightbox-zoom-indicator"
                  className="text-sm min-w-14 text-center font-mono text-white"
                >
                  {Math.round(scale * 100)}%
                </span>
                
                {/* Zoom In */}
                <Button 
                    variant="ghost"
                    size="icon"
                  onClick={() => zoomIn(0.25)} 
                  className="text-white w-8 h-8 hover:bg-white/10 rounded-full transition-colors"
                  aria-label="Aumentar zoom"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </Button>
              </div>
              
              {/* Mobile Zoom Hint */}
              {showZoomHint && (
                <div className="absolute top-20 left-1/2 -translate-x-1/2 text-xs text-white/80 bg-black/60 px-4 py-2 rounded-full md:hidden z-50 flex items-center gap-2 animate-pulse pointer-events-none">
                  <span>👆</span>
                  Clique para zoom • Duplo clique para reset
                </div>
              )}
            </>
          );}}
        </TransformWrapper>
      </div>
    </div>,
    document.body
  );
}
