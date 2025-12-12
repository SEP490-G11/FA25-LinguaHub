
import { motion } from 'framer-motion';
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/constants/routes";
import { useToast } from "@/components/ui/use-toast";

const CTASection = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleApplyClick = () => {
    const token = localStorage.getItem("access_token") || sessionStorage.getItem("access_token");
    
    if (!token) {
      // Chưa đăng nhập -> hiện toast và redirect đến trang đăng nhập
      toast({
        variant: "destructive",
        title: "Chưa đăng nhập",
        description: "Vui lòng đăng nhập để đăng ký trở thành gia sư.",
      });
      navigate(`${ROUTES.SIGN_IN}?redirect=${encodeURIComponent(ROUTES.APPLY_TUTOR)}`);
    } else {
      // Đã đăng nhập -> đi đến trang apply tutor
      navigate(ROUTES.APPLY_TUTOR);
    }
  };

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
            viewport={{once: true}}
            variants={staggerContainer}
        >
          <motion.h2
              className="text-4xl font-bold text-white mb-6"
              variants={fadeInUp}
          >
            Sẵn sàng bắt đầu giảng dạy?
          </motion.h2>
          <motion.p
              className="text-xl text-blue-100 mb-8"
              variants={fadeInUp}
          >
            Tham gia cộng đồng người bản ngữ và bắt đầu kiếm tiền ngay hôm nay
          </motion.p>
          <motion.div variants={fadeInUp}>
            <motion.button
                className="bg-white text-blue-600 px-8 py-4 rounded-full font-semibold text-lg hover:bg-gray-100 transition-colors"
                whileHover={{scale: 1.05}}
                whileTap={{scale: 0.95}}
                onClick={handleApplyClick}
            >
              Đăng ký trở thành gia sư
            </motion.button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;