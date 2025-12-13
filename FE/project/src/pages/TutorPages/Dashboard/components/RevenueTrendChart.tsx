import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RevenueTrendItem } from '../types';

interface RevenueTrendChartProps {
  data: RevenueTrendItem[];
}

const RevenueTrendChart: React.FC<RevenueTrendChartProps> = ({ data }) => {
  // Handle empty state
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Xu hướng doanh thu</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px] text-gray-500" role="status" aria-label="Không có dữ liệu doanh thu">
            Không có dữ liệu doanh thu trong khoảng thời gian đã chọn
          </div>
        </CardContent>
      </Card>
    );
  }

  // Memoize data transformation to avoid recalculation on every render
  const chartData = useMemo(() => 
    data.map((item) => ({
      date: item.date,
      displayDate: format(parseISO(item.date), 'dd MMM', { locale: vi }),
      amount: item.amount,
    })),
    [data]
  );

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-gray-900">
            {format(parseISO(data.date), 'dd MMMM, yyyy', { locale: vi })}
          </p>
          <p className="text-sm text-gray-600 mt-1">
            Doanh thu: {data.amount.toLocaleString('vi-VN')} ₫
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Xu hướng doanh thu</CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="w-full overflow-x-auto" role="img" aria-label="Bar chart showing daily revenue trend">
          <ResponsiveContainer width="100%" height={300} minWidth={300}>
          <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }} accessibilityLayer>
            <defs>
              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.8} />
                <stop offset="100%" stopColor="#3B82F6" stopOpacity={0.4} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis
              dataKey="displayDate"
              stroke="#6B7280"
              fontSize={12}
              tickLine={false}
            />
            <YAxis
              stroke="#6B7280"
              fontSize={12}
              tickLine={false}
              tickFormatter={(value) => {
                if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
                return value.toString();
              }}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }} />
            <Bar dataKey="amount" fill="url(#revenueGradient)" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

// Wrap with React.memo to prevent unnecessary re-renders
export default React.memo(RevenueTrendChart);
