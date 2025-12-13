import { motion } from 'framer-motion';
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/constants/routes";
import { useToast } from "@/components/ui/use-toast";
// import { Languages } from 'lucide-react';

const HeroSection = () => {
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
    <section className="bg-gradient-to-r from-blue-600 to-purple-700 py-20">
      <div className="max-w-7xl mx-auto px-8 lg:px-16">
        <motion.div 
          className="text-center text-white"
          initial="initial"
          animate="animate"
          variants={staggerContainer}
        >
          <motion.h1 
            className="text-5xl font-bold mb-6"
            variants={fadeInUp}
          >
            Trở thành gia sư ngôn ngữ
          </motion.h1>
          <motion.p 
            className="text-xl mb-8 text-blue-100 max-w-3xl mx-auto"
            variants={fadeInUp}
          >
            Chia sẻ ngôn ngữ mẹ đẻ của bạn với học viên trên toàn thế giới và kiếm tiền từ điều bạn yêu thích. 
            Tham gia cùng hàng nghìn gia sư đang giảng dạy trên LinguaHub.
          </motion.p>
          <motion.button 
            className="bg-white text-blue-600 px-8 py-4 rounded-full font-semibold text-lg hover:bg-gray-100 transition-colors"
            variants={fadeInUp}
            onClick={handleApplyClick}
          >
            Đăng ký ngay
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;