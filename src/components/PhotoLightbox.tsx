import { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';

interface PhotoLightboxProps {
  images: string[];
  initialIndex?: number;
  isOpen: boolean;
  onClose: () => void;
}

export function PhotoLightbox({ images, initialIndex = 0, isOpen, onClose }: PhotoLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex, isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        handlePrevious();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, currentIndex]);

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  };

  if (!isOpen || images.length === 0) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90"
      onClick={onClose}
    >
      <div className="relative max-w-7xl max-h-[95vh] w-full h-full flex items-center justify-center p-4">
        {/* Close Button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 z-10 text-white hover:bg-white/20"
          onClick={onClose}
        >
          <X className="size-6" />
        </Button>

        {/* Previous Button */}
        {images.length > 1 && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-4 z-10 text-white hover:bg-white/20"
            onClick={(e) => {
              e.stopPropagation();
              handlePrevious();
            }}
          >
            <ChevronLeft className="size-8" />
          </Button>
        )}

        {/* Image */}
        <div
          className="relative max-w-full max-h-full"
          onClick={(e) => e.stopPropagation()}
        >
          <img
            src={images[currentIndex]}
            alt={`Photo ${currentIndex + 1} of ${images.length}`}
            className="max-w-full max-h-[95vh] object-contain rounded-lg"
          />
        </div>

        {/* Next Button */}
        {images.length > 1 && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 z-10 text-white hover:bg-white/20"
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
          >
            <ChevronRight className="size-8" />
          </Button>
        )}

        {/* Image Counter */}
        {images.length > 1 && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-4 py-2 rounded-full text-sm">
            {currentIndex + 1} / {images.length}
          </div>
        )}

        {/* Thumbnail Strip */}
        {images.length > 1 && (
          <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 flex gap-2 max-w-full overflow-x-auto px-4">
            {images.map((img, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex(index);
                }}
                className={`flex-shrink-0 w-16 h-16 rounded overflow-hidden border-2 transition-all ${
                  index === currentIndex
                    ? 'border-white scale-110'
                    : 'border-transparent opacity-60 hover:opacity-100'
                }`}
              >
                <img
                  src={img}
                  alt={`Thumbnail ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

