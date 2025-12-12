import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, DollarSign, Clock, Globe, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const BecomeTutorCTA = () => {
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
      title: 'Thu nhập cao',
      description: 'Kiếm đến 350,000₫ – 1,200,000₫ mỗi giờ dạy ngôn ngữ bản ngữ của bạn'
    },
    {
      icon: Clock,
      title: 'Lịch linh hoạt',
      description: 'Dạy bất cứ lúc nào, bất cứ nơi đâu — bạn kiểm soát thời gian'
    },
    {
      icon: Users,
      title: 'Học viên toàn cầu',
      description: 'Kết nối với học viên từ hơn 100 quốc gia'
    },
    {
      icon: Globe,
      title: 'Nền tảng uy tín',
      description: 'Tham gia cộng đồng hơn 5000 gia sư chuyên nghiệp'
    }
  ];

  return (
      <section className="py-12 bg-gradient-to-r from-blue-50 to-cyan-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">

            {/* Left Content */}
            <motion.div
                initial="initial"
                whileInView="animate"
                viewport={{ once: true }}
                variants={staggerContainer}
            >
              <motion.h2
                  className="text-2xl md:text-3xl font-bold text-gray-900 mb-4"
                  variants={fadeInUp}
              >
                Trở thành <span className="text-blue-600">Gia sư</span> cùng LinguaHub
              </motion.h2>

              <motion.p
                  className="text-base text-gray-600 mb-6"
                  variants={fadeInUp}
              >
                Chia sẻ ngôn ngữ của bạn với học viên từ khắp nơi trên thế giới và kiếm tiền từ điều bạn yêu thích.
              </motion.p>

              <motion.div
                  className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6"
                  variants={staggerContainer}
              >
                {benefits.map((benefit, index) => (
                    <motion.div key={index} variants={fadeInUp}>
                      <Card className="p-3 hover:shadow-md transition-shadow">
                        <CardContent className="p-0">
                          <div className="flex items-start space-x-2">
                            <div className="bg-blue-100 p-1.5 rounded-lg">
                              <benefit.icon className="w-4 h-4 text-blue-600" />
                            </div>
                            <div>
                              <h3 className="text-sm font-semibold text-gray-900 mb-1">
                                {benefit.title}
                              </h3>
                              <p className="text-xs text-gray-600">
                                {benefit.description}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                ))}
              </motion.div>

              <motion.div
                  className="flex flex-col sm:flex-row gap-3"
                  variants={fadeInUp}
              >
                <Button asChild className="bg-blue-600 hover:bg-blue-700">
                  <Link to="/become-tutor">
                    Đăng ký làm gia sư
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>

                <Button variant="outline">
                  Tìm hiểu thêm
                </Button>
              </motion.div>
            </motion.div>

            {/* Right Image */}
            <motion.div
                className="relative"
                initial={{ opacity: 0, x: 60 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
            >
              <div className="max-w-md mx-auto">
                <img
                    src="https://images.pexels.com/photos/3184287/pexels-photo-3184287.jpeg?auto=compress&cs=tinysrgb&w=800"
                    alt="Online teaching"
                    className="w-full h-auto max-h-64 object-cover rounded-xl shadow-lg"
                />
                <div className="absolute -bottom-2 -left-2 bg-white p-2 rounded-lg shadow-md border">
                  <div className="text-lg font-bold text-blue-600">5000+</div>
                  <div className="text-xs text-gray-600">Gia sư</div>
                </div>
                <div className="absolute -top-2 -right-2 bg-white p-2 rounded-lg shadow-md border">
                  <div className="text-lg font-bold text-blue-600">100K+</div>
                  <div className="text-xs text-gray-600">Học viên</div>
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </section>
  );
};

export default BecomeTutorCTA;
