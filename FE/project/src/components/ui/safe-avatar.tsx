import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/utils/cn";

interface SafeAvatarProps {
  src?: string | null;
  alt?: string;
  fallback?: string;
  className?: string;
  fallbackClassName?: string;
}

/**
 * SafeAvatar component that handles base64 images and provides fallback
 * Automatically handles long base64 strings and provides error handling
 */
export const SafeAvatar = ({
  src,
  alt = "Avatar",
  fallback = "U",
  className,
  fallbackClassName,
}: SafeAvatarProps) => {
  // Validate and clean src
  const validSrc = src && src.trim() !== "" ? src.trim() : undefined;

  return (
    <Avatar className={cn("relative", className)}>
      {validSrc ? (
        <AvatarImage
          src={validSrc}
          alt={alt}
          referrerPolicy="no-referrer"
          onError={(e) => {
            // Hide the broken image
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
      ) : null}
      <AvatarFallback className={cn("bg-blue-600 text-white font-semibold", fallbackClassName)}>
        {fallback}
      </AvatarFallback>
    </Avatar>
  );
};
