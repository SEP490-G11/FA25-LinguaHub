import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Lock, Eye, UserCheck } from 'lucide-react';

const PrivacyPolicy = () => {
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

  const privacySections = [
    {
      icon: Shield,
      title: 'Thông tin chúng tôi thu thập',
      content: [
        'Thông tin cá nhân: Họ tên, email, số điện thoại, địa chỉ',
        'Thông tin tài khoản: Tên đăng nhập, mật khẩu (được mã hóa)',
        'Thông tin học tập: Tiến độ khóa học, lịch học, lịch sử đặt lịch với gia sư',
        'Thông tin thanh toán: Được xử lý an toàn qua PayOS',
        'Thông tin ngân hàng: Chỉ lưu khi bạn yêu cầu hoàn tiền'
      ]
    },
    {
      icon: Eye,
      title: 'Cách chúng tôi sử dụng thông tin',
      content: [
        'Kết nối học viên với gia sư phù hợp',
        'Quản lý lịch học và buổi học 1-1',
        'Xử lý thanh toán, hoàn tiền và giao dịch',
        'Gửi thông báo về lịch học, khóa học và tin nhắn',
        'Cải thiện chất lượng dịch vụ và trải nghiệm người dùng'
      ]
    },
    {
      icon: Lock,
      title: 'Bảo mật thông tin',
      content: [
        'Mã hóa SSL/TLS cho tất cả dữ liệu truyền tải',
        'Lưu trữ dữ liệu trên server bảo mật với tường lửa',
        'Kiểm soát truy cập nghiêm ngặt cho nhân viên',
        'Sao lưu dữ liệu định kỳ và an toàn',
        'Tuân thủ các tiêu chuẩn bảo mật quốc tế'
      ]
    },
    {
      icon: UserCheck,
      title: 'Quyền của bạn',
      content: [
        'Truy cập và xem thông tin cá nhân',
        'Yêu cầu chỉnh sửa hoặc cập nhật thông tin',
        'Xóa tài khoản và dữ liệu cá nhân',
        'Từ chối nhận email marketing',
        'Khiếu nại về việc xử lý dữ liệu'
      ]
    }
  ];

  return (
    <section className="py-16 bg-white">
      <div className="max-w-4xl mx-auto px-8 lg:px-16">
        <motion.div 
          className="text-center mb-12"
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          variants={fadeInUp}
        >
          <Shield className="w-16 h-16 text-blue-600 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-foreground mb-4">Chính sách Bảo mật</h2>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Tại LinguaHub, chúng tôi hiểu rằng quyền riêng tư của bạn là vô cùng quan trọng. 
            Chính sách bảo mật này giải thích cách chúng tôi thu thập, sử dụng, và bảo vệ 
            thông tin cá nhân của bạn khi sử dụng dịch vụ của chúng tôi.
          </p>
        </motion.div>

        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16"
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          variants={staggerContainer}
        >
          {privacySections.map((section, index) => (
            <motion.div
              key={index}
              className="bg-card rounded-xl p-6 shadow-md"
              variants={fadeInUp}
            >
              <div className="flex items-center space-x-3 mb-4">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <section.icon className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="text-lg font-bold text-foreground">{section.title}</h3>
              </div>
              <ul className="space-y-2">
                {section.content.map((item, itemIndex) => (
                  <li key={itemIndex} className="flex items-start space-x-2">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-sm text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default PrivacyPolicy;