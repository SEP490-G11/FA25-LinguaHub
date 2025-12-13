import { AlertCircle } from 'lucide-react';
import { cn } from '@/utils/cn';

interface ErrorMessageProps {
  message: string;
  className?: string;
}

export function ErrorMessage({ message, className }: ErrorMessageProps) {
  return (
    <div className={cn('flex items-center space-x-2 text-red-600', className)}>
      <AlertCircle className="h-4 w-4" />
      <span className="text-sm">{message}</span>
    </div>
  );
}