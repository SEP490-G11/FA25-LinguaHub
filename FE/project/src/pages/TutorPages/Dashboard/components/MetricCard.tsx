import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { MetricCardProps } from '../types';
import { cn } from '@/utils/cn';

/**
 * MetricCard component displays a performance metric with an icon, title, value, and optional trend indicator.
 * Used in the dashboard to show key performance indicators like revenue, student counts, ratings, etc.
 * 
 * @param title - The metric label (e.g., "Total Revenue", "Active Students")
 * @param value - The metric value (can be string or number)
 * @param icon - Lucide icon component to display
 * @param subtitle - Optional subtitle text below the value
 * @param trend - Optional trend object with value and direction
 */
export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  icon: Icon,
  subtitle,
  trend,
}) => {
  return (
    <Card className="hover:shadow-soft hover:-translate-y-1 transition-all duration-300 border-none shadow-sm bg-white/60 backdrop-blur-sm" role="article" aria-label={`${title}: ${value}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-semibold text-muted-foreground tracking-tight">
          {title}
        </CardTitle>
        <div className="p-2 bg-primary/10 rounded-xl transition-colors group-hover:bg-primary/20">
          <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold tracking-tight text-foreground" aria-label={`Value: ${value}`}>{value}</div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1 font-medium">{subtitle}</p>
        )}
        {trend && (
          <div
            className={cn(
              'flex items-center gap-1.5 mt-3 text-xs font-semibold px-2 py-1 rounded-md w-fit',
              trend.isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
            )}
          >
            {trend.isPositive ? (
              <TrendingUp className="h-3.5 w-3.5" />
            ) : (
              <TrendingDown className="h-3.5 w-3.5" />
            )}
            <span>{trend.value}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Wrap with React.memo to prevent unnecessary re-renders
// This is especially important since MetricCard is rendered 7 times in the dashboard
export const MemoizedMetricCard = React.memo(MetricCard);
