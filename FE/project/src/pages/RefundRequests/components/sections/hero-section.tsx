import { Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface HeroSectionProps {
  stats: {
    pending: number;
    submitted: number;
    processed: number;
    rejected: number;
    totalAmount: number;
    pendingAmount: number;
    rejectedAmount: number;
  };
}

const HeroSection = ({ stats }: HeroSectionProps) => {
  return (
      <div className="bg-gradient-to-br from-green-600 via-emerald-700 to-green-800 rounded-2xl shadow-lg p-8 text-white mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-bold mb-2">Yêu cầu hoàn tiền</h1>
            <p className="text-green-100 text-lg mb-2">Theo dõi các yêu cầu hoàn tiền cho các buổi học đã hủy</p>
            <p className="text-green-200 text-sm">Khi buổi học bị hủy, tiền hoàn sẽ được xử lý và chuyển vào tài khoản ngân hàng của bạn</p>
          </div>
          <div className="flex flex-col gap-4 w-full lg:w-auto">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-amber-300" />
                  <span className="text-sm text-green-100 font-medium">Chờ xử lý</span>
                </div>
                <p className="text-3xl font-bold">{stats.pending}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-4 h-4 text-blue-300" />
                  <span className="text-sm text-green-100 font-medium">Đã gửi</span>
                </div>
                <p className="text-3xl font-bold">{stats.submitted}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-green-300" />
                  <span className="text-sm text-green-100 font-medium">Đã xử lý</span>
                </div>
                <p className="text-3xl font-bold">{stats.processed}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="flex items-center gap-2 mb-2">
                  <XCircle className="w-4 h-4 text-red-300" />
                  <span className="text-sm text-green-100 font-medium">Từ chối</span>
                </div>
                <p className="text-3xl font-bold">{stats.rejected}</p>
              </div>
            </div>

            {/* Stats - Tiền */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-green-500/20 backdrop-blur-sm rounded-xl p-4 border border-green-400/30 flex flex-col">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-green-200 flex-shrink-0" />
                  <span className="text-sm text-green-100 font-medium">Tiền nhận thành công</span>
                </div>
                <p className="text-2xl font-bold text-white mt-auto">{stats.totalAmount.toLocaleString()} đ</p>
              </div>
              <div className="bg-amber-500/20 backdrop-blur-sm rounded-xl p-4 border border-amber-400/30 flex flex-col">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-5 h-5 text-amber-200 flex-shrink-0" />
                  <span className="text-sm text-amber-100 font-medium">Tiền đang đợi</span>
                </div>
                <p className="text-2xl font-bold text-white mt-auto">{stats.pendingAmount.toLocaleString()} đ</p>
              </div>
              <div className="bg-red-500/20 backdrop-blur-sm rounded-xl p-4 border border-red-400/30 flex flex-col">
                <div className="flex items-center gap-2 mb-2">
                  <XCircle className="w-5 h-5 text-red-200 flex-shrink-0" />
                  <span className="text-sm text-red-100 font-medium">Tiền bị từ chối</span>
                </div>
                <p className="text-2xl font-bold text-white mt-auto">{stats.rejectedAmount.toLocaleString()} đ</p>
              </div>
            </div>
          </div>
        </div>
      </div>
  );
};

export default HeroSection;