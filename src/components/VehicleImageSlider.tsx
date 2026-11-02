import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Maximize2, X, Image as ImageIcon } from 'lucide-react';

interface VehicleImageSliderProps {
  images: string[];
  alt?: string;
  aspectRatio?: '16/10' | '16/9' | '4/3' | 'square' | 'auto';
  className?: string;
  showThumbnails?: boolean;
  showControls?: boolean;
  showCounter?: boolean;
  showDots?: boolean;
  allowFullscreen?: boolean;
  onImageClick?: (index: number) => void;
  overlayBadge?: React.ReactNode;
  initialIndex?: number;
}

export const VehicleImageSlider: React.FC<VehicleImageSliderProps> = ({
  images: rawImages,
  alt = 'Vehicle',
  aspectRatio = '16/10',
  className = '',
  showThumbnails = false,
  showControls = true,
  showCounter = true,
  showDots = true,
  allowFullscreen = false,
  onImageClick,
  overlayBadge,
  initialIndex = 0,
}) => {
  // Ensure valid, strictly deduplicated images array with at least one image
  const uniqueImages = Array.from(
    new Set(
      (rawImages || [])
        .filter((src): src is string => typeof src === 'string' && src.trim().length > 0)
        .map((s) => s.trim())
    )
  );

  const images = uniqueImages.length > 0
    ? uniqueImages
    : ['https://images.unsplash.com/photo-1541348263662-e0c8de4259ba?auto=format&fit=crop&w=1200&q=85'];

  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Sync index if images change or initialIndex changes
  useEffect(() => {
    if (currentIndex >= images.length) {
      setCurrentIndex(0);
    }
  }, [images, currentIndex]);

  const goToPrev = useCallback(
    (e?: React.MouseEvent) => {
      if (e) {
        e.stopPropagation();
        e.preventDefault();
      }
      setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    },
    [images.length]
  );

  const goToNext = useCallback(
    (e?: React.MouseEvent) => {
      if (e) {
        e.stopPropagation();
        e.preventDefault();
      }
      setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    },
    [images.length]
  );

  const goToIndex = (index: number, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    setCurrentIndex(index);
  };

  // Keyboard navigation when in fullscreen
  useEffect(() => {
    if (!isFullscreen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goToPrev();
      if (e.key === 'ArrowRight') goToNext();
      if (e.key === 'Escape') setIsFullscreen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen, goToPrev, goToNext]);

  // Touch handlers for swipe sliding
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const minSwipeDistance = 45;
    if (distance > minSwipeDistance) {
      goToNext();
    } else if (distance < -minSwipeDistance) {
      goToPrev();
    }
    setTouchStart(null);
    setTouchEnd(null);
  };

  const aspectClass =
    aspectRatio === '16/10'
      ? 'aspect-[16/10]'
      : aspectRatio === '16/9'
      ? 'aspect-[16/9]'
      : aspectRatio === '4/3'
      ? 'aspect-[4/3]'
      : aspectRatio === 'square'
      ? 'aspect-square'
      : '';

  return (
    <div className={`relative flex flex-col select-none ${className}`}>
      {/* Main Slider Viewport */}
      <div
        className={`relative w-full ${aspectClass} overflow-hidden bg-[#0A0C10] group rounded-lg`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Sliding Track */}
        <div
          className="flex w-full h-full transition-transform duration-300 ease-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {images.map((src, idx) => (
            <div
              key={idx}
              className="w-full h-full flex-shrink-0 relative cursor-pointer"
              onClick={() => (onImageClick ? onImageClick(idx) : allowFullscreen && setIsFullscreen(true))}
            >
              <img
                src={src}
                alt={`${alt} - Frame ${idx + 1}`}
                className="w-full h-full object-cover object-center pointer-events-none"
                loading={idx === 0 ? 'eager' : 'lazy'}
                referrerPolicy="no-referrer"
                onError={(e) => {
                  // Fallback to stylized dark performance car placeholder
                  (e.target as HTMLImageElement).src =
                    'https://images.unsplash.com/photo-1541348263662-e0c8de4259ba?auto=format&fit=crop&w=1200&q=85';
                }}
              />
            </div>
          ))}
        </div>

        {/* Overlay Badges (if provided) */}
        {overlayBadge && <div className="pointer-events-none absolute inset-0 z-10">{overlayBadge}</div>}

        {/* Slide Counter Badge */}
        {showCounter && images.length > 1 && (
          <div className="absolute top-2.5 right-2.5 z-20 flex items-center gap-1.5 bg-black/75 backdrop-blur-md border border-white/10 px-2 py-0.5 rounded text-[10px] font-mono text-[#ECE5D8]">
            <ImageIcon className="w-3 h-3 text-[#E5252A]" />
            <span>
              {currentIndex + 1} / {images.length}
            </span>
          </div>
        )}

        {/* Fullscreen Expand Button */}
        {allowFullscreen && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsFullscreen(true);
            }}
            className="absolute bottom-2.5 right-2.5 z-20 p-1.5 rounded bg-black/70 hover:bg-[#E5252A] text-white/80 hover:text-white border border-white/10 backdrop-blur-md transition-colors cursor-pointer"
            title="Expand Fullscreen Gallery"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Left Chevron Button */}
        {showControls && images.length > 1 && (
          <button
            type="button"
            onClick={goToPrev}
            aria-label="Previous Slide"
            className={`absolute left-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/75 hover:bg-[#E5252A] text-white border border-white/15 flex items-center justify-center backdrop-blur-md shadow-lg transition-all duration-200 cursor-pointer ${
              isHovered ? 'opacity-100 scale-100' : 'opacity-0 sm:opacity-75 scale-90'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}

        {/* Right Chevron Button */}
        {showControls && images.length > 1 && (
          <button
            type="button"
            onClick={goToNext}
            aria-label="Next Slide"
            className={`absolute right-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/75 hover:bg-[#E5252A] text-white border border-white/15 flex items-center justify-center backdrop-blur-md shadow-lg transition-all duration-200 cursor-pointer ${
              isHovered ? 'opacity-100 scale-100' : 'opacity-0 sm:opacity-75 scale-90'
            }`}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}

        {/* Interactive Indicator Dots */}
        {showDots && images.length > 1 && (
          <div className="absolute bottom-2.5 inset-x-0 z-20 flex items-center justify-center gap-1.5 pointer-events-auto">
            <div className="flex items-center gap-1 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-full border border-white/10">
              {images.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={(e) => goToIndex(i, e)}
                  aria-label={`Go to slide ${i + 1}`}
                  className={`h-1.5 transition-all rounded-full cursor-pointer ${
                    currentIndex === i
                      ? 'w-5 bg-[#E5252A]'
                      : 'w-1.5 bg-white/40 hover:bg-white/80'
                  }`}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Optional Thumbnail Strip (e.g. for Detail Modal) */}
      {showThumbnails && images.length > 1 && (
        <div className="flex items-center gap-2 mt-2.5 overflow-x-auto pb-1 scrollbar-thin">
          {images.map((src, i) => (
            <button
              key={i}
              type="button"
              onClick={(e) => goToIndex(i, e)}
              className={`relative flex-shrink-0 w-16 sm:w-20 aspect-[16/10] rounded overflow-hidden border-2 transition-all cursor-pointer ${
                currentIndex === i
                  ? 'border-[#E5252A] ring-2 ring-[#E5252A]/30 scale-[1.02]'
                  : 'border-white/10 opacity-60 hover:opacity-100'
              }`}
            >
              <img
                src={src}
                alt={`Thumbnail ${i + 1}`}
                className="w-full h-full object-cover"
                loading="lazy"
                referrerPolicy="no-referrer"
              />
              <span className="absolute bottom-0.5 right-0.5 text-[8px] font-mono bg-black/80 px-1 rounded text-[#ECE5D8]">
                {i + 1}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Fullscreen Modal View */}
      {isFullscreen && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex flex-col p-4 sm:p-8 animate-in fade-in duration-200">
          {/* Top Bar */}
          <div className="flex items-center justify-between text-[#ECE5D8] pb-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <span className="font-display font-bold text-lg text-white">{alt}</span>
              <span className="text-xs font-mono text-[#94A3B8] bg-white/[0.08] px-2 py-0.5 rounded">
                SLIDE {currentIndex + 1} OF {images.length}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsFullscreen(false)}
              className="p-2 text-[#94A3B8] hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Large Image Frame */}
          <div className="relative flex-1 flex items-center justify-center my-4 overflow-hidden">
            <img
              src={images[currentIndex]}
              alt={`${alt} Fullscreen`}
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl transition-all duration-300"
              referrerPolicy="no-referrer"
            />

            {/* Left Button */}
            {images.length > 1 && (
              <button
                type="button"
                onClick={goToPrev}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/80 hover:bg-[#E5252A] text-white border border-white/20 flex items-center justify-center transition-all cursor-pointer"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}

            {/* Right Button */}
            {images.length > 1 && (
              <button
                type="button"
                onClick={goToNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/80 hover:bg-[#E5252A] text-white border border-white/20 flex items-center justify-center transition-all cursor-pointer"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}
          </div>

          {/* Bottom Thumbnails */}
          <div className="flex items-center justify-center gap-2 overflow-x-auto py-2">
            {images.map((src, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setCurrentIndex(i)}
                className={`relative w-20 aspect-[16/10] rounded overflow-hidden border-2 transition-all cursor-pointer ${
                  currentIndex === i ? 'border-[#E5252A] scale-105' : 'border-white/10 opacity-50 hover:opacity-100'
                }`}
              >
                <img src={src} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
