import React from 'react';
import { motion } from 'framer-motion';
import { FileText, Users, CreditCard, Shield, AlertTriangle } from 'lucide-react';

const TermsOfService = () => {
  const fadeInUp = {
    initial: { opacity: 0, y: 60 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  };

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const termsSections = [
    {
      icon: Users,
      title: 'Điều khoản sử dụng dịch vụ',
      content: [
        'Bạn phải từ 16 tuổi trở lên để sử dụng dịch vụ',
        'Tài khoản phải được đăng ký với thông tin chính xác',
        'Mỗi người chỉ được tạo một tài khoản duy nhất',
        'Bạn chịu trách nhiệm bảo mật thông tin đăng nhập',
        'Không được chia sẻ tài khoản với người khác'
      ]
    },
    {
      icon: CreditCard,
      title: 'Thanh toán và hoàn tiền',
      content: [
        'Tất cả thanh toán được xử lý qua cổng thanh toán bảo mật',
        'Phí khóa học được tính theo giờ hoặc gói học',
        'Hoàn tiền trong vòng 7 ngày nếu chưa bắt đầu học',
        'Không hoàn tiền sau khi đã tham gia 25% khóa học',
        'Phí chuyển khoản và thuế do học viên chịu'
      ]
    },
    {
      icon: Shield,
      title: 'Quyền và nghĩa vụ của giáo viên',
      content: [
        'Giáo viên phải có chứng chỉ hoặc kinh nghiệm giảng dạy',
        'Cam kết chất lượng bài giảng và đúng giờ',
        'Không được chia sẻ thông tin cá nhân của học viên',
        'Tuân thủ quy tắc ứng xử chuyên nghiệp',
        'Báo cáo các vấn đề kỹ thuật kịp thời'
      ]
    },
    {
      icon: AlertTriangle,
      title: 'Hành vi bị cấm',
      content: [
        'Sử dụng ngôn ngữ không phù hợp hoặc xúc phạm',
        'Chia sẻ nội dung vi phạm bản quyền',
        'Quấy rối hoặc đe dọa người dùng khác',
        'Spam hoặc quảng cáo không được phép',
        'Hack hoặc phá hoại hệ thống'
      ]
    }
  ];

  return (
    <section className="py-16 bg-muted/50">
      <div className="max-w-4xl mx-auto px-8 lg:px-16">
        <motion.div 
          className="text-center mb-12"
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          variants={fadeInUp}
        >
          <FileText className="w-16 h-16 text-purple-600 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-foreground mb-4">Điều khoản Dịch vụ</h2>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Chào mừng bạn đến với LinguaHub! Bằng việc sử dụng dịch vụ của chúng tôi, 
            bạn đồng ý tuân thủ các điều khoản và điều kiện được nêu dưới đây.
          </p>
        </motion.div>

        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16"
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          variants={staggerContainer}
        >
          {termsSections.map((section, index) => (
            <motion.div
              key={index}
              className="bg-white rounded-xl p-6 shadow-md"
              variants={fadeInUp}
            >
              <div className="flex items-center space-x-3 mb-4">
                <div className="bg-purple-100 p-2 rounded-lg">
                  <section.icon className="w-5 h-5 text-purple-600" />
                </div>
                <h3 className="text-lg font-bold text-foreground">{section.title}</h3>
              </div>
              <ul className="space-y-2">
                {section.content.map((item, itemIndex) => (
                  <li key={itemIndex} className="flex items-start space-x-2">
                    <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-sm text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </motion.div>

        {/* Important Notice */}
        <motion.div 
          className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-8"
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          variants={fadeInUp}
        >
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-6 h-6 text-yellow-600 mt-1 flex-shrink-0" />
            <div>
              <h3 className="text-lg font-bold text-yellow-800 mb-2">Lưu ý quan trọng</h3>
              <p className="text-yellow-700 mb-3">
                Vi phạm điều khoản dịch vụ có thể dẫn đến việc tạm khóa hoặc xóa tài khoản vĩnh viễn. 
                Chúng tôi có quyền thay đổi điều khoản này bất cứ lúc nào và sẽ thông báo trước 30 ngày.
              </p>
              <p className="text-yellow-700">
                Nếu bạn không đồng ý với các thay đổi, vui lòng ngừng sử dụng dịch vụ.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default TermsOfService;