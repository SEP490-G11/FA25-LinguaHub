import React from 'react';
import { cn } from '@/utils/cn';
import {
  StandardPageHeadingProps,
  DESIGN_TOKENS,
} from './types/standard-components';

/**
 * StandardPageHeading Component
 * 
 * A unified page header component with gradient background, title, description,
 * and optional statistics cards. Provides consistent styling across Admin and TutorPages.
 * 
 * @param title - Page title text
 * @param description - Optional page description
 * @param icon - Lucide icon component to display
 * @param iconBgColor - Optional custom background color for icon container
 * @param gradientFrom - Optional custom gradient start color (e.g., 'from-blue-600')
 * @param gradientVia - Optional custom gradient middle color (e.g., 'via-blue-600')
 * @param gradientTo - Optional custom gradient end color (e.g., 'to-blue-500')
 * @param statistics - Optional array of statistics to display in header
 */
export const StandardPageHeading: React.FC<StandardPageHeadingProps> = ({
  title,
  description,
  icon: Icon,
  iconBgColor,
  gradientFrom,
  gradientVia,
  gradientTo,
  statistics,
  actionButtons,
  children,
}) => {
  // Determine gradient classes
  const getGradientClasses = () => {
    if (gradientFrom && gradientVia && gradientTo) {
      return cn('bg-gradient-to-r', gradientFrom, gradientVia, gradientTo);
    }

    // Use default gradient
    const defaultGradient = DESIGN_TOKENS.colors.headingGradient.default;
    return cn('bg-gradient-to-r key-gradient', defaultGradient.from, defaultGradient.via, defaultGradient.to);
  };

  return (
    <header
      className={cn(
        getGradientClasses(),
        'py-8 px-6 shadow-lg', // Premium padding & shadow
        'text-white relative overflow-hidden'
      )}
      role="banner"
    >
      <div className={DESIGN_TOKENS.responsive.maxWidth}>
        {/* Title and Icon Section */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
          <div className="flex items-start gap-4">
            {/* Icon Container */}
            <div
              className={cn(
                'p-3 rounded-xl bg-white/10 backdrop-blur-sm shadow-inner',
                'flex items-center justify-center flex-shrink-0'
              )}
              style={iconBgColor ? { backgroundColor: iconBgColor } : undefined}
              aria-hidden="true"
            >
              <Icon className="w-8 h-8 text-white" />
            </div>

            {/* Title and Description */}
            <div className="space-y-1">
              <h1 className="text-3xl font-bold tracking-tight text-white drop-shadow-sm">
                {title}
              </h1>
              {description && (
                <div className="text-blue-50/90 text-lg font-medium max-w-2xl leading-relaxed">
                  {description}
                </div>
              )}
              {/* Custom Children Content (Like Date Filters) */}
              {children && (
                <div className="mt-4 pt-2">
                  {children}
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          {actionButtons && (
            <div className="flex-shrink-0 flex items-center gap-3">
              {actionButtons}
            </div>
          )}
        </div>

        {/* Statistics Cards Section */}
        {statistics && statistics.length > 0 && (
          <div className="mt-8">
            <div
              className={cn(
                'grid',
                DESIGN_TOKENS.responsive.statGrid.heading.mobile,
                DESIGN_TOKENS.responsive.statGrid.heading.tablet,
                DESIGN_TOKENS.responsive.statGrid.heading.desktop,
                DESIGN_TOKENS.spacing.statGridGap,
              )}
              role="region"
              aria-label="Statistics"
            >
              {statistics.map((stat, index) => (
                <div
                  key={`${stat.label}-${index}`}
                  className={cn(
                    DESIGN_TOKENS.colors.compactCardBg,
                    DESIGN_TOKENS.colors.backdropBlur,
                    DESIGN_TOKENS.borderRadius.card,
                    DESIGN_TOKENS.spacing.statCardPadding,
                    DESIGN_TOKENS.colors.compactCardBorder,
                    'hover:bg-white/20 transition-all duration-300 hover:-translate-y-0.5',
                    'border border-white/10 shadow-sm'
                  )}
                  role="article"
                  aria-label={stat.ariaLabel || `${stat.label}: ${stat.value}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-white/10">
                      {stat.icon && <stat.icon className="w-4 h-4 text-white" />}
                    </div>
                    <div>
                      <p className="text-blue-100 text-sm font-medium">
                        {stat.label}
                      </p>
                      <p className="text-2xl font-bold text-white tracking-tight">
                        {stat.value}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default StandardPageHeading;
