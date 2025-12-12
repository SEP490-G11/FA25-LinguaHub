import { useState } from "react";
import { cn } from "@/utils/cn";

interface SafeImageProps {
  src?: string | null;
  alt?: string;
  fallbackSrc?: string;
  className?: string;
  onError?: () => void;
}

/**
 * SafeImage component that handles image loading errors with fallback
 */
export const SafeImage = ({
  src,
  alt = "Image",
  fallbackSrc = "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=800",
  className,
  onError,
}: SafeImageProps) => {
  const [imgSrc, setImgSrc] = useState(src || fallbackSrc);
  const [hasError, setHasError] = useState(false);

  const handleError = () => {
    if (!hasError) {
      setHasError(true);
      setImgSrc(fallbackSrc);
      onError?.();
    }
  };

  return (
    <img
      src={imgSrc}
      alt={alt}
      className={cn("object-cover", className)}
      onError={handleError}
      loading="lazy"
    />
  );
};
