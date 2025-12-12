import React from 'react';
import { LanguageRevenueItem } from '../types';
import { formatCurrency, formatPercentage } from '../utils/formatters';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * RevenueByLanguageSection Component
 * 
 * Displays revenue distribution across different languages in a table format.
 * Shows GMV, Commission, Payout, Course Count, and percentage of total GMV for each language.
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8
 * - Filters payments where status equals PAID, payment_type equals Course
 * - Groups filtered payments by language
 * - Calculates gmv, commission, payout, courseCount for each language
 * - Calculates percentGMV as language gmv / total system GMV * 100
 * - Displays data in table with progress bar for percentage column
 * - Sorts by GMV descending
 * - Formats currency and percentage values
 */

interface RevenueByLanguageSectionProps {
  revenueByLanguage: LanguageRevenueItem[];
}

export const RevenueByLanguageSection: React.FC<RevenueByLanguageSectionProps> = ({
  revenueByLanguage,
}) => {
  // Task 18.2: Memoize sorting to avoid recalculation on every render
  // Sort by GMV descending (Requirement 5.8)
  const sortedData = React.useMemo(
    () => [...revenueByLanguage].sort((a, b) => b.gmv - a.gmv),
    [revenueByLanguage]
  );

  return (
    <section className="mb-6 md:mb-8" aria-labelledby="revenue-by-language-heading">
      <Card>
        <CardHeader>
          <CardTitle id="revenue-by-language-heading" className="text-lg md:text-xl font-semibold text-gray-900 dark:text-gray-100">
            Doanh thu theo ngôn ngữ
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table aria-label="Revenue by language table">
            <TableHeader>
              <TableRow>
                <TableHead>Ngôn ngữ</TableHead>
                <TableHead className="text-right">Doanh thu</TableHead>
                <TableHead className="text-right">Hoa hồng</TableHead>
                <TableHead className="text-right">Chi trả</TableHead>
                <TableHead className="text-right">Khóa học</TableHead>
                <TableHead className="text-right">% Tổng</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground" role="status">
                    Không có dữ liệu doanh thu cho khoảng thời gian đã chọn
                  </TableCell>
                </TableRow>
              ) : (
                sortedData.map((item) => (
                  <TableRow key={item.language}>
                    {/* Language Name - Requirement 5.2 */}
                    <TableCell className="font-medium">
                      {item.language}
                    </TableCell>
                    
                    {/* GMV - Requirements 5.3, 12.7 */}
                    <TableCell className="text-right">
                      {formatCurrency(item.gmv)}
                    </TableCell>
                    
                    {/* Commission - Requirements 5.4, 12.7 */}
                    <TableCell className="text-right">
                      {formatCurrency(item.commission)}
                    </TableCell>
                    
                    {/* Payout - Requirements 5.5, 12.7 */}
                    <TableCell className="text-right">
                      {formatCurrency(item.payout)}
                    </TableCell>
                    
                    {/* Course Count - Requirement 5.6 */}
                    <TableCell className="text-right">
                      {item.courseCount}
                    </TableCell>
                    
                    {/* Percentage with Progress Bar - Requirements 5.7, 12.6 */}
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-20">
                          <Progress 
                            value={item.percentGMV} 
                            className="h-2"
                            aria-label={`${formatPercentage(item.percentGMV)} of total GMV`}
                          />
                        </div>
                        <span className="text-sm font-medium min-w-[3rem]">
                          {formatPercentage(item.percentGMV, 1)}
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </section>
  );
};

// Memoize to prevent unnecessary re-renders
export const MemoizedRevenueByLanguageSection = React.memo(RevenueByLanguageSection);
