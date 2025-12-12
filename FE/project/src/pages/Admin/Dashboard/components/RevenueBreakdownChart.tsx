import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DailyRevenuePoint } from '../types';
import { formatCurrency } from '../utils/formatters';

interface RevenueBreakdownChartProps {
  data: DailyRevenuePoint[];
}

/**
 * RevenueBreakdownChart Component
 * 
 * Displays daily revenue breakdown in a stacked column chart showing GMV, Commission, and Payout.
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 12.3
 * - Groups payments by date where status equals PAID
 * - Calculates gmv, commission, and payout for each date
 * - Displays revenue breakdown in a stacked column chart
 * - Date on x-axis, monetary values on y-axis
 * - Tooltip with formatted values
 * - Responsive sizing
 */
const RevenueBreakdownChart: React.FC<RevenueBreakdownChartProps> = ({ data }) => {
  // Handle empty state
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Phân tích doanh thu theo ngày</CardTitle>
        </CardHeader>
        <CardContent>
          <div 
            className="flex items-center justify-center h-[300px] text-gray-500" 
            role="status" 
            aria-label="Không có dữ liệu doanh thu"
          >
            Không có dữ liệu doanh thu trong khoảng thời gian đã chọn
          </div>
        </CardContent>
      </Card>
    );
  }

  // Memoize data transformation to avoid recalculation on every render
  // Requirement 4.5: Return revenue breakdown ordered chronologically
  const chartData = useMemo(() => 
    data.map((item) => ({
      date: item.date,
      displayDate: format(parseISO(item.date), 'dd MMM', { locale: vi }),
      gmv: item.gmv,
      commission: item.commission,
      payout: item.payout,
    })),
    [data]
  );

  // Custom tooltip with formatted currency values (Requirement 12.3)
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-gray-900 mb-2">
            {format(parseISO(data.date), 'dd MMMM, yyyy', { locale: vi })}
          </p>
          <div className="space-y-1">
            <p className="text-sm flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-500"></span>
              <span className="text-gray-600">GMV:</span>
              <span className="font-medium">{formatCurrency(data.gmv)}</span>
            </p>
            <p className="text-sm flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-green-500"></span>
              <span className="text-gray-600">Commission:</span>
              <span className="font-medium">{formatCurrency(data.commission)}</span>
            </p>
            <p className="text-sm flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-orange-500"></span>
              <span className="text-gray-600">Payout:</span>
              <span className="font-medium">{formatCurrency(data.payout)}</span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle id="revenue-breakdown-heading" className="text-lg md:text-xl">Phân tích doanh thu theo ngày</CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <div 
          className="w-full overflow-x-auto" 
          role="img" 
          aria-label="Stacked bar chart showing daily revenue breakdown with GMV, Commission, and Payout"
        >
          {/* Responsive height: 250px on mobile, 300px on tablet/desktop */}
          <ResponsiveContainer width="100%" height={250} minWidth={300} className="md:!h-[300px]">
            <BarChart 
              data={chartData} 
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              accessibilityLayer
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              
              {/* X-Axis: Date (Requirement 4.6) */}
              <XAxis
                dataKey="displayDate"
                stroke="#6B7280"
                fontSize={12}
                tickLine={false}
              />
              
              {/* Y-Axis: Currency (Requirement 4.6) */}
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
              
              {/* Tooltip with formatted values (Requirement 12.3) */}
              <Tooltip 
                content={<CustomTooltip />} 
                cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }} 
              />
              
              {/* Legend */}
              <Legend 
                wrapperStyle={{ paddingTop: '20px' }}
                iconType="circle"
              />
              
              {/* 3 series: GMV (blue), Commission (green), Payout (orange) */}
              {/* Requirement 4.2, 4.3: Calculate gmv, commission, payout for each date */}
              <Bar 
                dataKey="gmv" 
                name="GMV"
                stackId="revenue"
                fill="#3B82F6" 
                radius={[0, 0, 0, 0]}
              />
              <Bar 
                dataKey="commission" 
                name="Commission"
                stackId="revenue"
                fill="#10B981" 
                radius={[0, 0, 0, 0]}
              />
              <Bar 
                dataKey="payout" 
                name="Payout"
                stackId="revenue"
                fill="#F97316" 
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

// Wrap with React.memo to prevent unnecessary re-renders
export default React.memo(RevenueBreakdownChart);
