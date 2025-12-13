import { 
  DollarSign, 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle 
} from 'lucide-react';
import { WithdrawRequestStats } from '../types';
import { formatCurrency } from '../utils';
import { StandardStatisticsCards, StatCardData } from '@/components/shared';

interface WithdrawRequestStatsProps {
  stats: WithdrawRequestStats;
  isLoading: boolean;
}

export default function WithdrawRequestStatsComponent({ 
  stats, 
  isLoading 
}: WithdrawRequestStatsProps) {
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
      icon: FileText,
      label: 'Tổng yêu cầu',
      value: stats.totalRequests.toString(),
      iconColor: '#93C5FD', // blue-300
    },
    {
      icon: Clock,
      label: 'Chờ xử lý',
      value: stats.pendingCount.toString(),
      iconColor: '#FCD34D', // yellow-300
    },
    {
      icon: CheckCircle,
      label: 'Đã duyệt',
      value: stats.approvedCount.toString(),
      iconColor: '#86EFAC', // green-300
    },
    {
      icon: XCircle,
      label: 'Đã từ chối',
      value: stats.rejectedCount.toString(),
      iconColor: '#FCA5A5', // red-300
    },
    {
      icon: DollarSign,
      label: 'Tổng tiền rút',
      value: formatCurrency(stats.totalWithdrawAmount),
      iconColor: '#86EFAC', // green-300
    },
    {
      icon: DollarSign,
      label: 'Tổng hoa hồng',
      value: formatCurrency(stats.totalCommission),
      iconColor: '#93C5FD', // blue-300
    },
  ];

  return <StandardStatisticsCards stats={statCards} variant="compact" />;
}
