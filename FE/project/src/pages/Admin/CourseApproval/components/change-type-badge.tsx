import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Minus } from 'lucide-react';
import { ChangeType } from '../types';

interface ChangeTypeBadgeProps {
  changeType: ChangeType;
  className?: string;
}

/**
 * ChangeTypeBadge component displays a color-coded badge with icon for change types
 * Ensures accessibility with both color and icon indicators
 * 
 * Requirements: 5.5, 6.1
 * - ADDED: Green badge with Plus icon
 * - MODIFIED: Blue badge with Edit icon
 * - DELETED: Red badge with Minus icon
 */
export function ChangeTypeBadge({ changeType, className = '' }: ChangeTypeBadgeProps) {
  switch (changeType) {
    case 'ADDED':
      return (
        <Badge 
          className={`bg-green-100 text-green-800 border-green-300 gap-1 font-semibold ${className}`}
          aria-label="Added change"
        >
          <Plus className="w-3 h-3" aria-hidden="true" />
          ADDED
        </Badge>
      );
    case 'MODIFIED':
      return (
        <Badge 
          className={`bg-blue-100 text-blue-800 border-blue-300 gap-1 font-semibold ${className}`}
          aria-label="Modified change"
        >
          <Edit className="w-3 h-3" aria-hidden="true" />
          MODIFIED
        </Badge>
      );
    case 'DELETED':
      return (
        <Badge 
          className={`bg-red-100 text-red-800 border-red-300 gap-1 font-semibold ${className}`}
          aria-label="Deleted change"
        >
          <Minus className="w-3 h-3" aria-hidden="true" />
          DELETED
        </Badge>
      );
  }
}
