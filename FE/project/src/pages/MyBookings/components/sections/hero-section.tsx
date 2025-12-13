import { Calendar, Clock, CheckCircle, XCircle, Ban } from 'lucide-react';
import type { BookingStats } from '@/types/MyBooking';

interface HeroSectionProps {
  stats: BookingStats;
}

const StatBox = ({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) => (
  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
    <div className="flex items-center gap-2 mb-2">
      {icon}
      <span className="text-sm text-blue-100 font-medium">{label}</span>
    </div>
    <p className="text-3xl font-bold">{value}</p>
  </div>
);

const HeroSection = ({ stats }: HeroSectionProps) => {
  return (
    <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 rounded-2xl shadow-lg p-8 text-white mb-8">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold mb-2">Lịch học của tôi</h1>
          <p className="text-blue-100 text-lg">
            Theo dõi và quản lý tất cả các buổi học của bạn
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <StatBox
            label="Sắp tới"
            value={stats.upcoming}
            icon={<Clock className="w-4 h-4 text-blue-200" />}
          />
          <StatBox
            label="Đã qua"
            value={stats.expired}
            icon={<XCircle className="w-4 h-4 text-slate-300" />}
          />
          <StatBox
            label="Bị hủy"
            value={stats.cancelled}
            icon={<Ban className="w-4 h-4 text-red-300" />}
          />
          <StatBox
            label="Tổng buổi"
            value={stats.totalSlots}
            icon={<Calendar className="w-4 h-4 text-blue-200" />}
          />
          <StatBox
            label="Tổng giờ"
            value={stats.totalHours}
            icon={<CheckCircle className="w-4 h-4 text-green-300" />}
          />
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
