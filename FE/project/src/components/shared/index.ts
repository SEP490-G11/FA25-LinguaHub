/**
 * Shared Components Index
 * 
 * This file exports all standard components and their types for use across
 * Admin and TutorPages to ensure UI consistency.
 */

// ============================================================================
// Components
// ============================================================================

export { StandardStatisticsCards } from './StandardStatisticsCards';
export { StandardFilters } from './StandardFilters';
export { StandardPageHeading } from './StandardPageHeading';

// ============================================================================
// Types and Interfaces
// ============================================================================

export type {
  // StatisticsCards Types
  StatCardData,
  StandardStatisticsCardsProps,
  StatisticsVariant,
  
  // Filters Types
  FilterOption,
  FilterConfig,
  StandardFiltersProps,
  FilterType,
  LayoutType,
  
  // PageHeading Types
  PageHeadingStatistic,
  StandardPageHeadingProps,
  GradientColorScheme,
} from './types/standard-components';

// ============================================================================
// Design Tokens
// ============================================================================

export { DESIGN_TOKENS } from './types/standard-components';
