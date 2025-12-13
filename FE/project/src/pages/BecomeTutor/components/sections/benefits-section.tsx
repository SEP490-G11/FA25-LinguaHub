import React from 'react';
import { motion } from 'framer-motion';
import { DollarSign, Clock, Users, Star } from 'lucide-react';

const BenefitsSection = () => {
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

  const benefits = [
    {
      icon: DollarSign,
      title: 'Thu nhập hấp dẫn',
      description: 'Tự đặt mức giá phù hợp với trình độ và kinh nghiệm của bạn'
    },
    {
      icon: Clock,
      title: 'Lịch trình linh hoạt',
      description: 'Tự quản lý lịch dạy, làm việc theo thời gian phù hợp với bạn'
    },
    {
      icon: Users,
      title: 'Kết nối học viên',
      description: 'Tiếp cận học viên có nhu cầu học tập thực sự trên nền tảng'
    },
    {
      icon: Star,
      title: 'Xây dựng danh tiếng',
      description: 'Phát triển hồ sơ giảng dạy với đánh giá và xếp hạng từ học viên'
    }
  ];

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-8 lg:px-16">
        <motion.div 
          className="text-center mb-12"
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          variants={fadeInUp}
        >
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Tại sao dạy học với LinguaHub?</h2>
          <p className="text-lg text-gray-600">Tham gia cộng đồng và tận hưởng những lợi ích tuyệt vời</p>
        </motion.div>

        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          variants={staggerContainer}
        >
          {benefits.map((benefit, index) => (
            <motion.div
              key={index}
              className="text-center p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow"
              variants={fadeInUp}
            >
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                <benefit.icon className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{benefit.title}</h3>
              <p className="text-gray-600">{benefit.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default BenefitsSection;