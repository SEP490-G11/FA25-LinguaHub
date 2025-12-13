import React, { useMemo, useCallback } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SalesByCourseItem } from '../types';
import { routeHelpers } from '@/constants/routes';

interface SalesByCourseChartProps {
  data: SalesByCourseItem[];
}

// Predefined color palette (8 colors, cycling)
const COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Orange
  '#8B5CF6', // Purple
  '#EF4444', // Red
  '#06B6D4', // Cyan
  '#EC4899', // Pink
  '#84CC16', // Lime
];

const SalesByCourseChart: React.FC<SalesByCourseChartProps> = ({ data }) => {
  const navigate = useNavigate();

  // Handle empty state
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Doanh thu theo khóa học</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px] text-gray-500" role="status" aria-label="Không có dữ liệu doanh thu khóa học">
            Không có doanh thu khóa học trong khoảng thời gian đã chọn
          </div>
        </CardContent>
      </Card>
    );
  }

  // Memoize data transformation to avoid recalculation on every render
  const chartData = useMemo(() => 
    data.map((item, index) => ({
      ...item,
      fill: COLORS[index % COLORS.length],
    })),
    [data]
  );

  // Memoize course click handler to avoid recreating on every render
  // Requirement 4.3: Course navigation preserves application state
  const handleCourseClick = useCallback((courseId: number) => {
    navigate(routeHelpers.tutorCourseDetails(courseId));
  }, [navigate]);

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-gray-900">{data.courseTitle}</p>
          <p className="text-sm text-gray-600 mt-1">
            Doanh thu: {data.revenue.toLocaleString()} ₫
          </p>
          <p className="text-sm text-gray-600">
            Tỷ lệ: {data.percent.toFixed(1)}%
          </p>
        </div>
      );
    }
    return null;
  };

  // Custom label for pie chart
  const renderLabel = (entry: any) => {
    return `${entry.percent.toFixed(1)}%`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Doanh thu theo khóa học</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* Pie Chart */}
          <div className="flex items-center justify-center min-h-[300px]" role="img" aria-label="Pie chart showing revenue distribution by course">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart accessibilityLayer>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderLabel}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="revenue"
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.fill}
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleCourseClick(entry.courseId)}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Course List */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Chi tiết khóa học</h4>
            <div className="space-y-2 max-h-[280px] overflow-y-auto" role="list" aria-label="Course revenue breakdown">
              {chartData.map((course, index) => (
                <div
                  key={course.courseId}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                  onClick={() => handleCourseClick(course.courseId)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleCourseClick(course.courseId);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  aria-label={`${course.courseTitle}: $${course.revenue.toLocaleString()}, ${course.percent.toFixed(1)}% of total revenue. Click to view course details.`}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div
                      className="w-4 h-4 rounded-full flex-shrink-0"
                      style={{ backgroundColor: course.fill }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {course.courseTitle}
                      </p>
                      <p className="text-xs text-gray-500">
                        {course.percent.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                  <div className="text-right ml-3">
                    <p className="text-sm font-semibold text-gray-900">
                      {course.revenue.toLocaleString()} ₫
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Wrap with React.memo to prevent unnecessary re-renders
export default React.memo(SalesByCourseChart);
