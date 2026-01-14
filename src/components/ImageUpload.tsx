import { useState, useRef } from 'react';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

interface ImageUploadProps {
  onImagesChange: (images: string[]) => void; // Array of base64 strings
  maxImages?: number;
  maxSizeMB?: number;
}

export function ImageUpload({ onImagesChange, maxImages = 5, maxSizeMB = 5 }: ImageUploadProps) {
  const [images, setImages] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setError(null);

    const filesArray = Array.from(files);
    const remainingSlots = maxImages - images.length;
    
    // Check if adding these files would exceed maxImages
    if (filesArray.length > remainingSlots) {
      setError(`Maximum ${maxImages} images allowed. You can add ${remainingSlots} more image(s).`);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    const validFiles: File[] = [];
    const errors: string[] = [];

    // Validate all files first
    filesArray.forEach((file) => {
      // Check file type
      if (!file.type.startsWith('image/')) {
        errors.push(`${file.name} is not an image file.`);
        return;
      }

      // Check file size
      if (file.size > maxSizeBytes) {
        errors.push(`${file.name} exceeds ${maxSizeMB}MB size limit.`);
        return;
      }

      validFiles.push(file);
    });

    if (errors.length > 0) {
      setError(errors.join(' '));
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      if (validFiles.length === 0) return;
    }

    // Process valid files
    const newImages: string[] = [];
    let processedCount = 0;

    validFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        newImages.push(base64);
        processedCount++;

        // When all files are processed, update state
        if (processedCount === validFiles.length) {
          const updatedImages = [...images, ...newImages];
          setImages(updatedImages);
          onImagesChange(updatedImages);
        }
      };
      reader.onerror = () => {
        setError(`Failed to read ${file.name}`);
        processedCount++;
        if (processedCount === validFiles.length && newImages.length > 0) {
          const updatedImages = [...images, ...newImages];
          setImages(updatedImages);
          onImagesChange(updatedImages);
        }
      };
      reader.readAsDataURL(file);
    });

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = (index: number) => {
    const updatedImages = images.filter((_, i) => i !== index);
    setImages(updatedImages);
    onImagesChange(updatedImages);
    setError(null);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-2 sm:space-y-3">
      <Label className="text-sm sm:text-base">Photos (Optional)</Label>
      
      {error && (
        <div className="text-xs sm:text-sm text-red-600 bg-red-50 p-2 sm:p-3 rounded break-words">
          {error}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />

      {images.length === 0 ? (
        <div
          className="border-2 border-dashed border-gray-300 rounded-lg p-4 sm:p-6 text-center cursor-pointer hover:border-gray-400 transition-colors min-h-[120px] sm:min-h-[150px] flex flex-col items-center justify-center"
          onClick={handleClick}
        >
          <Upload className="size-6 sm:size-8 text-gray-400 mx-auto mb-2" />
          <p className="text-xs sm:text-sm text-muted-foreground mb-1 break-words">
            Click to upload images or drag and drop
          </p>
          <p className="text-[10px] sm:text-xs text-muted-foreground break-words">
            Maximum {maxImages} images, {maxSizeMB}MB each
          </p>
        </div>
      ) : (
        <div className="space-y-2 sm:space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
            {images.map((image, index) => (
              <div key={index} className="relative group">
                <div className="aspect-square rounded-lg overflow-hidden border border-gray-200">
                  <img
                    src={image}
                    alt={`Upload ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveImage(index)}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 sm:p-1.5 opacity-70 sm:opacity-0 group-hover:opacity-100 transition-opacity min-h-[32px] min-w-[32px] flex items-center justify-center"
                  aria-label="Remove image"
                >
                  <X className="size-3 sm:size-4" />
                </button>
              </div>
            ))}
          </div>

          {images.length < maxImages && (
            <Button
              type="button"
              variant="outline"
              onClick={handleClick}
              className="w-full min-h-[44px] text-xs sm:text-sm"
            >
              <ImageIcon className="size-3 sm:size-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Add More Images ({images.length}/{maxImages})</span>
              <span className="sm:hidden">Add More ({images.length}/{maxImages})</span>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

