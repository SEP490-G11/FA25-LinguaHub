
import { motion } from 'framer-motion';

const HowItWorksSection = () => {
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

  const steps = [
    {
      step: '1',
      title: 'Đăng ký làm gia sư',
      description: 'Điền thông tin cá nhân, kinh nghiệm và chuyên môn của bạn vào form đăng ký'
    },
    {
      step: '2',
      title: 'Chờ phê duyệt',
      description: 'Admin sẽ xem xét hồ sơ của bạn và phê duyệt trong vòng 1-3 ngày làm việc'
    },
    {
      step: '3',
      title: 'Bắt đầu dạy học',
      description: 'Sau khi được phê duyệt, bạn có thể tạo lịch dạy và bắt đầu nhận học viên ngay'
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
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Cách thức hoạt động</h2>
          <p className="text-lg text-gray-600">Bắt đầu với 3 bước đơn giản</p>
        </motion.div>

        <motion.div 
          className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto"
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          variants={staggerContainer}
        >
          {steps.map((step, index) => (
            <motion.div
              key={index}
              className="text-center relative"
              variants={fadeInUp}
            >
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500 text-white rounded-full text-2xl font-bold mb-4">
                {step.step}
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{step.title}</h3>
              <p className="text-gray-600">{step.description}</p>
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-8 left-full w-full h-0.5 bg-gray-200 -translate-x-1/2"></div>
              )}
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default HowItWorksSection;