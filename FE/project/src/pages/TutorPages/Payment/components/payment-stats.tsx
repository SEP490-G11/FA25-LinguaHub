import { 
  CreditCard, 
  DollarSign, 
  CheckCircle, 
  Clock, 
  RotateCcw, 
  XCircle 
} from 'lucide-react';
import { PaymentStats } from '../types';
import { formatCurrency } from '../utils';
import { StandardStatisticsCards } from '@/components/shared';
import type { StatCardData } from '@/components/shared/types/standard-components';

interface PaymentStatsProps {
  stats: PaymentStats;
  isLoading: boolean;
}

export default function PaymentStatsComponent({ stats, isLoading }: PaymentStatsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[...Array(6)].map((_, index) => (
          <div 
            key={index}
            className="bg-white/15 backdrop-blur-md rounded-lg px-4 py-3 border border-white/20 animate-pulse"
          >
            <div className="h-5 bg-white/20 rounded mb-2"></div>
            <div className="h-8 bg-white/20 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  const statCards: StatCardData[] = [
    {
      icon: CreditCard,
      label: 'Tổng giao dịch',
      value: stats.totalPayments.toString(),
      iconColor: 'text-blue-300',
    },
    {
      icon: DollarSign,
      label: 'Tổng thu nhập',
      value: formatCurrency(stats.totalAmount),
      iconColor: 'text-green-300',
    },
    {
      icon: CheckCircle,
      label: 'Đã thanh toán',
      value: stats.paidCount.toString(),
      iconColor: 'text-green-300',
    },
    {
      icon: Clock,
      label: 'Chờ thanh toán',
      value: stats.pendingCount.toString(),
      iconColor: 'text-yellow-300',
    },
    {
      icon: RotateCcw,
      label: 'Đã hoàn tiền',
      value: stats.refundedCount.toString(),
      iconColor: 'text-blue-300',
    },
    {
      icon: XCircle,
      label: 'Thất bại',
      value: stats.failedCount.toString(),
      iconColor: 'text-red-300',
    },
  ];

  return (
    <StandardStatisticsCards 
      stats={statCards} 
      variant="compact"
      columns={{ mobile: 2, tablet: 3, desktop: 6 }}
    />
  );
}
