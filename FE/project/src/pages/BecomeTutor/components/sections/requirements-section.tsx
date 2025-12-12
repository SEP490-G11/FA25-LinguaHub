import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';

const RequirementsSection = () => {
  const fadeInUp = {
    initial: { opacity: 0, y: 60 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  };

  const requirements = [
    'Người bản ngữ của ngôn ngữ bạn muốn dạy',
    'Kinh nghiệm giảng dạy hoặc chứng chỉ (ưu tiên)',
    'Kết nối internet ổn định và không gian giảng dạy yên tĩnh',
    'Đam mê giúp đỡ người khác học ngôn ngữ',
    'Có thể dạy ít nhất 10 giờ mỗi tuần'
  ];

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-8 lg:px-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={fadeInUp}
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Yêu cầu</h2>
            <div className="space-y-4">
              {requirements.map((requirement, index) => (
                <motion.div
                  key={index}
                  className="flex items-start space-x-3"
                  variants={fadeInUp}
                  transition={{ delay: index * 0.1 }}
                >
                  <CheckCircle className="w-6 h-6 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">{requirement}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={fadeInUp}
          >
            <img
              src="https://images.pexels.com/photos/3184287/pexels-photo-3184287.jpeg?auto=compress&cs=tinysrgb&w=800"
              alt="Online teaching"
              className="rounded-2xl shadow-lg"
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default RequirementsSection;