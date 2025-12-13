
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, Languages } from 'lucide-react';
import { Button } from '@/components/ui/button';

const CompleteForgotPassword = () => {
  const fadeInUp = {
    initial: { opacity: 0, y: 60 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <motion.div 
        className="max-w-md w-full space-y-8"
        initial="initial"
        animate="animate"
        variants={fadeInUp}
      >
        {/* Header */}
        <div className="text-center">
          <Link to="/" className="inline-flex items-center space-x-2 mb-6">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-3 rounded-lg">
              <Languages className="w-8 h-8 text-white" />
            </div>
            <div className="text-3xl font-bold text-gray-800">
              Lingua<span className="text-blue-500">Hub</span>
            </div>
          </Link>
        </div>

        {/* Success Message */}
        <motion.div 
          className="bg-white rounded-2xl shadow-xl p-8 text-center"
          variants={fadeInUp}
          transition={{ delay: 0.1 }}
        >
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Đặt lại mật khẩu hoàn tất!</h2>
            <p className="text-gray-600">
              Mật khẩu của bạn đã được đặt lại thành công. Bây giờ bạn có thể đăng nhập bằng mật khẩu mới.
            </p>
          </div>

          <Button asChild className="w-full">
            <Link to="/auth/signin">
              Đăng nhập ngay
            </Link>
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default CompleteForgotPassword;