import React from 'react';
import { motion } from 'framer-motion';
import { Mail } from 'lucide-react';

const ContactSection = () => {
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

  return (
    <section className="py-16 bg-gradient-to-r from-blue-500 to-purple-600">
      <div className="max-w-4xl mx-auto px-8 lg:px-16 text-center">
        <motion.div
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          variants={staggerContainer}
        >
          <motion.div variants={fadeInUp}>
            <Mail className="w-12 h-12 text-white mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white mb-4">Cần hỗ trợ?</h3>
            <p className="text-blue-100 mb-6">
              Nếu bạn có câu hỏi về chính sách hoặc điều khoản, 
              đội ngũ hỗ trợ của chúng tôi luôn sẵn sàng giúp đỡ.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a 
                href="mailto:support@linguahub.com" 
                className="text-white hover:text-blue-200 font-medium transition-colors"
              >
                support@linguahub.com
              </a>
              <span className="text-blue-200 hidden sm:inline">|</span>
              <a 
                href="tel:+84123456789" 
                className="text-white hover:text-blue-200 font-medium transition-colors"
              >
                Hotline: +84 123 456 789
              </a>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default ContactSection;