import { LucideIcon } from 'lucide-react';

// ============================================================================
// StatisticsCards Types
// ============================================================================

export interface StatCardData {
  label: string;
  value: number | string;
  icon: LucideIcon;
  iconColor: string;
  bgColor?: string;
  ariaLabel?: string;
}

export interface StandardStatisticsCardsProps {
  stats: StatCardData[];
  variant?: 'default' | 'compact';
  columns?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
  };
}

// ============================================================================
// Filters Types
// ============================================================================

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterConfig {
  id: string;
  type: 'search' | 'select';
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  options?: FilterOption[];
  width?: string;
  icon?: LucideIcon;
}

export interface StandardFiltersProps {
  filters: FilterConfig[];
  layout?: 'horizontal' | 'vertical';
}

// ============================================================================
// PageHeading Types
// ============================================================================

export interface PageHeadingStatistic {
  label: string;
  value: string | number;
  icon: LucideIcon;
  ariaLabel?: string;
}

export interface StandardPageHeadingProps {
  title: string;
  description?: React.ReactNode;
  icon: LucideIcon;
  iconBgColor?: string;
  gradientFrom?: string;
  gradientVia?: string;
  gradientTo?: string;
  statistics?: PageHeadingStatistic[];
  actionButtons?: React.ReactNode;
  children?: React.ReactNode;
}

// ============================================================================
// Design Tokens
// ============================================================================

export const DESIGN_TOKENS = {
  spacing: {
    cardPadding: 'p-6',
    compactCardPadding: 'px-4 py-3',
    gridGap: 'gap-4',
    sectionSpacing: 'space-y-6',
    filterGap: 'gap-3',
    headingPaddingY: 'py-6 sm:py-10',
    headingPaddingX: 'px-4',
    statCardPadding: 'px-4 sm:px-6 py-4',
    statGridGap: 'gap-4 sm:gap-6',
  },
  borderRadius: {
    card: 'rounded-xl',
    compactCard: 'rounded-lg',
    input: 'rounded-lg',
    icon: 'rounded-lg',
  },
  colors: {
    // CHUẨN DUY NHẤT cho heading gradient - KHÔNG thay đổi
    // Phải sử dụng chính xác gradient này trên TẤT CẢ các trang Admin và TutorPages
    headingGradient: {
      default: {
        from: 'from-blue-600',
        via: 'via-blue-600',
        to: 'to-blue-500',
      },
    },
    cardBg: 'bg-white',
    cardBorder: 'border border-gray-100',
    statCardHover: 'hover:shadow-lg',
    compactCardBg: 'bg-white/15',
    compactCardBorder: 'border border-white/20',
    backdropBlur: 'backdrop-blur-sm',
    backdropBlurMd: 'backdrop-blur-md',
    iconBgOpacity: 'bg-opacity-10',
    headingIconBg: 'bg-white/20',
  },
  typography: {
    pageTitle: 'text-3xl sm:text-4xl lg:text-5xl font-bold text-white',
    pageDescription: 'text-blue-100 text-base sm:text-lg',
    statLabel: 'text-sm text-muted-foreground mb-1',
    statValue: 'text-2xl font-bold',
    compactStatLabel: 'text-xs font-medium text-blue-100',
    compactStatValue: 'text-xl font-bold text-white',
  },
  responsive: {
    statGrid: {
      default: {
        mobile: 'grid-cols-1',
        tablet: 'md:grid-cols-2',
        desktop: 'lg:grid-cols-4',
      },
      compact: {
        mobile: 'grid-cols-2',
        tablet: 'md:grid-cols-3',
        desktop: 'lg:grid-cols-6',
      },
      heading: {
        mobile: 'grid-cols-1',
        tablet: 'sm:grid-cols-2',
        desktop: 'lg:grid-cols-3',
      },
    },
    maxWidth: 'max-w-7xl mx-auto',
  },
  icons: {
    default: {
      size: 'w-6 h-6',
      containerPadding: 'p-3',
    },
    compact: {
      size: 'w-5 h-5',
      containerPadding: 'p-2',
    },
    heading: {
      size: 'w-8 h-8 sm:w-10 sm:h-10',
      containerPadding: 'p-2 sm:p-3',
    },
  },
  filters: {
    container: 'flex gap-3 flex-wrap',
    searchMinWidth: 'min-w-[250px]',
    searchPaddingLeft: 'pl-10',
    searchIconPosition: 'absolute left-3 top-1/2 transform -translate-y-1/2',
    searchIconSize: 'w-4 h-4 text-gray-400',
    selectWidth: 'w-48',
  },
  transitions: {
    default: 'transition-all',
    shadow: 'transition-shadow',
  },
} as const;

// ============================================================================
// Helper Types
// ============================================================================

export type StatisticsVariant = 'default' | 'compact';

export type FilterType = 'search' | 'select';

export type LayoutType = 'horizontal' | 'vertical';
