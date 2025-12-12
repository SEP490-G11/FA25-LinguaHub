import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ActionableItemCardProps } from '../types';
import { cn } from '@/lib/utils';

/**
 * ActionableItemCard component displays actionable items requiring administrator attention.
 * Shows a count badge in red when there are pending items.
 * 
 * Requirements: 2.5, 2.6, 12.1
 * - Display actionable items as prominent cards with visual indicators (2.5, 12.1)
 * - Navigate to corresponding management page on click (2.6)
 * - Red badge when count > 0 (12.1)
 * 
 * @param title - The actionable item label (e.g., "Pending Tutors")
 * @param count - Number of pending items
 * @param icon - Lucide icon component to display
 * @param onClick - Click handler for navigation
 */
export const ActionableItemCard: React.FC<ActionableItemCardProps> = ({
  title,
  count,
  icon: Icon,
  onClick,
}) => {
  const hasItems = count > 0;

  return (
    <Card
      className={cn(
        'cursor-pointer transition-all duration-200',
        'hover:shadow-md hover:-translate-y-0.5',
        hasItems 
          ? 'border-l-4 border-l-red-500 bg-red-50/40 dark:bg-red-950/20' 
          : 'border-l-4 border-l-blue-500 bg-blue-50/30 dark:bg-blue-950/10'
      )}
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-label={`${title}: ${count} pending items. Click to view.`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xs md:text-sm font-medium text-gray-600 dark:text-gray-400">
          {title}
        </CardTitle>
        <Icon
          className={cn(
            'h-4 w-4 md:h-5 md:w-5',
            hasItems ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'
          )}
          aria-hidden="true"
        />
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100" aria-label={`Count: ${count}`}>
            {count}
          </div>
          {hasItems && (
            <Badge
              variant="destructive"
              className="bg-red-600 hover:bg-red-700 text-white text-[10px] md:text-xs px-2 py-0.5"
              aria-label="Action required"
            >
              Cần xử lý
            </Badge>
          )}
        </div>
        <p className="text-[10px] md:text-xs text-muted-foreground mt-1.5 md:mt-2">
          {hasItems ? 'Nhấn để xem chi tiết' : 'Không có mục chờ'}
        </p>
      </CardContent>
    </Card>
  );
};

// Wrap with React.memo to prevent unnecessary re-renders
export const MemoizedActionableItemCard = React.memo(ActionableItemCard);
