import { 
  CreditCard, 
  DollarSign, 
  CheckCircle, 
  Clock, 
  RotateCcw, 
  XCircle 
} from 'lucide-react';
import { StandardStatisticsCards, StatCardData } from '@/components/shared';
import { PaymentStats } from '../types';
import { formatCurrency } from '../utils';

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
      iconColor: '#93C5FD', // blue-300
    },
    {
      icon: DollarSign,
      label: 'Tổng doanh thu',
      value: formatCurrency(stats.totalAmount),
      iconColor: '#86EFAC', // green-300
    },
    {
      icon: CheckCircle,
      label: 'Đã thanh toán',
      value: stats.paidCount.toString(),
      iconColor: '#86EFAC', // green-300
    },
    {
      icon: Clock,
      label: 'Chờ thanh toán',
      value: stats.pendingCount.toString(),
      iconColor: '#FDE047', // yellow-300
    },
    {
      icon: RotateCcw,
      label: 'Đã hoàn tiền',
      value: stats.refundedCount.toString(),
      iconColor: '#93C5FD', // blue-300
    },
    {
      icon: XCircle,
      label: 'Thất bại',
      value: stats.failedCount.toString(),
      iconColor: '#FCA5A5', // red-300
    },
  ];

  return <StandardStatisticsCards stats={statCards} variant="compact" />;
}
