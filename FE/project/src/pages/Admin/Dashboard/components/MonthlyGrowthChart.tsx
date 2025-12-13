import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MonthlyGrowthPoint } from '../types';

interface MonthlyGrowthChartProps {
  data: MonthlyGrowthPoint[];
}

/**
 * MonthlyGrowthChart Component
 * 
 * Displays monthly growth trends in an area chart showing New Users, New Tutors, and New Enrollments.
 * 
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 12.5
 * - Filters users, tutors, and enrollments where created_at falls within the date range
 * - Groups filtered records by year and month
 * - Counts newUsers, newTutors, newEnrollments for each month
 * - Displays monthly growth in an area chart
 * - Months on x-axis, counts on y-axis
 * - Responsive sizing
 */
const MonthlyGrowthChart: React.FC<MonthlyGrowthChartProps> = ({ data }) => {
  // Handle empty state
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Tăng trưởng theo tháng</CardTitle>
        </CardHeader>
        <CardContent>
          <div 
            className="flex items-center justify-center h-[300px] text-gray-500" 
            role="status" 
            aria-label="Không có dữ liệu tăng trưởng"
          >
            Không có dữ liệu tăng trưởng trong khoảng thời gian đã chọn
          </div>
        </CardContent>
      </Card>
    );
  }

  // Memoize data transformation to avoid recalculation on every render
  // Requirement 7.6: Return monthly growth as array of data points containing year, month, newUsers, newTutors, newEnrollments
  const chartData = useMemo(() => 
    data.map((item) => ({
      year: item.year,
      month: item.month,
      displayMonth: `${item.month}/${item.year}`,
      newUsers: item.newUsers,
      newTutors: item.newTutors,
      newEnrollments: item.newEnrollments,
    })),
    [data]
  );

  // Custom tooltip (Requirement 12.5)
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const monthNames = [
        'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
        'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
      ];
      
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-gray-900 mb-2">
            {monthNames[data.month - 1]} {data.year}
          </p>
          <div className="space-y-1">
            <p className="text-sm flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-500"></span>
              <span className="text-gray-600">Người dùng mới:</span>
              <span className="font-medium">{data.newUsers}</span>
            </p>
            <p className="text-sm flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-green-500"></span>
              <span className="text-gray-600">Giảng viên mới:</span>
              <span className="font-medium">{data.newTutors}</span>
            </p>
            <p className="text-sm flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-purple-500"></span>
              <span className="text-gray-600">Đăng ký mới:</span>
              <span className="font-medium">{data.newEnrollments}</span>
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
        <CardTitle id="monthly-growth-heading" className="text-lg md:text-xl">Tăng trưởng theo tháng</CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <div 
          className="w-full overflow-x-auto" 
          role="img" 
          aria-label="Area chart showing monthly growth trends with new users, new tutors, and new enrollments"
        >
          {/* Responsive height: 250px on mobile, 300px on tablet/desktop */}
          <ResponsiveContainer width="100%" height={250} minWidth={300} className="md:!h-[300px]">
            <AreaChart 
              data={chartData} 
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              accessibilityLayer
            >
              <defs>
                {/* Gradients for area fills */}
                <linearGradient id="usersGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.8} />
                  <stop offset="100%" stopColor="#3B82F6" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="tutorsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10B981" stopOpacity={0.8} />
                  <stop offset="100%" stopColor="#10B981" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="enrollmentsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#A855F7" stopOpacity={0.8} />
                  <stop offset="100%" stopColor="#A855F7" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              
              {/* X-Axis: Month/Year (Requirement 7.7) */}
              <XAxis
                dataKey="displayMonth"
                stroke="#6B7280"
                fontSize={12}
                tickLine={false}
              />
              
              {/* Y-Axis: Counts (Requirement 7.7) */}
              <YAxis
                stroke="#6B7280"
                fontSize={12}
                tickLine={false}
                tickFormatter={(value) => {
                  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
                  return value.toString();
                }}
              />
              
              {/* Tooltip (Requirement 12.5) */}
              <Tooltip 
                content={<CustomTooltip />} 
                cursor={{ stroke: '#9CA3AF', strokeWidth: 1 }} 
              />
              
              {/* Legend (Requirement 7.7) */}
              <Legend 
                wrapperStyle={{ paddingTop: '20px' }}
                iconType="circle"
              />
              
              {/* 3 series: New Users, New Tutors, New Enrollments */}
              {/* Requirements 7.3, 7.4, 7.5: Count newUsers, newTutors, newEnrollments for each month */}
              <Area 
                type="monotone"
                dataKey="newUsers" 
                name="Người dùng mới"
                stroke="#3B82F6"
                strokeWidth={2}
                fill="url(#usersGradient)"
                dot={{ fill: '#3B82F6', r: 3 }}
                activeDot={{ r: 5 }}
              />
              <Area 
                type="monotone"
                dataKey="newTutors" 
                name="Giảng viên mới"
                stroke="#10B981"
                strokeWidth={2}
                fill="url(#tutorsGradient)"
                dot={{ fill: '#10B981', r: 3 }}
                activeDot={{ r: 5 }}
              />
              <Area 
                type="monotone"
                dataKey="newEnrollments" 
                name="Đăng ký mới"
                stroke="#A855F7"
                strokeWidth={2}
                fill="url(#enrollmentsGradient)"
                dot={{ fill: '#A855F7', r: 3 }}
                activeDot={{ r: 5 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

// Wrap with React.memo to prevent unnecessary re-renders
export default React.memo(MonthlyGrowthChart);
