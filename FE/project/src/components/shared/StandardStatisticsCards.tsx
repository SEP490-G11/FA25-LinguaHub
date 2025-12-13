import React from 'react';
import { cn } from '@/utils/cn';
import {
  StandardStatisticsCardsProps,
  DESIGN_TOKENS,
} from './types/standard-components';
import { TrendingUp, TrendingDown } from 'lucide-react';

/**
 * StandardStatisticsCards Component
 * 
 * A unified statistics cards component with consistent styling across Admin and TutorPages.
 * Supports two variants: default (for page content) and compact (for headers).
 * 
 * @param stats - Array of statistics data to display
 * @param variant - 'default' for page content, 'compact' for headers
 * @param columns - Optional custom grid column configuration
 */
export const StandardStatisticsCards: React.FC<StandardStatisticsCardsProps> = ({
  stats,
  variant = 'default',
  columns,
}) => {
  // Determine grid classes based on variant and custom columns
  const getGridClasses = () => {
    if (columns) {
      const mobileClass = columns.mobile ? `grid-cols-${columns.mobile}` : '';
      const tabletClass = columns.tablet ? `md:grid-cols-${columns.tablet}` : '';
      const desktopClass = columns.desktop ? `lg:grid-cols-${columns.desktop}` : '';
      return cn('grid', mobileClass, tabletClass, desktopClass, DESIGN_TOKENS.spacing.gridGap);
    }

    // Use default grid configuration based on variant
    const gridConfig = variant === 'compact'
      ? DESIGN_TOKENS.responsive.statGrid.compact
      : DESIGN_TOKENS.responsive.statGrid.default;

    return cn(
      'grid',
      gridConfig.mobile,
      gridConfig.tablet,
      gridConfig.desktop,
      DESIGN_TOKENS.spacing.gridGap
    );
  };

  return (
    <div className={getGridClasses()}>
      {stats.map((stat, index) => {
        const Icon = stat.icon;

        return (
          <div
            key={`${stat.label}-${index}`}
            className={cn(
              'group relative overflow-hidden transition-all duration-300',
              variant === 'default' ? [
                'bg-white hover:bg-white/90', // Card bg
                'border-none shadow-sm hover:shadow-soft hover:-translate-y-1', // Premium shadow & lift
                'rounded-xl', // Softer radius
                'p-5', // More padding
              ] : [
                DESIGN_TOKENS.colors.compactCardBg,
                DESIGN_TOKENS.colors.backdropBlurMd,
                DESIGN_TOKENS.borderRadius.compactCard,
                DESIGN_TOKENS.spacing.compactCardPadding,
                DESIGN_TOKENS.colors.compactCardBorder,
              ]
            )}
            role="article"
            aria-label={stat.ariaLabel || `${stat.label}: ${stat.value}`}
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0 space-y-1">
                <p
                  className={cn(
                    'text-sm font-medium text-muted-foreground tracking-tight',
                    variant === 'compact' && DESIGN_TOKENS.typography.compactStatLabel
                  )}
                >
                  {stat.label}
                </p>
                <div className="flex items-baseline gap-2">
                  <p
                    className={cn(
                      'text-2xl font-bold tracking-tight text-foreground/90',
                      variant === 'compact' && DESIGN_TOKENS.typography.compactStatValue,
                      'truncate'
                    )}
                  >
                    {stat.value}
                  </p>
                </div>
              </div>

              {/* Icon Container */}
              <div
                className={cn(
                  'flex items-center justify-center transition-colors px-3 py-3 rounded-xl',
                  variant === 'default'
                    ? 'bg-primary/10 group-hover:bg-primary/20'
                    : 'bg-white/10'
                )}
                style={variant === 'default' && stat.bgColor ? { backgroundColor: stat.bgColor } : undefined}
              >
                <Icon
                  className={cn(
                    'w-5 h-5',
                    variant === 'default' ? 'text-primary' : 'text-white'
                  )}
                  style={variant === 'default' && stat.iconColor ? { color: stat.iconColor } : undefined}
                  aria-hidden="true"
                />
              </div>
            </div>

            {/* Decorative gradient overlay */}
            {variant === 'default' && (
              <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default StandardStatisticsCards;
