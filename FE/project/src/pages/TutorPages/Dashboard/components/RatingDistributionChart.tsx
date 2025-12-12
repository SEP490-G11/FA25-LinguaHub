import React, { useMemo, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RatingDistribution } from '../types';

interface RatingDistributionChartProps {
  data: RatingDistribution[];
}

// Memoize color function to avoid recreating on every render
const getBarColor = (stars: number) => {
  const colors = {
    5: '#10B981', // Green
    4: '#84CC16', // Lime
    3: '#F59E0B', // Orange
    2: '#FB923C', // Light Orange
    1: '#EF4444', // Red
  };
  return colors[stars as keyof typeof colors] || '#6B7280';
};

const RatingDistributionChart: React.FC<RatingDistributionChartProps> = ({ data }) => {
  // Memoize data transformation to avoid recalculation on every render
  const chartData = useMemo(() => {
    // Always show all 5 star levels, even if some have zero count
    const allStarLevels = [5, 4, 3, 2, 1];
    
    // Create a map of existing data
    const dataMap = new Map(data.map((item) => [item.stars, item]));
    
    // Build complete data with all star levels
    return allStarLevels.map((stars) => {
      const existing = dataMap.get(stars);
      return {
        stars,
        count: existing?.count || 0,
        percent: existing?.percent || 0,
        displayLabel: `${stars} ⭐`,
      };
    });
  }, [data]);

  // Memoize hasReviews check to avoid recalculation on every render
  const hasReviews = useMemo(() => 
    data.length > 0 && data.some((item) => item.count > 0),
    [data]
  );

  // Handle empty state
  if (!hasReviews) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" aria-hidden="true" />
            Phân bố đánh giá
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px] text-gray-500" role="status" aria-label="Chưa có đánh giá">
            Chưa có đánh giá
          </div>
        </CardContent>
      </Card>
    );
  }

  // Memoize custom tooltip to avoid recreating on every render
  const CustomTooltip = useCallback(({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-gray-900">{data.displayLabel}</p>
          <p className="text-sm text-gray-600 mt-1">
            Số lượng: {data.count}
          </p>
          <p className="text-sm text-gray-600">
            Tỷ lệ: {data.percent.toFixed(1)}%
          </p>
        </div>
      );
    }
    return null;
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5" aria-hidden="true" />
          Phân bố đánh giá
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="w-full overflow-x-auto" role="img" aria-label="Horizontal bar chart showing rating distribution from 1 to 5 stars">
          <ResponsiveContainer width="100%" height={300} minWidth={300}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            accessibilityLayer
          >
            <defs>
              {[5, 4, 3, 2, 1].map((stars) => (
                <linearGradient key={stars} id={`ratingGradient${stars}`} x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor={getBarColor(stars)} stopOpacity={0.8} />
                  <stop offset="100%" stopColor={getBarColor(stars)} stopOpacity={0.4} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis
              type="number"
              stroke="#6B7280"
              fontSize={12}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="displayLabel"
              stroke="#6B7280"
              fontSize={12}
              tickLine={false}
              width={60}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }} />
            <Bar dataKey="count" radius={[0, 8, 8, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={`url(#ratingGradient${entry.stars})`} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        </div>
        
        {/* Percentage labels */}
        <div className="mt-4 space-y-2">
          {chartData.map((item) => (
            <div key={item.stars} className="flex items-center justify-between text-sm">
              <span className="text-gray-600">{item.displayLabel}</span>
              <span className="font-medium text-gray-900">
                {item.count} ({item.percent.toFixed(1)}%)
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// Wrap with React.memo to prevent unnecessary re-renders
export default React.memo(RatingDistributionChart);
