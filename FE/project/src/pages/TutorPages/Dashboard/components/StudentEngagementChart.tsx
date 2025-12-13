import React, { useMemo, useCallback } from 'react';
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StudentEngagementItem } from '../types';

interface StudentEngagementChartProps {
  data: StudentEngagementItem[];
}

const StudentEngagementChart: React.FC<StudentEngagementChartProps> = ({ data }) => {
  // Handle empty state
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Hoạt động học viên</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px] text-gray-500" role="status" aria-label="Không có dữ liệu hoạt động">
            Không có dữ liệu hoạt động học viên
          </div>
        </CardContent>
      </Card>
    );
  }

  // Memoize data transformation to avoid recalculation on every render
  const chartData = useMemo(() => 
    [...data]
      .sort((a, b) => a.weekIndex - b.weekIndex)
      .map((item) => ({
        weekIndex: item.weekIndex,
        displayWeek: `Tuần ${item.weekIndex}`,
        hours: item.hours,
        lessonCount: item.lessonCount,
      })),
    [data]
  );

  // Memoize custom tooltip to avoid recreating on every render
  const CustomTooltip = useCallback(({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-gray-900">{data.displayWeek}</p>
          <p className="text-sm text-blue-600 mt-1">
            Giờ học: {data.hours.toFixed(2)}
          </p>
          <p className="text-sm text-green-600">
            Bài học: {data.lessonCount}
          </p>
        </div>
      );
    }
    return null;
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Hoạt động học viên</CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="w-full overflow-x-auto" role="img" aria-label="Combined chart showing student engagement with hours watched and lessons completed per week">
          <ResponsiveContainer width="100%" height={300} minWidth={400}>
          <ComposedChart
            data={chartData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            accessibilityLayer
          >
            <defs>
              <linearGradient id="hoursGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.8} />
                <stop offset="100%" stopColor="#3B82F6" stopOpacity={0.4} />
              </linearGradient>
              <linearGradient id="lessonsGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10B981" stopOpacity={0.8} />
                <stop offset="100%" stopColor="#10B981" stopOpacity={0.4} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis
              dataKey="displayWeek"
              stroke="#6B7280"
              fontSize={12}
              tickLine={false}
            />
            <YAxis
              yAxisId="left"
              stroke="#3B82F6"
              fontSize={12}
              tickLine={false}
              label={{ value: 'Giờ', angle: -90, position: 'insideLeft', style: { fill: '#3B82F6' } }}
              tickFormatter={(value) => value.toFixed(1)}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              stroke="#10B981"
              fontSize={12}
              tickLine={false}
              label={{ value: 'Bài học', angle: 90, position: 'insideRight', style: { fill: '#10B981' } }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="line"
            />
            <Bar
              yAxisId="right"
              dataKey="lessonCount"
              fill="url(#lessonsGradient)"
              name="Bài học hoàn thành"
              radius={[8, 8, 0, 0]}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="hours"
              stroke="#3B82F6"
              strokeWidth={3}
              name="Giờ học đã xem"
              dot={{ fill: '#3B82F6', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

// Wrap with React.memo to prevent unnecessary re-renders
export default React.memo(StudentEngagementChart);
