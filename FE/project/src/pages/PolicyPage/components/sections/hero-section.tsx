import React from 'react';
import { motion } from 'framer-motion';
import { Shield, FileText } from 'lucide-react';

const PolicyHeroSection = () => {
  const fadeInUp = {
    initial: { opacity: 0, y: 60 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  };

  return (
    <section className="bg-gradient-to-r from-blue-600 to-purple-700 py-16">
      <div className="max-w-7xl mx-auto px-8 lg:px-16">
        <motion.div 
          className="text-center text-white"
          initial="initial"
          animate="animate"
          variants={fadeInUp}
        >
          <div className="flex items-center justify-center space-x-4 mb-6">
            <Shield className="w-12 h-12" />
            <FileText className="w-12 h-12" />
          </div>
          <h1 className="text-4xl font-bold mb-4">Chính sách & Điều khoản</h1>
          <p className="text-xl text-blue-100 mb-4">
            Chính sách bảo mật và điều khoản sử dụng dịch vụ LinguaHub
          </p>
          <p className="text-blue-200">
            Cập nhật lần cuối: {new Date().toLocaleDateString('vi-VN')}
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default PolicyHeroSection;