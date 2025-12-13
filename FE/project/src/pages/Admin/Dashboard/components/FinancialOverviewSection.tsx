import React from 'react';
import { DollarSign, TrendingUp, Wallet, ShoppingCart } from 'lucide-react';
import { MetricCard } from './';
import { FinancialOverview } from '../types';
import { formatCurrency } from '../utils/formatters';

/**
 * FinancialOverviewSection Component
 * 
 * Displays financial metrics for the selected date range including:
 * - Total GMV (Gross Merchandise Value)
 * - Total Commission (Platform Revenue)
 * - Total Payout (Amount to Tutors)
 * - Average Order Value
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8
 * - Calculates and displays totalGMV from paid transactions
 * - Calculates commission based on payment type
 * - Calculates totalPayout as GMV - Commission
 * - Calculates avgOrderValue as GMV / totalPaidOrders
 * - Displays metrics in dedicated card components
 * - Formats currency values with VND symbol
 * - Responsive grid layout
 */

interface FinancialOverviewSectionProps {
  financialOverview: FinancialOverview;
}

export const FinancialOverviewSection: React.FC<FinancialOverviewSectionProps> = ({
  financialOverview,
}) => {
  const { totalGMV, totalCommission, totalPayout, avgOrderValue, totalPaidOrders } = financialOverview;

  return (
    <section className="mb-6 md:mb-8" aria-labelledby="financial-overview-heading">
      <h2 id="financial-overview-heading" className="text-lg md:text-xl font-semibold mb-3 md:mb-4 text-gray-900 dark:text-gray-100">
        Tổng quan tài chính
      </h2>
      
      {/* Responsive grid: 1 column on mobile, 2 on tablet, 4 on desktop */}
      {/* Requirements 12.2: Mobile - single column, Tablet - 2 columns, Desktop - full grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total GMV - Requirement 3.1 */}
        <MetricCard
          title="Tổng doanh thu"
          value={formatCurrency(totalGMV)}
          icon={DollarSign}
          subtitle={`${totalPaidOrders} đơn hàng`}
        />
        
        {/* Total Commission - Requirements 3.2, 3.3, 3.4 */}
        <MetricCard
          title="Hoa hồng"
          value={formatCurrency(totalCommission)}
          icon={TrendingUp}
          subtitle="Thu nhập nền tảng"
        />
        
        {/* Total Payout - Requirement 3.5 */}
        <MetricCard
          title="Chi trả"
          value={formatCurrency(totalPayout)}
          icon={Wallet}
          subtitle="Thanh toán giáo viên"
        />
        
        {/* Average Order Value - Requirements 3.6, 3.7 */}
        <MetricCard
          title="Giá trị TB"
          value={formatCurrency(avgOrderValue)}
          icon={ShoppingCart}
          subtitle="Trung bình/đơn hàng"
        />
      </div>
    </section>
  );
};

// Memoize to prevent unnecessary re-renders
export const MemoizedFinancialOverviewSection = React.memo(FinancialOverviewSection);
