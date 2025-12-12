import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/constants/routes.ts';

const CTASection = () => {
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
        <div className="max-w-7xl mx-auto px-8 lg:px-16 text-center">
          <motion.div
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              variants={staggerContainer}
          >
            <motion.h2
                className="text-4xl font-bold text-white mb-6"
                variants={fadeInUp}
            >
              Sẵn sàng bắt đầu hành trình ngôn ngữ của bạn?
            </motion.h2>

            <motion.p
                className="text-xl text-blue-100 mb-8"
                variants={fadeInUp}
            >
              Chọn ngôn ngữ của bạn và được kết nối với gia sư bản ngữ hoàn hảo
            </motion.p>

            <motion.div variants={fadeInUp}>
              <Link
                  to={ROUTES.TUTORS}
                  className="bg-white text-blue-600 px-8 py-4 rounded-full font-semibold text-lg hover:bg-gray-100 transition-colors inline-block"
              >
                Tìm gia sư của bạn
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>
  );
};

export default CTASection;
