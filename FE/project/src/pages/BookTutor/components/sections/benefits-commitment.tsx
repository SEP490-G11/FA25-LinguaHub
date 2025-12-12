import {
  CheckCircle,
  Target,
  TrendingUp,
  Shield,
  Clock,
} from "lucide-react";

const BenefitsCommitment = () => {
  const benefits = [
    {
      icon: <Target className="w-6 h-6 text-green-600" />,
      title: "Học 1-1 cá nhân hóa",
      description: "Lộ trình học tập được thiết kế riêng theo nhu cầu và trình độ của bạn.",
    },
    {
      icon: <TrendingUp className="w-6 h-6 text-orange-600" />,
      title: "Theo dõi tiến độ",
      description: "Đánh giá định kỳ và báo cáo tiến độ đầy đủ sau mỗi giai đoạn.",
    },
    {
      icon: <Clock className="w-6 h-6 text-purple-600" />,
      title: "Chuyển lịch linh hoạt",
      description: "Nếu buổi học bị hủy, bạn có thể chuyển sang slot khác phù hợp.",
    },
    {
      icon: <CheckCircle className="w-6 h-6 text-teal-600" />,
      title: "Đảm bảo chất lượng",
      description: "Tất cả gia sư đều được xác minh và đánh giá liên tục bởi học viên.",
    },
  ];

  const commitments = [
    {
      level: "Cơ bản",
      outcome: "Hội thoại đơn giản trong 4–6 tuần",
      details: "Giới thiệu bản thân, gọi món, hỏi đường, giao tiếp cơ bản.",
    },
    {
      level: "Trung cấp",
      outcome: "Hội thoại hàng ngày thoải mái trong 8–12 tuần",
      details: "Thảo luận chủ đề chung, hiểu chương trình TV, bày tỏ ý kiến cá nhân.",
    },
    {
      level: "Nâng cao",
      outcome: "Tiếng Anh chuyên nghiệp trong 12–16 tuần",
      details: "Thuyết trình, kỹ năng tranh luận, viết học thuật, giao tiếp kinh doanh.",
    },
  ];

  return (
      <div className="space-y-6">

        {/* BENEFITS SECTION */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
          <h2 className="text-2xl font-bold mb-6 flex items-center space-x-2">
            <CheckCircle className="w-6 h-6 text-green-600" />
            <span>Quyền lợi & Cam kết của bạn</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {benefits.map((benefit, index) => (
                <div
                    key={index}
                    className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg
              hover:bg-white hover:shadow transition-all duration-200 border"
                >
                  <div className="mt-1">{benefit.icon}</div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{benefit.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{benefit.description}</p>
                  </div>
                </div>
            ))}
          </div>
        </div>

        {/* COMMITMENT SECTION */}
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl shadow-md p-6 border border-blue-100">
          <h2 className="text-2xl font-bold mb-4 flex items-center space-x-2 text-blue-900">
            <Target className="w-6 h-6" />
            <span>Lộ trình học tập dự kiến</span>
          </h2>

          <p className="text-gray-700 mb-6 leading-relaxed">
            Với luyện tập đều đặn và cam kết học tập, bạn có thể đạt được các mục tiêu sau. Kết quả phụ thuộc vào sự nỗ lực và thời gian bạn dành cho việc học.
          </p>

          <div className="space-y-4">
            {commitments.map((item, index) => (
                <div
                    key={index}
                    className="bg-white rounded-lg p-4 border-l-4 border-blue-600 shadow-sm hover:shadow transition"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-blue-700 text-lg">{item.level}</span>
                    <span className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
                  {item.outcome}
                </span>
                  </div>
                  <p className="text-gray-600 text-sm">{item.details}</p>
                </div>
            ))}
          </div>
        </div>

        {/* IMPORTANT NOTES */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-semibold text-yellow-900 mb-2 flex items-center gap-2">
            <Shield className="w-5 h-5" />
            <span>Lưu ý quan trọng</span>
          </h3>

          <ul className="text-sm text-yellow-800 space-y-1">
            <li>• Tài liệu học tập do gia sư cung cấp trong quá trình học.</li>
            <li>• Nếu buổi học bị hủy, bạn có thể yêu cầu chuyển sang slot khác .</li>
            <li>• Đánh giá tiến độ được thực hiện trong suốt quá trình học tập.</li>
          </ul>
        </div>

      </div>
  );
};

export default BenefitsCommitment;
